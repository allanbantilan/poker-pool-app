import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useNetworkStore } from "@/services/networking/networkStore";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

const avatars = ["chip", "card", "cue", "8-ball", "horseshoe", "dice"];

export default function LobbyScreen() {
  const router = useRouter();
  const roomCode = useNetworkStore((s) => s.roomCode);
  const hostIp = useNetworkStore((s) => s.hostIp);
  const playerNames = useNetworkStore((s) => s.playerNames);
  const maxPlayers = useNetworkStore((s) => s.maxPlayers);
  const addLocalPlayer = useNetworkStore((s) => s.addLocalPlayer);
  const removeLocalPlayer = useNetworkStore((s) => s.removeLocalPlayer);
  const [newName, setNewName] = useState("");

  const setupPlayers = useGameStore((s) => s.setupPlayers);
  const dealCards = useGameStore((s) => s.dealCards);

  const startGame = () => {
    if (playerNames.length < 2) return;
    const names = playerNames.slice(0, 8);
    const pickedAvatars = names.map((_, i) => avatars[i % avatars.length]);
    setupPlayers(names, pickedAvatars);
    dealCards();
    router.replace("/game");
  };

  return (
    <ScrollView className="flex-1 bg-felt px-5" contentContainerClassName="py-8">
      <Text className="mb-4 text-3xl font-bold text-chalk">Waiting for players...</Text>
      <Text className="mb-2 text-chalk">Room Code: {roomCode || "AB42"}</Text>
      <Text className="mb-4 text-chalk">Your IP: {hostIp || "192.168.1.5"}</Text>
      <Text className="mb-2 text-chalk">Players ({playerNames.length}/{maxPlayers})</Text>

      <View className="mb-4 rounded-xl bg-black/25 p-3">
        {playerNames.map((name, index) => (
          <View key={`${name}-${index}`} className="mb-2 flex-row items-center justify-between">
            <Text className="text-chalk">{index + 1}. {name}</Text>
            {index > 0 ? (
              <Pressable onPress={() => removeLocalPlayer(index)}>
                <Text className="font-bold text-gold">Remove</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <TextInput
        value={newName}
        onChangeText={setNewName}
        style={inputStyle}
        placeholder="Add joining player name"
        placeholderTextColor="#9EB6A8"
      />
      <Pressable
        onPress={() => {
          addLocalPlayer(newName);
          setNewName("");
        }}
        className="mb-4 rounded-xl bg-[#2B4A39] px-3 py-2"
      >
        <Text className="text-center font-semibold text-chalk">Add Player</Text>
      </Pressable>

      <GoldButton title={playerNames.length >= 2 ? "Start Game" : "Need 2+ Players"} onPress={startGame} disabled={playerNames.length < 2} />
    </ScrollView>
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
