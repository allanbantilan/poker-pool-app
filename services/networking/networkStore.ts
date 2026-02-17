import { create } from "zustand";

interface DiscoveredGame {
  hostName: string;
  gameId: string;
  roomCode: string;
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
  maxPlayers: number;
  playerNames: string[];
  setDiscoveredGames: (games: DiscoveredGame[]) => void;
  setHosting: (roomCode: string, hostIp: string, hostName: string, maxPlayers: number) => void;
  setJoinTarget: (roomCode: string, hostIp: string) => void;
  joinAsPlayer: (playerName: string) => void;
  addLocalPlayer: (playerName: string) => void;
  removeLocalPlayer: (index: number) => void;
  setStatus: (status: NetworkState["status"]) => void;
  resetLobby: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  discoveredGames: [],
  roomCode: "",
  hostIp: "",
  status: "idle",
  maxPlayers: 8,
  playerNames: [],
  setDiscoveredGames: (games) => set({ discoveredGames: games }),
  setHosting: (roomCode, hostIp, hostName, maxPlayers) =>
    set({
      status: "hosting",
      roomCode,
      hostIp,
      maxPlayers: Math.min(8, Math.max(2, maxPlayers)),
      playerNames: [hostName.trim() || "Host"],
    }),
  setJoinTarget: (roomCode, hostIp) => set({ roomCode: roomCode.trim().toUpperCase(), hostIp: hostIp.trim() }),
  joinAsPlayer: (playerName) =>
    set((state) => {
      if (!playerName.trim()) return state;
      if (state.playerNames.includes(playerName.trim())) return { status: "connected" };
      return {
        status: "connected",
        playerNames:
          state.playerNames.length < state.maxPlayers ? [...state.playerNames, playerName.trim()] : state.playerNames,
      };
    }),
  addLocalPlayer: (playerName) =>
    set((state) => {
      const cleanName = playerName.trim();
      if (!cleanName || state.playerNames.length >= state.maxPlayers || state.playerNames.includes(cleanName)) return state;
      return { playerNames: [...state.playerNames, cleanName] };
    }),
  removeLocalPlayer: (index) =>
    set((state) => ({
      playerNames: state.playerNames.filter((_, i) => i !== index),
    })),
  setStatus: (status) => set({ status }),
  resetLobby: () => set({ roomCode: "", hostIp: "", status: "idle", maxPlayers: 8, playerNames: [] }),
}));
