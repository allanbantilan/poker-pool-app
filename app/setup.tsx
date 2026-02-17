import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

const avatars = ["chip", "card", "cue", "8-ball", "horseshoe", "dice"];

export default function SetupScreen() {
  const router = useRouter();
  const setupPlayers = useGameStore((s) => s.setupPlayers);
  const dealCards = useGameStore((s) => s.dealCards);
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(["Player 1", "Player 2"]);

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const onCountChange = (count: number) => {
    setPlayerCount(count);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(`Player ${next.length + 1}`);
      return next.slice(0, count);
    });
  };

  const onStart = () => {
    const selectedNames = names.slice(0, playerCount);
    const picks = selectedNames.map((_, i) => avatars[i % avatars.length]);
    setupPlayers(selectedNames, picks);
    dealCards();
    router.push("/game");
  };

  return (
    <SafeAreaView className="flex-1 bg-felt" edges={["top", "bottom"]}>
      <ScrollView className="flex-1 bg-felt px-5" contentContainerClassName="py-8">
        <Text className="mb-5 text-3xl font-bold text-chalk">Player Setup (2-8)</Text>

        <View className="mb-4 flex-row flex-wrap">
          {Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
            <Pressable
              key={n}
              onPress={() => onCountChange(n)}
              className={`mb-2 mr-2 rounded-xl px-4 py-2.5 ${playerCount === n ? "bg-gold" : "bg-[#2B4A39]"}`}
            >
              <Text className={playerCount === n ? "text-[#1B160B]" : "text-chalk"}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {Array.from({ length: playerCount }, (_, i) => i).map((index) => (
          <TextInput
            key={index}
            value={names[index] ?? ""}
            onChangeText={(text) => updateName(index, text)}
            style={inputStyle}
            placeholder={`Player ${index + 1} name`}
            placeholderTextColor="#9EB6A8"
          />
        ))}

        <GoldButton title="Start Game" onPress={onStart} />
      </ScrollView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: "#143725",
  color: "#F1EFE7",
  borderWidth: 1,
  borderColor: "#35634B",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 12,
  marginBottom: 10,
} as const;
