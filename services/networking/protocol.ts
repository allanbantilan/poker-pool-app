export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface NetworkPlayerCard {
  id: string;
  suit: Suit;
  value: string;
  ballNumber: number;
  revealed: boolean;
  pocketed: boolean;
  hidden: boolean;
}

export interface NetworkPlayer {
  id: string;
  name: string;
  avatar: string;
  cards: NetworkPlayerCard[];
}

export interface NetworkBall {
  number: number;
  pocketedBy: string | null;
}

export interface ConnectedPeer {
  id: string;
  name: string;
  avatar: string;
}

export interface NetworkGameState {
  players: NetworkPlayer[];
  currentPlayerIndex: number;
  round: 1 | 2;
  phase: "dealing" | "revealing" | "playing" | "round-end" | "game-over";
  balls: NetworkBall[];
  winner: string | null;
  draw: boolean;
  firstThreeMode: boolean;
}

export type ClientGameAction =
  | { type: "REVEAL_CARD"; playerId: string; cardId: string }
  | { type: "POCKET_BALL"; playerId: string; ballNumber: number }
  | { type: "CONFIRM_POCKET"; playerId: string }
  | { type: "REPORT_FOUL"; playerId: string }
  | { type: "UNLOCK_REMAINING"; playerId: string };

export type UDPMessage =
  | {
      type: "HOST_BEACON";
      hostName: string;
      gameId: string;
      roomCode: string;
      playerCount: number;
      maxPlayers: number;
      ip: string;
      port: number;
      ts: number;
    }
  | { type: "JOIN"; roomCode: string; clientId: string; playerName: string; avatar: string; ts: number }
  | { type: "JOIN_ACK"; roomCode: string; clientId: string; ts: number }
  | { type: "ACTION"; roomCode: string; clientId: string; action: ClientGameAction; ts: number }
  | { type: "STATE_UPDATE"; roomCode: string; gameState: NetworkGameState; connectedPlayers: ConnectedPeer[]; ts: number }
  | { type: "PLAYER_DISCONNECTED"; roomCode: string; playerId: string; ts: number }
  | { type: "HEARTBEAT"; roomCode: string; clientId: string; role: "host" | "guest"; ts: number }
  | { type: "ERROR"; roomCode?: string; message: string; ts: number };

export const PORTS = {
  ws: 8765,
  udp: 41234,
};

export const HEARTBEAT_INTERVAL_MS = 5000;
export const HEARTBEAT_TIMEOUT_MS = 15000;

// Offline LAN/hotspot mode accepts only private IPv4 ranges.
export function isPrivateLanIp(ip: string): boolean {
  const value = ip.trim();
  if (!value) return false;
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [a, b, c, d] = match.slice(1).map(Number);
  if ([a, b, c, d].some((octet) => octet < 0 || octet > 255)) return false;

  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function safeParseMessage(raw: string): UDPMessage | null {
  try {
    return JSON.parse(raw) as UDPMessage;
  } catch {
    return null;
  }
}

export function messageToWire(message: UDPMessage): string {
  return JSON.stringify(message);
}
