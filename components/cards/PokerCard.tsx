import { Pressable, Text, View } from "react-native";
import { CardBack } from "@/components/cards/CardBack";
import { SUIT_COLORS, SUIT_SYMBOLS, type Suit } from "@/constants/game";

interface PokerCardProps {
  suit: Suit;
  value: string;
  faceDown?: boolean;
  pocketed?: boolean;
  hidden?: boolean;
  onTap?: () => void;
}

export function PokerCard({ suit, value, faceDown, pocketed, hidden, onTap }: PokerCardProps) {
  const showBack = faceDown || hidden;

  return (
    <Pressable
      onPress={onTap}
      style={{
        width: 90,
        height: 130,
        borderRadius: 16,
        marginRight: 10,
        backgroundColor: "#FAFAF5",
        borderWidth: 1,
        borderColor: pocketed ? "#909090" : "#EAE9DF",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        opacity: pocketed ? 0.58 : 1,
        overflow: "hidden",
      }}
    >
      {showBack ? (
        <CardBack />
      ) : (
        <View style={{ flex: 1, padding: 10, justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: SUIT_COLORS[suit], fontWeight: "700", fontSize: 20 }}>{value}</Text>
            <Text style={{ color: SUIT_COLORS[suit], fontSize: 18 }}>{SUIT_SYMBOLS[suit]}</Text>
          </View>
          <Text style={{ color: SUIT_COLORS[suit], fontSize: 38, textAlign: "center" }}>{SUIT_SYMBOLS[suit]}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: SUIT_COLORS[suit], fontWeight: "700", fontSize: 20 }}>{value}</Text>
          </View>
        </View>
      )}
      {pocketed ? (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            backgroundColor: "#1C5637",
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

