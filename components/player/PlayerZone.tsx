import { Pressable, Text, View } from "react-native";
import { CardHand } from "@/components/cards/CardHand";
import type { Player } from "@/store/useGameStore";

interface PlayerZoneProps {
  player: Player;
  showPocketedOnly: boolean;
  onCardTap: (cardId: string) => void;
  onCardLongPress: (cardId: string) => void;
  onTogglePocketedFilter: () => void;
}

export function PlayerZone({ player, showPocketedOnly, onCardTap, onCardLongPress, onTogglePocketedFilter }: PlayerZoneProps) {
  const cards = showPocketedOnly ? player.cards.filter((card) => card.pocketed) : player.cards;

  return (
    <View className="rounded-2xl border border-gold bg-black/35 p-3">
      <Text className="mb-2 text-[17px] font-bold text-chalk">{player.name} - Your Hand</Text>
      <CardHand cards={cards} onCardTap={onCardTap} onCardLongPress={onCardLongPress} />
      <View className="mt-2.5 flex-row">
        <Pressable onPress={onTogglePocketedFilter} className="rounded-[10px] bg-leather px-3 py-2.5">
          <Text className="text-chalk">{showPocketedOnly ? "Show All 6 Cards" : "Pocketed Cards"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
