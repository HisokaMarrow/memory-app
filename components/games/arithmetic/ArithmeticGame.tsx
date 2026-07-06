import { useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSetupLayout from "../GameSetupLayout";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type ArithmeticKind =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division";
type Level = "calm" | "focused" | "challenge";
type Phase = "setup" | "play" | "result";
type ArithmeticAttempt = {
  index: number;
  prompt: string;
  expected: number;
  actual: number;
  correct: boolean;
};

const LEVEL_MAX: Record<Level, number> = {
  calm: 10,
  focused: 50,
  challenge: 100,
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(kind: ArithmeticKind, level: Level) {
  const max = LEVEL_MAX[level];
  if (kind === "multiplication") {
    const limit = level === "calm" ? 5 : level === "focused" ? 12 : 20;
    const a = randomInt(2, limit);
    const b = randomInt(2, limit);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }
  if (kind === "division") {
    const divisor = randomInt(2, level === "challenge" ? 15 : 10);
    const answer = randomInt(2, Math.max(5, Math.floor(max / divisor)));
    return { prompt: `${divisor * answer} ÷ ${divisor}`, answer };
  }
  const a = randomInt(level === "calm" ? 1 : 10, max);
  const b = randomInt(1, max);
  if (kind === "subtraction")
    return {
      prompt: `${Math.max(a, b)} − ${Math.min(a, b)}`,
      answer: Math.abs(a - b),
    };
  return { prompt: `${a} + ${b}`, answer: a + b };
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={[s.statTile, s.statTileLight]}>
      <Text style={[s.statValue, s.statValueLight, color ? { color } : null]}>
        {value}
      </Text>
      <Text style={[s.statLabel, s.statLabelLight]}>{label}</Text>
    </View>
  );
}

export default function ArithmeticGame({
  game,
  kind,
}: {
  game: GameConfig;
  kind: ArithmeticKind;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [phase, setPhase] = useState<Phase>("setup");
  const [level, setLevel] = useState<Level>("focused");
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [question, setQuestion] = useState(() => makeQuestion(kind, "focused"));
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<ArithmeticAttempt[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const statsRef = useRef({ correct: 0, attempted: 0 });
  const attemptHistoryRef = useRef<ArithmeticAttempt[]>([]);
  const answerInputRef = useRef<TextInput>(null);
  const startedAtRef = useRef(Date.now());
  const finishGameRef = useRef<() => void>(() => {});
  const finishedRef = useRef(false);

  function finishGame() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPaused(false);
    const stats = statsRef.current;
    const accuracy = stats.attempted
      ? Math.round((stats.correct / stats.attempted) * 100)
      : 0;
    const result: StoredGameResult = {
      id: `${game.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gameId: game.id,
      gameTitle: game.title,
      createdAt: new Date().toISOString(),
      mode: "auto",
      exerciseSeconds: duration,
      timeTakenSeconds: Math.max(
        1,
        Math.min(
          duration,
          duration - timeLeft,
        ),
      ),
      numbersShown: stats.attempted,
      numbersCorrect: stats.correct,
      digitsShown: stats.attempted,
      digitsCorrect: stats.correct,
      accuracy,
      settings: {
        digits: 1,
        min: 0,
        max: LEVEL_MAX[level],
        level,
        operation: kind,
        attemptHistory: JSON.stringify(attemptHistoryRef.current),
      },
    };
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }
  finishGameRef.current = finishGame;

  useEffect(() => {
    if (phase !== "play" || paused) return;
    const timer = globalThis.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          globalThis.clearInterval(timer);
          globalThis.setTimeout(() => finishGameRef.current(), 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [paused, phase]);

  function startGame() {
    finishedRef.current = false;
    statsRef.current = { correct: 0, attempted: 0 };
    attemptHistoryRef.current = [];
    setCorrect(0);
    setAttempted(0);
    setAnswer("");
    setFeedback(null);
    setAttemptHistory([]);
    setSavedResult(null);
    setPaused(false);
    setQuestion(makeQuestion(kind, level));
    startedAtRef.current = Date.now();
    setTimeLeft(duration);
    setPhase("play");
  }

  function submitAnswer() {
    if (paused) return;
    if (!answer.trim()) return;
    const submittedAnswer = Number(answer);
    const isCorrect = submittedAnswer === question.answer;
    const next = {
      correct: statsRef.current.correct + (isCorrect ? 1 : 0),
      attempted: statsRef.current.attempted + 1,
    };
    statsRef.current = next;
    const attempt: ArithmeticAttempt = {
      index: next.attempted - 1,
      prompt: question.prompt,
      expected: question.answer,
      actual: submittedAnswer,
      correct: isCorrect,
    };
    const nextHistory = [...attemptHistoryRef.current, attempt];
    attemptHistoryRef.current = nextHistory;
    setAttemptHistory(nextHistory);
    setCorrect(next.correct);
    setAttempted(next.attempted);
    setFeedback(isCorrect ? "correct" : "wrong");
    setAnswer("");
    setQuestion(makeQuestion(kind, level));
    globalThis.setTimeout(() => answerInputRef.current?.focus(), 0);
    globalThis.setTimeout(() => setFeedback(null), 320);
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
    >
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Difficulty</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={["calm", "focused", "challenge"] as Level[]}
          value={level}
          onChange={setLevel}
        />
        <Text style={s.fieldHint}>
          Controls the size and complexity of each calculation.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Sprint time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[30, 60, 120]}
          value={duration}
          onChange={setDuration}
          labelForOption={(seconds) =>
            seconds < 60 ? `${seconds}s` : `${seconds / 60}m`
          }
        />
        <Text style={s.fieldHint}>
          Answer as many clean calculations as possible.
        </Text>
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
              <Text style={[s.kicker, { color: game.color }]}>
                Question {attempted + 1}
              </Text>
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
                {timeLeft}s
              </Text>
            </View>
            <View
              style={[
                s.challengeStage,
                s.sessionSurface,
                { borderColor: `${game.color}33` },
              ]}
            >
              <Text style={s.challengePrompt}>{question.prompt}</Text>
              <TextInput
                ref={answerInputRef}
                autoFocus
                blurOnSubmit={false}
                editable={!paused}
                value={answer}
                onChangeText={(value) =>
                  setAnswer(value.replace(/[^0-9-]/g, ""))
                }
                onSubmitEditing={submitAnswer}
                keyboardType="number-pad"
                placeholder="?"
                placeholderTextColor="#A0A0A0"
                style={[
                  s.challengeInput,
                  {
                    borderColor:
                      feedback === "wrong"
                        ? "#FF7660"
                        : feedback === "correct"
                          ? "#2A9D8F"
                          : `${game.color}55`,
                  },
                  paused && s.buttonDisabled,
                ]}
              />
              <TouchableOpacity
                disabled={!answer.trim() || paused}
                style={[
                  s.primaryButtonInline,
                  { backgroundColor: game.color },
                  (!answer.trim() || paused) && s.buttonDisabled,
                ]}
                onPress={submitAnswer}
              >
                <Feather name="arrow-right" size={15} color="#FFFFFF" />
                <Text style={s.primaryButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={24} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : null}
            <View style={s.gameStatRow}>
              <Text style={s.gameStatText}>
                Correct <Text style={{ color: game.color }}>{correct}</Text>
              </Text>
              <Text style={s.gameStatText}>
                Accuracy{" "}
                <Text style={{ color: game.color }}>
                  {attempted ? Math.round((correct / attempted) * 100) : 0}%
                </Text>
              </Text>
            </View>
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="Finalise"
              primaryIcon="check-circle"
              onPrimary={finishGame}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  return (
    <>
      {setup}
      <GameFocusOverlay mobile={isMobile}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <Text style={[s.kicker, { color: game.color }]}>Sprint complete</Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
            {savedResult?.numbersCorrect ?? 0} correct answers
          </Text>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <ResultStat
              label="Accuracy"
              value={`${savedResult?.accuracy ?? 0}%`}
              color={game.color}
            />
            <ResultStat
              label="Correct"
              value={String(savedResult?.numbersCorrect ?? 0)}
            />
            <ResultStat
              label="Answered"
              value={String(savedResult?.numbersShown ?? 0)}
            />
            <ResultStat
              label="Time taken"
              value={`${savedResult?.timeTakenSeconds ?? 0}s`}
            />
          </View>
          <View style={[s.answerList, isMobile && s.answerListMobile]}>
            {attemptHistory.map((attempt) => (
              <View
                key={`${attempt.index}-${attempt.prompt}`}
                style={[
                  s.answerRow,
                  isMobile && s.answerRowMobile,
                  attempt.correct ? s.answerRowGood : s.answerRowBad,
                ]}
              >
                <Text style={[s.answerIndex, isMobile && s.answerIndexMobile]}>
                  #{attempt.index + 1}
                </Text>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Question</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {attempt.prompt}
                  </Text>
                </View>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Correct answer</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {attempt.expected}
                  </Text>
                </View>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Your answer</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {attempt.actual}
                  </Text>
                </View>
                <Feather
                  name={attempt.correct ? "check-circle" : "x-circle"}
                  size={18}
                  color={attempt.correct ? "#2A9D8F" : "#E85D3F"}
                />
              </View>
            ))}
            {!attemptHistory.length ? (
              <Text style={s.emptyText}>
                No answers were submitted during this sprint.
              </Text>
            ) : null}
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
