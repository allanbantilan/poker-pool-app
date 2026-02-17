import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GoldButton } from "@/components/ui/GoldButton";

export default function Index() {
  const router = useRouter();
  const shimmer = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.72, duration: 1100, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.45, duration: 1100, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);

  return (
    <View className="flex-1 justify-center bg-felt px-5">
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          opacity: shimmer,
          backgroundColor: "rgba(255,255,255,0.02)",
        }}
      />
      <View className="mb-12 items-center">
        <Text className="text-[42px] font-extrabold tracking-[2px] text-chalk">POKER POOL</Text>
        <Text className="mt-1.5 text-[18px] text-gold">?--------?</Text>
      </View>
      <GoldButton title="Host Game" onPress={() => router.push("/host")} />
      <View className="h-3.5" />
      <GoldButton title="Join Game" onPress={() => router.push("/join")} />
      <Pressable onPress={() => router.push("/setup")} className="mt-[18px] items-center">
        <Text className="text-[#E5CCA2]">Quick Local Setup</Text>
      </Pressable>
      <Text className="absolute bottom-5 self-center text-[rgba(241,239,231,0.6)]">v1.0.0</Text>
    </View>
  );
}
