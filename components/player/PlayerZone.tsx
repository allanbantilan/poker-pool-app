import { Pressable, Text, View } from "react-native";
import { CardHand } from "@/components/cards/CardHand";
import type { Player } from "@/store/useGameStore";

interface PlayerZoneProps {
  player: Player;
  showPocketedOnly: boolean;
  hideCards: boolean;
  onCardTap: (cardId: string) => void;
  onToggleHide: () => void;
  onTogglePocketedFilter: () => void;
}

export function PlayerZone({
  player,
  showPocketedOnly,
  hideCards,
  onCardTap,
  onToggleHide,
  onTogglePocketedFilter,
}: PlayerZoneProps) {
  const cards = showPocketedOnly ? player.cards.filter((card) => card.pocketed) : player.cards;

  return (
    <View className="rounded-2xl border border-gold bg-black/35 p-3">
      <Text className="mb-2 text-[17px] font-bold text-chalk">{player.name}</Text>
      <CardHand
        cards={cards.map((card) => ({
          ...card,
          hidden: hideCards && !card.pocketed ? true : card.hidden,
        }))}
        onCardTap={onCardTap}
      />
      <View className="mt-2.5 flex-row">
        <Pressable onPress={onToggleHide} className="mr-2 rounded-[10px] bg-[#2F493B] px-3 py-2.5">
          <Text className="text-chalk">?? {hideCards ? "Show" : "Hide"} My Cards</Text>
        </Pressable>
        <Pressable onPress={onTogglePocketedFilter} className="rounded-[10px] bg-leather px-3 py-2.5">
          <Text className="text-chalk">{showPocketedOnly ? "All Cards" : "Pocketed Cards"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
