import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameResultStat from "../GameResultStat";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSetupLayout from "../GameSetupLayout";
import { buildGameResult, shuffle, useIsMobile } from "../gameUtils";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Phase = "setup" | "study" | "recall" | "result";
type CheckedWord = {
  index: number;
  expected: string;
  actual: string;
  correct: boolean;
};

const WORD_BANK = [
  "anchor",
  "bamboo",
  "castle",
  "dolphin",
  "ember",
  "feather",
  "garden",
  "harbour",
  "island",
  "jungle",
  "kettle",
  "lantern",
  "meadow",
  "nebula",
  "orchard",
  "piano",
  "quartz",
  "rocket",
  "shadow",
  "temple",
  "umbrella",
  "velvet",
  "window",
  "yonder",
  "zephyr",
  "bridge",
  "camera",
  "dragon",
  "forest",
  "glacier",
  "helmet",
  "mirror",
  "ocean",
  "pepper",
  "ribbon",
  "silver",
  "thunder",
  "violet",
];

function shuffledWords(count: number) {
  return shuffle(WORD_BANK).slice(0, count);
}

export default function WordRecallGame({ game }: { game: GameConfig }) {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>("setup");
  const [wordCount, setWordCount] = useState(8);
  const [displaySeconds, setDisplaySeconds] = useState(2);
  const [recallSeconds, setRecallSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [checked, setChecked] = useState<CheckedWord[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const phaseRef = useRef<Phase>("setup");
  const beginRecallRef = useRef<() => void>(() => {});
  const finishRef = useRef<() => void>(() => {});
  const finishedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  function beginRecall() {
    if (phaseRef.current === "recall" || phaseRef.current === "result") return;
    phaseRef.current = "recall";
    setPaused(false);
    setAnswers(Array(words.length).fill(""));
    setTimeLeft(recallSeconds);
    setPhase("recall");
    globalThis.setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }
  beginRecallRef.current = beginRecall;

  function finishRecall(answerOverride = answers) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    phaseRef.current = "result";
    const rows = words.map((word, index) => {
      const actual = (answerOverride[index] ?? "").trim().toLowerCase();
      return { index, expected: word, actual, correct: actual === word };
    });
    const correct = rows.filter((row) => row.correct).length;
    const accuracy = rows.length
      ? Math.round((correct / rows.length) * 100)
      : 0;
    const result = buildGameResult({
      gameId: game.id,
      gameTitle: game.title,
      mode: "auto",
      exerciseSeconds: wordCount * displaySeconds + recallSeconds,
      timeTakenSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      numbersShown: rows.length,
      numbersCorrect: correct,
      digitsShown: rows.length,
      digitsCorrect: correct,
      accuracy,
      settings: {
        digits: 1,
        min: 0,
        max: rows.length,
        wordCount,
        displaySeconds,
        recallSeconds,
        wordSequence: JSON.stringify(words),
        answers: JSON.stringify(answerOverride),
      },
    });
    setChecked(rows);
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }
  finishRef.current = finishRecall;

  useEffect(() => {
    if (phase !== "study" || paused) return;
    const timer = globalThis.setInterval(() => {
      setCurrentIndex((index) => {
        if (index >= words.length - 1) {
          globalThis.clearInterval(timer);
          globalThis.setTimeout(() => beginRecallRef.current(), 250);
          return index;
        }
        return index + 1;
      });
    }, displaySeconds * 1000);
    return () => globalThis.clearInterval(timer);
  }, [displaySeconds, paused, phase, words.length]);

  useEffect(() => {
    if (phase !== "recall" || paused) return;
    const timer = globalThis.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          globalThis.clearInterval(timer);
          globalThis.setTimeout(() => finishRef.current(), 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [paused, phase]);

  function startGame() {
    const nextWords = shuffledWords(wordCount);
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    phaseRef.current = "study";
    setWords(nextWords);
    setAnswers(Array(nextWords.length).fill(""));
    setChecked([]);
    setSavedResult(null);
    setPaused(false);
    setCurrentIndex(0);
    setPhase("study");
  }

  function updateAnswer(index: number, value: string) {
    const cleaned = value.replace(/[^a-zA-Z'-]/g, "");
    setAnswers((current) =>
      current.map((answer, answerIndex) =>
        answerIndex === index ? cleaned : answer,
      ),
    );
  }

  function focusInput(index: number) {
    inputRefs.current[Math.max(0, Math.min(index, words.length - 1))]?.focus();
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
    >
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Words</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[5, 8, 12]}
          value={wordCount}
          onChange={setWordCount}
        />
        <Text style={s.fieldHint}>
          Words are shown one at a time, just like Numbers Game.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Display speed</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[1, 2, 3]}
          value={displaySeconds}
          onChange={setDisplaySeconds}
          labelForOption={(value) => `${value}s`}
        />
        <Text style={s.fieldHint}>How long each word remains visible.</Text>
      </View>
      <View style={[s.settingBlockWide, isMobile && s.settingBlockWideMobile]}>
        <Text style={s.fieldLabel}>Recall time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[60, 120, 180]}
          value={recallSeconds}
          onChange={setRecallSeconds}
          labelForOption={(value) => `${value / 60}m`}
        />
        <Text style={s.fieldHint}>
          Recall each word in its original position and order.
        </Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setup;

  if (phase === "study")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <Text style={[s.kicker, { color: game.color }]}>
                Memorise the sequence
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
                {currentIndex + 1} / {words.length}
              </Text>
            </View>
            <View
              style={[
                s.wordDisplayStage,
                s.sessionSurface,
                { borderColor: `${game.color}33` },
              ]}
            >
              {paused ? (
                <View style={s.pauseCurtain}>
                  <Feather name="pause" size={28} color={game.color} />
                  <Text style={s.pauseText}>Paused</Text>
                </View>
              ) : (
                <Text
                  style={[
                    s.wordDisplayValue,
                    isMobile && s.wordDisplayValueMobile,
                  ]}
                >
                  {words[currentIndex]}
                </Text>
              )}
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width:
                      `${((currentIndex + 1) / words.length) * 100}%` as any,
                    backgroundColor: game.color,
                  },
                ]}
              />
            </View>
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="End Early"
              primaryIcon="flag"
              onPrimary={beginRecall}
              tertiaryDestructive
              tertiaryLabel="Give Up"
              tertiaryIcon="x-circle"
              onTertiary={() => finishRecall(Array(words.length).fill(""))}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  if (phase === "recall")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <View>
                <Text style={[s.kicker, { color: game.color }]}>Recall</Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  Type the words in order
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
                {timeLeft}s
              </Text>
            </View>
            <View
              style={[s.wordRecallGrid, isMobile && s.wordRecallGridMobile]}
            >
              {words.map((_, index) => (
                <View key={`word-${index}`} style={s.wordRecallBox}>
                  <Text style={s.wordRecallIndex}>{index + 1}</Text>
                  <TextInput
                    ref={(node) => {
                      inputRefs.current[index] = node;
                    }}
                    autoFocus={index === 0}
                    blurOnSubmit={false}
                    value={answers[index] ?? ""}
                    onChangeText={(value) => updateAnswer(index, value)}
                    onSubmitEditing={() => focusInput(index + 1)}
                    editable={!paused}
                    placeholder="word"
                    placeholderTextColor="#B0B0B0"
                    autoCapitalize="none"
                    style={[
                      s.wordRecallBoxInput,
                      { borderColor: `${game.color}38` },
                      paused && s.buttonDisabled,
                    ]}
                  />
                </View>
              ))}
            </View>
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={24} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : null}
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="Finalise"
              primaryIcon="check-circle"
              onPrimary={finishRecall}
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
          <Text style={[s.kicker, { color: game.color }]}>Recall complete</Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
            You remembered {savedResult?.numbersCorrect ?? 0} of{" "}
            {savedResult?.numbersShown ?? 0}
          </Text>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <GameResultStat
              label="Accuracy"
              value={`${savedResult?.accuracy ?? 0}%`}
              color={game.color}
            />
            <GameResultStat
              label="Words correct"
              value={`${savedResult?.numbersCorrect ?? 0}/${savedResult?.numbersShown ?? 0}`}
            />
            <GameResultStat label="Display speed" value={`${displaySeconds}s`} />
            <GameResultStat
              label="Time taken"
              value={`${savedResult?.timeTakenSeconds ?? 0}s`}
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
                  <Text style={s.answerLabel}>Correct word</Text>
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
                    {item.actual || "—"}
                  </Text>
                </View>
                <Feather
                  name={item.correct ? "check-circle" : "x-circle"}
                  size={18}
                  color={item.correct ? "#2A9D8F" : "#E85D3F"}
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
