import { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSetupLayout from "../GameSetupLayout";
import { buildGameResult, useIsMobile } from "../gameUtils";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Phase = "setup" | "waiting" | "ready" | "result";

export default function ReactionSprintGame({ game }: { game: GameConfig }) {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>("setup");
  const [rounds, setRounds] = useState(8);
  const [delayMode, setDelayMode] = useState<"steady" | "unpredictable">(
    "unpredictable",
  );
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const signalAtRef = useRef(0);
  const signalDueAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const remainingDelayRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null,
  );
  const timesRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) globalThis.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => () => clearTimer(), []);

  function showSignal() {
    signalAtRef.current = Date.now();
    signalDueAtRef.current = 0;
    setPhase("ready");
  }

  function queueRound(nextRound: number) {
    clearTimer();
    setPaused(false);
    setRound(nextRound);
    setPhase("waiting");
    const delay = delayMode === "steady" ? 1800 : 900 + Math.random() * 2600;
    signalDueAtRef.current = Date.now() + delay;
    timerRef.current = globalThis.setTimeout(showSignal, delay);
  }

  function finishGame(finalTimes = timesRef.current) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimer();
    setPaused(false);
    const average = finalTimes.length
      ? Math.round(
          finalTimes.reduce((sum, value) => sum + value, 0) / finalTimes.length,
        )
      : 0;
    const best = finalTimes.length ? Math.min(...finalTimes) : 0;
    const accuracy = Math.max(
      0,
      Math.round(
        (finalTimes.length / Math.max(1, rounds + falseStartsRef.current)) *
          100,
      ),
    );
    const result = buildGameResult({
      gameId: game.id,
      gameTitle: game.title,
      mode: "manual",
      exerciseSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      timeTakenSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      numbersShown: rounds,
      numbersCorrect: finalTimes.length,
      digitsShown: rounds,
      digitsCorrect: finalTimes.length,
      accuracy,
      settings: {
        digits: 1,
        min: 0,
        max: 0,
        rounds,
        delayMode,
        averageMs: average,
        bestMs: best,
        falseStarts: falseStartsRef.current,
      },
    });
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }

  function startGame() {
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    timesRef.current = [];
    falseStartsRef.current = 0;
    setTimes([]);
    setFalseStarts(0);
    setSavedResult(null);
    setPaused(false);
    queueRound(1);
  }

  function handleTap() {
    if (paused) return;
    if (phase === "waiting") {
      falseStartsRef.current += 1;
      setFalseStarts(falseStartsRef.current);
      queueRound(round);
      return;
    }
    if (phase !== "ready") return;
    const reaction = Math.max(1, Date.now() - signalAtRef.current);
    const nextTimes = [...timesRef.current, reaction];
    timesRef.current = nextTimes;
    setTimes(nextTimes);
    if (round >= rounds) finishGame(nextTimes);
    else queueRound(round + 1);
  }

  function togglePause() {
    if (phase !== "waiting" && phase !== "ready") return;

    if (paused) {
      const pausedForMs = Math.max(0, Date.now() - pausedAtRef.current);
      setPaused(false);
      if (phase === "waiting") {
        const remaining = Math.max(100, remainingDelayRef.current);
        signalDueAtRef.current = Date.now() + remaining;
        timerRef.current = globalThis.setTimeout(showSignal, remaining);
      } else {
        signalAtRef.current += pausedForMs;
      }
      return;
    }

    pausedAtRef.current = Date.now();
    setPaused(true);
    if (phase === "waiting") {
      remainingDelayRef.current = Math.max(
        100,
        signalDueAtRef.current - Date.now(),
      );
      clearTimer();
    }
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
    >
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Rounds</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[5, 8, 12]}
          value={rounds}
          onChange={setRounds}
        />
        <Text style={s.fieldHint}>
          More rounds produce a more reliable reaction average.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Signal rhythm</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={
            ["steady", "unpredictable"] as const as (
              | "steady"
              | "unpredictable"
            )[]
          }
          value={delayMode}
          onChange={setDelayMode}
        />
        <Text style={s.fieldHint}>
          Unpredictable timing prevents anticipation.
        </Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setup;

  if (phase === "result") {
    const average = Number(savedResult?.settings.averageMs ?? 0);
    const best = Number(savedResult?.settings.bestMs ?? 0);
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <Text style={[s.kicker, { color: game.color }]}>
              Reaction run complete
            </Text>
            <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
              {average}ms average
            </Text>
            <View style={s.gameStatRow}>
              <Text style={s.gameStatText}>
                Best <Text style={{ color: game.color }}>{best}ms</Text>
              </Text>
              <Text style={s.gameStatText}>
                False starts{" "}
                <Text style={{ color: game.color }}>{falseStarts}</Text>
              </Text>
            </View>
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel="Back to Menu"
              secondaryIcon="arrow-left"
              onSecondary={() => router.push("/games" as any)}
              primaryLabel="Play Again"
              primaryIcon="refresh-cw"
              onPrimary={startGame}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );
  }

  const latest = times[times.length - 1];
  return (
    <>
      {setup}
      <GameFocusOverlay mobile={isMobile}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <View style={s.gameStatusRow}>
            <Text style={[s.kicker, { color: game.color }]}>
              Round {round} / {rounds}
            </Text>
            <Text style={s.gameStatText}>
              {latest ? `${latest}ms last` : `${falseStarts} false starts`}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={paused}
            style={[
              s.reactionStage,
              s.sessionSurface,
              phase === "ready"
                ? { backgroundColor: game.color, borderColor: game.color }
                : null,
            ]}
            onPress={handleTap}
          >
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={28} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : (
              <>
                <Feather
                  name={phase === "ready" ? "zap" : "clock"}
                  size={44}
                  color={phase === "ready" ? "#FFFFFF" : game.color}
                />
                <Text
                  style={[
                    s.reactionTitle,
                    phase !== "ready" && { color: "#121212" },
                  ]}
                >
                  {phase === "ready" ? "TAP NOW" : "Wait for the signal…"}
                </Text>
                <Text
                  style={[
                    s.reactionHint,
                    phase !== "ready" && { color: "#6A6A6A" },
                  ]}
                >
                  {phase === "ready"
                    ? "React as quickly as you can."
                    : "Tapping early counts as a false start."}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <GameSessionActions
            accentColor={game.color}
            mobile={isMobile}
            secondaryLabel={paused ? "Unpause" : "Pause"}
            secondaryIcon={paused ? "play" : "pause"}
            onSecondary={togglePause}
            primaryLabel="Finalise"
            primaryIcon="check-circle"
            onPrimary={() => finishGame()}
          />
        </GameSessionPanel>
      </GameFocusOverlay>
    </>
  );
}
