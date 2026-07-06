import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import type { Voice } from "expo-speech";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import GameFocusOverlay from "../GameFocusOverlay";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSetupLayout from "../GameSetupLayout";
import { game as s } from "../../../styles/screens/game.styles";
import {
  loadGameResults,
  readLocalGameResultsSnapshot,
  saveGameResult,
  type StoredGameResult,
} from "../resultsStore";
import {
  clampNumber,
  clampIntervalSeconds,
  clampSeconds,
  cleanDecimalInput,
  DEFAULT_SETTINGS,
  digitsCorrectFor,
  formatNumber,
  INTERVAL_PRESETS,
  randomBetween,
  RECALL_TIME_PRESETS,
  TIME_PRESETS,
  type CheckedAnswer,
  type Mode,
  type Phase,
  type Settings,
  type VoiceOverMode,
} from "./NumbersGame.logic";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function StatTile({
  label,
  value,
  color,
  light = false,
  compact = false,
}: {
  label: string;
  value: string;
  color?: string;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        s.statTile,
        light && s.statTileLight,
        compact && s.statTileMobile,
      ]}
    >
      <Text
        style={[
          s.statValue,
          light && s.statValueLight,
          compact && s.statValueMobile,
          color && { color },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          s.statLabel,
          light && s.statLabelLight,
          compact && s.statLabelMobile,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function smartIntervalFromResults(results: StoredGameResult[], gameId: string) {
  const latestManual = results
    .filter(
      (result) =>
        result.gameId === gameId &&
        result.mode === "manual" &&
        result.numbersShown > 1 &&
        result.timeTakenSeconds > 0,
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  if (!latestManual) return null;

  const averageSwitchSeconds =
    latestManual.timeTakenSeconds / Math.max(1, latestManual.numbersShown - 1);
  return clampIntervalSeconds(
    averageSwitchSeconds - 0.3,
    DEFAULT_SETTINGS.intervalSeconds,
  );
}

function createResultId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function formatRecallTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatSecondsLabel(value: number | "custom") {
  if (value === "custom") return "custom";
  if (value < 60) return `${value}s`;
  return `${Math.round(value / 60)}m`;
}

function spokenDigits(value: string) {
  const words: Record<string, string> = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
  };
  return value
    .split("")
    .map((digit) => words[digit] ?? digit)
    .join(", ");
}

function spokenNumber(value: string) {
  if (/^0\d/.test(value)) return spokenDigits(value);
  return value;
}

function spokenValue(value: string, mode: VoiceOverMode) {
  return mode === "digits" ? spokenDigits(value) : spokenNumber(value);
}

const spokenNumberWords: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function digitsFromTranscript(transcript: string) {
  const normalized = transcript
    .toLowerCase()
    .replace(/[-,]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  const directDigits = normalized.match(/\d+/g)?.join("") ?? "";
  if (directDigits) return directDigits;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const numbers: string[] = [];
  let pendingTens: number | null = null;

  tokens.forEach((token) => {
    const value = spokenNumberWords[token];
    if (typeof value !== "number") return;

    if (value >= 20 && value < 100 && value % 10 === 0) {
      if (pendingTens !== null) numbers.push(String(pendingTens));
      pendingTens = value;
      return;
    }

    if (pendingTens !== null && value > 0 && value < 10) {
      numbers.push(String(pendingTens + value));
      pendingTens = null;
      return;
    }

    if (pendingTens !== null) {
      numbers.push(String(pendingTens));
      pendingTens = null;
    }
    numbers.push(String(value));
  });

  if (pendingTens !== null) numbers.push(String(pendingTens));
  return numbers.join("");
}

function scorePreferredVoice(voice: Voice) {
  const name = voice.name.toLowerCase();
  const identifier = voice.identifier.toLowerCase();
  const language = voice.language.toLowerCase();
  const searchable = `${name} ${identifier}`;
  let score = language.startsWith("en") ? 20 : 0;

  if (
    /female|woman|samantha|karen|moira|tessa|serena|victoria|allison|ava|susan|zoe|fiona|joanna|kendra|kimberly|salli|amy|emma|olivia|aria|jenny|michelle|natasha|libby/.test(
      searchable,
    )
  ) {
    score += 40;
  }
  if (
    /enhanced|premium|natural|neural/.test(searchable) ||
    voice.quality === Speech.VoiceQuality.Enhanced
  ) {
    score += 12;
  }
  if (
    /male|man|daniel|fred|tom|thomas|aaron|albert|bruce|alex/.test(searchable)
  ) {
    score -= 30;
  }

  return score;
}

function pickPreferredVoice(voices: Voice[]) {
  const englishVoices = voices.filter((voice) =>
    voice.language.toLowerCase().startsWith("en"),
  );
  const candidates = englishVoices.length ? englishVoices : voices;
  return (
    candidates
      .map((voice) => ({ voice, score: scorePreferredVoice(voice) }))
      .sort((a, b) => b.score - a.score)[0]?.voice.identifier ?? null
  );
}

export default function NumbersGame({ game }: { game: GameConfig }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [phase, setPhase] = useState<Phase>("setup");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    DEFAULT_SETTINGS.exerciseSeconds,
  );
  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const [numberVisible, setNumberVisible] = useState(true);
  const [recallAnswers, setRecallAnswers] = useState<string[]>([]);
  const [recallSecondsLeft, setRecallSecondsLeft] = useState(
    DEFAULT_SETTINGS.recallSeconds,
  );
  const [checked, setChecked] = useState<CheckedAnswer[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [preferredVoiceIdentifier, setPreferredVoiceIdentifier] = useState<
    string | null
  >(null);
  const [recallListening, setRecallListening] = useState(false);
  const [recallSpeechSupported, setRecallSpeechSupported] = useState(false);
  const [smartIntervalSeconds, setSmartIntervalSeconds] = useState<
    number | null
  >(() => smartIntervalFromResults(readLocalGameResultsSnapshot(), game.id));
  const recallRefs = useRef<(TextInput | null)[]>([]);
  const switchTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const currentIndexRef = useRef(0);
  const sequenceLengthRef = useRef(0);
  const checkAnswersRef = useRef<() => void>(() => {});
  const autoCheckRef = useRef(false);
  const resultSavedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const minValue = clampNumber(Number(settings.min), 0);
  const maxValue = Math.max(minValue, clampNumber(Number(settings.max), 99));
  const visibleSequence = sequence.slice(0, maxSeenIndex + 1);
  const currentNumber = numberVisible ? (sequence[currentIndex] ?? "") : "";
  const progress = Math.max(
    0,
    Math.min(
      100,
      ((settings.exerciseSeconds - secondsLeft) / settings.exerciseSeconds) *
        100,
    ),
  );
  const canStart =
    maxValue >= minValue &&
    settings.exerciseSeconds > 0 &&
    settings.intervalSeconds > 0;
  const recallTimerValue = formatRecallTime(recallSecondsLeft);

  function clearSwitchTimer() {
    if (!switchTimerRef.current) return;
    globalThis.clearTimeout(switchTimerRef.current);
    switchTimerRef.current = null;
  }

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    sequenceLengthRef.current = sequence.length;
  }, [sequence.length]);

  const moveNumber = useCallback((direction: -1 | 1) => {
    if (switchTimerRef.current) return;

    const current = currentIndexRef.current;
    const next = Math.min(
      sequenceLengthRef.current - 1,
      Math.max(0, current + direction),
    );
    if (next === current) return;

    setNumberVisible(false);
    switchTimerRef.current = globalThis.setTimeout(() => {
      currentIndexRef.current = next;
      setCurrentIndex(next);
      setMaxSeenIndex((seen) => Math.max(seen, next));
      setNumberVisible(true);
      switchTimerRef.current = null;
    }, 140);
  }, []);

  useEffect(() => {
    if (phase === "memorise" && !paused) return;
    clearSwitchTimer();
    setNumberVisible(true);
  }, [paused, phase]);

  useEffect(() => () => clearSwitchTimer(), []);

  useEffect(() => {
    setRecallSpeechSupported(
      Platform.OS === "web" &&
        typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    );
  }, []);

  useEffect(() => {
    let alive = true;

    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (!alive) return;
        setPreferredVoiceIdentifier(pickPreferredVoice(voices));
      })
      .catch(() => {
        if (!alive) return;
        setPreferredVoiceIdentifier(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    setSmartIntervalSeconds(
      smartIntervalFromResults(readLocalGameResultsSnapshot(), game.id),
    );

    async function refreshSmartInterval() {
      const results = await loadGameResults();
      if (!alive) return;
      setSmartIntervalSeconds(smartIntervalFromResults(results, game.id));
    }

    refreshSmartInterval();

    if (
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    )
      return () => {
        alive = false;
      };

    window.addEventListener("memoro-results-updated", refreshSmartInterval);
    return () => {
      alive = false;
      window.removeEventListener(
        "memoro-results-updated",
        refreshSmartInterval,
      );
    };
  }, [game.id]);

  useEffect(() => {
    if (phase !== "memorise" || paused) return;

    const timer = globalThis.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          setPaused(false);
          setRecallSecondsLeft(settings.recallSeconds);
          setPhase("recall");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [paused, phase, settings.recallSeconds]);

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
    setRecallAnswers((prev) =>
      Array.from(
        { length: visibleSequence.length },
        (_, index) => prev[index] ?? "",
      ),
    );
    globalThis.setTimeout(() => recallRefs.current[0]?.focus(), 80);
  }, [phase, visibleSequence.length]);

  useEffect(() => {
    if (phase !== "memorise" || paused || settings.mode !== "auto") return;

    const timer = globalThis.setInterval(() => {
      moveNumber(1);
    }, settings.intervalSeconds * 1000);

    return () => globalThis.clearInterval(timer);
  }, [
    moveNumber,
    paused,
    phase,
    sequence.length,
    settings.intervalSeconds,
    settings.mode,
  ]);

  useEffect(() => {
    if (
      phase !== "memorise" ||
      paused ||
      settings.mode !== "manual" ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    )
      return;

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
  }, [moveNumber, paused, phase, sequence.length, settings.mode]);

  function updateSettings(next: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...next }));
  }

  function setExerciseTime(seconds: number | "custom") {
    if (seconds === "custom") {
      const customSeconds = clampSeconds(
        Number(settings.customExerciseSeconds),
        settings.exerciseSeconds,
      );
      updateSettings({
        useCustomTime: true,
        exerciseSeconds: customSeconds,
        customExerciseSeconds: String(customSeconds),
      });
      return;
    }

    updateSettings({ useCustomTime: false, exerciseSeconds: seconds });
  }

  function setRecallTime(seconds: number | "custom") {
    if (seconds === "custom") {
      const customSeconds = clampSeconds(
        Number(settings.customRecallSeconds),
        settings.recallSeconds,
      );
      updateSettings({
        useCustomRecallTime: true,
        recallSeconds: customSeconds,
        customRecallSeconds: String(customSeconds),
      });
      return;
    }

    updateSettings({ useCustomRecallTime: false, recallSeconds: seconds });
  }

  function setAutoInterval(value: number | "custom") {
    if (value === "custom") {
      const customSeconds = clampIntervalSeconds(
        Number(settings.customIntervalSeconds),
        settings.intervalSeconds,
      );
      updateSettings({
        useCustomInterval: true,
        intervalSeconds: customSeconds,
        customIntervalSeconds: String(customSeconds),
      });
      return;
    }

    updateSettings({ useCustomInterval: false, intervalSeconds: value });
  }

  function setCustomAutoInterval(value: string) {
    const cleanValue = cleanDecimalInput(value);
    updateSettings({
      customIntervalSeconds: cleanValue,
      intervalSeconds: cleanValue
        ? clampIntervalSeconds(Number(cleanValue), settings.intervalSeconds)
        : settings.intervalSeconds,
      useCustomInterval: true,
    });
  }

  function applySmartInterval() {
    if (smartIntervalSeconds === null) return;
    updateSettings({
      useCustomInterval: true,
      intervalSeconds: smartIntervalSeconds,
      customIntervalSeconds: String(smartIntervalSeconds),
    });
  }

  function setCustomExerciseTime(value: string) {
    const cleanValue = value.replace(/\D/g, "");
    updateSettings({
      customExerciseSeconds: cleanValue,
      exerciseSeconds: cleanValue
        ? clampSeconds(Number(cleanValue), settings.exerciseSeconds)
        : settings.exerciseSeconds,
      useCustomTime: true,
    });
  }

  function setCustomRecallTime(value: string) {
    const cleanValue = value.replace(/\D/g, "");
    updateSettings({
      customRecallSeconds: cleanValue,
      recallSeconds: cleanValue
        ? clampSeconds(Number(cleanValue), settings.recallSeconds)
        : settings.recallSeconds,
      useCustomRecallTime: true,
    });
  }

  function addRecallTime(seconds: number) {
    setRecallSecondsLeft((prev) => clampSeconds(prev + seconds, prev));
  }

  function stopVoiceOver() {
    Speech.stop().catch(() => {});
  }

  function startGame() {
    resultSavedRef.current = false;
    stopRecallListening();
    const generatedLength =
      settings.mode === "auto"
        ? Math.ceil(settings.exerciseSeconds / settings.intervalSeconds) + 2
        : 250;
    const nextSequence = Array.from({ length: generatedLength }, () =>
      formatNumber(randomBetween(minValue, maxValue), settings.digits),
    );

    setSequence(nextSequence);
    sequenceLengthRef.current = nextSequence.length;
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setMaxSeenIndex(0);
    clearSwitchTimer();
    setNumberVisible(true);
    setSecondsLeft(settings.exerciseSeconds);
    setCountdown(3);
    setPaused(false);
    setRecallAnswers([]);
    setRecallSecondsLeft(settings.recallSeconds);
    setChecked([]);
    setSavedResult(null);
    setPhase("countdown");
  }

  function finishMemorising() {
    setPaused(false);
    setRecallSecondsLeft(settings.recallSeconds);
    setPhase("recall");
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

  function applySpokenRecall(transcript: string) {
    const spokenDigitsValue = digitsFromTranscript(transcript);
    if (!spokenDigitsValue) return;

    setRecallAnswers((prev) => {
      const next = Array.from(
        { length: visibleSequence.length },
        (_, index) => prev[index] ?? "",
      );
      let cursor = next.findIndex((answer) => answer.length < settings.digits);
      if (cursor < 0) cursor = Math.max(0, next.length - 1);

      for (const digit of spokenDigitsValue) {
        if (cursor >= next.length) break;
        next[cursor] = `${next[cursor] ?? ""}${digit}`.slice(
          0,
          settings.digits,
        );
        if (next[cursor].length >= settings.digits) cursor += 1;
      }

      globalThis.setTimeout(
        () => focusRecallInput(Math.min(cursor, next.length - 1)),
        20,
      );
      return next;
    });
  }

  function stopRecallListening() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        if (recognition.abort) recognition.abort();
        else recognition.stop();
      } catch {
        // Recognition may already have ended; the local state still needs clearing.
      }
    }
    setRecallListening(false);
  }

  function startRecallListening() {
    if (!recallSpeechSupported || typeof window === "undefined") return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (result?.isFinal) applySpokenRecall(result[0]?.transcript ?? "");
      }
    };
    recognition.onerror = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setRecallListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setRecallListening(false);
    };
    recognitionRef.current = recognition;
    setRecallListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setRecallListening(false);
    }
  }

  function toggleRecallListening() {
    if (recallListening) {
      stopRecallListening();
      return;
    }
    startRecallListening();
  }

  function checkAnswers(answerOverride = recallAnswers) {
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;
    stopRecallListening();
    const answers = answerOverride.map((answer) => answer.trim());
    const expected = visibleSequence;
    const nextChecked = expected.map((item, index) => ({
      index,
      expected: item,
      actual: answers[index] ?? "",
      correct: answers[index] === item,
    }));
    const numbersCorrect = nextChecked.filter((item) => item.correct).length;
    const digitsShown = expected.reduce((sum, item) => sum + item.length, 0);
    const digitsCorrect = nextChecked.reduce(
      (sum, item) => sum + digitsCorrectFor(item.expected, item.actual),
      0,
    );
    const result: StoredGameResult = {
      id: createResultId(),
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
      accuracy: expected.length
        ? Math.round((numbersCorrect / expected.length) * 100)
        : 0,
      settings: {
        digits: settings.digits,
        min: minValue,
        max: maxValue,
        intervalSeconds:
          settings.mode === "auto" ? settings.intervalSeconds : undefined,
      },
    };

    setChecked(nextChecked);
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }

  useEffect(() => {
    checkAnswersRef.current = checkAnswers;
  });

  useEffect(() => {
    if (phase !== "recall" || paused) stopRecallListening();
  }, [paused, phase]);

  useEffect(() => {
    if (phase !== "recall" || paused) {
      autoCheckRef.current = false;
      return;
    }

    autoCheckRef.current = false;
    const timer = globalThis.setInterval(() => {
      setRecallSecondsLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          if (!autoCheckRef.current) {
            autoCheckRef.current = true;
            globalThis.setTimeout(() => checkAnswersRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [paused, phase]);

  useEffect(() => {
    if (
      phase !== "memorise" ||
      paused ||
      !settings.voiceOverEnabled ||
      !numberVisible ||
      !currentNumber
    ) {
      if (phase !== "memorise" || paused || !settings.voiceOverEnabled)
        stopVoiceOver();
      return;
    }

    let cancelled = false;
    Speech.stop()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        Speech.speak(spokenValue(currentNumber, settings.voiceOverMode), {
          language: "en-US",
          pitch: 1.08,
          rate:
            Platform.OS === "ios" ? 0.5 : Platform.OS === "web" ? 0.9 : 0.82,
          voice: preferredVoiceIdentifier ?? undefined,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentNumber,
    numberVisible,
    paused,
    phase,
    preferredVoiceIdentifier,
    settings.voiceOverEnabled,
    settings.voiceOverMode,
  ]);

  useEffect(() => stopVoiceOver, []);

  useEffect(() => () => stopRecallListening(), []);

  const setupPanel = (
    <GameSetupLayout
      game={game}
      canStart={canStart}
      isMobile={isMobile}
      onStart={startGame}
    >
      <View style={[s.settingBlockWide, isMobile && s.settingBlockWideMobile]}>
        <Text style={s.fieldLabel}>Mode</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={["auto", "manual"] as Mode[]}
          value={settings.mode}
          onChange={(mode) => updateSettings({ mode })}
        />
      </View>

      {settings.mode === "auto" && (
        <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
          <Text style={s.fieldLabel}>Auto interval</Text>
          <GameSegmentedControl
            accentColor={game.color}
            compact={isMobile}
            options={[...INTERVAL_PRESETS, "custom"] as (number | "custom")[]}
            value={
              settings.useCustomInterval ? "custom" : settings.intervalSeconds
            }
            onChange={setAutoInterval}
          />
          {settings.useCustomInterval && (
            <View
              style={[s.inlineInputRow, isMobile && s.inlineInputRowMobile]}
            >
              <TextInput
                value={settings.customIntervalSeconds}
                onChangeText={setCustomAutoInterval}
                keyboardType="decimal-pad"
                placeholder="1.5"
                placeholderTextColor="#7A7A7A"
                style={[s.numberInput, isMobile && s.numberInputMobile]}
              />
              <Text style={[s.rangeDivider, isMobile && s.rangeDividerMobile]}>
                sec / number
              </Text>
            </View>
          )}
          {smartIntervalSeconds !== null && (
            <TouchableOpacity
              style={[
                s.smartSpeedBtn,
                {
                  borderColor: `${game.color}3D`,
                  backgroundColor: `${game.color}14`,
                },
                isMobile && s.smartSpeedBtnMobile,
              ]}
              onPress={applySmartInterval}
            >
              <Feather name="zap" size={13} color={game.color} />
              <Text style={[s.smartSpeedText, { color: game.color }]}>
                Use smart speed: {smartIntervalSeconds}s
              </Text>
            </TouchableOpacity>
          )}
          <Text style={s.fieldHint}>
            Seconds between each number. Smart speed uses your latest manual run
            minus 0.3s.
          </Text>
        </View>
      )}

      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Exercise time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[...TIME_PRESETS, "custom"] as (number | "custom")[]}
          value={settings.useCustomTime ? "custom" : settings.exerciseSeconds}
          onChange={setExerciseTime}
          labelForOption={formatSecondsLabel}
        />
        {settings.useCustomTime && (
          <View style={[s.inlineInputRow, isMobile && s.inlineInputRowMobile]}>
            <TextInput
              value={settings.customExerciseSeconds}
              onChangeText={setCustomExerciseTime}
              keyboardType="number-pad"
              placeholder="90"
              placeholderTextColor="#7A7A7A"
              style={[s.numberInput, isMobile && s.numberInputMobile]}
            />
            <Text style={[s.rangeDivider, isMobile && s.rangeDividerMobile]}>
              seconds
            </Text>
          </View>
        )}
        <Text style={s.fieldHint}>Countdown for the memorisation stage.</Text>
      </View>

      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Recall time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[...RECALL_TIME_PRESETS, "custom"] as (number | "custom")[]}
          value={
            settings.useCustomRecallTime ? "custom" : settings.recallSeconds
          }
          onChange={setRecallTime}
          labelForOption={formatSecondsLabel}
        />
        {settings.useCustomRecallTime && (
          <View style={[s.inlineInputRow, isMobile && s.inlineInputRowMobile]}>
            <TextInput
              value={settings.customRecallSeconds}
              onChangeText={setCustomRecallTime}
              keyboardType="number-pad"
              placeholder="300"
              placeholderTextColor="#7A7A7A"
              style={[s.numberInput, isMobile && s.numberInputMobile]}
            />
            <Text style={[s.rangeDivider, isMobile && s.rangeDividerMobile]}>
              seconds
            </Text>
          </View>
        )}
        <Text style={s.fieldHint}>
          How long you get to type the sequence after memorising.
        </Text>
      </View>

      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Voice over</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={["off", "on"] as ("off" | "on")[]}
          value={settings.voiceOverEnabled ? "on" : "off"}
          onChange={(value) =>
            updateSettings({ voiceOverEnabled: value === "on" })
          }
        />
        {settings.voiceOverEnabled && (
          <GameSegmentedControl
            accentColor={game.color}
            compact={isMobile}
            options={["digits", "number"] as VoiceOverMode[]}
            value={settings.voiceOverMode}
            onChange={(voiceOverMode) => updateSettings({ voiceOverMode })}
            labelForOption={(value) => (value === "digits" ? "7 and 6" : "76")}
          />
        )}
        <Text style={s.fieldHint}>
          Reads each displayed number aloud during memorisation. Uses the
          smoothest female voice available.
        </Text>
      </View>

      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Number display</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[1, 2, 3]}
          value={settings.digits}
          onChange={(digits) => updateSettings({ digits })}
        />
        <Text style={s.fieldHint}>Values are padded to this many digits.</Text>
      </View>

      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Number range</Text>
        <View style={[s.rangeRow, isMobile && s.rangeRowMobile]}>
          <TextInput
            value={settings.min}
            onChangeText={(min) => updateSettings({ min })}
            keyboardType="number-pad"
            style={[s.numberInput, isMobile && s.numberInputMobile]}
          />
          <Text style={[s.rangeDivider, isMobile && s.rangeDividerMobile]}>
            to
          </Text>
          <TextInput
            value={settings.max}
            onChangeText={(max) => updateSettings({ max })}
            keyboardType="number-pad"
            style={[s.numberInput, isMobile && s.numberInputMobile]}
          />
        </View>
        <Text style={s.fieldHint}>
          {formatNumber(minValue, settings.digits)} to{" "}
          {formatNumber(maxValue, settings.digits)} inclusive.
        </Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setupPanel;

  if (phase === "countdown") {
    return (
      <>
        {setupPanel}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View
              style={[s.countdownPanel, isMobile && s.countdownPanelMobile]}
            >
              <Text style={s.countdownKicker}>Get ready</Text>
              <Text
                style={[s.countdownNumber, isMobile && s.countdownNumberMobile]}
              >
                {countdown}
              </Text>
              <Text style={s.countdownText}>
                Numbers begin after the countdown.
              </Text>
            </View>
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );
  }

  if (phase === "memorise") {
    return (
      <>
        {setupPanel}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={[s.playPanel, isMobile && s.playPanelMobile]}>
              <View style={[s.playTimerRow, isMobile && s.playTimerRowMobile]}>
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${progress}%` as any,
                        backgroundColor: game.color,
                      },
                    ]}
                  />
                </View>
                <Text style={s.timerText}>{secondsLeft}s</Text>
              </View>

              <View style={[s.numberStage, isMobile && s.numberStageMobile]}>
                {paused ? (
                  <View style={s.pauseCurtain}>
                    <Feather name="pause" size={24} color={game.color} />
                    <Text style={s.pauseText}>Paused</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      s.numberDisplay,
                      isMobile && s.numberDisplayMobile,
                      !numberVisible && s.numberDisplayHidden,
                    ]}
                  >
                    {currentNumber}
                  </Text>
                )}
              </View>

              {settings.mode === "manual" && (
                <View
                  style={[s.manualControls, isMobile && s.manualControlsMobile]}
                >
                  <TouchableOpacity
                    style={s.iconButton}
                    onPress={() => moveNumber(-1)}
                    disabled={paused || currentIndex === 0}
                  >
                    <Feather
                      name="chevron-left"
                      size={22}
                      color="rgba(255,255,255,0.78)"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.iconButton}
                    onPress={() => moveNumber(1)}
                    disabled={paused}
                  >
                    <Feather
                      name="chevron-right"
                      size={22}
                      color="rgba(255,255,255,0.78)"
                    />
                  </TouchableOpacity>
                </View>
              )}

              <GameSessionActions
                accentColor={game.color}
                mobile={isMobile}
                secondaryLabel={paused ? "Unpause" : "Pause"}
                secondaryIcon={paused ? "play" : "pause"}
                onSecondary={() => setPaused((next) => !next)}
                primaryLabel="End Early"
                primaryIcon="flag"
                onPrimary={finishMemorising}
                tertiaryDestructive
                tertiaryLabel="Give Up"
                tertiaryIcon="x-circle"
                onTertiary={() =>
                  checkAnswers(Array(visibleSequence.length).fill(""))
                }
              />
            </View>
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );
  }

  if (phase === "recall") {
    return (
      <>
        {setupPanel}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={[s.panelHeader, isMobile && s.panelHeaderMobile]}>
              <View style={isMobile && s.panelHeaderCopyMobile}>
                <Text style={[s.kicker, { color: game.color }]}>Recall</Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  Type the numbers in order
                </Text>
              </View>
              <View style={s.recallHeaderActions}>
                <View
                  style={[
                    s.recallTimerPill,
                    {
                      borderColor: `${game.color}3D`,
                      backgroundColor: `${game.color}14`,
                    },
                    recallSecondsLeft <= 20 && s.recallTimerPillUrgent,
                    recallSecondsLeft <= 20 && {
                      backgroundColor: game.color,
                      borderColor: game.color,
                    },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={14}
                    color={recallSecondsLeft <= 20 ? "#FFFFFF" : game.color}
                  />
                  <Text
                    style={[
                      s.recallTimerText,
                      { color: game.color },
                      recallSecondsLeft <= 20 && s.recallTimerTextUrgent,
                    ]}
                  >
                    {recallTimerValue}
                  </Text>
                </View>
                <View
                  style={[s.settingsIcon, isMobile && s.settingsIconMobile]}
                >
                  <Feather name="edit-3" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text style={[s.fieldHint, isMobile && s.fieldHintMobile]}>
              Recall auto-checks when the timer reaches zero.
            </Text>

            <View
              style={[s.recallTimeAdjust, isMobile && s.recallTimeAdjustMobile]}
            >
                <TouchableOpacity
                  disabled={paused}
                  style={[
                    s.timeAdjustButton,
                    {
                      borderColor: `${game.color}3D`,
                      backgroundColor: `${game.color}14`,
                    },
                    isMobile && s.timeAdjustButtonMobile,
                    paused && s.buttonDisabled,
                  ]}
                  onPress={() => addRecallTime(60)}
                >
                <Feather name="plus" size={13} color={game.color} />
                <Text style={[s.timeAdjustText, { color: game.color }]}>
                  1 min
                </Text>
              </TouchableOpacity>
                <TouchableOpacity
                  disabled={paused}
                  style={[
                    s.timeAdjustButton,
                    {
                      borderColor: `${game.color}3D`,
                      backgroundColor: `${game.color}14`,
                    },
                    isMobile && s.timeAdjustButtonMobile,
                    paused && s.buttonDisabled,
                  ]}
                  onPress={() => addRecallTime(300)}
                >
                <Feather name="plus" size={13} color={game.color} />
                <Text style={[s.timeAdjustText, { color: game.color }]}>
                  5 min
                </Text>
              </TouchableOpacity>
                <TouchableOpacity
                  disabled={!recallSpeechSupported || paused}
                  style={[
                    s.timeAdjustButton,
                    {
                    borderColor: `${game.color}3D`,
                    backgroundColor: `${game.color}14`,
                  },
                  isMobile && s.timeAdjustButtonMobile,
                  recallListening && s.micButtonActive,
                  recallListening && {
                    backgroundColor: game.color,
                    borderColor: game.color,
                  },
                  (!recallSpeechSupported || paused) && s.buttonDisabled,
                ]}
                onPress={toggleRecallListening}
              >
                <Feather
                  name={recallListening ? "mic-off" : "mic"}
                  size={13}
                  color={recallListening ? "#FFFFFF" : game.color}
                />
                <Text
                  style={[
                    s.timeAdjustText,
                    { color: game.color },
                    recallListening && s.micButtonTextActive,
                  ]}
                >
                  {recallListening ? "Listening" : "Speak"}
                </Text>
              </TouchableOpacity>
            </View>
            {!recallSpeechSupported && (
              <Text style={[s.fieldHint, isMobile && s.fieldHintMobile]}>
                Microphone recall works in supported browsers.
              </Text>
            )}
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={24} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : null}

            <View style={[s.recallSummary, isMobile && s.recallSummaryMobile]}>
              <StatTile
                label="Numbers to recall"
                value={String(visibleSequence.length)}
                color={game.color}
                light
                compact={isMobile}
              />
              <StatTile
                label="Digits shown"
                value={String(visibleSequence.join("").length)}
                light
                compact={isMobile}
              />
              <StatTile
                label="Time used"
                value={`${settings.exerciseSeconds - secondsLeft}s`}
                light
                compact={isMobile}
              />
            </View>

            <View style={[s.recallGrid, isMobile && s.recallGridMobile]}>
              {visibleSequence.map((_, index) => (
                <View
                  key={`recall-${index}`}
                  style={[s.recallBoxWrap, isMobile && s.recallBoxWrapMobile]}
                >
                  <Text style={s.recallBoxIndex}>{index + 1}</Text>
                  <TextInput
                    ref={(node) => {
                      recallRefs.current[index] = node;
                    }}
                    value={recallAnswers[index] ?? ""}
                    onChangeText={(value) => updateRecallAnswer(index, value)}
                    onKeyPress={({ nativeEvent }) =>
                      handleRecallKey(index, nativeEvent.key)
                    }
                    keyboardType="number-pad"
                    maxLength={settings.digits}
                    editable={!paused}
                    placeholder={"0".repeat(settings.digits)}
                    placeholderTextColor="#B0B0B0"
                    style={[s.recallBoxInput, paused && s.buttonDisabled]}
                  />
                </View>
              ))}
            </View>

            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((next) => !next)}
              primaryLabel="Finalise"
              primaryIcon="check-circle"
              onPrimary={checkAnswers}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );
  }

  return (
    <>
      {setupPanel}
      <GameFocusOverlay mobile={isMobile}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <View style={[s.panelHeader, isMobile && s.panelHeaderMobile]}>
            <View style={isMobile && s.panelHeaderCopyMobile}>
              <Text style={[s.kicker, { color: game.color }]}>
                Results saved
              </Text>
              <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                You remembered {savedResult?.numbersCorrect ?? 0} of{" "}
                {savedResult?.numbersShown ?? 0}
              </Text>
            </View>
            <View style={[s.settingsIcon, isMobile && s.settingsIconMobile]}>
              <Feather name="award" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <StatTile
              label="Accuracy"
              value={`${savedResult?.accuracy ?? 0}%`}
              color={game.color}
              light
              compact={isMobile}
            />
            <StatTile
              label="Numbers correct"
              value={`${savedResult?.numbersCorrect ?? 0}/${savedResult?.numbersShown ?? 0}`}
              light
              compact={isMobile}
            />
            <StatTile
              label="Digits correct"
              value={`${savedResult?.digitsCorrect ?? 0}/${savedResult?.digitsShown ?? 0}`}
              light
              compact={isMobile}
            />
            <StatTile
              label="Time taken"
              value={`${savedResult?.timeTakenSeconds ?? 0}s`}
              light
              compact={isMobile}
            />
          </View>

          <View style={[s.answerList, isMobile && s.answerListMobile]}>
            {checked.map((item) => (
              <View
                key={item.index}
                style={[
                  s.answerRow,
                  isMobile && s.answerRowMobile,
                  item.correct ? s.answerRowGood : s.answerRowBad,
                ]}
              >
                <Text style={[s.answerIndex, isMobile && s.answerIndexMobile]}>
                  #{item.index + 1}
                </Text>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Correct</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {item.expected}
                  </Text>
                </View>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Your answer</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {item.actual || "-"}
                  </Text>
                </View>
                <Feather
                  name={item.correct ? "check-circle" : "x-circle"}
                  size={18}
                  color={item.correct ? "#7DECD4" : "#FF8C75"}
                />
              </View>
            ))}
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
