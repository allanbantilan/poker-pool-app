import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D2B1A" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="game" />
      <Stack.Screen name="round-end" />
      <Stack.Screen name="winner" />
      <Stack.Screen name="host" />
      <Stack.Screen name="join" />
      <Stack.Screen name="lobby" />
    </Stack>
  );
}
