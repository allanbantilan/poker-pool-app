import type { Player } from "@/store/useGameStore";

export type WSMessage =
  | { type: "JOIN"; playerName: string; avatar: string }
  | { type: "PLAYER_JOINED"; players: Player[] }
  | { type: "GAME_START"; gameState: unknown }
  | { type: "REVEAL_CARD"; playerId: string; cardId: string }
  | { type: "POCKET_BALL"; playerId: string; ballNumber: number }
  | { type: "CONFIRM_POCKET"; playerId: string }
  | { type: "REPORT_FOUL"; playerId: string }
  | { type: "STATE_UPDATE"; gameState: unknown }
  | { type: "GAME_OVER"; winner: Player }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "ERROR"; message: string };

export const PORTS = {
  ws: 8765,
  udp: 41234,
};

