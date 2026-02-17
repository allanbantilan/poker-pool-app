import { Modal, Pressable, Text, View } from "react-native";
import type { PendingPocket } from "@/store/useGameStore";
import { PoolBall } from "@/components/balls/PoolBall";
import { GoldButton } from "@/components/ui/GoldButton";

interface ActionSheetProps {
  visible: boolean;
  pendingPocket: PendingPocket | null;
  onConfirm: () => void;
  onCancel: () => void;
  onFoul: () => void;
}

export function ActionSheet({ visible, pendingPocket, onConfirm, onCancel, onFoul }: ActionSheetProps) {
  if (!pendingPocket) return null;
  const title = pendingPocket.valid ? "Ball Pocketed!" : "Pocket Validation";

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[18px] border border-gold bg-[#102D1D] p-4 pb-[30px]">
          <Text className="text-[22px] font-bold text-chalk">{title}</Text>
          <View className="my-3">
            <PoolBall number={pendingPocket.ballNumber} />
          </View>
          <Text className="mb-4 text-[#D8D6CB]">
            {pendingPocket.valid
              ? `Ball ${pendingPocket.ballNumber} matched ${pendingPocket.matchedCardIds.length} card(s).`
              : pendingPocket.error}
          </Text>
          {pendingPocket.valid ? (
            <GoldButton title="Confirm Pocket" onPress={onConfirm} />
          ) : (
            <GoldButton title="Foul - Skip my turn" onPress={onFoul} />
          )}
          <Pressable onPress={onCancel} className="mt-2.5 items-center">
            <Text className="font-bold text-[#D7B75A]">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
