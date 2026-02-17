import dgram from "react-native-udp";
import type UdpSocket from "react-native-udp/lib/types/UdpSocket";
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  PORTS,
  type ClientGameAction,
  type ConnectedPeer,
  type NetworkGameState,
  type UDPMessage,
  isPrivateLanIp,
  messageToWire,
  safeParseMessage,
} from "@/services/networking/protocol";

export interface HostSessionInfo {
  gameId: string;
  roomCode: string;
  ip: string;
  wsPort: number;
}

interface HostClient {
  clientId: string;
  address: string;
  port: number;
  lastSeenAt: number;
  name: string;
  avatar: string;
}

interface HostSyncCallbacks {
  onJoin: (peer: ConnectedPeer) => void;
  onAction: (action: ClientGameAction) => void;
  onDisconnect: (clientId: string) => void;
}

interface HostRuntime {
  socket: UdpSocket;
  roomCode: string;
  hostName: string;
  hostIp: string;
  gameId: string;
  maxPlayers: number;
  clients: Map<string, HostClient>;
  callbacks: HostSyncCallbacks;
  beaconTimer: ReturnType<typeof setInterval>;
  heartbeatTimer: ReturnType<typeof setInterval>;
}

let runtime: HostRuntime | null = null;

function decodePayload(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof Uint8Array) return String.fromCharCode(...raw);
  return `${raw ?? ""}`;
}

function sendMessage(socket: UdpSocket, message: UDPMessage, port: number, address: string) {
  const payload = messageToWire(message);
  socket.send(payload, undefined, undefined, port, address);
}

export async function startHostSession(
  hostName: string,
  hotspotIp: string,
  options?: { roomCode?: string; maxPlayers?: number; callbacks?: HostSyncCallbacks },
): Promise<HostSessionInfo> {
  if (!hostName.trim()) {
    throw new Error("Host name is required.");
  }
  if (!isPrivateLanIp(hotspotIp)) {
    throw new Error("Enter a valid hotspot/local IP (10.x.x.x, 172.16-31.x.x, or 192.168.x.x).");
  }

  if (runtime) {
    stopHostSession();
  }

  const gameId = Math.random().toString(36).slice(2, 8);
  const roomCode = (options?.roomCode ?? gameId.slice(-4)).toUpperCase();
  const maxPlayers = Math.min(8, Math.max(2, options?.maxPlayers ?? 8));

  const socket = dgram.createSocket({ type: "udp4", reusePort: true });
  socket.bind(PORTS.udp);
  socket.setBroadcast(true);

  const callbacks: HostSyncCallbacks =
    options?.callbacks ??
    ({
      onJoin: () => {},
      onAction: () => {},
      onDisconnect: () => {},
    } as HostSyncCallbacks);

  const clients = new Map<string, HostClient>();

  socket.on("message", (raw, rinfo: { address: string; port: number }) => {
    const parsed = safeParseMessage(decodePayload(raw));
    if (!parsed) return;

    if (parsed.type === "JOIN") {
      if (parsed.roomCode !== roomCode) return;
      if (clients.size >= maxPlayers - 1 && !clients.has(parsed.clientId)) {
        sendMessage(
          socket,
          { type: "ERROR", roomCode, message: "Room is full.", ts: Date.now() },
          rinfo.port,
          rinfo.address,
        );
        return;
      }

      const existing = clients.get(parsed.clientId);
      const next: HostClient = {
        clientId: parsed.clientId,
        address: rinfo.address,
        port: rinfo.port,
        lastSeenAt: Date.now(),
        name: parsed.playerName,
        avatar: parsed.avatar,
      };
      clients.set(parsed.clientId, next);
      if (!existing) {
        callbacks.onJoin({ id: parsed.clientId, name: parsed.playerName, avatar: parsed.avatar });
      }
      sendMessage(socket, { type: "JOIN_ACK", roomCode, clientId: parsed.clientId, ts: Date.now() }, rinfo.port, rinfo.address);
      return;
    }

    if (parsed.type === "ACTION") {
      if (parsed.roomCode !== roomCode) return;
      const client = clients.get(parsed.clientId);
      if (!client) {
        sendMessage(
          socket,
          { type: "ERROR", roomCode, message: "Client not registered. Join first.", ts: Date.now() },
          rinfo.port,
          rinfo.address,
        );
        return;
      }
      client.lastSeenAt = Date.now();
      callbacks.onAction(parsed.action);
      return;
    }

    if (parsed.type === "HEARTBEAT") {
      if (parsed.roomCode !== roomCode || parsed.role !== "guest") return;
      const client = clients.get(parsed.clientId);
      if (client) {
        client.lastSeenAt = Date.now();
      }
    }
  });

  const beaconTimer = setInterval(() => {
    const beacon: UDPMessage = {
      type: "HOST_BEACON",
      hostName: hostName.trim(),
      gameId,
      roomCode,
      playerCount: clients.size + 1,
      maxPlayers,
      ip: hotspotIp.trim(),
      port: PORTS.udp,
      ts: Date.now(),
    };
    sendMessage(socket, beacon, PORTS.udp, "255.255.255.255");
  }, 2000);

  const heartbeatTimer = setInterval(() => {
    const heartbeat: UDPMessage = {
      type: "HEARTBEAT",
      roomCode,
      clientId: "host",
      role: "host",
      ts: Date.now(),
    };
    for (const peer of clients.values()) {
      sendMessage(socket, heartbeat, peer.port, peer.address);
    }

    const now = Date.now();
    for (const [clientId, client] of clients) {
      if (now - client.lastSeenAt > HEARTBEAT_TIMEOUT_MS) {
        clients.delete(clientId);
        callbacks.onDisconnect(clientId);
        const notice: UDPMessage = { type: "PLAYER_DISCONNECTED", roomCode, playerId: clientId, ts: Date.now() };
        for (const peer of clients.values()) {
          sendMessage(socket, notice, peer.port, peer.address);
        }
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  runtime = {
    socket,
    roomCode,
    hostName: hostName.trim(),
    hostIp: hotspotIp.trim(),
    gameId,
    maxPlayers,
    clients,
    callbacks,
    beaconTimer,
    heartbeatTimer,
  };

  return {
    gameId,
    roomCode,
    ip: hotspotIp.trim(),
    wsPort: PORTS.ws,
  };
}

export function updateHostCallbacks(callbacks: HostSyncCallbacks) {
  if (!runtime) return;
  runtime.callbacks = callbacks;
}

export function broadcastStateUpdate(gameState: NetworkGameState, connectedPlayers: ConnectedPeer[]) {
  if (!runtime) return;
  const message: UDPMessage = {
    type: "STATE_UPDATE",
    roomCode: runtime.roomCode,
    gameState,
    connectedPlayers,
    ts: Date.now(),
  };

  for (const client of runtime.clients.values()) {
    sendMessage(runtime.socket, message, client.port, client.address);
  }
}

export function broadcastHostHeartbeat() {
  if (!runtime) return;
  const heartbeat: UDPMessage = {
    type: "HEARTBEAT",
    roomCode: runtime.roomCode,
    clientId: "host",
    role: "host",
    ts: Date.now(),
  };
  for (const client of runtime.clients.values()) {
    sendMessage(runtime.socket, heartbeat, client.port, client.address);
  }
}

export function stopHostSession() {
  if (!runtime) return;
  clearInterval(runtime.beaconTimer);
  clearInterval(runtime.heartbeatTimer);
  runtime.socket.close();
  runtime = null;
}

export function isHostSessionActive() {
  return runtime !== null;
}
