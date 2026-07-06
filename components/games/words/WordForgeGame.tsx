import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSetupLayout from "../GameSetupLayout";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Phase = "setup" | "play" | "result";
type Difficulty = "short" | "medium" | "long";
type Attempt = { word: string; accepted: boolean; reason?: string };
type Puzzle = { source: string; words: string[] };

const PUZZLES: Record<Difficulty, Puzzle[]> = {
  short: [
    {
      source: "stream",
      words: [
        "are", "arm", "art", "ate", "ear", "eat", "era", "mar", "mat",
        "met", "ram", "rat", "sea", "set", "sir", "sit", "tar", "tea",
        "aim", "air", "its", "rest", "rate", "same", "seam", "star",
        "stem", "team", "tear", "term", "time", "tram", "steam", "tamer",
        "master",
      ],
    },
    {
      source: "planet",
      words: [
        "ant", "ape", "apt", "ate", "eat", "lap", "let", "nap", "net",
        "pan", "pat", "pen", "pet", "tan", "tap", "tea", "ten", "late",
        "lean", "leap", "lent", "pale", "pane", "pant", "pate", "peal",
        "peat", "plan", "tale", "tape", "teal", "plane", "plant", "plate",
        "pleat", "panel", "petal",
      ],
    },
    {
      source: "garden",
      words: [
        "age", "and", "are", "den", "ear", "end", "era", "rag", "ran",
        "red", "anger", "dare", "dear", "drag", "earn", "gear", "near",
        "rage", "read", "ranged", "grade", "grand", "danger", "garden",
      ],
    },
  ],
  medium: [
    {
      source: "triangle",
      words: [
        "age", "air", "ant", "are", "art", "ate", "ear", "eat", "era",
        "gel", "gin", "leg", "lie", "net", "rag", "ran", "rat", "tan",
        "tie", "alert", "alien", "align", "angle", "giant", "glare", "glean",
        "grain", "grant", "great", "later", "learn", "range", "regal", "reign",
        "tiger", "trail", "train", "trial", "retain", "retail", "linear",
        "integral", "relating",
      ],
    },
    {
      source: "education",
      words: [
        "act", "aid", "ant", "ate", "can", "cat", "cut", "den", "die",
        "due", "eat", "end", "ice", "net", "nod", "not", "nut", "one",
        "out", "tan", "tea", "ten", "tie", "tin", "ton", "date", "diet",
        "dine", "dune", "edit", "idea", "into", "note", "tone", "unit",
        "untie", "audio", "dance", "ocean", "united", "notice", "action",
        "auction", "caution", "donate", "induce", "edition",
      ],
    },
    {
      source: "adventure",
      words: [
        "ant", "are", "art", "ate", "den", "due", "ear", "eat", "end",
        "era", "net", "ran", "red", "rue", "run", "ten", "van", "dare",
        "date", "dear", "deer", "dune", "even", "ever", "near", "need",
        "read", "rude", "tune", "under", "venue", "nature", "venture",
        "advent", "averted", "vaunted",
      ],
    },
  ],
  long: [
    {
      source: "conversation",
      words: [
        "act", "air", "ant", "are", "art", "ate", "can", "car", "cat",
        "con", "ear", "eat", "era", "net", "nor", "not", "one", "ore",
        "ran", "rat", "sea", "set", "sir", "sit", "son", "tan", "tar",
        "ten", "tie", "tin", "ton", "van", "action", "actor", "ancient",
        "arise", "coast", "coin", "cone", "crane", "crate", "nation", "notion",
        "ocean", "ratio", "raven", "react", "saint", "satin", "scare", "score",
        "since", "stone", "store", "train", "voice", "voter", "reason",
        "version", "scenario", "creation", "reaction", "conserve",
      ],
    },
    {
      source: "constellation",
      words: [
        "act", "ail", "ant", "ate", "can", "cat", "con", "ice", "ion",
        "its", "let", "lie", "net", "not", "one", "sat", "sea", "set",
        "sit", "son", "tan", "tea", "ten", "tie", "tin", "ton", "action",
        "alien", "alone", "atone", "coast", "coin", "cone", "lane", "late",
        "lean", "least", "lent", "line", "lion", "list", "loan", "nation",
        "neat", "note", "notion", "ocean", "once", "saint", "scale", "scent",
        "silent", "slate", "slice", "snail", "stone", "tale", "teal", "tile",
        "toast", "total", "station", "elastic", "install", "isolate", "location",
        "national", "notation", "salient", "section", "social", "stolen",
      ],
    },
    {
      source: "masterpiece",
      words: [
        "ace", "aim", "air", "ape", "arm", "art", "ate", "ear", "eat",
        "era", "ice", "map", "mat", "met", "pie", "ram", "rat", "sea",
        "set", "sir", "sit", "care", "case", "cast", "cite", "item", "mate",
        "meat", "pace", "pair", "part", "past", "pear", "race", "rate", "rest",
        "same", "seam", "seat", "site", "star", "steam", "team", "tear", "term",
        "time", "trace", "master", "piece", "precise", "respect", "secret",
        "script", "spare", "spear", "spice", "timer", "permit", "tamper", "impact",
        "practice", "ceramist",
      ],
    },
  ],
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  short: "Short",
  medium: "Medium",
  long: "Super long",
};

function canBuildWord(word: string, source: string) {
  const available = [...source].reduce<Record<string, number>>((counts, letter) => {
    counts[letter] = (counts[letter] ?? 0) + 1;
    return counts;
  }, {});
  return [...word].every((letter) => {
    if (!available[letter]) return false;
    available[letter] -= 1;
    return true;
  });
}

function cleanWords(puzzle: Puzzle) {
  return [...new Set(puzzle.words.map((word) => word.toLowerCase()))].filter(
    (word) => word.length >= 3 && word !== puzzle.source && canBuildWord(word, puzzle.source),
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function ResultStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={[s.statTile, s.statTileLight]}>
      <Text style={[s.statValue, s.statValueLight, color ? { color } : null]}>{value}</Text>
      <Text style={[s.statLabel, s.statLabelLight]}>{label}</Text>
    </View>
  );
}

export default function WordForgeGame({ game }: { game: GameConfig }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [duration, setDuration] = useState(180);
  const [timeLeft, setTimeLeft] = useState(180);
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES.medium[0]);
  const [entry, setEntry] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [status, setStatus] = useState("Type a word using only the letters above.");
  const [statusKind, setStatusKind] = useState<"neutral" | "good" | "bad">("neutral");
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const phaseRef = useRef<Phase>("setup");
  const finishRef = useRef<() => void>(() => {});
  const finishedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const validWords = useMemo(() => cleanWords(puzzle), [puzzle]);
  const acceptedWords = useMemo(
    () => attempts.filter((attempt) => attempt.accepted).map((attempt) => attempt.word),
    [attempts],
  );
  const missedWords = useMemo(
    () =>
      validWords
        .filter((word) => !acceptedWords.includes(word))
        .sort((a, b) => b.length - a.length || a.localeCompare(b))
        .slice(0, 12),
    [acceptedWords, validWords],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  function focusEntry() {
    globalThis.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function finishGame() {
    if (finishedRef.current || phaseRef.current === "result") return;
    finishedRef.current = true;
    phaseRef.current = "result";
    setPaused(false);
    const accepted = attempts.filter((attempt) => attempt.accepted);
    const accuracy = attempts.length ? Math.round((accepted.length / attempts.length) * 100) : 0;
    const result: StoredGameResult = {
      id: `${game.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gameId: game.id,
      gameTitle: game.title,
      createdAt: new Date().toISOString(),
      mode: "manual",
      exerciseSeconds: duration,
      timeTakenSeconds: Math.max(1, duration - timeLeft),
      numbersShown: attempts.length,
      numbersCorrect: accepted.length,
      digitsShown: attempts.length,
      digitsCorrect: accepted.length,
      accuracy,
      settings: {
        digits: puzzle.source.length,
        min: 3,
        max: puzzle.source.length,
        difficulty,
        duration,
        sourceWord: puzzle.source,
        acceptedWords: JSON.stringify(accepted.map((attempt) => attempt.word)),
        attempts: JSON.stringify(attempts),
      },
    };
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }
  finishRef.current = finishGame;

  useEffect(() => {
    if (phase !== "play" || paused) return;
    const timer = globalThis.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          globalThis.clearInterval(timer);
          globalThis.setTimeout(() => finishRef.current(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [paused, phase]);

  function startGame() {
    const options = PUZZLES[difficulty];
    const nextPuzzle = options[Math.floor(Math.random() * options.length)];
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    phaseRef.current = "play";
    setPuzzle(nextPuzzle);
    setTimeLeft(duration);
    setEntry("");
    setAttempts([]);
    setSavedResult(null);
    setPaused(false);
    setStatus("Type a word using only the letters above.");
    setStatusKind("neutral");
    setPhase("play");
    focusEntry();
  }

  function submitWord() {
    if (paused) return;
    const word = entry.trim().toLowerCase();
    if (!word) {
      focusEntry();
      return;
    }

    let nextAttempt: Attempt;
    if (word.length < 3) {
      nextAttempt = { word, accepted: false, reason: "Use at least 3 letters" };
    } else if (word === puzzle.source) {
      nextAttempt = { word, accepted: false, reason: "Forge a new word" };
    } else if (!canBuildWord(word, puzzle.source)) {
      nextAttempt = { word, accepted: false, reason: "Those letters are not available" };
    } else if (attempts.some((attempt) => attempt.word === word)) {
      nextAttempt = { word, accepted: false, reason: "Already tried" };
    } else if (!validWords.includes(word)) {
      nextAttempt = { word, accepted: false, reason: "Not in this puzzle's common-word list" };
    } else {
      nextAttempt = { word, accepted: true };
    }

    setAttempts((current) => [...current, nextAttempt]);
    setEntry("");
    setStatus(nextAttempt.accepted ? `${word.toUpperCase()} forged!` : nextAttempt.reason ?? "Try again");
    setStatusKind(nextAttempt.accepted ? "good" : "bad");
    focusEntry();
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
      title="Prepare your word forge"
      startLabel="Start Forging"
    >
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Source word</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={["short", "medium", "long"] as Difficulty[]}
          value={difficulty}
          onChange={setDifficulty}
          labelForOption={(value) => DIFFICULTY_LABELS[value]}
        />
        <Text style={s.fieldHint}>Longer source words hold more possible combinations.</Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Exercise time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[60, 180, 300]}
          value={duration}
          onChange={setDuration}
          labelForOption={(value) => `${value / 60}m`}
        />
        <Text style={s.fieldHint}>Find as many unique words as you can before time expires.</Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setup;

  if (phase === "play")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <View>
                <Text style={[s.kicker, { color: game.color }]}>Word Forge</Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  {acceptedWords.length} word{acceptedWords.length === 1 ? "" : "s"} forged
                </Text>
              </View>
              <Text
                style={[
                  s.gameTimerPill,
                  {
                    color: game.color,
                    borderColor: `${game.color}44`,
                    backgroundColor: `${game.color}14`,
                  },
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View style={[s.wordForgeStage, s.sessionSurface, { borderColor: `${game.color}33` }]}>
              <Text style={s.wordForgeSource}>{puzzle.source}</Text>
              <View style={s.wordForgeLetters}>
                {[...puzzle.source].map((letter, index) => (
                  <View key={`${letter}-${index}`} style={[s.wordForgeLetter, { borderColor: `${game.color}42` }]}>
                    <Text style={[s.wordForgeLetterText, { color: game.color }]}>{letter}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.controlRow}>
              <TextInput
                ref={inputRef}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                editable={!paused}
                enterKeyHint="done"
                onChangeText={(value) => setEntry(value.replace(/[^a-zA-Z]/g, ""))}
                onSubmitEditing={submitWord}
                placeholder="Type a word and press Enter"
                placeholderTextColor="#9A9A9A"
                style={[
                  s.wordForgeInput,
                  { borderColor: `${game.color}55`, flex: 1, width: "auto" as any },
                  paused && s.buttonDisabled,
                ]}
                value={entry}
              />
              <TouchableOpacity
                disabled={!entry.trim() || paused}
                style={[
                  s.primaryButtonInline,
                  { backgroundColor: game.color },
                  (!entry.trim() || paused) && s.buttonDisabled,
                ]}
                onPress={submitWord}
              >
                <Feather name="plus" size={15} color="#FFFFFF" />
                <Text style={s.primaryButtonText}>Submit Word</Text>
              </TouchableOpacity>
            </View>
            <View style={s.wordForgeStatusRow}>
              <Feather
                name={statusKind === "good" ? "check-circle" : statusKind === "bad" ? "x-circle" : "info"}
                size={15}
                color={statusKind === "good" ? game.color : statusKind === "bad" ? "#D64B45" : "#7A7A7A"}
              />
              <Text
                style={[
                  s.wordForgeStatus,
                  statusKind === "good" && { color: game.color },
                  statusKind === "bad" && s.wordForgeStatusBad,
                ]}
              >
                {status}
              </Text>
            </View>

            {acceptedWords.length ? (
              <ScrollView style={s.wordForgeFoundScroll} contentContainerStyle={s.wordForgeFound} nestedScrollEnabled>
                {acceptedWords.map((word) => (
                  <View key={word} style={[s.wordForgeFoundChip, { backgroundColor: `${game.color}13`, borderColor: `${game.color}38` }]}>
                    <Feather name="check" size={12} color={game.color} />
                    <Text style={[s.wordForgeFoundText, { color: game.color }]}>{word}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={24} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : null}

            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryIcon={paused ? "play" : "pause"}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryIcon="check-circle"
              primaryLabel="Finalise"
              onPrimary={finishGame}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  const accepted = attempts.filter((attempt) => attempt.accepted);
  const rejected = attempts.filter((attempt) => !attempt.accepted);
  const longest = [...accepted].sort((a, b) => b.word.length - a.word.length)[0]?.word ?? "—";

  return (
    <>
      {setup}
      <GameFocusOverlay mobile={isMobile}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <View style={s.gameStatusRow}>
            <View>
              <Text style={[s.kicker, { color: game.color }]}>Forge complete</Text>
              <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                You forged {accepted.length} word{accepted.length === 1 ? "" : "s"} from {puzzle.source}
              </Text>
            </View>
          </View>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <ResultStat label="Accepted" value={String(accepted.length)} color={game.color} />
            <ResultStat label="Attempts" value={String(attempts.length)} />
            <ResultStat label="Accuracy" value={`${savedResult?.accuracy ?? 0}%`} />
            <ResultStat label="Longest" value={longest} color={game.color} />
          </View>

          <ScrollView style={s.wordForgeResultsScroll} contentContainerStyle={s.wordForgeResultsContent} nestedScrollEnabled>
            <View style={s.wordForgeResultGroup}>
              <Text style={s.fieldLabel}>Your accepted words</Text>
              <View style={s.wordForgeFound}>
                {accepted.length ? accepted.map((attempt) => (
                  <View key={attempt.word} style={[s.wordForgeFoundChip, { backgroundColor: `${game.color}13`, borderColor: `${game.color}38` }]}>
                    <Feather name="check" size={12} color={game.color} />
                    <Text style={[s.wordForgeFoundText, { color: game.color }]}>{attempt.word}</Text>
                  </View>
                )) : <Text style={s.emptyText}>No accepted words this round.</Text>}
              </View>
            </View>

            {rejected.length ? (
              <View style={s.wordForgeResultGroup}>
                <Text style={s.fieldLabel}>Not accepted</Text>
                <View style={s.wordForgeFound}>
                  {rejected.map((attempt, index) => (
                    <View key={`${attempt.word}-${index}`} style={[s.wordForgeFoundChip, s.wordForgeRejectedChip]}>
                      <Feather name="x" size={12} color="#D64B45" />
                      <Text style={s.wordForgeRejectedText}>{attempt.word}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={s.wordForgeResultGroup}>
              <Text style={s.fieldLabel}>Strong common words you missed</Text>
              <Text style={s.fieldHint}>A useful selection rather than an overwhelming dictionary dump.</Text>
              <View style={s.wordForgeFound}>
                {missedWords.map((word) => (
                  <View key={word} style={s.wordForgeSuggestionChip}>
                    <Text style={s.wordForgeSuggestionText}>{word}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <GameSessionActions
            accentColor={game.color}
            mobile={isMobile}
            secondaryIcon="arrow-left"
            secondaryLabel="Back to Menu"
            onSecondary={() => router.push("/games" as any)}
            primaryIcon="rotate-cw"
            primaryLabel="Play Again"
            onPrimary={startGame}
          />
        </GameSessionPanel>
      </GameFocusOverlay>
    </>
  );
}
