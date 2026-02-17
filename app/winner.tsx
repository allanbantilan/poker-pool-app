import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

export default function WinnerScreen() {
  const router = useRouter();
  const winner = useGameStore((s) => s.winner);
  const draw = useGameStore((s) => s.draw);
  const resetGame = useGameStore((s) => s.resetGame);
  const dealCards = useGameStore((s) => s.dealCards);

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="mb-3 text-center text-[40px] font-extrabold text-gold">{draw ? "Draw Game" : `${winner ?? "Winner"} Wins!`}</Text>
      <Text className="mb-5 text-center text-chalk">? ? ?</Text>
      <GoldButton
        title="Next Round"
        onPress={() => {
          resetGame();
          dealCards();
          router.replace("/game");
        }}
      />
      <View className="h-3" />
      <GoldButton title="Exit to Lobby" onPress={() => router.replace("/")} />
    </View>
  );
}
