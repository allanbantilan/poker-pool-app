import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";
import { useNetworkStore } from "@/services/networking/networkStore";
import { startHostSession } from "@/services/networking/host";

export default function HostScreen() {
  const router = useRouter();
  const setHosting = useNetworkStore((s) => s.setHosting);
  const [name, setName] = useState("Player 1");

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Text className="mb-3 text-3xl font-bold text-chalk">Hosting Game</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor="#9EB6A8" placeholder="Host name" />
      <GoldButton
        title="Start Hosting"
        onPress={async () => {
          const session = await startHostSession(name);
          setHosting(session.roomCode, session.ip);
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
