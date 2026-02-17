import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

const avatars = ["chip", "card", "cue", "8-ball", "horseshoe", "dice"];

export default function SetupScreen() {
  const router = useRouter();
  const setupPlayers = useGameStore((s) => s.setupPlayers);
  const dealCards = useGameStore((s) => s.dealCards);
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [nameOne, setNameOne] = useState("Player 1");
  const [nameTwo, setNameTwo] = useState("Player 2");
  const [nameThree, setNameThree] = useState("Player 3");
  const [avatar, setAvatar] = useState("chip");

  const onStart = () => {
    const names = playerCount === 2 ? [nameOne, nameTwo] : [nameOne, nameTwo, nameThree];
    const picks = names.map((_, i) => avatars[i] ?? avatar);
    setupPlayers(names, picks);
    dealCards();
    router.push("/game");
  };

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="mb-5 text-3xl font-bold text-chalk">Player Setup</Text>
      <TextInput value={nameOne} onChangeText={setNameOne} style={inputStyle} placeholder="Player 1" placeholderTextColor="#9EB6A8" />
      <TextInput value={nameTwo} onChangeText={setNameTwo} style={inputStyle} placeholder="Player 2" placeholderTextColor="#9EB6A8" />
      {playerCount === 3 ? (
        <TextInput value={nameThree} onChangeText={setNameThree} style={inputStyle} placeholder="Player 3" placeholderTextColor="#9EB6A8" />
      ) : null}

      <Text className="mb-2 mt-3 text-chalk">Avatar</Text>
      <View className="mb-3 flex-row flex-wrap">
        {avatars.map((item) => (
          <Pressable
            key={item}
            onPress={() => setAvatar(item)}
            className={`mb-2 mr-2 rounded-xl px-2.5 py-2 ${avatar === item ? "bg-gold" : "bg-[#234333]"}`}
          >
            <Text className={avatar === item ? "text-[#1B160B]" : "text-chalk"}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-4 flex-row">
        {[2, 3].map((n) => (
          <Pressable
            key={n}
            onPress={() => setPlayerCount(n as 2 | 3)}
            className={`mr-2 rounded-xl px-4 py-2.5 ${playerCount === n ? "bg-gold" : "bg-[#2B4A39]"}`}
          >
            <Text className={playerCount === n ? "text-[#1B160B]" : "text-chalk"}>{n} Players</Text>
          </Pressable>
        ))}
      </View>
      <GoldButton title="Start Game" onPress={onStart} />
    </View>
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
