import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useNetworkStore } from "@/services/networking/networkStore";
import { GoldButton } from "@/components/ui/GoldButton";

export default function LobbyScreen() {
  const router = useRouter();
  const roomCode = useNetworkStore((s) => s.roomCode);
  const hostIp = useNetworkStore((s) => s.hostIp);

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="mb-4 text-3xl font-bold text-chalk">Waiting for players...</Text>
      <Text className="mb-2 text-chalk">Room Code: {roomCode || "AB42"}</Text>
      <Text className="mb-4 text-chalk">Your IP: {hostIp || "192.168.1.5"}</Text>
      <View className="mb-4 rounded-xl bg-black/25 p-3">
        <Text className="mb-1.5 text-chalk">? You (Player 1)</Text>
        <Text className="mb-1.5 text-chalk">? Waiting for others...</Text>
      </View>
      <GoldButton title="Start Game" onPress={() => router.replace("/setup")} />
    </View>
  );
}
