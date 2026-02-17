import { PORTS } from "@/services/networking/protocol";

export interface DiscoveredHost {
  hostName: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  ip: string;
  port: number;
}

export async function scanForHosts(): Promise<DiscoveredHost[]> {
  return [
    {
      hostName: "Poker Pool Table",
      gameId: "abc123",
      playerCount: 1,
      maxPlayers: 3,
      ip: "192.168.1.5",
      port: PORTS.ws,
    },
  ];
}

export async function connectToHost(_ip: string, _port: number) {
  return true;
}

