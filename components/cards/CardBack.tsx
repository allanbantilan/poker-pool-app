import { View } from "react-native";
import { APP_COLORS } from "@/constants/game";

export function CardBack() {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: APP_COLORS.gold,
        backgroundColor: "#6E1E1E",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: -60 + i * 20,
            top: -10,
            width: 20,
            height: 170,
            transform: [{ rotate: "35deg" }],
            backgroundColor: i % 2 === 0 ? "#812929" : "#5A1616",
            opacity: 0.45,
          }}
        />
      ))}
    </View>
  );
}

