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

export interface DiscoveredHost {
  hostName: string;
  gameId: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  ip: string;
  port: number;
}

interface GuestCallbacks {
  onConnected: () => void;
  onStateUpdate: (state: NetworkGameState, connectedPlayers: ConnectedPeer[]) => void;
  onPlayerDisconnected: (playerId: string) => void;
  onError: (message: string) => void;
  onHostDisconnected: () => void;
}

interface GuestRuntime {
  socket: UdpSocket;
  hostIp: string;
  roomCode: string;
  clientId: string;
  callbacks: GuestCallbacks;
  heartbeatTimer: ReturnType<typeof setInterval>;
  watchdogTimer: ReturnType<typeof setInterval>;
  hostLastSeenAt: number;
}

let runtime: GuestRuntime | null = null;

function decodePayload(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof Uint8Array) return String.fromCharCode(...raw);
  return `${raw ?? ""}`;
}

function sendToHost(socket: UdpSocket, hostIp: string, message: UDPMessage) {
  socket.send(messageToWire(message), undefined, undefined, PORTS.udp, hostIp);
}

export async function scanForHosts(timeoutMs = 2200): Promise<DiscoveredHost[]> {
  const socket = dgram.createSocket({ type: "udp4", reusePort: true });
  socket.bind(PORTS.udp);
  const map = new Map<string, DiscoveredHost>();

  return new Promise((resolve) => {
    socket.on("message", (raw) => {
      const parsed = safeParseMessage(decodePayload(raw));
      if (!parsed || parsed.type !== "HOST_BEACON") return;
      map.set(parsed.roomCode, {
        hostName: parsed.hostName,
        gameId: parsed.gameId,
        roomCode: parsed.roomCode,
        playerCount: parsed.playerCount,
        maxPlayers: parsed.maxPlayers,
        ip: parsed.ip,
        port: parsed.port,
      });
    });

    setTimeout(() => {
      socket.close();
      resolve([...map.values()]);
    }, timeoutMs);
  });
}

export async function connectToHost(config: {
  ip: string;
  roomCode: string;
  playerName: string;
  avatar: string;
  callbacks: GuestCallbacks;
}) {
  if (!isPrivateLanIp(config.ip)) {
    return { ok: false as const, message: "Host IP must be a local hotspot/LAN IP." };
  }

  if (runtime) {
    disconnectGuest();
  }

  const socket = dgram.createSocket({ type: "udp4", reusePort: true });
  socket.bind();
  const clientId = `g-${Math.random().toString(36).slice(2, 8)}`;

  const callbacks = config.callbacks;

  const guestRuntime: GuestRuntime = {
    socket,
    hostIp: config.ip.trim(),
    roomCode: config.roomCode.trim().toUpperCase(),
    clientId,
    callbacks,
    heartbeatTimer: setInterval(() => {}, HEARTBEAT_INTERVAL_MS),
    watchdogTimer: setInterval(() => {}, HEARTBEAT_INTERVAL_MS),
    hostLastSeenAt: Date.now(),
  };

  socket.on("message", (raw) => {
    const parsed = safeParseMessage(decodePayload(raw));
    if (!parsed) return;

    if (parsed.type === "JOIN_ACK" && parsed.roomCode === guestRuntime.roomCode && parsed.clientId === clientId) {
      guestRuntime.hostLastSeenAt = Date.now();
      callbacks.onConnected();
      return;
    }

    if (parsed.type === "STATE_UPDATE" && parsed.roomCode === guestRuntime.roomCode) {
      guestRuntime.hostLastSeenAt = Date.now();
      callbacks.onStateUpdate(parsed.gameState, parsed.connectedPlayers);
      return;
    }

    if (parsed.type === "PLAYER_DISCONNECTED" && parsed.roomCode === guestRuntime.roomCode) {
      guestRuntime.hostLastSeenAt = Date.now();
      callbacks.onPlayerDisconnected(parsed.playerId);
      return;
    }

    if (parsed.type === "HEARTBEAT" && parsed.roomCode === guestRuntime.roomCode && parsed.role === "host") {
      guestRuntime.hostLastSeenAt = Date.now();
      return;
    }

    if (parsed.type === "ERROR") {
      callbacks.onError(parsed.message);
    }
  });

  sendToHost(socket, guestRuntime.hostIp, {
    type: "JOIN",
    roomCode: guestRuntime.roomCode,
    clientId,
    playerName: config.playerName.trim(),
    avatar: config.avatar,
    ts: Date.now(),
  });

  guestRuntime.heartbeatTimer = setInterval(() => {
    sendToHost(socket, guestRuntime.hostIp, {
      type: "HEARTBEAT",
      roomCode: guestRuntime.roomCode,
      clientId,
      role: "guest",
      ts: Date.now(),
    });
  }, HEARTBEAT_INTERVAL_MS);

  guestRuntime.watchdogTimer = setInterval(() => {
    if (Date.now() - guestRuntime.hostLastSeenAt > HEARTBEAT_TIMEOUT_MS) {
      callbacks.onHostDisconnected();
      disconnectGuest();
    }
  }, HEARTBEAT_INTERVAL_MS);

  runtime = guestRuntime;

  return { ok: true as const, message: "Connected over local hotspot." };
}

export function sendGuestAction(action: ClientGameAction) {
  if (!runtime) return;
  sendToHost(runtime.socket, runtime.hostIp, {
    type: "ACTION",
    roomCode: runtime.roomCode,
    clientId: runtime.clientId,
    action,
    ts: Date.now(),
  });
}

export function disconnectGuest() {
  if (!runtime) return;
  clearInterval(runtime.heartbeatTimer);
  clearInterval(runtime.watchdogTimer);
  runtime.socket.close();
  runtime = null;
}

export function isGuestConnected() {
  return runtime !== null;
}
