import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";
import { useNetworkStore } from "@/services/networking/networkStore";
import { startHostSession } from "@/services/networking/host";

export default function HostScreen() {
  const router = useRouter();
  const setHosting = useNetworkStore((s) => s.setHosting);
  const [name, setName] = useState("Host");
  const [maxPlayers, setMaxPlayers] = useState(8);

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="mb-3 text-3xl font-bold text-chalk">Hosting Game</Text>
      <Text className="mb-2 text-chalk">Your Name</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor="#9EB6A8" placeholder="Host name" />

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

      <GoldButton
        title="Start Hosting"
        onPress={async () => {
          const session = await startHostSession(name);
          setHosting(session.roomCode, session.ip, name, maxPlayers);
          router.push("/lobby");
        }}
      />
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
