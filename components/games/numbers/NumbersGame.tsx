import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Mode = "auto" | "manual";
type Phase = "setup" | "countdown" | "memorise" | "recall" | "result";

type Settings = {
  mode: Mode;
  intervalSeconds: number;
  exerciseSeconds: number;
  customExerciseSeconds: string;
  useCustomTime: boolean;
  digits: number;
  min: string;
  max: string;
};

type CheckedAnswer = {
  index: number;
  expected: string;
  actual: string;
  correct: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  mode: "auto",
  intervalSeconds: 2,
  exerciseSeconds: 60,
  customExerciseSeconds: "90",
  useCustomTime: false,
  digits: 2,
  min: "0",
  max: "99",
};

const TIME_PRESETS = [30, 60, 120, 180];
const INTERVAL_PRESETS = [1, 2, 3, 5];

function clampNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(999, Math.max(0, Math.round(value)));
}

function clampSeconds(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(3600, Math.max(5, Math.round(value)));
}

function formatNumber(value: number, digits: number) {
  return String(value).padStart(digits, "0");
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitsCorrectFor(expected: string, actual: string) {
  return expected.split("").reduce((sum, char, index) => sum + (actual[index] === char ? 1 : 0), 0);
}

function StatTile({ label, value, color, light = false }: { label: string; value: string; color?: string; light?: boolean }) {
  return (
    <View style={[s.statTile, light && s.statTileLight]}>
      <Text style={[s.statValue, light && s.statValueLight, color && { color }]}>{value}</Text>
      <Text style={[s.statLabel, light && s.statLabelLight]}>{label}</Text>
    </View>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.segmented}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity key={String(option)} style={[s.segment, active && s.segmentActive]} onPress={() => onChange(option)}>
            <Text style={[s.segmentText, active && s.segmentTextActive]}>{String(option)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FocusOverlay({ children }: { children: ReactNode }) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => {}}>
      <View style={s.focusOverlay}>
        <View style={s.focusBlur} pointerEvents="none" />
        <View style={s.focusCard}>{children}</View>
      </View>
    </Modal>
  );
}

export default function NumbersGame({ game }: { game: GameConfig }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.exerciseSeconds);
  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const [recallAnswers, setRecallAnswers] = useState<string[]>([]);
  const [checked, setChecked] = useState<CheckedAnswer[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const recallRefs = useRef<(TextInput | null)[]>([]);

  const minValue = clampNumber(Number(settings.min), 0);
  const maxValue = Math.max(minValue, clampNumber(Number(settings.max), 99));
  const visibleSequence = sequence.slice(0, maxSeenIndex + 1);
  const currentNumber = sequence[currentIndex] ?? "";
  const progress = Math.max(0, Math.min(100, ((settings.exerciseSeconds - secondsLeft) / settings.exerciseSeconds) * 100));
  const canStart = maxValue >= minValue && settings.exerciseSeconds > 0 && settings.intervalSeconds > 0;
  const moveNumber = useCallback((direction: -1 | 1) => {
    setCurrentIndex((prev) => {
      const next = Math.min(sequence.length - 1, Math.max(0, prev + direction));
      setMaxSeenIndex((seen) => Math.max(seen, next));
      return next;
    });
  }, [sequence.length]);

  useEffect(() => {
    if (phase !== "memorise" || paused) return;

    const timer = globalThis.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          setPhase("recall");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [paused, phase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    const timer = globalThis.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          setPhase("memorise");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recall") return;
    setRecallAnswers((prev) => Array.from({ length: visibleSequence.length }, (_, index) => prev[index] ?? ""));
    globalThis.setTimeout(() => recallRefs.current[0]?.focus(), 80);
  }, [phase, visibleSequence.length]);

  useEffect(() => {
    if (phase !== "memorise" || paused || settings.mode !== "auto") return;

    const timer = globalThis.setInterval(() => {
      moveNumber(1);
    }, settings.intervalSeconds * 1000);

    return () => globalThis.clearInterval(timer);
  }, [moveNumber, paused, phase, sequence.length, settings.intervalSeconds, settings.mode]);

  useEffect(() => {
    if (phase !== "memorise" || paused || typeof window === "undefined") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveNumber(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveNumber(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveNumber, paused, phase, sequence.length]);

  function updateSettings(next: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...next }));
  }

  function setExerciseTime(seconds: number | "custom") {
    if (seconds === "custom") {
      const customSeconds = clampSeconds(Number(settings.customExerciseSeconds), settings.exerciseSeconds);
      updateSettings({ useCustomTime: true, exerciseSeconds: customSeconds, customExerciseSeconds: String(customSeconds) });
      return;
    }

    updateSettings({ useCustomTime: false, exerciseSeconds: seconds });
  }

  function setCustomExerciseTime(value: string) {
    const cleanValue = value.replace(/\D/g, "");
    updateSettings({
      customExerciseSeconds: cleanValue,
      exerciseSeconds: cleanValue ? clampSeconds(Number(cleanValue), settings.exerciseSeconds) : settings.exerciseSeconds,
      useCustomTime: true,
    });
  }

  function startGame() {
    const generatedLength = settings.mode === "auto"
      ? Math.ceil(settings.exerciseSeconds / settings.intervalSeconds) + 2
      : 250;
    const nextSequence = Array.from({ length: generatedLength }, () => formatNumber(randomBetween(minValue, maxValue), settings.digits));

    setSequence(nextSequence);
    setCurrentIndex(0);
    setMaxSeenIndex(0);
    setSecondsLeft(settings.exerciseSeconds);
    setCountdown(3);
    setPaused(false);
    setRecallAnswers([]);
    setChecked([]);
    setSavedResult(null);
    setPhase("countdown");
  }

  function finishMemorising() {
    setPaused(false);
    setPhase("recall");
  }

  function restartGame() {
    setPhase("setup");
    setSequence([]);
    setCurrentIndex(0);
    setMaxSeenIndex(0);
    setSecondsLeft(settings.exerciseSeconds);
    setPaused(false);
    setRecallAnswers([]);
    setChecked([]);
    setSavedResult(null);
  }

  function focusRecallInput(index: number) {
    recallRefs.current[index]?.focus();
  }

  function updateRecallAnswer(index: number, value: string) {
    const cleanValue = value.replace(/\D/g, "").slice(0, settings.digits);
    setRecallAnswers((prev) => {
      const next = [...prev];
      next[index] = cleanValue;
      return next;
    });

    if (cleanValue.length >= settings.digits) {
      globalThis.setTimeout(() => focusRecallInput(index + 1), 20);
    }
  }

  function handleRecallKey(index: number, key: string) {
    if (key === "Enter") focusRecallInput(index + 1);
  }

  function checkAnswers() {
    const answers = recallAnswers.map((answer) => answer.trim());
    const expected = visibleSequence;
    const nextChecked = expected.map((item, index) => ({
      index,
      expected: item,
      actual: answers[index] ?? "",
      correct: answers[index] === item,
    }));
    const numbersCorrect = nextChecked.filter((item) => item.correct).length;
    const digitsShown = expected.reduce((sum, item) => sum + item.length, 0);
    const digitsCorrect = nextChecked.reduce((sum, item) => sum + digitsCorrectFor(item.expected, item.actual), 0);
    const result: StoredGameResult = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      gameId: game.id,
      gameTitle: game.title,
      createdAt: new Date().toISOString(),
      mode: settings.mode,
      exerciseSeconds: settings.exerciseSeconds,
      timeTakenSeconds: settings.exerciseSeconds - secondsLeft,
      numbersShown: expected.length,
      numbersCorrect,
      digitsShown,
      digitsCorrect,
      accuracy: expected.length ? Math.round((numbersCorrect / expected.length) * 100) : 0,
      settings: {
        digits: settings.digits,
        min: minValue,
        max: maxValue,
        intervalSeconds: settings.mode === "auto" ? settings.intervalSeconds : undefined,
      },
    };

    setChecked(nextChecked);
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }

  const setupPanel = (
    <View style={s.panel}>
      <View style={s.panelHeader}>
        <View>
          <Text style={s.kicker}>Game Settings</Text>
          <Text style={s.panelTitle}>Prepare your number run</Text>
        </View>
        <View style={s.settingsIcon}>
          <Feather name="sliders" size={18} color="#FFFFFF" />
        </View>
      </View>

      <View style={s.settingsGrid}>
        <View style={s.settingBlockWide}>
          <Text style={s.fieldLabel}>Mode</Text>
          <Segmented options={["auto", "manual"] as Mode[]} value={settings.mode} onChange={(mode) => updateSettings({ mode })} />
        </View>

        {settings.mode === "auto" && (
          <View style={s.settingBlock}>
            <Text style={s.fieldLabel}>Auto interval</Text>
            <Segmented options={INTERVAL_PRESETS} value={settings.intervalSeconds} onChange={(intervalSeconds) => updateSettings({ intervalSeconds })} />
            <Text style={s.fieldHint}>Seconds between each number.</Text>
          </View>
        )}

        <View style={s.settingBlock}>
          <Text style={s.fieldLabel}>Exercise time</Text>
          <Segmented
            options={[...TIME_PRESETS, "custom"] as (number | "custom")[]}
            value={settings.useCustomTime ? "custom" : settings.exerciseSeconds}
            onChange={setExerciseTime}
          />
          {settings.useCustomTime && (
            <View style={s.inlineInputRow}>
              <TextInput
                value={settings.customExerciseSeconds}
                onChangeText={setCustomExerciseTime}
                keyboardType="number-pad"
                placeholder="90"
                placeholderTextColor="#7A7A7A"
                style={s.numberInput}
              />
              <Text style={s.rangeDivider}>seconds</Text>
            </View>
          )}
          <Text style={s.fieldHint}>Countdown for the memorisation stage.</Text>
        </View>

        <View style={s.settingBlock}>
          <Text style={s.fieldLabel}>Number display</Text>
          <Segmented options={[1, 2, 3]} value={settings.digits} onChange={(digits) => updateSettings({ digits })} />
          <Text style={s.fieldHint}>Values are padded to this many digits.</Text>
        </View>

        <View style={s.settingBlock}>
          <Text style={s.fieldLabel}>Number range</Text>
          <View style={s.rangeRow}>
            <TextInput
              value={settings.min}
              onChangeText={(min) => updateSettings({ min })}
              keyboardType="number-pad"
              style={s.numberInput}
            />
            <Text style={s.rangeDivider}>to</Text>
            <TextInput
              value={settings.max}
              onChangeText={(max) => updateSettings({ max })}
              keyboardType="number-pad"
              style={s.numberInput}
            />
          </View>
          <Text style={s.fieldHint}>{formatNumber(minValue, settings.digits)} to {formatNumber(maxValue, settings.digits)} inclusive.</Text>
        </View>
      </View>

      <TouchableOpacity disabled={!canStart} style={[s.primaryButton, !canStart && s.buttonDisabled]} onPress={startGame}>
        <Feather name="play" size={15} color="#FFFFFF" />
        <Text style={s.primaryButtonText}>Start Exercise</Text>
      </TouchableOpacity>
    </View>
  );

  if (phase === "setup") return setupPanel;

  if (phase === "countdown") {
    return (
      <>
        {setupPanel}
        <FocusOverlay>
          <View style={s.countdownPanel}>
            <Text style={s.countdownKicker}>Get ready</Text>
            <Text style={s.countdownNumber}>{countdown}</Text>
            <Text style={s.countdownText}>Numbers begin after the countdown.</Text>
          </View>
        </FocusOverlay>
      </>
    );
  }

  if (phase === "memorise") {
    return (
      <>
        {setupPanel}
        <FocusOverlay>
          <View style={s.playPanel}>
            <View style={s.playTimerRow}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={s.timerText}>{secondsLeft}s</Text>
            </View>

            <View style={s.numberStage}>
              {paused ? (
                <View style={s.pauseCurtain}>
                  <Feather name="pause" size={24} color="#FFFFFF" />
                  <Text style={s.pauseText}>Paused</Text>
                </View>
              ) : (
                <Text style={s.numberDisplay}>{currentNumber}</Text>
              )}
            </View>

            {settings.mode === "manual" && (
              <View style={s.manualControls}>
                <TouchableOpacity style={s.iconButton} onPress={() => moveNumber(-1)} disabled={paused || currentIndex === 0}>
                  <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.78)" />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconButton} onPress={() => moveNumber(1)} disabled={paused}>
                  <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.78)" />
                </TouchableOpacity>
              </View>
            )}

            <View style={s.controlRow}>
              <TouchableOpacity style={s.secondaryButton} onPress={() => setPaused((next) => !next)}>
                <Feather name={paused ? "play" : "pause"} size={14} color="#FFFFFF" />
                <Text style={s.secondaryButtonText}>{paused ? "Resume" : "Pause"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryButton} onPress={restartGame}>
                <Feather name="rotate-ccw" size={14} color="#FFFFFF" />
                <Text style={s.secondaryButtonText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.secondaryButton, s.endButton]} onPress={finishMemorising}>
                <Feather name="flag" size={14} color="#FFFFFF" />
                <Text style={s.secondaryButtonText}>End Early</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FocusOverlay>
      </>
    );
  }

  if (phase === "recall") {
    return (
      <>
        {setupPanel}
        <FocusOverlay>
          <View style={s.panel}>
            <View style={s.panelHeader}>
              <View>
                <Text style={s.kicker}>Recall</Text>
                <Text style={s.panelTitle}>Type the numbers in order</Text>
              </View>
              <View style={s.settingsIcon}>
                <Feather name="edit-3" size={18} color="#FFFFFF" />
              </View>
            </View>

            <View style={s.recallSummary}>
              <StatTile label="Numbers to recall" value={String(visibleSequence.length)} color="#E85D2A" light />
              <StatTile label="Digits shown" value={String(visibleSequence.join("").length)} light />
              <StatTile label="Time used" value={`${settings.exerciseSeconds - secondsLeft}s`} light />
            </View>

            <View style={s.recallGrid}>
              {visibleSequence.map((_, index) => (
                <View key={`recall-${index}`} style={s.recallBoxWrap}>
                  <Text style={s.recallBoxIndex}>{index + 1}</Text>
                  <TextInput
                    ref={(node) => {
                      recallRefs.current[index] = node;
                    }}
                    value={recallAnswers[index] ?? ""}
                    onChangeText={(value) => updateRecallAnswer(index, value)}
                    onKeyPress={({ nativeEvent }) => handleRecallKey(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={settings.digits}
                    placeholder={"0".repeat(settings.digits)}
                    placeholderTextColor="rgba(255,255,255,0.24)"
                    style={s.recallBoxInput}
                  />
                </View>
              ))}
            </View>

            <View style={s.controlRow}>
              <TouchableOpacity style={s.secondaryButton} onPress={() => setPhase("memorise")}>
                <Feather name="arrow-left" size={14} color="#FFFFFF" />
                <Text style={s.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.primaryButtonInline} onPress={checkAnswers}>
                <Feather name="check" size={15} color="#FFFFFF" />
                <Text style={s.primaryButtonText}>Check Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FocusOverlay>
      </>
    );
  }

  return (
    <>
      {setupPanel}
      <FocusOverlay>
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <View>
              <Text style={s.kicker}>Results saved</Text>
              <Text style={s.panelTitle}>You remembered {savedResult?.numbersCorrect ?? 0} of {savedResult?.numbersShown ?? 0}</Text>
            </View>
            <View style={s.settingsIcon}>
              <Feather name="award" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View style={s.resultStats}>
            <StatTile label="Accuracy" value={`${savedResult?.accuracy ?? 0}%`} color="#E85D2A" light />
            <StatTile label="Numbers correct" value={`${savedResult?.numbersCorrect ?? 0}/${savedResult?.numbersShown ?? 0}`} light />
            <StatTile label="Digits correct" value={`${savedResult?.digitsCorrect ?? 0}/${savedResult?.digitsShown ?? 0}`} light />
            <StatTile label="Time taken" value={`${savedResult?.timeTakenSeconds ?? 0}s`} light />
          </View>

          <View style={s.answerList}>
            {checked.map((item) => (
              <View key={item.index} style={[s.answerRow, item.correct ? s.answerRowGood : s.answerRowBad]}>
                <Text style={s.answerIndex}>#{item.index + 1}</Text>
                <View style={s.answerCol}>
                  <Text style={s.answerLabel}>Correct</Text>
                  <Text style={s.answerValue}>{item.expected}</Text>
                </View>
                <View style={s.answerCol}>
                  <Text style={s.answerLabel}>Your answer</Text>
                  <Text style={s.answerValue}>{item.actual || "-"}</Text>
                </View>
                <Feather name={item.correct ? "check-circle" : "x-circle"} size={18} color={item.correct ? "#7DECD4" : "#FF8C75"} />
              </View>
            ))}
          </View>

          <View style={s.controlRow}>
            <TouchableOpacity style={s.secondaryButton} onPress={restartGame}>
              <Feather name="x" size={14} color="#FFFFFF" />
              <Text style={s.secondaryButtonText}>Finish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.primaryButtonInline} onPress={startGame}>
              <Feather name="refresh-cw" size={15} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </FocusOverlay>
    </>
  );
}
