import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { scanForHosts } from "@/services/networking/guest";
import { useNetworkStore } from "@/services/networking/networkStore";
import { GoldButton } from "@/components/ui/GoldButton";

export default function JoinScreen() {
  const router = useRouter();
  const discoveredGames = useNetworkStore((s) => s.discoveredGames);
  const setDiscoveredGames = useNetworkStore((s) => s.setDiscoveredGames);
  const joinAsPlayer = useNetworkStore((s) => s.joinAsPlayer);
  const [code, setCode] = useState("");
  const [name, setName] = useState("Guest");

  useEffect(() => {
    scanForHosts().then((games) => setDiscoveredGames(games));
  }, [setDiscoveredGames]);

  const onJoin = () => {
    joinAsPlayer(name);
    router.push("/lobby");
  };

  return (
    <View className="flex-1 bg-felt px-5 pt-10">
      <Text className="mb-2.5 text-3xl font-bold text-chalk">Join Game</Text>
      <Text className="mb-2 text-chalk">Your Name</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} placeholder="Enter your name" placeholderTextColor="#9EB6A8" />

      <Text className="mb-2 text-chalk">Finding Games...</Text>
      {discoveredGames.map((game) => (
        <View key={game.gameId} className="mb-2.5 rounded-xl bg-black/20 p-3">
          <Text className="font-bold text-chalk">{game.hostName}</Text>
          <Text className="mt-1 text-[#D0CFC4]">
            Code: {game.gameId.slice(-4).toUpperCase()}  {game.playerCount}/{game.maxPlayers}
          </Text>
          <Pressable onPress={onJoin} className="mt-2">
            <Text className="font-bold text-gold">Join</Text>
          </Pressable>
        </View>
      ))}

      <Text className="mb-2 mt-2.5 text-chalk">Or enter code manually</Text>
      <TextInput value={code} onChangeText={setCode} style={inputStyle} placeholder="AB42" placeholderTextColor="#9EB6A8" />
      <GoldButton title="Connect" onPress={onJoin} />
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
  marginBottom: 12,
} as const;
