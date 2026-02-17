import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Network from "expo-network";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoldButton } from "@/components/ui/GoldButton";
import { useNetworkStore } from "@/services/networking/networkStore";
import { isPrivateLanIp } from "@/services/networking/protocol";
import { useGameStore } from "@/store/useGameStore";

export default function HostScreen() {
  const router = useRouter();
  const setHosting = useNetworkStore((s) => s.setHosting);
  const hostGame = useGameStore((s) => s.hostGame);
  const [name, setName] = useState("Host");
  const [hotspotIp, setHotspotIp] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [error, setError] = useState("");
  const [ipStatus, setIpStatus] = useState("Checking local IP...");
  const [isDetectingIp, setIsDetectingIp] = useState(false);

  const detectLocalIp = useCallback(async () => {
    setIsDetectingIp(true);
    try {
      const ip = await Network.getIpAddressAsync();
      const cleanIp = ip?.trim() ?? "";

      if (isPrivateLanIp(cleanIp)) {
        setHotspotIp((prev) => (prev ? prev : cleanIp));
        setIpStatus(`Detected local IP: ${cleanIp}`);
      } else if (cleanIp) {
        setIpStatus(`Detected IP ${cleanIp}, but it is not a private hotspot/LAN IP.`);
      } else {
        setIpStatus("Could not detect local IP. Turn hotspot on and retry.");
      }
    } catch {
      setIpStatus("Could not detect local IP. Turn hotspot on and retry.");
    } finally {
      setIsDetectingIp(false);
    }
  }, []);

  useEffect(() => {
    void detectLocalIp();
  }, [detectLocalIp]);

  return (
    <SafeAreaView className="flex-1 justify-center bg-felt px-5" edges={["top", "bottom"]}>
      <Text className="mb-1 text-3xl font-bold text-chalk">Hosting Game</Text>
      <Text className="mb-4 text-[#D8D6CB]">Offline Mode: turn on your phone hotspot. Friends join this hotspot, then enter your IP.</Text>

      <Text className="mb-2 text-chalk">Your Name</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor="#9EB6A8" placeholder="Host name" />

      <Text className="mb-2 text-chalk">Your Hotspot IP</Text>
      <TextInput value={hotspotIp} onChangeText={setHotspotIp} style={inputStyle} placeholderTextColor="#9EB6A8" placeholder="192.168.x.x" />
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="mr-2 flex-1 text-[#D8D6CB]">{ipStatus}</Text>
        <Pressable
          onPress={() => void detectLocalIp()}
          disabled={isDetectingIp}
          className={`rounded-lg px-3 py-2 ${isDetectingIp ? "bg-[#3A4D42]" : "bg-[#2B4A39]"}`}
        >
          <Text className="text-chalk">{isDetectingIp ? "Checking..." : "Detect Again"}</Text>
        </Pressable>
      </View>

      <Text className="mb-2 text-chalk">Max Players (2-8)</Text>
      <View className="mb-3 flex-row flex-wrap">
        {Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
          <Pressable
            key={n}
            onPress={() => setMaxPlayers(n)}
            className={`mb-2 mr-2 rounded-xl px-3 py-2 ${maxPlayers === n ? "bg-gold" : "bg-[#2B4A39]"}`}
          >
            <Text className={maxPlayers === n ? "text-[#1B160B]" : "text-chalk"}>{n}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text className="mb-2 text-[#FCA5A5]">{error}</Text> : null}

      <GoldButton
        title="Start Hosting"
        onPress={async () => {
          try {
            setError("");
            const session = await hostGame(name, "chip", hotspotIp, undefined, maxPlayers);
            setHosting(session.roomCode, session.ip, name, maxPlayers);
            router.push("/lobby");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to start host session.");
          }
        }}
      />
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
