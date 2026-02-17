import { Text, View } from "react-native";
import { CardHand } from "@/components/cards/CardHand";
import { BallRow } from "@/components/balls/BallRow";
import type { Player } from "@/store/useGameStore";

interface PlayerStripProps {
  player: Player;
}

export function PlayerStrip({ player }: PlayerStripProps) {
  const balls = Array.from({ length: 13 }, (_, i) => ({
    number: i + 1,
    pocketed: player.cards.some((card) => card.pocketed && card.ballNumber === i + 1),
  }));

  return (
    <View className="mb-2.5 rounded-2xl border border-[#3B2E1E] bg-black/25 p-2.5">
      <Text className="mb-2 font-bold text-chalk">
        {player.avatar} {player.name}
      </Text>
      <CardHand cards={player.cards} forceHide />
      <BallRow balls={balls} />
    </View>
  );
}
