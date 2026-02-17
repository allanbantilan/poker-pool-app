import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

export default function RoundEndScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const nextRound = useGameStore((s) => s.nextRound);

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="text-center text-[34px] font-bold text-gold">Round Complete!</Text>
      <View className="my-5 rounded-xl bg-black/25 p-3.5">
        {players.map((p) => (
          <Text key={p.id} className="mb-1.5 text-chalk">
            {p.name}: {p.cards.filter((c) => !c.pocketed).length} cards remaining
          </Text>
        ))}
      </View>
      <GoldButton
        title="Deal Next 3 Cards"
        onPress={() => {
          nextRound();
          router.replace("/game");
        }}
      />
    </View>
  );
}
