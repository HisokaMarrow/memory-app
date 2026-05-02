import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import DashboardShell from "../components/dashboard/DashboardShell";
import { getDailyPlanGames, getFavouriteGameIds, getUserGoals, saveUserGoals, type UserGoal } from "../components/games/gamePreferences";
import { calculateGameStats, loadGameResults, type StoredGameResult } from "../components/games/resultsStore";
import { GAME_CATEGORIES, GAMES, getCategoryConfig, type GameConfig } from "../data/gamesCatalog";
import { dashboard as s } from "../styles/screens/dashboard.styles";

const PERSIST_KEY = "memoro-dashboard-state";

const TECHNIQUES = [
  { name: "Chunking Method", unlocked: true },
  { name: "Memory Palace", unlocked: true },
  { name: "Spaced Repetition", unlocked: false },
  { name: "Mind Mapping", unlocked: false },
  { name: "Peg System", unlocked: false },
];

const LEADERBOARD = {
  Global: [
    { name: "Alex K.", xp: 2340 },
    { name: "Sarah M.", xp: 2120 },
    { name: "James T.", xp: 1750 },
  ],
  Friends: [
    { name: "Jamie R.", xp: 1600 },
    { name: "Priya S.", xp: 1350 },
  ],
} as const;

type LeaderboardRow = {
  name: string;
  xp: number;
  you?: boolean;
};

const GOAL_METRIC_PRESETS: Record<string, string[]> = {
  Memory: ["numbers", "digits", "cards", "words", "names", "images"],
  Maths: ["equations", "additions", "subtractions", "multiplications", "divisions", "percentages"],
  Words: ["words", "letters", "anagrams", "lists"],
  Speed: ["reactions", "seconds", "rounds"],
  Focus: ["patterns", "sequences", "rounds"],
};

const GRAPH_WIDTH = 1120;
const GRAPH_HEIGHT = 340;
const GRAPH_PADDING = { top: 42, right: 92, bottom: 52, left: 44 };
const GRAPH_SCALES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

type GraphScale = typeof GRAPH_SCALES[number]["id"];
const GRAPH_SCALE_ORDER: GraphScale[] = ["day", "week", "month", "year"];

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

function ProgressBar({ value, color = "#E85D2A" }: { value: number; color?: string }) {
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${Math.min(100, Math.max(0, value))}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.statMini}>
      <Text style={s.statEmoji}>{icon}</Text>
      <Text style={s.statMiniValue}>{value}</Text>
      <Text style={s.statMiniLabel}>{label}</Text>
    </View>
  );
}

function localDayKey(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scoreForGoal(goal: UserGoal, stats: ReturnType<typeof calculateGameStats>) {
  if (goal.targetMetric === "digits") return stats.bestDigits;
  if (goal.targetMetric === "numbers") return stats.bestNumbers;
  return 0;
}

function normaliseMetricLabel(value: string) {
  return value
    .replace(/game$/i, "")
    .replace(/calculation$/i, "equations")
    .replace(/names & faces/i, "names")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function metricOptionsForTag(tag: string) {
  const preset = GOAL_METRIC_PRESETS[tag] ?? [];
  const derived = GAMES
    .filter((game) => game.category === tag)
    .map((game) => normaliseMetricLabel(game.title));
  return Array.from(new Set([...preset, ...derived])).filter(Boolean);
}

function pointsForResult(result: StoredGameResult) {
  return result.digitsCorrect + result.numbersCorrect * 2;
}

function pointsPerSecondForResult(result: StoredGameResult) {
  return pointsForResult(result) / Math.max(1, result.timeTakenSeconds);
}

function sameLocalDay(a: Date, b: Date) {
  return localDayKey(a) === localDayKey(b);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
}

function attemptLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function aggregateResults(id: string, label: string, results: StoredGameResult[]) {
  const numbersCorrect = results.reduce((sum, result) => sum + result.numbersCorrect, 0);
  const numbersShown = results.reduce((sum, result) => sum + result.numbersShown, 0);
  const digitsCorrect = results.reduce((sum, result) => sum + result.digitsCorrect, 0);
  const digitsShown = results.reduce((sum, result) => sum + result.digitsShown, 0);
  const timeTakenSeconds = results.reduce((sum, result) => sum + result.timeTakenSeconds, 0);
  const points = results.reduce((sum, result) => sum + pointsForResult(result), 0);
  const accuracy = results.length ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length) : 0;

  return {
    id,
    label,
    attempts: results.length,
    points,
    pointsPerSecond: points / Math.max(1, timeTakenSeconds),
    numbersCorrect,
    numbersShown,
    digitsCorrect,
    digitsShown,
    timeTakenSeconds,
    accuracy,
    hasData: results.length > 0,
  };
}

function buildPerformanceTimeline(results: StoredGameResult[], scale: GraphScale) {
  const now = new Date();

  if (scale === "day") {
    return results
      .filter((result) => sameLocalDay(new Date(result.createdAt), now))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map((result, index) => ({
        id: result.id,
        label: attemptLabel(new Date(result.createdAt)),
        attempts: 1,
        points: pointsForResult(result),
        pointsPerSecond: pointsPerSecondForResult(result),
        numbersCorrect: result.numbersCorrect,
        numbersShown: result.numbersShown,
        digitsCorrect: result.digitsCorrect,
        digitsShown: result.digitsShown,
        timeTakenSeconds: result.timeTakenSeconds,
        accuracy: result.accuracy,
        hasData: true,
        index,
      }));
  }

  if (scale === "year") {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      const key = monthKey(date);
      const bucketResults = results.filter((result) => monthKey(new Date(result.createdAt)) === key);
      const label = index === 11 ? "This month" : monthLabel(date);
      return { ...aggregateResults(key, label, bucketResults), index };
    });
  }

  const length = scale === "week" ? 7 : 30;
  return Array.from({ length }, (_, index) => {
    const date = startOfLocalDay(now);
    date.setDate(date.getDate() - (length - 1 - index));
    const key = localDayKey(date);
    const bucketResults = results.filter((result) => localDayKey(result.createdAt) === key);
    const label = index === length - 1 ? "Today" : scale === "week"
      ? new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)
      : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
    return { ...aggregateResults(key, label, bucketResults), index };
  });
}

export default function Dashboard() {
  const [goals, setGoals] = useState<UserGoal[]>(() => getUserGoals());
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const firstGoal = goals[0];
  const [draftGoalText, setDraftGoalText] = useState(firstGoal.text);
  const [draftGoalTag, setDraftGoalTag] = useState(firstGoal.tag);
  const [draftTargetCount, setDraftTargetCount] = useState(String(firstGoal.targetCount));
  const [draftTargetMetric, setDraftTargetMetric] = useState(firstGoal.targetMetric);
  const [draftTargetSeconds, setDraftTargetSeconds] = useState(String(firstGoal.targetSeconds));
  const [draftDeadline, setDraftDeadline] = useState(firstGoal.deadline);
  const [metricMenuOpen, setMetricMenuOpen] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<keyof typeof LEADERBOARD>("Global");
  const [gameResults, setGameResults] = useState<StoredGameResult[]>([]);
  const [selectedGraphGameId, setSelectedGraphGameId] = useState<string | null>(null);
  const [focusedGraphResultId, setFocusedGraphResultId] = useState<string | null>(null);
  const [graphScale, setGraphScale] = useState<GraphScale>("week");
  const [graphSelected, setGraphSelected] = useState(false);
  const graphWheelAtRef = useRef(0);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [dailyPlan, setDailyPlan] = useState<GameConfig[]>(GAMES.slice(0, 3));

  useEffect(() => {
    if (typeof localStorage === "undefined") return;

    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.leaderboardFilter) setLeaderboardFilter(saved.leaderboardFilter);
    } catch {
      // Ignore malformed dashboard state.
    }
  }, []);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ leaderboardFilter }));
  }, [leaderboardFilter]);

  useEffect(() => {
    setGoals(getUserGoals());
    setFavouriteIds(getFavouriteGameIds());
    setDailyPlan(getDailyPlanGames());
  }, []);

  useEffect(() => {
    let alive = true;

    async function refreshResults() {
      const results = await loadGameResults();
      if (alive) setGameResults(results);
    }

    refreshResults();

    if (typeof window === "undefined") return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshResults);
    window.addEventListener("memoro-results-updated", refreshResults);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshResults);
      window.removeEventListener("memoro-results-updated", refreshResults);
    };
  }, []);

  const gameStats = calculateGameStats(gameResults);
  const latestResult = gameStats.latest;
  const continueProgress = latestResult ? Math.min(100, Math.max(0, latestResult.accuracy)) : 0;
  const today = localDayKey(new Date());
  const playedToday = new Set(gameResults.filter((result) => localDayKey(result.createdAt) === today).map((result) => result.gameId));
  const favouriteGames = favouriteIds
    .map((id) => GAMES.find((game) => game.id === id))
    .filter(Boolean) as GameConfig[];
  const visibleFavouriteGames = favouriteGames.length ? favouriteGames : GAMES.slice(0, 3);
  const draftMetricOptions = metricOptionsForTag(draftGoalTag);
  const activeGraphGameId = selectedGraphGameId ?? latestResult?.gameId ?? "numbers-game";
  const graphGame = GAMES.find((game) => game.id === activeGraphGameId) ?? GAMES[0];
  const graphResults = gameResults.filter((result) => result.gameId === activeGraphGameId);
  const graphTimeline = buildPerformanceTimeline(graphResults, graphScale);
  const graphDataPoints = graphTimeline.filter((point) => point.hasData);
  const graphPeak = Math.max(1, ...graphDataPoints.map((item) => item.pointsPerSecond));
  const focusedGraphResult = graphDataPoints.find((item) => item.id === focusedGraphResultId) ?? graphDataPoints[graphDataPoints.length - 1];
  const plotWidth = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;
  const graphLinePoints = graphDataPoints.map((item) => {
    const denominator = Math.max(1, graphTimeline.length - 1);
    const x = GRAPH_PADDING.left + (item.index / denominator) * plotWidth;
    const y = GRAPH_PADDING.top + (1 - item.pointsPerSecond / graphPeak) * plotHeight;
    return { ...item, x, y };
  });
  const graphLineSegments = graphLinePoints.slice(1).map((point, index) => {
    const previous = graphLinePoints[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    return {
      key: `${previous.id}-${point.id}`,
      left: previous.x,
      top: previous.y,
      width: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  });
  const graphAxisLabels = graphTimeline
    .filter((point) => graphScale === "week" || point.index === 0 || point.index === graphTimeline.length - 1 || point.index === Math.floor((graphTimeline.length - 1) / 2))
    .map((point) => {
      const denominator = Math.max(1, graphTimeline.length - 1);
      return {
        id: point.id,
        label: point.label,
        left: GRAPH_PADDING.left + (point.index / denominator) * plotWidth,
      };
    });

  function moveGraphScale(direction: 1 | -1) {
    setGraphScale((current) => {
      const currentIndex = GRAPH_SCALE_ORDER.indexOf(current);
      const nextIndex = Math.max(0, Math.min(GRAPH_SCALE_ORDER.length - 1, currentIndex + direction));
      const nextScale = GRAPH_SCALE_ORDER[nextIndex];
      if (nextScale !== current) setFocusedGraphResultId(null);
      return nextScale;
    });
  }

  function handleGraphWheel(event: any) {
    if (!graphSelected) return;

    const raw = event?.nativeEvent ?? event;
    const deltaY = Number(raw?.deltaY ?? 0);
    const deltaX = Number(raw?.deltaX ?? 0);
    const primaryDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;

    event?.preventDefault?.();
    raw?.preventDefault?.();
    event?.stopPropagation?.();
    raw?.stopPropagation?.();

    if (Math.abs(primaryDelta) < 8) return;

    const now = Date.now();
    if (now - graphWheelAtRef.current < 320) return;
    graphWheelAtRef.current = now;

    moveGraphScale(primaryDelta > 0 ? 1 : -1);
  }

  function selectGoalTag(tag: string) {
    const options = metricOptionsForTag(tag);
    setDraftGoalTag(tag);
    if (!options.includes(draftTargetMetric)) setDraftTargetMetric(options[0] ?? "target");
    setMetricMenuOpen(false);
  }

  function openGoalSettings(index: number | null = 0) {
    const goal = index === null ? {
      text: "Remember digits",
      tag: "Memory",
      targetCount: 20,
      targetMetric: "digits",
      targetSeconds: 60,
      deadline: "2026-05-31",
    } : goals[index];
    setEditingGoalIndex(index);
    setDraftGoalText(goal.text);
    setDraftGoalTag(goal.tag);
    setDraftTargetCount(String(goal.targetCount));
    setDraftTargetMetric(goal.targetMetric);
    setDraftTargetSeconds(String(goal.targetSeconds));
    setDraftDeadline(goal.deadline);
    setMetricMenuOpen(false);
    setGoalModalOpen(true);
  }

  function saveGoalSettings() {
    const nextCount = Number.parseInt(draftTargetCount, 10);
    const nextSeconds = Number.parseInt(draftTargetSeconds, 10);
    const nextGoal = {
      text: draftGoalText.trim() || "Remember digits",
      tag: draftGoalTag,
      targetCount: Number.isFinite(nextCount) ? Math.max(1, Math.min(999, nextCount)) : 20,
      targetMetric: draftTargetMetric.trim() || "digits",
      targetSeconds: Number.isFinite(nextSeconds) ? Math.max(5, Math.min(3600, nextSeconds)) : 60,
      deadline: draftDeadline || "2026-05-31",
    };
    const nextGoals = editingGoalIndex === null
      ? [...goals, nextGoal].slice(0, 3)
      : goals.map((goal, index) => index === editingGoalIndex ? nextGoal : goal);
    setGoals(nextGoals);
    saveUserGoals(nextGoals);
    setGoalModalOpen(false);
  }

  function removeGoal() {
    if (editingGoalIndex === null || goals.length <= 1) return;
    const nextGoals = goals.filter((_, index) => index !== editingGoalIndex);
    setGoals(nextGoals);
    saveUserGoals(nextGoals);
    setGoalModalOpen(false);
  }

  return (
    <DashboardShell
      active="dashboard"
      title={({ profileName }) => `Good training, ${profileName}`}
      subtitle={`${todayLabel()} · You are on a ${gameStats.streakDays}-day streak. Keep it up.`}
      actionLabel="Start Training"
      onActionPress={() => router.push("/games" as any)}
    >
      {({ isCompact, isMobile, profileName }) => {
        const leaderboardRows: (LeaderboardRow & { rank: number })[] = [
          ...LEADERBOARD[leaderboardFilter],
          { name: profileName, xp: gameStats.totalXp, you: true },
        ].sort((a, b) => b.xp - a.xp).map((row, index) => ({ ...row, rank: index + 1 }));

        return (
        <>
          <View style={[s.grid, isCompact && s.gridCompact, isMobile && s.gridMobile]}>
            <View style={s.mainColumn}>
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View>
                    <SectionLabel>Your Goals</SectionLabel>
                    <Text style={s.cardTitle}>{goals.length}/3 active goals</Text>
                  </View>
                  {goals.length < 3 && (
                    <TouchableOpacity style={s.gearBtn} onPress={() => openGoalSettings(null)}>
                      <Feather name="plus" size={15} color="#9E9E9E" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.listStack}>
                  {goals.map((goal, index) => {
                    const currentScore = scoreForGoal(goal, gameStats);
                    const goalPercent = Math.min(100, Math.round((currentScore / goal.targetCount) * 100));
                    const step = Math.ceil(goal.targetCount / 4);
                    const milestones = [step, step * 2, step * 3, goal.targetCount];
                    const goalTagConfig = getCategoryConfig(goal.tag);

                    return (
                      <View key={`${goal.text}-${index}`} style={s.goalItem}>
                        <View style={s.goalHeader}>
                          <View style={[s.goalEmoji, { backgroundColor: `${goalTagConfig.color}18` }]}>
                            <Text style={s.goalEmojiText}>{goalTagConfig.emoji}</Text>
                          </View>
                          <View style={s.goalTextBlock}>
                            <Text style={s.goalTitle}>
                              {goal.text} <Text style={s.goalTitleEm}>{goal.targetCount} {goal.targetMetric}</Text>
                            </Text>
                            <View style={s.goalMeta}>
                              <Text style={s.goalMetaText}>Currently at <Text style={s.boldText}>{currentScore} {goal.targetMetric}</Text></Text>
                              <View style={[s.onTrackPill, { backgroundColor: `${goalTagConfig.color}14` }]}>
                                <Text style={[s.onTrackText, { color: goalTagConfig.color }]}>{goal.tag}</Text>
                              </View>
                              <Text style={s.goalMetaText}>in {goal.targetSeconds}s</Text>
                              <Text style={s.goalMetaText}>{daysUntil(goal.deadline)} days left</Text>
                            </View>
                          </View>
                          <View style={s.goalRight}>
                            <View>
                              <Text style={s.goalPercent}>{goalPercent}%</Text>
                              <Text style={s.goalPercentLabel}>complete</Text>
                            </View>
                            <TouchableOpacity style={s.gearBtn} onPress={() => openGoalSettings(index)}>
                              <Feather name="settings" size={15} color="#9E9E9E" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={s.goalProgressWrap}>
                          <ProgressBar value={goalPercent} />
                          <View style={s.milestoneRow}>
                            {milestones.map((m) => (
                              <Text key={m} style={[s.milestoneText, m <= currentScore && s.milestoneTextActive]}>{m}</Text>
                            ))}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  <View style={s.goalMeta}>
                    <Text style={s.goalMetaText}>Play any game once today to count toward your daily streak.</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={s.quickStart} onPress={() => router.push("/game/numbers-game" as any)}>
                <View>
                  <Text style={s.quickLabel}>Quick Start</Text>
                  <Text style={s.quickTitle}>Start number training</Text>
                  <Text style={s.quickSub}>Continue building your recall streak</Text>
                </View>
                <View style={s.quickIcon}>
                  <Feather name="play" size={22} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View>
                    <SectionLabel>{"Today's Plan"}</SectionLabel>
                    <Text style={s.cardTitle}>3 games selected for today</Text>
                  </View>
                  <View style={s.donePill}>
                    <Text style={s.donePillText}>{dailyPlan.filter((game) => playedToday.has(game.id)).length}/3 done</Text>
                  </View>
                </View>
                <View style={s.listStack}>
                  {dailyPlan.map((game) => {
                    const done = playedToday.has(game.id);
                    const category = getCategoryConfig(game.category);
                    return (
                      <TouchableOpacity
                        key={game.id}
                        style={[s.taskRow, done && { borderColor: `${game.color}44`, backgroundColor: `${game.color}10` }]}
                        onPress={() => router.push(`/game/${game.id}` as any)}
                      >
                        <View style={[s.taskIcon, { backgroundColor: `${game.color}18` }]}>
                          <Text style={s.taskEmoji}>{category.emoji}</Text>
                        </View>
                        <View style={s.taskContent}>
                          <Text style={[s.taskTitle, done && s.taskTitleDone]}>{game.title}</Text>
                          <Text style={s.taskDur}>{game.category} · {game.duration}</Text>
                        </View>
                        <View style={[s.checkCircle, done && { backgroundColor: game.color, borderColor: game.color }]}>
                          {done && <Feather name="check" size={13} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={s.card}>
                <SectionLabel>Continue</SectionLabel>
                <View style={s.listStack}>
                  {[
                    {
                      label: latestResult?.gameTitle ?? "Numbers Game",
                      progress: continueProgress,
                      icon: "🧠",
                      color: "#5B5BD6",
                      sub: latestResult ? `${latestResult.numbersCorrect}/${latestResult.numbersShown} remembered · ${latestResult.accuracy}% accuracy` : "No saved attempts yet",
                    },
                  ].map((item) => (
                    <TouchableOpacity key={item.label} style={s.continueRow} onPress={() => router.push("/game/numbers-game" as any)}>
                      <View style={s.continueContent}>
                        <Text style={s.continueTitle}>{item.label}</Text>
                        <Text style={s.continuePct}>{item.sub}</Text>
                        <ProgressBar value={item.progress} color={item.color} />
                      </View>
                      <Text style={s.continuePct}>{item.progress}%</Text>
                      <View style={[s.continuePlay, { backgroundColor: `${item.color}18` }]}>
                        <Feather name="play" size={12} color={item.color} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.card}>
                <SectionLabel>Favourite Games</SectionLabel>
                <View style={s.favGrid}>
                  {visibleFavouriteGames.slice(0, 3).map((game) => {
                    const category = getCategoryConfig(game.category);
                    return (
                    <TouchableOpacity key={game.id} style={s.favItem} onPress={() => router.push(`/game/${game.id}` as any)}>
                      <View style={[s.favIcon, { backgroundColor: `${game.color}18` }]}>
                        <Text style={s.taskEmoji}>{category.emoji}</Text>
                      </View>
                      <Text style={s.favText}>{game.title}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={s.card}>
                <SectionLabel>Recommended For You</SectionLabel>
                {[
                  { title: "Improve Recall Speed", sub: "You slow down after 10 digits. This fixes it.", tag: "Memory" },
                  { title: "Chunking Drill", sub: "Your weakest technique. 3 min exercise.", tag: "Technique" },
                ].map((item) => (
                  <View key={item.title} style={s.recommendRow}>
                    <View style={s.recommendDot} />
                    <View style={s.recommendContent}>
                      <View style={s.recommendTop}>
                        <Text style={s.recommendTitle}>{item.title}</Text>
                        <View style={s.onTrackPill}><Text style={s.onTrackText}>{item.tag}</Text></View>
                      </View>
                      <Text style={s.recommendSub}>{item.sub}</Text>
                    </View>
                    <Feather name="arrow-right" size={16} color="#9E9E9E" />
                  </View>
                ))}
              </View>
            </View>

            <View style={s.sideColumn}>
              <View style={[s.card, s.darkCard]}>
                <SectionLabel>Progress Snapshot</SectionLabel>
                <View style={s.statGrid}>
                  <StatCard label="Streak" value={String(gameStats.streakDays)} icon="🔥" />
                  <StatCard label="XP Earned" value={gameStats.totalXp.toLocaleString("en-GB")} icon="✨" />
                  <StatCard label="Best Recall" value={String(gameStats.bestNumbers)} icon="🧠" />
                </View>
                <Text style={[s.chartLabel, s.darkMutedText]}>Weekly streak</Text>
                <View style={s.weekStrip}>
                  {gameStats.weekActivity.map((day) => (
                    <View key={day.key} style={s.weekDay}>
                      <View style={[s.weekDot, day.active && s.weekDotActive, day.isToday && s.weekDotToday]}>
                        {day.active && <Feather name="check" size={11} color="#FFFFFF" />}
                      </View>
                      <Text style={[s.weekLabel, day.isToday && s.weekLabelToday]}>{day.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.chartLabel, s.darkMutedText]}>Accuracy trend - last 7 attempts</Text>
                <View style={s.chart}>
                  {(gameResults.length ? gameResults.slice(0, 7).reverse().map((result) => result.accuracy) : [0, 0, 0, 0, 0, 0, 0]).map((value, index) => (
                    <View key={index} style={s.chartColumn}>
                      <View style={[s.chartBar, { height: `${value}%` as any, backgroundColor: index === 6 ? "#E85D2A" : "#DADADA" }]} />
                      <Text style={[s.chartDay, index === 6 && s.chartDayActive]}>{index + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[s.card, s.darkCard]}>
                <View style={s.cardHeader}>
                  <View>
                    <SectionLabel>Vault Preview</SectionLabel>
                    <Text style={[s.cardTitle, s.darkCardTitle]}>Memory Techniques</Text>
                  </View>
                  <View style={s.onTrackPill}><Text style={s.onTrackText}>2 / 5 unlocked</Text></View>
                </View>
                <View style={s.listStack}>
                  {TECHNIQUES.map((technique) => (
                    <View key={technique.name} style={[s.techniqueRow, s.darkSubPanel, !technique.unlocked && s.techniqueLocked]}>
                      <View style={[s.techniqueIcon, !technique.unlocked && s.techniqueIconLocked]}>
                        <Feather name={technique.unlocked ? "check" : "lock"} size={13} color={technique.unlocked ? "#E85D2A" : "#9E9E9E"} />
                      </View>
                      <Text style={[s.techniqueText, !technique.unlocked && s.techniqueTextLocked]}>{technique.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[s.card, s.darkCard]}>
                <View style={s.cardHeader}>
                  <View>
                    <SectionLabel>Leaderboard</SectionLabel>
                    <Text style={[s.cardTitle, s.darkCardTitle]}>Top This Week</Text>
                  </View>
                  <View style={s.segment}>
                    {(["Global", "Friends"] as const).map((filter) => (
                      <TouchableOpacity
                        key={filter}
                        style={[s.segmentBtn, leaderboardFilter === filter && s.segmentBtnActive]}
                        onPress={() => setLeaderboardFilter(filter)}
                      >
                        <Text style={[s.segmentText, leaderboardFilter === filter && s.segmentTextActive]}>{filter}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={s.listStack}>
                  {leaderboardRows.map((row) => (
                    <View key={`${row.rank}-${row.name}`} style={[s.leaderRow, s.darkSubPanel, row.you && s.leaderRowYou]}>
                      <View style={[s.rankBadge, row.rank === 1 && s.rankGold, row.rank === 2 && s.rankSilver, row.rank === 3 && s.rankBronze]}>
                        <Text style={s.rankText}>{row.rank}</Text>
                      </View>
                      <Text style={[s.leaderName, row.you && s.leaderNameYou]}>{row.name}{row.you ? " · you" : ""}</Text>
                      <View style={s.leaderXp}>
                        <Text style={s.leaderEmoji}>✨</Text>
                        <Text style={[s.leaderXpText, row.you && s.leaderNameYou]}>{row.xp.toLocaleString("en-GB")}</Text>
                        <Text style={s.leaderXpLabel}>XP</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={[s.card, s.darkCard, s.performanceCard]}>
              <View style={s.cardHeader}>
                <View>
                  <SectionLabel>Performance Graph</SectionLabel>
                  <Text style={[s.cardTitle, s.darkCardTitle]}>Points per second by game</Text>
                </View>
                {focusedGraphResult && (
                  <View style={s.performanceScorePill}>
                    <Text style={s.performanceScore}>{focusedGraphResult.pointsPerSecond.toFixed(2)}</Text>
                    <Text style={s.performanceScoreLabel}>points/sec</Text>
                  </View>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.graphSelector} contentContainerStyle={s.graphSelectorContent}>
                {GAMES.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    style={[s.graphSelectorBtn, activeGraphGameId === game.id && s.graphSelectorBtnActive]}
                    onPress={() => {
                      setSelectedGraphGameId(game.id);
                      setFocusedGraphResultId(null);
                    }}
                  >
                    <Text style={[s.graphSelectorText, activeGraphGameId === game.id && s.graphSelectorTextActive]}>{game.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.timeScaleRow}>
                {GRAPH_SCALES.map((scale) => (
                  <TouchableOpacity
                    key={scale.id}
                    style={[s.timeScaleBtn, graphScale === scale.id && s.timeScaleBtnActive]}
                    onPress={() => {
                      setGraphSelected(true);
                      setGraphScale(scale.id);
                      setFocusedGraphResultId(null);
                    }}
                  >
                    <Text style={[s.timeScaleText, graphScale === scale.id && s.timeScaleTextActive]}>{scale.label}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={[s.graphZoomHint, graphSelected && s.graphZoomHintActive]}>
                  {graphSelected ? "Wheel zoom enabled" : "Click graph to enable wheel zoom"}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.graphChartScroll} contentContainerStyle={s.graphChartScrollContent}>
                <View
                  style={[s.graphLineChart, graphSelected && s.graphLineChartSelected]}
                  {...({
                    onClick: () => setGraphSelected(true),
                    onPointerDown: () => setGraphSelected(true),
                    onWheel: handleGraphWheel,
                    onWheelCapture: handleGraphWheel,
                  } as any)}
                >
                  <View style={s.graphLineGrid} />
                  <View style={[s.graphTodayMarker, { left: GRAPH_PADDING.left + plotWidth }]} />
                  <Text style={[s.graphTodayLabel, { left: GRAPH_PADDING.left + plotWidth }]}>
                    {graphScale === "year" ? "Now" : "Today"}
                  </Text>
                  {graphLineSegments.map((segment) => (
                    <View
                      key={segment.key}
                      style={[
                        s.graphLineSegment,
                        {
                          left: segment.left,
                          top: segment.top,
                          width: segment.width,
                          transform: [{ rotate: `${segment.angle}deg` }],
                        },
                      ]}
                    />
                  ))}
                  {graphLinePoints.map((point, index) => {
                    const isFocused = point.id === focusedGraphResult?.id;
                    return (
                      <Pressable
                        key={point.id}
                        style={[
                          s.graphLinePoint,
                          isFocused && s.graphLinePointActive,
                          {
                            left: point.x,
                            top: point.y,
                          },
                        ]}
                        onHoverIn={() => setFocusedGraphResultId(point.id)}
                        onPress={() => setFocusedGraphResultId(point.id)}
                      >
                        <Text style={s.graphLinePointText}>{index + 1}</Text>
                      </Pressable>
                    );
                  })}
                  {graphAxisLabels.map((label) => (
                    <Text key={label.id} style={[s.graphAxisLabel, { left: label.left }]}>{label.label}</Text>
                  ))}
                  {!graphLinePoints.length && (
                    <View style={s.graphEmptyState}>
                      <Text style={s.graphEmptyTitle}>No score history yet</Text>
                      <Text style={s.graphDetailText}>Play {graphGame.title} to start drawing your points/sec line.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={s.graphDetailPanelWide}>
                {focusedGraphResult ? (
                  <>
                    <View style={s.graphDetailTop}>
                      <Text style={s.graphDetailTitle}>{graphGame.title}</Text>
                      <Text style={s.graphDetailDate}>{focusedGraphResult.label} · {focusedGraphResult.attempts} attempt{focusedGraphResult.attempts === 1 ? "" : "s"}</Text>
                    </View>
                    <View style={s.performanceStatsRow}>
                      <Text style={s.graphDetailText}>{focusedGraphResult.points} pts</Text>
                      <Text style={s.graphDetailText}>{focusedGraphResult.numbersCorrect}/{focusedGraphResult.numbersShown} numbers</Text>
                      <Text style={s.graphDetailText}>{focusedGraphResult.digitsCorrect}/{focusedGraphResult.digitsShown} digits</Text>
                      <Text style={s.graphDetailText}>{focusedGraphResult.timeTakenSeconds}s</Text>
                      <Text style={s.graphDetailText}>{focusedGraphResult.accuracy}% accuracy</Text>
                    </View>
                  </>
                ) : (
                  <Text style={s.graphDetailText}>Select a game with saved attempts to see the full attempt breakdown.</Text>
                )}
              </View>
            </View>
          </View>

          <Modal transparent visible={goalModalOpen} animationType="fade" onRequestClose={() => setGoalModalOpen(false)}>
            <View style={s.modalRoot}>
              <TouchableOpacity style={s.modalScrim} activeOpacity={1} onPress={() => setGoalModalOpen(false)} />
              <Pressable style={s.modalCard} onPress={() => setMetricMenuOpen(false)}>
                <View style={s.modalHeader}>
                  <View>
                    <SectionLabel>Goal Settings</SectionLabel>
                    <Text style={s.modalTitle}>{editingGoalIndex === null ? "Add a goal" : "Edit goal"}</Text>
                  </View>
                  <TouchableOpacity style={s.modalClose} onPress={() => setGoalModalOpen(false)}>
                    <Feather name="x" size={17} color="#9E9E9E" />
                  </TouchableOpacity>
                </View>

                <Text style={s.inputLabel}>Goal</Text>
                <TextInput
                  style={s.modalInput}
                  value={draftGoalText}
                  onChangeText={(value) => {
                    setMetricMenuOpen(false);
                    setDraftGoalText(value);
                  }}
                  placeholder="Remember digits"
                  placeholderTextColor="#9E9E9E"
                />

                <Text style={s.inputLabel}>Tag</Text>
                <View style={s.goalTypeRow}>
                  {GAME_CATEGORIES.map((category) => (
                    <TouchableOpacity key={category.id} style={[s.goalTypeBtn, draftGoalTag === category.id && s.goalTypeBtnActive]} onPress={() => selectGoalTag(category.id)}>
                      <Text style={[s.goalTypeText, draftGoalTag === category.id && s.goalTypeTextActive]}>{category.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.inputLabel}>Target</Text>
                <View style={s.goalTargetGrid}>
                  <View style={s.goalTargetField}>
                    <TextInput
                      style={s.modalInput}
                      value={draftTargetCount}
                      onChangeText={(value) => {
                        setMetricMenuOpen(false);
                        setDraftTargetCount(value.replace(/[^0-9]/g, ""));
                      }}
                      keyboardType="number-pad"
                      placeholder="20"
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                  <View style={s.goalTargetField}>
                    <TouchableOpacity
                      style={s.metricSelect}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        setMetricMenuOpen((open) => !open);
                      }}
                    >
                      <Text style={s.metricSelectText}>{draftTargetMetric}</Text>
                      <Feather name="chevron-down" size={14} color="#6A6A6A" />
                    </TouchableOpacity>
                    {metricMenuOpen && (
                      <View style={s.metricMenu}>
                        <ScrollView style={s.metricMenuScroll} showsVerticalScrollIndicator={draftMetricOptions.length > 7} nestedScrollEnabled>
                          {draftMetricOptions.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={s.metricMenuItem}
                              onPress={(event) => {
                                event.stopPropagation?.();
                                setDraftTargetMetric(option);
                                setMetricMenuOpen(false);
                              }}
                            >
                              <Text style={[s.goalTypeText, draftTargetMetric === option && s.goalTypeTextActive]}>{option}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <View style={s.goalTargetField}>
                    <TextInput
                      style={s.modalInput}
                      value={draftTargetSeconds}
                      onChangeText={(value) => {
                        setMetricMenuOpen(false);
                        setDraftTargetSeconds(value.replace(/[^0-9]/g, ""));
                      }}
                      keyboardType="number-pad"
                      placeholder="60"
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                </View>
                <Text style={s.goalMetaText}>Example: remember 20 digits in 60 seconds.</Text>

                <Text style={s.inputLabel}>Target date</Text>
                <TextInput
                  style={s.modalInput}
                  value={draftDeadline}
                  onChangeText={(value) => {
                    setMetricMenuOpen(false);
                    setDraftDeadline(value);
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9E9E9E"
                />

                <View style={s.modalActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setGoalModalOpen(false)}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  {editingGoalIndex !== null && goals.length > 1 && (
                    <TouchableOpacity style={s.cancelBtn} onPress={removeGoal}>
                      <Text style={s.cancelBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.saveBtn} onPress={saveGoalSettings}>
                    <Text style={s.saveBtnText}>Save Goal</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </View>
          </Modal>
        </>
        );
      }}
    </DashboardShell>
  );
}
