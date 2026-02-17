import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlayerStrip } from "@/components/player/PlayerStrip";
import { PlayerZone } from "@/components/player/PlayerZone";
import { RoundBanner } from "@/components/ui/RoundBanner";
import { GoldButton } from "@/components/ui/GoldButton";
import { BallRow } from "@/components/balls/BallRow";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { useGameStore } from "@/store/useGameStore";

export default function GameScreen() {
  const router = useRouter();
  const state = useGameStore();
  const [showPocketedOnly, setShowPocketedOnly] = useState(false);
  const [showBallPicker, setShowBallPicker] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

  const activePlayer = state.players[state.currentPlayerIndex];
  const nextPlayer = state.players.length > 0 ? state.players[(state.currentPlayerIndex + 1) % state.players.length] : null;
  const opponents = useMemo(
    () => state.players.filter((p) => p.id !== activePlayer?.id),
    [activePlayer?.id, state.players],
  );

  useEffect(() => {
    if (state.phase === "game-over") router.replace("/winner");
    if (state.phase === "round-end") router.replace("/round-end");
  }, [router, state.phase]);

  useEffect(() => {
    if (state.firstThreeMode && state.phase === "playing") {
      setShowContinuePrompt(true);
    }
  }, [state.firstThreeMode, state.phase]);

  if (!activePlayer) return null;

  return (
    <SafeAreaView className="flex-1 bg-felt" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="p-3.5 pb-10">
        {state.firstThreeMode ? (
          <View className="mb-3 rounded-xl border border-gold bg-black/30 p-3">
            <Text className="text-center font-bold text-gold">First 3 Cards Game: Reveal your first 3 cards to begin.</Text>
          </View>
        ) : null}

        {opponents.map((player) => (
          <PlayerStrip key={player.id} player={player} />
        ))}

        <RoundBanner
          round={state.round}
          phase={state.phase}
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          firstThreeMode={state.firstThreeMode}
        />

        <View className="mt-2 rounded-xl bg-black/30 p-3">
          <Text className="font-semibold text-chalk">Current Turn: {activePlayer.name}</Text>
          <Text className="mt-1 text-[#D8D6CB]">Next Turn: {nextPlayer?.name ?? "-"}</Text>
        </View>

        <View className="my-3">
          <Text className="mb-2 text-chalk">Table Balls</Text>
          <BallRow balls={state.balls.map((b) => ({ number: b.number, pocketed: b.pocketedBy !== null }))} />
        </View>

        <PlayerZone
          player={activePlayer}
          showPocketedOnly={showPocketedOnly}
          onCardTap={(cardId) => {
            const card = activePlayer.cards.find((c) => c.id === cardId);
            if (!card) return;
            if (!card.revealed) state.revealCard(activePlayer.id, cardId);
          }}
          onTogglePocketedFilter={() => setShowPocketedOnly((prev) => !prev)}
        />

        <View className="mt-3">
          <GoldButton title="Pocket a Ball" onPress={() => setShowBallPicker((prev) => !prev)} />
        </View>

        {showBallPicker ? (
          <View className="mt-2.5 rounded-xl bg-black/25 p-2.5">
            <Text className="mb-2 text-chalk">Which ball did you pocket?</Text>
            <BallRow
              balls={state.balls.map((b) => ({ number: b.number, pocketed: b.pocketedBy !== null }))}
              onSelect={(number) => {
                state.pocketBall(activePlayer.id, number);
                setShowBallPicker(false);
              }}
            />
          </View>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={!!state.pendingPocket}
        pendingPocket={state.pendingPocket}
        onConfirm={state.confirmPocket}
        onCancel={state.cancelPocket}
        onFoul={state.reportFoul}
      />

      <Modal transparent visible={showContinuePrompt} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-2xl border border-gold bg-[#102D1D] p-5">
            <Text className="text-center text-xl font-bold text-chalk">All First 3 Cards Revealed</Text>
            <Text className="mt-2 text-center text-[#D8D6CB]">Continue to play Poker Billiard with all 6 cards visible.</Text>
            <View className="mt-4">
              <GoldButton
                title="Continue to Play"
                onPress={() => {
                  state.unlockRemainingCards();
                  setShowContinuePrompt(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
