import { Pressable, Text, View } from "react-native";
import { BALL_COLORS } from "@/constants/game";

interface PoolBallProps {
  number: number;
  pocketed?: boolean;
  active?: boolean;
  onPress?: () => void;
}

export function PoolBall({ number, pocketed, active, onPress }: PoolBallProps) {
  const isStriped = number >= 9;
  const fill = BALL_COLORS[number] ?? "#FFFFFF";
  return (
    <Pressable onPress={onPress} disabled={!onPress || pocketed}>
      <View
        className="mb-1.5 mr-1.5 h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2"
        style={{
          backgroundColor: isStriped ? "#FFFFFF" : fill,
          borderColor: active ? "#C9A84C" : "#1D1D1D",
          opacity: pocketed ? 0.3 : 1,
        }}
      >
        {isStriped ? <View className="absolute h-3 w-7" style={{ backgroundColor: fill }} /> : null}
        <Text className="text-[11px] font-bold" style={{ color: number === 8 ? "#F8F8F8" : "#161616" }}>
          {number}
        </Text>
      </View>
    </Pressable>
  );
}
