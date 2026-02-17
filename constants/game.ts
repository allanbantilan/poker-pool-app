export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardValue = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface DeckCard {
  id: string;
  suit: Suit;
  value: CardValue;
  ballNumber: number;
}

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES: CardValue[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const valueToBallNumber = (value: CardValue): number => {
  if (value === "A") return 1;
  if (value === "J") return 11;
  if (value === "Q") return 12;
  if (value === "K") return 13;
  return Number(value);
};

export const FULL_DECK: DeckCard[] = SUITS.flatMap((suit) =>
  VALUES.map((value) => ({
    id: `${value}-${suit}`,
    suit,
    value,
    ballNumber: valueToBallNumber(value),
  })),
);

export const APP_COLORS = {
  felt: "#0D2B1A",
  feltAlt: "#103322",
  gold: "#C9A84C",
  chalk: "#F1EFE7",
  leather: "#4B2E20",
  red: "#9C2F2F",
  black: "#181818",
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: "#B32025",
  diamonds: "#B32025",
  clubs: "#151515",
  spades: "#151515",
};

export const BALL_COLORS: Record<number, string> = {
  1: "#F2C32E",
  2: "#2D4FA6",
  3: "#C7412E",
  4: "#5B3288",
  5: "#D06A23",
  6: "#2E8C56",
  7: "#8B2A1F",
  8: "#111111",
  9: "#F2C32E",
  10: "#2D4FA6",
  11: "#C7412E",
  12: "#5B3288",
  13: "#D06A23",
};

