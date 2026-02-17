import { Text, View } from "react-native";
import type { Player, Phase } from "@/store/useGameStore";

interface RoundBannerProps {
  round: 1 | 2;
  phase: Phase;
  players: Player[];
  currentPlayerIndex: number;
  firstThreeMode: boolean;
}

export function RoundBanner({ round, phase, players, currentPlayerIndex, firstThreeMode }: RoundBannerProps) {
  const current = players[currentPlayerIndex]?.name ?? "None";
  const next = players.length > 0 ? players[(currentPlayerIndex + 1) % players.length]?.name ?? "None" : "None";

  return (
    <View className="rounded-xl border border-gold bg-black/35 p-2.5">
      <Text className="font-bold text-chalk">Round {round} of 2</Text>
      {firstThreeMode ? <Text className="mt-1 text-gold">First 3 Cards Game</Text> : null}
      <Text className="mt-1 text-[#A7D9B9]">Now Playing: {current}</Text>
      <Text className="mt-1 text-[#D8D6CB]">Next Up: {next}</Text>
      <Text className="mt-1 text-[#8CC6A2]">Phase: {phase}</Text>
    </View>
  );
}
