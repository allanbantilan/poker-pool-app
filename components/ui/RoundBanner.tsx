import { Text, View } from "react-native";
import type { Player, Phase } from "@/store/useGameStore";

interface RoundBannerProps {
  round: 1 | 2;
  phase: Phase;
  players: Player[];
  currentPlayerIndex: number;
}

export function RoundBanner({ round, phase, players, currentPlayerIndex }: RoundBannerProps) {
  return (
    <View className="rounded-xl border border-gold bg-black/35 p-2.5">
      <Text className="font-bold text-chalk">Round {round} of 2</Text>
      <Text className="mt-1 text-[#A7D9B9]">
        Active: {players[currentPlayerIndex]?.name ?? "None"} | Phase: {phase}
      </Text>
    </View>
  );
}
