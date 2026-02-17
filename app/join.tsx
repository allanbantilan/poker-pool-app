import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { scanForHosts } from "@/services/networking/guest";
import { useNetworkStore } from "@/services/networking/networkStore";
import { GoldButton } from "@/components/ui/GoldButton";
import { useGameStore } from "@/store/useGameStore";

export default function JoinScreen() {
  const router = useRouter();
  const discoveredGames = useNetworkStore((s) => s.discoveredGames);
  const setDiscoveredGames = useNetworkStore((s) => s.setDiscoveredGames);
  const setJoinTarget = useNetworkStore((s) => s.setJoinTarget);
  const joinAsPlayer = useNetworkStore((s) => s.joinAsPlayer);
  const joinGame = useGameStore((s) => s.joinGame);
  const [roomCode, setRoomCode] = useState("");
  const [hostIp, setHostIp] = useState("");
  const [name, setName] = useState("Guest");
  const [error, setError] = useState("");

  useEffect(() => {
    scanForHosts().then((games) => setDiscoveredGames(games));
  }, [setDiscoveredGames]);

  const onJoin = async () => {
    setError("");
    try {
      await joinGame(hostIp, roomCode, name, "chip");
      setJoinTarget(roomCode, hostIp);
      joinAsPlayer(name);
      router.push("/lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect over hotspot.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-felt px-5 pt-10" edges={["top", "bottom"]}>
      <Text className="mb-1 text-3xl font-bold text-chalk">Join Game</Text>
      <Text className="mb-4 text-[#D8D6CB]">Offline Mode: connect to host hotspot first, then enter host IP and room code.</Text>

      <Text className="mb-2 text-chalk">Your Name</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} placeholder="Enter your name" placeholderTextColor="#9EB6A8" />

      <Text className="mb-2 text-chalk">Host Hotspot IP</Text>
      <TextInput value={hostIp} onChangeText={setHostIp} style={inputStyle} placeholder="192.168.x.x" placeholderTextColor="#9EB6A8" />

      <Text className="mb-2 text-chalk">Room Code</Text>
      <TextInput value={roomCode} onChangeText={setRoomCode} style={inputStyle} placeholder="AB42" placeholderTextColor="#9EB6A8" autoCapitalize="characters" />

      {discoveredGames.length > 0 ? (
        <>
          <Text className="mb-2 text-chalk">Discovered Games</Text>
          {discoveredGames.map((game) => (
            <View key={game.gameId} className="mb-2.5 rounded-xl bg-black/20 p-3">
              <Text className="font-bold text-chalk">{game.hostName}</Text>
              <Text className="mt-1 text-[#D0CFC4]">IP: {game.ip}  Code: {game.roomCode}</Text>
              <Pressable
                onPress={() => {
                  setHostIp(game.ip);
                  setRoomCode(game.roomCode);
                }}
                className="mt-2"
              >
                <Text className="font-bold text-gold">Use This Host</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      {error ? <Text className="mb-2 text-[#FCA5A5]">{error}</Text> : null}
      <GoldButton title="Connect Over Hotspot" onPress={onJoin} />
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
  marginBottom: 12,
} as const;
