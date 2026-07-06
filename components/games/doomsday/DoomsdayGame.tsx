import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Difficulty =
  | "current-year"
  | "current-century"
  | "four-centuries"
  | "any-date";
type Phase = "setup" | "play" | "result";
type DateQuestion = {
  year: number;
  month: number;
  day: number;
  label: string;
  weekday: number;
};
type DateAttempt = {
  index: number;
  date: string;
  expected: number;
  actual: number;
  correct: boolean;
};

const WEEKDAYS = [
  { name: "Sunday", emoji: "☀️" },
  { name: "Monday", emoji: "🌙" },
  { name: "Tuesday", emoji: "🔥" },
  { name: "Wednesday", emoji: "🌊" },
  { name: "Thursday", emoji: "⚡" },
  { name: "Friday", emoji: "💚" },
  { name: "Saturday", emoji: "🪐" },
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Proleptic Gregorian weekday calculation, valid from year 1 onwards. */
function weekdayFor(year: number, month: number, day: number) {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjustedYear = month < 3 ? year - 1 : year;
  return (
    (adjustedYear +
      Math.floor(adjustedYear / 4) -
      Math.floor(adjustedYear / 100) +
      Math.floor(adjustedYear / 400) +
      offsets[month - 1] +
      day) %
    7
  );
}

function yearRange(difficulty: Difficulty) {
  const currentYear = new Date().getFullYear();
  if (difficulty === "current-year") return [currentYear, currentYear] as const;
  if (difficulty === "current-century") {
    const start = Math.floor(currentYear / 100) * 100;
    return [start, start + 99] as const;
  }
  if (difficulty === "four-centuries") {
    const start = Math.floor(currentYear / 400) * 400;
    return [Math.max(1, start), start + 399] as const;
  }
  return [1, 9999] as const;
}

function makeQuestion(difficulty: Difficulty): DateQuestion {
  const [minYear, maxYear] = yearRange(difficulty);
  const year = randomInt(minYear, maxYear);
  const month = randomInt(1, 12);
  const day = randomInt(1, daysInMonth(year, month));
  return {
    year,
    month,
    day,
    label: `${day} ${MONTHS[month - 1]} ${year}`,
    weekday: weekdayFor(year, month, day),
  };
}

function difficultyLabel(value: Difficulty) {
  if (value === "current-year") return "Current year";
  if (value === "current-century") return "Current century";
  if (value === "four-centuries") return "Four centuries";
  return "From year 1";
}

export default function DoomsdayGame({ game }: { game: GameConfig }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("current-year");
  const [duration, setDuration] = useState(120);
  const [timeLeft, setTimeLeft] = useState(120);
  const [question, setQuestion] = useState(() => makeQuestion("current-year"));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attempts, setAttempts] = useState<DateAttempt[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const attemptsRef = useRef<DateAttempt[]>([]);
  const statsRef = useRef({ correct: 0, attempted: 0 });
  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const finishRef = useRef<() => void>(() => {});

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
      mode: "manual",
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
        min: yearRange(difficulty)[0],
        max: yearRange(difficulty)[1],
        difficulty,
        duration,
        attempts: JSON.stringify(attemptsRef.current),
      },
    };
    setSavedResult(result);
    saveGameResult(result);
    setMenuOpen(false);
    setPhase("result");
  }
  finishRef.current = finishGame;

  useEffect(() => {
    if (phase !== "play" || paused) return;
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
    finishedRef.current = false;
    attemptsRef.current = [];
    statsRef.current = { correct: 0, attempted: 0 };
    startedAtRef.current = Date.now();
    setAttempts([]);
    setSavedResult(null);
    setSelectedDay(null);
    setMenuOpen(false);
    setQuestion(makeQuestion(difficulty));
    setTimeLeft(duration);
    setPaused(false);
    setPhase("play");
  }

  function submitAnswer() {
    if (paused) return;
    if (selectedDay === null) return;
    const correct = selectedDay === question.weekday;
    const nextStats = {
      correct: statsRef.current.correct + (correct ? 1 : 0),
      attempted: statsRef.current.attempted + 1,
    };
    statsRef.current = nextStats;
    const attempt = {
      index: nextStats.attempted - 1,
      date: question.label,
      expected: question.weekday,
      actual: selectedDay,
      correct,
    };
    const nextAttempts = [...attemptsRef.current, attempt];
    attemptsRef.current = nextAttempts;
    setAttempts(nextAttempts);
    setQuestion(makeQuestion(difficulty));
    setSelectedDay(null);
    setMenuOpen(false);
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
      title="Prepare your calendar run"
      startLabel="Start Calculating"
    >
      <View style={[s.settingBlockWide, isMobile && s.settingBlockWideMobile]}>
        <Text style={s.fieldLabel}>Date range</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={
            [
              "current-year",
              "current-century",
              "four-centuries",
              "any-date",
            ] as Difficulty[]
          }
          value={difficulty}
          onChange={setDifficulty}
          labelForOption={difficultyLabel}
        />
        <Text style={s.fieldHint}>
          Progress from this year to the complete 400-year Gregorian cycle, then
          any date from year 1.
        </Text>
      </View>
      <View style={[s.settingBlockWide, isMobile && s.settingBlockWideMobile]}>
        <Text style={s.fieldLabel}>Exercise time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[60, 120, 300]}
          value={duration}
          onChange={setDuration}
          labelForOption={(value) =>
            value < 60 ? `${value}s` : `${value / 60}m`
          }
        />
        <Text style={s.fieldHint}>
          Calculate as many dates as you can before time expires.
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
                Date {attempts.length + 1}
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
                s.doomsdayStage,
                s.sessionSurface,
                { borderColor: `${game.color}33` },
              ]}
            >
              <Text style={s.doomsdayHint}>
                Which day of the week was this?
              </Text>
              <Text style={[s.doomsdayDate, isMobile && s.doomsdayDateMobile]}>
                {question.label}
              </Text>
              <View style={s.weekdayDropdownWrap}>
                <TouchableOpacity
                  disabled={paused}
                  style={[s.weekdaySelect, { borderColor: `${game.color}55` }]}
                  onPress={() => setMenuOpen((open) => !open)}
                >
                  <Text
                    style={[
                      s.weekdaySelectText,
                      selectedDay !== null && { color: "#121212" },
                    ]}
                  >
                    {selectedDay === null
                      ? "Select a weekday"
                      : `${WEEKDAYS[selectedDay].emoji}  ${WEEKDAYS[selectedDay].name}`}
                  </Text>
                  <Feather
                    name={menuOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={game.color}
                  />
                </TouchableOpacity>
                {menuOpen && !paused ? (
                  <ScrollView
                    style={s.weekdayMenu}
                    contentContainerStyle={s.weekdayMenuContent}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                  >
                    {WEEKDAYS.map((weekday, index) => (
                      <TouchableOpacity
                        key={weekday.name}
                        style={[
                          s.weekdayOption,
                          selectedDay === index && {
                            backgroundColor: `${game.color}14`,
                          },
                        ]}
                        onPress={() => {
                          setSelectedDay(index);
                          setMenuOpen(false);
                        }}
                      >
                        <Text style={s.weekdayEmoji}>{weekday.emoji}</Text>
                        <Text style={s.weekdayOptionText}>{weekday.name}</Text>
                        {selectedDay === index ? (
                          <Feather name="check" size={16} color={game.color} />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
              <TouchableOpacity
                disabled={selectedDay === null || paused}
                style={[
                  s.primaryButtonInline,
                  { backgroundColor: game.color },
                  (selectedDay === null || paused) && s.buttonDisabled,
                ]}
                onPress={submitAnswer}
              >
                <Feather name="arrow-right" size={15} color="#FFFFFF" />
                <Text style={s.primaryButtonText}>Submit Day</Text>
              </TouchableOpacity>
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
          <Text style={[s.kicker, { color: game.color }]}>
            Calendar run complete
          </Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
            {savedResult?.numbersCorrect ?? 0} correct weekdays
          </Text>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <View style={[s.statTile, s.statTileLight]}>
              <Text
                style={[s.statValue, s.statValueLight, { color: game.color }]}
              >
                {savedResult?.accuracy ?? 0}%
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Accuracy</Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {savedResult?.numbersCorrect ?? 0}
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Correct</Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {savedResult?.numbersShown ?? 0}
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Answered</Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {savedResult?.timeTakenSeconds ?? 0}s
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Time</Text>
            </View>
          </View>
          <View style={[s.answerList, isMobile && s.answerListMobile]}>
            {attempts.map((attempt) => (
              <View
                key={`${attempt.index}-${attempt.date}`}
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
                  <Text style={s.answerLabel}>Date</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {attempt.date}
                  </Text>
                </View>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Correct day</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {WEEKDAYS[attempt.expected].emoji}{" "}
                    {WEEKDAYS[attempt.expected].name}
                  </Text>
                </View>
                <View style={[s.answerCol, isMobile && s.answerColMobile]}>
                  <Text style={s.answerLabel}>Your answer</Text>
                  <Text
                    style={[s.answerValue, isMobile && s.answerValueMobile]}
                  >
                    {WEEKDAYS[attempt.actual].emoji}{" "}
                    {WEEKDAYS[attempt.actual].name}
                  </Text>
                </View>
                <Feather
                  name={attempt.correct ? "check-circle" : "x-circle"}
                  size={18}
                  color={attempt.correct ? "#2A9D8F" : "#E85D3F"}
                />
              </View>
            ))}
            {!attempts.length ? (
              <Text style={s.emptyText}>
                No dates were answered during this run.
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
