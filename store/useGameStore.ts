import { create } from "zustand";
import { FULL_DECK, type DeckCard, type Suit } from "@/constants/game";
import {
  broadcastHostHeartbeat,
  broadcastStateUpdate,
  type HostSessionInfo,
  startHostSession,
  stopHostSession,
} from "@/services/networking/host";
import {
  connectToHost,
  disconnectGuest,
  sendGuestAction,
} from "@/services/networking/guest";
import { PORTS, type ClientGameAction, type NetworkGameState } from "@/services/networking/protocol";

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
  breakerIndex: number;
  round: 1 | 2;
  phase: Phase;
  balls: Ball[];
  winner: string | null;
  draw: boolean;
  pendingPocket: PendingPocket | null;
  firstThreeMode: boolean;
  firstThreeWinner: { playerId: string; name: string; handLabel: string } | null;
  undealtDeck: DeckCard[];
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
  hostGame: (
    playerName: string,
    avatar: string,
    hotspotIp: string,
    roomCode?: string,
    maxPlayers?: number,
  ) => Promise<HostSessionInfo>;
  joinGame: (ip: string, roomCode: string, playerName: string, avatar: string) => Promise<void>;
  sendAction: (action: ClientGameAction) => void;
  syncFromHost: (state: NetworkGameState, connectedPlayers: ConnectedPlayer[]) => void;
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

const valueRank = (value: string): number => {
  if (value === "A") return 14;
  if (value === "K") return 13;
  if (value === "Q") return 12;
  if (value === "J") return 11;
  return Number(value);
};

const sortedDesc = (values: number[]) => [...values].sort((a, b) => b - a);

const evaluateThreeCardHand = (cards: PlayerCard[]): { score: number[]; handLabel: string } => {
  const values = sortedDesc(cards.map((c) => valueRank(c.value)));
  const counts = values.reduce<Record<number, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
  const countEntries = Object.entries(counts)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  // First 3 mini-game ranking only: Trips > Pair > High Card.
  if (countEntries[0].count === 3) return { score: [3, countEntries[0].value], handLabel: "Three of a Kind" };
  if (countEntries[0].count === 2) {
    const pair = countEntries[0].value;
    const kicker = countEntries[1].value;
    return { score: [2, pair, kicker], handLabel: "Pair" };
  }
  return { score: [1, ...values], handLabel: "High Card" };
};

const compareScore = (a: number[], b: number[]): number => {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
};

const toNetworkState = (state: GameState): NetworkGameState => ({
  players: state.players,
  currentPlayerIndex: state.currentPlayerIndex,
  breakerIndex: state.breakerIndex,
  round: state.round,
  phase: state.phase,
  balls: state.balls,
  winner: state.winner,
  draw: state.draw,
  firstThreeMode: state.firstThreeMode,
  firstThreeWinner: state.firstThreeWinner,
});

export const useGameStore = create<GameState>((set, get) => ({
  players: [
    { id: "p1", name: "Player 1", avatar: "chip", cards: [] },
    { id: "p2", name: "Player 2", avatar: "cue", cards: [] },
  ],
  currentPlayerIndex: 0,
  breakerIndex: 0,
  round: 1,
  phase: "dealing",
  balls: initialBalls,
  winner: null,
  draw: false,
  pendingPocket: null,
  firstThreeMode: true,
  firstThreeWinner: null,
  undealtDeck: [],
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
      breakerIndex: 0,
      phase: "dealing",
      round: 1,
      winner: null,
      draw: false,
      balls: initialBalls,
      pendingPocket: null,
      firstThreeMode: true,
      firstThreeWinner: null,
      undealtDeck: [],
      myPlayerId: nextPlayers[0]?.id ?? "p1",
    });
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  dealCards: () => {
    const { players } = get();
    const deck = shuffle(FULL_DECK);
    const cardsPerPlayer = 3;
    let index = 0;

    const nextPlayers = players.map((player) => {
      const dealt = deck.slice(index, index + cardsPerPlayer).map(createPlayerCard);
      index += cardsPerPlayer;
      return { ...player, cards: dealt };
    });

    set({
      players: nextPlayers,
      phase: "revealing",
      pendingPocket: null,
      firstThreeMode: true,
      firstThreeWinner: null,
      undealtDeck: deck.slice(index),
      round: 1,
    });
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  revealCard: (playerId, cardId) => {
    const state = get();
    if (state.networkMode === "guest") {
      get().sendAction({ type: "REVEAL_CARD", playerId, cardId });
      return;
    }

    const nextPlayers = state.players.map((player) => {
      if (player.id !== playerId) return player;
      return {
        ...player,
        cards: player.cards.map((card) => (card.id === cardId && !card.revealed ? { ...card, revealed: true } : card)),
      };
    });

    const shouldStartPlaying = state.firstThreeMode && allFirstThreeRevealed(nextPlayers);
    let firstThreeWinner = state.firstThreeWinner;
    let breakerIndex = state.breakerIndex;
    let currentPlayerIndex = state.currentPlayerIndex;

    if (shouldStartPlaying) {
      const ranked = nextPlayers.map((player, index) => {
        const hand = evaluateThreeCardHand(player.cards.slice(0, 3));
        return { index, player, ...hand };
      });
      ranked.sort((a, b) => compareScore(b.score, a.score));
      const top = ranked[0];
      if (top) {
        firstThreeWinner = { playerId: top.player.id, name: top.player.name, handLabel: top.handLabel };
        breakerIndex = top.index;
        currentPlayerIndex = top.index;
      }
    }

    set({
      players: nextPlayers,
      phase: shouldStartPlaying ? "playing" : state.phase,
      firstThreeWinner,
      breakerIndex,
      currentPlayerIndex,
    });
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  unlockRemainingCards: () => {
    const stateBefore = get();
    if (stateBefore.networkMode === "guest") {
      const me = stateBefore.players[stateBefore.currentPlayerIndex];
      if (me) get().sendAction({ type: "UNLOCK_REMAINING", playerId: me.id });
      return;
    }

    set((state) => {
      let deckIndex = 0;
      const nextPlayers = state.players.map((player) => {
        const nextThree = state.undealtDeck
          .slice(deckIndex, deckIndex + 3)
          .map((card) => ({ ...createPlayerCard(card), revealed: true }));
        deckIndex += 3;
        return { ...player, cards: [...player.cards, ...nextThree] };
      });

      return {
        firstThreeMode: false,
        round: 2,
        players: nextPlayers,
        undealtDeck: state.undealtDeck.slice(deckIndex),
        currentPlayerIndex: state.breakerIndex,
        phase: "playing",
      };
    });
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
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
    if (state.networkMode === "guest") {
      get().sendAction({ type: "POCKET_BALL", playerId, ballNumber });
      return;
    }
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
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  confirmPocket: () => {
    const state = get();
    if (state.networkMode === "guest") {
      const me = state.players[state.currentPlayerIndex];
      if (me) get().sendAction({ type: "CONFIRM_POCKET", playerId: me.id });
      return;
    }
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

    const winnerIndex = nextPlayers.findIndex((player) => player.cards.length === 6 && player.cards.every((card) => card.pocketed));
    const winnerPlayer = winnerIndex >= 0 ? nextPlayers[winnerIndex] : undefined;
    const allBallsGone = nextBalls.every((ball) => ball.pocketedBy !== null);

    if (winnerPlayer) {
      set({
        players: nextPlayers,
        balls: nextBalls,
        pendingPocket: null,
        winner: winnerPlayer.name,
        breakerIndex: winnerIndex,
        phase: "game-over",
      });
      const updated = get();
      if (updated.networkMode === "host") {
        broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
        broadcastHostHeartbeat();
      }
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
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  cancelPocket: () => {
    const state = get();
    if (state.networkMode === "guest") return;
    set({ pendingPocket: null });
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  reportFoul: () => {
    const current = get();
    if (current.networkMode === "guest") {
      const me = current.players[current.currentPlayerIndex];
      if (me) get().sendAction({ type: "REPORT_FOUL", playerId: me.id });
      return;
    }
    set((state) => ({
      pendingPocket: null,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    }));
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  nextTurn: () => {
    const state = get();
    if (state.networkMode === "guest") return;
    set((current) => ({
      currentPlayerIndex: (current.currentPlayerIndex + 1) % current.players.length,
    }));
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  nextRound: () => {
    get().unlockRemainingCards();
  },

  resetGame: () => {
    const state = get();
    if (state.networkMode === "guest") return;
    set((current) => ({
      players: current.players.map((p) => ({ ...p, cards: [] })),
      currentPlayerIndex: current.breakerIndex,
      round: 1,
      phase: "dealing",
      balls: initialBalls,
      winner: null,
      draw: false,
      pendingPocket: null,
      firstThreeMode: true,
      firstThreeWinner: null,
      undealtDeck: [],
    }));
    const updated = get();
    if (updated.networkMode === "host") {
      broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
      broadcastHostHeartbeat();
    }
  },

  hostGame: async (playerName, avatar, hotspotIp, roomCode, maxPlayers) => {
    const session = await startHostSession(playerName, hotspotIp, {
      roomCode,
      maxPlayers,
      callbacks: {
        onJoin: (peer) => {
          set((state) => {
            if (state.connectedPlayers.some((p) => p.id === peer.id)) return state;
            const nextPeers = [...state.connectedPlayers, peer];
            return { connectedPlayers: nextPeers };
          });
          const updated = get();
          broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
        },
        onAction: (action) => {
          const store = get();
          if (action.type === "REVEAL_CARD") store.revealCard(action.playerId, action.cardId);
          if (action.type === "POCKET_BALL") store.pocketBall(action.playerId, action.ballNumber);
          if (action.type === "CONFIRM_POCKET") store.confirmPocket();
          if (action.type === "REPORT_FOUL") store.reportFoul();
          if (action.type === "UNLOCK_REMAINING") store.unlockRemainingCards();
        },
        onDisconnect: (clientId) => {
          set((state) => ({
            connectedPlayers: state.connectedPlayers.filter((p) => p.id !== clientId),
          }));
          const updated = get();
          broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
        },
      },
    });

    set({
      networkMode: "host",
      connectionStatus: "hosting",
      connectedPlayers: [{ id: "p1", name: playerName, avatar }],
      myPlayerId: "p1",
    });

    const updated = get();
    broadcastStateUpdate(toNetworkState(updated), updated.connectedPlayers);
    return session;
  },

  joinGame: async (ip, roomCode, playerName, avatar) => {
    set({ connectionStatus: "connecting" });
    const result = await connectToHost({
      ip,
      roomCode,
      playerName,
      avatar,
      callbacks: {
        onConnected: () => {
          set({ connectionStatus: "connected" });
        },
        onStateUpdate: (state, connectedPlayers) => {
          get().syncFromHost(state, connectedPlayers);
        },
        onPlayerDisconnected: () => {},
        onError: () => {
          set({ connectionStatus: "disconnected" });
        },
        onHostDisconnected: () => {
          set({ connectionStatus: "disconnected", phase: "round-end" });
        },
      },
    });

    if (!result.ok) {
      set({ connectionStatus: "disconnected" });
      throw new Error(result.message);
    }

    set({
      networkMode: "guest",
      myPlayerId: `guest-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "player"}`,
      connectedPlayers: [{ id: "p1", name: "Host", avatar: "chip" }, { id: "guest", name: playerName, avatar }],
    });
  },

  sendAction: (action) => {
    const state = get();
    if (state.networkMode !== "guest") return;
    sendGuestAction(action);
  },

  syncFromHost: (state, connectedPlayers) =>
    set((current) => ({
      ...current,
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      breakerIndex: state.breakerIndex,
      round: state.round,
      phase: state.phase,
      balls: state.balls,
      winner: state.winner,
      draw: state.draw,
      firstThreeMode: state.firstThreeMode,
      firstThreeWinner: state.firstThreeWinner,
      connectedPlayers,
      pendingPocket: null,
    })),

  disconnect: () => {
    const state = get();
    if (state.networkMode === "host") {
      stopHostSession();
    }
    if (state.networkMode === "guest") {
      disconnectGuest();
    }
    set({ connectionStatus: "disconnected", connectedPlayers: [], networkMode: "local" });
  },
}));
