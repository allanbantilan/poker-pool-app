import { create } from "zustand";

interface DiscoveredGame {
  hostName: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  ip: string;
  port: number;
}

interface NetworkState {
  discoveredGames: DiscoveredGame[];
  roomCode: string;
  hostIp: string;
  status: "idle" | "hosting" | "scanning" | "connected" | "error";
  setDiscoveredGames: (games: DiscoveredGame[]) => void;
  setHosting: (roomCode: string, hostIp: string) => void;
  setStatus: (status: NetworkState["status"]) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  discoveredGames: [],
  roomCode: "",
  hostIp: "",
  status: "idle",
  setDiscoveredGames: (games) => set({ discoveredGames: games }),
  setHosting: (roomCode, hostIp) => set({ status: "hosting", roomCode, hostIp }),
  setStatus: (status) => set({ status }),
}));

