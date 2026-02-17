import { create } from "zustand";
import { FULL_DECK, type DeckCard, type Suit } from "@/constants/game";

export interface PlayerCard {
  id: string;
  suit: Suit;
  value: string;
  ballNumber: number;
  revealed: boolean;
  pocketed: boolean;
  hidden: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  cards: PlayerCard[];
}

export interface Ball {
  number: number;
  pocketedBy: string | null;
}

export type Phase = "dealing" | "revealing" | "playing" | "round-end" | "game-over";
export type NetworkMode = "local" | "host" | "guest";
export type ConnectionStatus = "idle" | "hosting" | "connecting" | "connected" | "disconnected";

export interface PendingPocket {
  playerId: string;
  ballNumber: number;
  matchedCardIds: string[];
  valid: boolean;
  error?: string;
}

export interface ConnectedPlayer {
  id: string;
  name: string;
  avatar: string;
}

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  round: 1 | 2;
  phase: Phase;
  balls: Ball[];
  winner: string | null;
  draw: boolean;
  pendingPocket: PendingPocket | null;
  firstThreeMode: boolean;
  networkMode: NetworkMode;
  myPlayerId: string;
  connectedPlayers: ConnectedPlayer[];
  connectionStatus: ConnectionStatus;
  setupPlayers: (names: string[], avatars: string[]) => void;
  dealCards: () => void;
  revealCard: (playerId: string, cardId: string) => void;
  unlockRemainingCards: () => void;
  toggleCardHidden: (playerId: string, cardId: string) => void;
  pocketBall: (playerId: string, ballNumber: number) => void;
  confirmPocket: () => void;
  cancelPocket: () => void;
  reportFoul: () => void;
  nextTurn: () => void;
  nextRound: () => void;
  resetGame: () => void;
  hostGame: (playerName: string, avatar: string) => Promise<void>;
  joinGame: (ip: string, port: number, playerName: string) => Promise<void>;
  sendAction: (_action: unknown) => void;
  syncFromHost: (state: Partial<GameState>) => void;
  disconnect: () => void;
}

const initialBalls: Ball[] = Array.from({ length: 13 }, (_, i) => ({ number: i + 1, pocketedBy: null }));

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const createPlayerCard = (card: DeckCard): PlayerCard => ({
  id: card.id,
  suit: card.suit,
  value: card.value,
  ballNumber: card.ballNumber,
  revealed: false,
  pocketed: false,
  hidden: false,
});

const allFirstThreeRevealed = (players: Player[]): boolean =>
  players.every((player) => player.cards.slice(0, 3).every((card) => card.revealed));

export const useGameStore = create<GameState>((set, get) => ({
  players: [
    { id: "p1", name: "Player 1", avatar: "chip", cards: [] },
    { id: "p2", name: "Player 2", avatar: "cue", cards: [] },
  ],
  currentPlayerIndex: 0,
  round: 1,
  phase: "dealing",
  balls: initialBalls,
  winner: null,
  draw: false,
  pendingPocket: null,
  firstThreeMode: true,
  networkMode: "local",
  myPlayerId: "p1",
  connectedPlayers: [],
  connectionStatus: "idle",

  setupPlayers: (names, avatars) => {
    const normalizedNames = names.map((n) => n.trim()).filter(Boolean).slice(0, 8);
    const fallbackNames = normalizedNames.length >= 2 ? normalizedNames : ["Player 1", "Player 2"];
    const nextPlayers = fallbackNames.map((name, i) => ({
      id: `p${i + 1}`,
      name,
      avatar: avatars[i] ?? "chip",
      cards: [],
    }));

    set({
      players: nextPlayers,
      connectedPlayers: nextPlayers.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
      currentPlayerIndex: 0,
      phase: "dealing",
      round: 1,
      winner: null,
      draw: false,
      balls: initialBalls,
      pendingPocket: null,
      firstThreeMode: true,
      myPlayerId: nextPlayers[0]?.id ?? "p1",
    });
  },

  dealCards: () => {
    const { players } = get();
    const deck = shuffle(FULL_DECK);
    const cardsPerPlayer = 6;
    let index = 0;

    const nextPlayers = players.map((player) => {
      const dealt = deck.slice(index, index + cardsPerPlayer).map(createPlayerCard);
      index += cardsPerPlayer;
      return { ...player, cards: dealt };
    });

    set({ players: nextPlayers, phase: "revealing", pendingPocket: null, firstThreeMode: true, round: 1 });
  },

  revealCard: (playerId, cardId) => {
    const state = get();
    const nextPlayers = state.players.map((player) => {
      if (player.id !== playerId) return player;
      return {
        ...player,
        cards: player.cards.map((card) => (card.id === cardId && !card.revealed ? { ...card, revealed: true } : card)),
      };
    });

    const shouldStartPlaying = state.firstThreeMode && allFirstThreeRevealed(nextPlayers);
    set({ players: nextPlayers, phase: shouldStartPlaying ? "playing" : state.phase });
  },

  unlockRemainingCards: () => {
    set((state) => ({
      firstThreeMode: false,
      round: 2,
      players: state.players.map((player) => ({
        ...player,
        cards: player.cards.map((card, index) => (index >= 3 ? { ...card, revealed: true } : card)),
      })),
      phase: "playing",
    }));
  },

  toggleCardHidden: (playerId, cardId) => {
    set((state) => ({
      players: state.players.map((player) => {
        if (player.id !== playerId) return player;
        return {
          ...player,
          cards: player.cards.map((card) =>
            card.id === cardId && !card.pocketed ? { ...card, hidden: !card.hidden } : card,
          ),
        };
      }),
    }));
  },

  pocketBall: (playerId, ballNumber) => {
    const state = get();
    const activePlayer = state.players[state.currentPlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) return;

    const isAlreadyPocketed = state.balls.some((ball) => ball.number === ballNumber && ball.pocketedBy !== null);
    if (isAlreadyPocketed) {
      set({
        pendingPocket: { playerId, ballNumber, matchedCardIds: [], valid: false, error: "That ball is already off the table." },
      });
      return;
    }

    const matches = activePlayer.cards
      .filter((card) => card.ballNumber === ballNumber && !card.pocketed && card.revealed)
      .map((card) => card.id);

    if (matches.length === 0) {
      set({
        pendingPocket: {
          playerId,
          ballNumber,
          matchedCardIds: [],
          valid: false,
          error: `Ball ${ballNumber} does not match any currently revealed cards.`,
        },
      });
      return;
    }

    set({ pendingPocket: { playerId, ballNumber, matchedCardIds: matches, valid: true } });
  },

  confirmPocket: () => {
    const state = get();
    const pending = state.pendingPocket;
    if (!pending || !pending.valid) return;

    const nextPlayers = state.players.map((player) => {
      if (player.id !== pending.playerId) return player;
      return {
        ...player,
        cards: player.cards.map((card) => (pending.matchedCardIds.includes(card.id) ? { ...card, pocketed: true } : card)),
      };
    });

    const nextBalls = state.balls.map((ball) =>
      ball.number === pending.ballNumber ? { ...ball, pocketedBy: pending.playerId } : ball,
    );

    const winnerPlayer = nextPlayers.find((player) => player.cards.length === 6 && player.cards.every((card) => card.pocketed));
    const allBallsGone = nextBalls.every((ball) => ball.pocketedBy !== null);

    if (winnerPlayer) {
      set({
        players: nextPlayers,
        balls: nextBalls,
        pendingPocket: null,
        winner: winnerPlayer.name,
        phase: "game-over",
      });
      return;
    }

    set({
      players: nextPlayers,
      balls: nextBalls,
      pendingPocket: null,
      draw: allBallsGone,
      phase: allBallsGone ? "game-over" : state.phase,
      currentPlayerIndex: allBallsGone ? state.currentPlayerIndex : (state.currentPlayerIndex + 1) % state.players.length,
    });
  },

  cancelPocket: () => set({ pendingPocket: null }),

  reportFoul: () => {
    set((state) => ({
      pendingPocket: null,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    }));
  },

  nextTurn: () =>
    set((state) => ({
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    })),

  nextRound: () => {
    get().unlockRemainingCards();
  },

  resetGame: () =>
    set((state) => ({
      players: state.players.map((p) => ({ ...p, cards: [] })),
      currentPlayerIndex: 0,
      round: 1,
      phase: "dealing",
      balls: initialBalls,
      winner: null,
      draw: false,
      pendingPocket: null,
      firstThreeMode: true,
    })),

  hostGame: async (playerName, avatar) => {
    set({
      networkMode: "host",
      connectionStatus: "hosting",
      connectedPlayers: [{ id: "p1", name: playerName, avatar }],
      myPlayerId: "p1",
    });
  },

  joinGame: async (_ip, _port, playerName) => {
    set({
      networkMode: "guest",
      connectionStatus: "connected",
      myPlayerId: "guest-local",
      connectedPlayers: [{ id: "guest-local", name: playerName, avatar: "chip" }],
    });
  },

  sendAction: (_action) => {},

  syncFromHost: (state) => set(state as Partial<GameState>),

  disconnect: () => set({ connectionStatus: "disconnected", connectedPlayers: [], networkMode: "local" }),
}));
