import { PORTS } from "@/services/networking/protocol";

export interface HostSessionInfo {
  gameId: string;
  roomCode: string;
  ip: string;
  wsPort: number;
}

export async function startHostSession(hostName: string): Promise<HostSessionInfo> {
  const gameId = Math.random().toString(36).slice(2, 8);
  return {
    gameId,
    roomCode: gameId.slice(-4).toUpperCase(),
    ip: "192.168.1.5",
    wsPort: PORTS.ws,
  };
}

export function stopHostSession() {}

