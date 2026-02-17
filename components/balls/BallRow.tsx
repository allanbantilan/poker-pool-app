import { View } from "react-native";
import { PoolBall } from "@/components/balls/PoolBall";

interface BallItem {
  number: number;
  pocketed: boolean;
}

interface BallRowProps {
  balls: BallItem[];
  onSelect?: (ballNumber: number) => void;
}

export function BallRow({ balls, onSelect }: BallRowProps) {
  return (
    <View className="flex-row flex-wrap">
      {balls.map((ball) => (
        <PoolBall
          key={ball.number}
          number={ball.number}
          pocketed={ball.pocketed}
          onPress={onSelect ? () => onSelect(ball.number) : undefined}
        />
      ))}
    </View>
  );
}
