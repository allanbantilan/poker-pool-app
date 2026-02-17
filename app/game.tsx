import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
  const [hideMyCards, setHideMyCards] = useState(false);
  const [showPocketedOnly, setShowPocketedOnly] = useState(false);
  const [showBallPicker, setShowBallPicker] = useState(false);

  const activePlayer = state.players[state.currentPlayerIndex];
  const opponents = useMemo(() => state.players.filter((p) => p.id !== activePlayer?.id), [activePlayer?.id, state.players]);

  useEffect(() => {
    if (state.phase === "game-over") router.replace("/winner");
    if (state.phase === "round-end") router.replace("/round-end");
  }, [router, state.phase]);

  if (!activePlayer) return null;

  return (
    <View className="flex-1 bg-felt">
      <ScrollView contentContainerClassName="p-3.5 pb-10">
        {opponents.map((player) => (
          <PlayerStrip key={player.id} player={player} />
        ))}

        <RoundBanner round={state.round} phase={state.phase} players={state.players} currentPlayerIndex={state.currentPlayerIndex} />

        <View className="my-3">
          <Text className="mb-2 text-chalk">Table Balls</Text>
          <BallRow balls={state.balls.map((b) => ({ number: b.number, pocketed: b.pocketedBy !== null }))} />
        </View>

        <PlayerZone
          player={activePlayer}
          showPocketedOnly={showPocketedOnly}
          hideCards={hideMyCards}
          onCardTap={(cardId) => {
            const card = activePlayer.cards.find((c) => c.id === cardId);
            if (!card) return;
            if (!card.revealed) state.revealCard(activePlayer.id, cardId);
            else state.toggleCardHidden(activePlayer.id, cardId);
          }}
          onToggleHide={() => setHideMyCards((prev) => !prev)}
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

        {state.round === 1 && state.players.every((p) => p.cards.some((card) => card.pocketed)) ? (
          <Pressable onPress={() => state.nextRound()} className="mt-3 self-center rounded-xl bg-[#204435] px-3.5 py-2.5">
            <Text className="text-chalk">Deal Next 3 Cards</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={!!state.pendingPocket}
        pendingPocket={state.pendingPocket}
        onConfirm={state.confirmPocket}
        onCancel={state.cancelPocket}
        onFoul={state.reportFoul}
      />
    </View>
  );
}
