import { Pressable, Text } from "react-native";

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function GoldButton({ title, onPress, disabled }: GoldButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-2xl border px-[18px] py-3.5 ${disabled ? "border-[#A18C4E] bg-[#7C6A38]" : "border-[#E8D59A] bg-gold"}`}
    >
      <Text className="text-base font-extrabold text-[#1B160B]">{title}</Text>
    </Pressable>
  );
}
