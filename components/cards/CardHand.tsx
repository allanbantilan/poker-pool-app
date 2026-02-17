import { ScrollView, View } from "react-native";
import { PokerCard } from "@/components/cards/PokerCard";
import type { PlayerCard } from "@/store/useGameStore";

interface CardHandProps {
  cards: PlayerCard[];
  onCardTap?: (cardId: string) => void;
  forceHide?: boolean;
}

export function CardHand({ cards, onCardTap, forceHide }: CardHandProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row py-1">
        {cards.map((card) => (
          <PokerCard
            key={card.id}
            suit={card.suit}
            value={card.value}
            faceDown={!card.revealed}
            pocketed={card.pocketed}
            hidden={forceHide ? !card.pocketed : card.hidden}
            onTap={onCardTap ? () => onCardTap(card.id) : undefined}
          />
        ))}
      </View>
    </ScrollView>
  );
}
