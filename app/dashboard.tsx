import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import DashboardShell from "../components/dashboard/DashboardShell";
import {
  buildGraphAxisLabels,
  buildGraphGeometry,
  buildPerformanceTimeline,
  GRAPH_PADDING,
  GRAPH_SCALE_ORDER,
  GRAPH_SCALES,
  localDayKey,
  pointsForResult,
  type GraphScale,
} from "../components/dashboard/performanceGraphModel";
import { getDailyPlanGames, getFavouriteGameIds, getUserQuests, loadUserPreferences, saveUserQuests, type UserQuest } from "../components/games/gamePreferences";
import { calculateGameStats, loadGameResults, loadLeaderboard, readLocalGameResultsSnapshot, type LeaderboardEntry, type StoredGameResult } from "../components/games/resultsStore";
import {
  MEMORY_LESSONS,
  getCachedLatestVaultTreeId,
  getCachedMemoryVaultProgress,
  loadLatestVaultTreeId,
  loadMemoryVaultProgress,
  memoryVaultProgressEventName,
} from "../components/vault/memoryVaultProgress";
import { GAMES, getCategoryConfig, type GameConfig } from "../data/gamesCatalog";
import { dashboard as s } from "../styles/screens/dashboard.styles";

const PERSIST_KEY = "memoro-dashboard-state";

function canUseWindowEvents() {
  return Platform.OS === "web" && typeof window !== "undefined" && typeof window.addEventListener === "function";
}

const LEADERBOARD_FILTERS = ["Global"] as const;
type LeaderboardFilter = typeof LEADERBOARD_FILTERS[number];

const QUEST_RANKS = [
  { name: "Wanderer", xp: 0 },
  { name: "Seeker", xp: 500 },
  { name: "Archivist", xp: 1500 },
  { name: "Strategist", xp: 3500 },
  { name: "Mindwalker", xp: 7000 },
  { name: "Mastermind", xp: 15000 },
];

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function ProgressBar({ value, color = "#E85D2A" }: { value: number; color?: string }) {
  const fillColor = Platform.OS === "web" ? color : color === "#121212" ? "#172A38" : "#0F7EA8";
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${Math.min(100, Math.max(0, value))}%` as any, backgroundColor: fillColor }]} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={[s.sectionLabel, Platform.OS !== "web" && s.sectionLabelApp]}>{children}</Text>;
}

function StatCard({ label, value, icon, style }: { label: string; value: string; icon: string; style?: any }) {
  return (
    <View style={[s.statMini, style]}>
      <Text style={s.statEmoji}>{icon}</Text>
      <Text style={s.statMiniValue}>{value}</Text>
      <Text style={s.statMiniLabel}>{label}</Text>
    </View>
  );
}

function LeaderboardRow({ row, isMobile, showLevel = false }: { row: LeaderboardEntry; isMobile: boolean; showLevel?: boolean }) {
  const level = questRankStatus(row.xp).current.name;
  return (
    <View style={[s.leaderRow, isMobile && s.leaderRowMobile, s.darkSubPanel, row.you && s.leaderRowYou]}>
      <View style={[s.rankBadge, row.rank === 1 && s.rankGold, row.rank === 2 && s.rankSilver, row.rank === 3 && s.rankBronze]}>
        <Text style={s.rankText}>{row.rank}</Text>
      </View>
      <View style={s.leaderIdentity}>
        <Text style={[s.leaderName, isMobile && s.leaderNameMobile, row.you && s.leaderNameYou]}>{row.displayName}{row.you ? " · you" : ""}</Text>
        {showLevel && <Text style={s.leaderLevel}>{level} level</Text>}
      </View>
      <View style={[s.leaderXp, isMobile && s.leaderXpMobile]}>
        <Text style={s.leaderEmoji}>✨</Text>
        <Text style={[s.leaderXpText, row.you && s.leaderNameYou]}>{row.xp.toLocaleString("en-GB")}</Text>
        <Text style={s.leaderXpLabel}>XP</Text>
      </View>
    </View>
  );
}

type GameStats = ReturnType<typeof calculateGameStats>;

const DAILY_TRAINING_CATEGORY_TARGETS = [
  { category: "Memory", label: "Memory" },
  { category: "Maths", label: "Maths" },
  { category: "Words", label: "Linguistics" },
] as const;

function completedDailyTrainingCategories(todayResults: StoredGameResult[]) {
  return new Set(
    todayResults
      .map((result) => GAMES.find((game) => game.id === result.gameId)?.category)
      .filter((category) => DAILY_TRAINING_CATEGORY_TARGETS.some((target) => target.category === category))
  );
}

function trainingCategoryLabel(category: string) {
  return category === "Words" ? "Linguistics" : category;
}

function questCurrentValue(quest: UserQuest, stats: GameStats, todayResults: StoredGameResult[], vaultCompletedCount: number) {
  if (quest.metric === "game_score") {
    const latestAttempt = todayResults
      .filter((result) => result.gameId === quest.gameId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    return latestAttempt ? pointsForResult(latestAttempt) : 0;
  }
  if (quest.metric === "daily_training_trio") return completedDailyTrainingCategories(todayResults).size;
  if (quest.metric === "daily_sessions") return todayResults.length;
  if (quest.metric === "accuracy") return todayResults.reduce((best, result) => Math.max(best, result.accuracy), 0);
  if (quest.metric === "best_digits") return stats.bestDigits;
  if (quest.metric === "best_numbers") return stats.bestNumbers;
  if (quest.metric === "vault_lessons") return vaultCompletedCount;
  if (quest.metric === "streak") return stats.streakDays;
  return 0;
}

function seededQuestBump(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return 2 + (hash % 5);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function weeklyQuestScores(quest: UserQuest, gameResults: StoredGameResult[]) {
  const questGame = GAMES.find((game) => game.id === quest.gameId);
  const category = questGame?.category ?? (quest.tag === "Linguistics" ? "Words" : quest.tag);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartTime = weekStart.getTime();

  const selectedGameResults = gameResults.filter((result) => result.gameId === quest.gameId && Date.parse(result.createdAt) >= weekStartTime);
  const fallbackCategoryResults = gameResults.filter((result) => {
    const game = GAMES.find((item) => item.id === result.gameId);
    return game?.category === category && Date.parse(result.createdAt) >= weekStartTime;
  });

  return (selectedGameResults.length ? selectedGameResults : fallbackCategoryResults)
    .map((result) => ({ score: pointsForResult(result), createdAt: result.createdAt }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function adaptiveGameQuestTarget(quest: UserQuest, gameResults: StoredGameResult[]) {
  const weeklyScores = weeklyQuestScores(quest, gameResults);
  const scores = weeklyScores.map((item) => item.score);
  const baseline = median(scores) || Math.max(8, quest.target);
  const latestScore = weeklyScores[0]?.score ?? baseline;
  const deviations = scores.map((score) => Math.abs(score - baseline));
  const medianDeviation = median(deviations);
  const outlierGap = Math.max(4, medianDeviation * 2);
  const latestIsHighOutlier = latestScore > baseline && latestScore - baseline >= outlierGap;
  const bump = seededQuestBump(`${quest.questDate}-${quest.gameId ?? quest.tag}`);
  const base = latestIsHighOutlier ? latestScore : baseline;

  return {
    bump,
    medianScore: baseline,
    target: Math.max(2, Math.round(base + bump)),
  };
}

function calibratedQuestTarget(quest: UserQuest, stats: GameStats, vaultCompletedCount: number, gameResults: StoredGameResult[]) {
  if (quest.calibratedAt) return quest.target;

  if (quest.metric === "game_score") {
    return adaptiveGameQuestTarget(quest, gameResults).target;
  }

  if (quest.metric === "daily_training_trio") {
    return 3;
  }

  if (quest.metric === "daily_sessions") {
    return Math.max(2, Math.min(4, stats.resultsCount >= 12 ? 3 : quest.target));
  }

  if (quest.metric === "accuracy") {
    const pressureTarget = stats.averageAccuracy ? stats.averageAccuracy + 4 : quest.target;
    return Math.max(quest.target, Math.min(96, pressureTarget));
  }

  if (quest.metric === "best_numbers") {
    return Math.max(quest.target, stats.bestNumbers ? stats.bestNumbers + 2 : quest.target);
  }

  if (quest.metric === "best_digits") {
    return Math.max(quest.target, stats.bestDigits ? stats.bestDigits + 4 : quest.target);
  }

  if (quest.metric === "vault_lessons") {
    return Math.max(quest.target, vaultCompletedCount + 1);
  }

  if (quest.metric === "streak") {
    return Math.max(quest.target, stats.streakDays + 1);
  }

  return quest.target;
}

function hydrateQuestProgress(quest: UserQuest, stats: GameStats, todayResults: StoredGameResult[], vaultCompletedCount: number, gameResults: StoredGameResult[]): UserQuest {
  const target = calibratedQuestTarget(quest, stats, vaultCompletedCount, gameResults);
  const current = questCurrentValue({ ...quest, target }, stats, todayResults, vaultCompletedCount);
  const complete = current >= target;
  const calibration = quest.metric === "game_score" ? adaptiveGameQuestTarget(quest, gameResults) : null;
  return {
    ...quest,
    target,
    current,
    status: complete ? "complete" : "active",
    systemMessage: calibration
      ? `7-day median ${calibration.medianScore} pts; target adds ${calibration.bump}. Latest attempt ${current || "not logged"}.`
      : quest.systemMessage,
    calibratedAt: quest.calibratedAt ?? new Date().toISOString(),
    completedAt: complete ? quest.completedAt ?? new Date().toISOString() : undefined,
  };
}

function questProgressPercent(quest: UserQuest) {
  return Math.min(100, Math.round((quest.current / Math.max(1, quest.target)) * 100));
}

function questProgressLabel(quest: UserQuest) {
  if (quest.metric === "game_score") return `${quest.current} / ${quest.target} pts`;
  if (quest.metric === "daily_training_trio") return `${quest.current} / ${quest.target} categories`;
  if (quest.metric === "accuracy") return `${quest.current}% / ${quest.target}%`;
  if (quest.metric === "daily_sessions") return `${quest.current} / ${quest.target} sessions`;
  if (quest.metric === "vault_lessons") return `${quest.current} / ${quest.target} lessons`;
  if (quest.metric === "streak") return `${quest.current} / ${quest.target} days`;
  return `${quest.current} / ${quest.target}`;
}

function questStateKey(quests: UserQuest[]) {
  return JSON.stringify(quests.map((quest) => ({
    id: quest.id,
    target: quest.target,
    current: quest.current,
    status: quest.status,
    calibratedAt: quest.calibratedAt,
    completedAt: quest.completedAt,
    gameId: quest.gameId,
    systemMessage: quest.systemMessage,
  })));
}

function questRankStatus(totalXp: number) {
  const currentIndex = QUEST_RANKS.reduce((best, rank, index) => totalXp >= rank.xp ? index : best, 0);
  const current = QUEST_RANKS[currentIndex];
  const next = QUEST_RANKS[currentIndex + 1] ?? current;
  const span = Math.max(1, next.xp - current.xp);
  const progress = next === current ? 100 : Math.round(((totalXp - current.xp) / span) * 100);

  return {
    current,
    next,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export default function Dashboard() {
  const [quests, setQuests] = useState<UserQuest[]>(() => getUserQuests());
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilter>("Global");
  const [gameResults, setGameResults] = useState<StoredGameResult[]>(() => readLocalGameResultsSnapshot());
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardEntry[]>([]);
  const [vaultCompletedCount, setVaultCompletedCount] = useState(() => getCachedMemoryVaultProgress());
  const [latestVaultTreeId, setLatestVaultTreeId] = useState(() => getCachedLatestVaultTreeId());
  const [selectedGraphGameId, setSelectedGraphGameId] = useState<string | null>(null);
  const [focusedGraphResultId, setFocusedGraphResultId] = useState<string | null>(null);
  const [graphScale, setGraphScale] = useState<GraphScale>("week");
  const [graphSelected, setGraphSelected] = useState(false);
  const graphWheelAtRef = useRef(0);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => getFavouriteGameIds());
  const [dailyPlan, setDailyPlan] = useState<GameConfig[]>(GAMES.slice(0, 3));
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;

    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (LEADERBOARD_FILTERS.includes(saved.leaderboardFilter)) setLeaderboardFilter(saved.leaderboardFilter);
    } catch {
      // Ignore malformed dashboard state.
    }
  }, []);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ leaderboardFilter }));
  }, [leaderboardFilter]);

  useEffect(() => {
    let alive = true;

    function refreshPreferences() {
      setPreferencesReady(false);
      setDailyPlan(getDailyPlanGames());
      loadUserPreferences()
        .then((preferences) => {
          if (!alive) return;
          setQuests(preferences.quests);
          setFavouriteIds(preferences.favouriteGameIds);
        })
        .catch(() => undefined)
        .finally(() => {
          if (alive) setPreferencesReady(true);
        });
    }

    refreshPreferences();

    if (!canUseWindowEvents()) return () => {
      alive = false;
    };

    window.addEventListener("memoro-user-changed", refreshPreferences);
    return () => {
      alive = false;
      window.removeEventListener("memoro-user-changed", refreshPreferences);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    function refreshVaultProgress() {
      Promise.all([loadMemoryVaultProgress(), loadLatestVaultTreeId()])
        .then(([progress, treeId]) => {
          if (!alive) return;
          setVaultCompletedCount(progress);
          setLatestVaultTreeId(treeId);
        })
        .catch(() => undefined)
        .finally(() => {
          if (alive) setVaultReady(true);
        });
    }

    refreshVaultProgress();

    if (!canUseWindowEvents()) return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshVaultProgress);
    window.addEventListener("memoro-user-changed", refreshVaultProgress);
    window.addEventListener(memoryVaultProgressEventName(), refreshVaultProgress);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshVaultProgress);
      window.removeEventListener("memoro-user-changed", refreshVaultProgress);
      window.removeEventListener(memoryVaultProgressEventName(), refreshVaultProgress);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function refreshResults() {
      try {
        const results = await loadGameResults();
        if (alive) setGameResults(results);
        const nextLeaderboard = await loadLeaderboard(100);
        if (alive) setLeaderboardRows(nextLeaderboard);
      } catch {
        // Keep the cached dashboard visible if remote data is unavailable.
      } finally {
        if (alive) setResultsReady(true);
      }
    }

    refreshResults();

    if (!canUseWindowEvents()) return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshResults);
    window.addEventListener("memoro-results-updated", refreshResults);
    window.addEventListener("memoro-user-changed", refreshResults);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshResults);
      window.removeEventListener("memoro-results-updated", refreshResults);
      window.removeEventListener("memoro-user-changed", refreshResults);
    };
  }, []);

  const gameStats = calculateGameStats(gameResults);
  const latestResult = gameStats.latest;
  const continueProgress = latestResult ? Math.min(100, Math.max(0, latestResult.accuracy)) : 0;
  const today = localDayKey(new Date());
  const todayResults = gameResults.filter((result) => localDayKey(result.createdAt) === today);
  const playedToday = new Set(todayResults.map((result) => result.gameId));
  const favouriteGames = favouriteIds
    .map((id) => GAMES.find((game) => game.id === id))
    .filter(Boolean) as GameConfig[];
  const activeQuests = quests.map((quest) => hydrateQuestProgress(quest, gameStats, todayResults, vaultCompletedCount, gameResults));
  const completedQuestCount = activeQuests.filter((quest) => quest.status === "complete").length;
  const activeQuestState = questStateKey(activeQuests);
  const storedQuestState = questStateKey(quests);
  const rankStatus = questRankStatus(gameStats.totalXp);
  const activeGraphGameId = selectedGraphGameId ?? latestResult?.gameId ?? "numbers-game";
  const graphGame = GAMES.find((game) => game.id === activeGraphGameId) ?? GAMES[0];
  const graphResults = gameResults.filter((result) => result.gameId === activeGraphGameId);
  const graphTimeline = buildPerformanceTimeline(graphResults, graphScale);
  const { graphDataPoints, graphLinePoints, graphLineSegments, plotWidth } = buildGraphGeometry(graphTimeline);
  const focusedGraphResult = graphDataPoints.find((item) => item.id === focusedGraphResultId) ?? graphDataPoints[graphDataPoints.length - 1];
  const graphAxisLabels = buildGraphAxisLabels(graphTimeline, graphScale);
  const dashboardReady = preferencesReady && vaultReady && resultsReady;

  useEffect(() => {
    if (!dashboardReady || activeQuestState === storedQuestState) return;
    setQuests(activeQuests);
    saveUserQuests(activeQuests);
  }, [activeQuestState, activeQuests, dashboardReady, storedQuestState]);

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

  return (
    <DashboardShell
      active="dashboard"
      lightHeader
      title="Dashboard"
      subtitle=""
    >
      {({ isCompact, isMobile, profileName }) => {
        const isNativeApp = Platform.OS !== "web";
        const visibleLeaderboardRows = leaderboardRows.length
          ? leaderboardRows
          : [{
              userId: "local",
              displayName: profileName,
              avatarColor: "#E85D2A",
              avatarImageUri: "",
              xp: gameStats.totalXp,
              resultsCount: gameStats.resultsCount,
              rank: 1,
              you: true,
            }];
        const topLeaderboardRows = visibleLeaderboardRows.slice(0, 3);
        const ownLeaderboardRow = visibleLeaderboardRows.find((row) => row.you);
        const leaderboardModalRows = ownLeaderboardRow
          ? [ownLeaderboardRow, ...visibleLeaderboardRows.filter((row) => row.userId !== ownLeaderboardRow.userId).slice(0, 24)]
          : visibleLeaderboardRows.slice(0, 25);
        const latestVaultCategory = getCategoryConfig(latestVaultTreeId);
        const latestVaultIsMemory = latestVaultCategory.id === "Memory";
        const cardStyle = [s.card, isNativeApp && s.cardApp, isMobile && s.cardMobile];
        const darkCardStyle = [s.card, s.darkCard, isNativeApp && s.darkCardApp, isMobile && s.cardMobile];

        return (
        <View style={s.contentFadeIn}>
          {/* Hero card — greeting, progress pills, Start Training, and rank */}
          <View style={[s.heroCard, isMobile && s.heroCardMobile]}>
            <View style={s.heroLeft}>
              <Text style={[s.heroGreeting, isMobile && s.heroGreetingMobile]}>Good training, {profileName}</Text>
              <Text style={s.heroSubtitle}>{todayLabel()} · You are on a {gameStats.streakDays}-day streak. Keep it up.</Text>
              <View style={s.heroPillRow}>
                <View style={s.heroPill}>
                  <Text style={s.heroPillText}>{completedQuestCount} / {activeQuests.length} quests cleared</Text>
                </View>
                <View style={[s.heroPill, s.heroPillAccent]}>
                  <View style={s.heroPillAccentDot} />
                  <Text style={s.heroPillAccentText}>Adaptive</Text>
                </View>
              </View>
              <TouchableOpacity style={s.heroStartBtn} onPress={() => router.push("/games" as any)}>
                <Feather name="play" size={15} color="#FFFFFF" />
                <Text style={s.heroStartText}>Start Training</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.rankCard, isMobile && s.rankCardMobile]}>
              <View style={s.rankTopRow}>
                <Text style={s.rankLabel}>Rank</Text>
                <Text style={s.rankXp}>{gameStats.totalXp.toLocaleString("en-GB")} <Text style={s.rankXpUnit}>/ {rankStatus.next.xp.toLocaleString("en-GB")}</Text></Text>
              </View>
              <Text style={s.rankName}>{rankStatus.current.name}</Text>
              <ProgressBar value={rankStatus.progress} />
              <View style={s.rankToNextRow}>
                <Text style={s.rankToNextLabel}>XP to next</Text>
                <Text style={s.rankToNextValue}>{Math.max(0, rankStatus.next.xp - gameStats.totalXp).toLocaleString("en-GB")} XP</Text>
              </View>
            </View>
          </View>

          {/* System Quests — 2×2 grid */}
          <View style={[s.questsSection, isMobile && s.questsSectionMobile]}>
            <View style={s.questsSectionHead}>
              <SectionLabel>System Quests</SectionLabel>
              <Text style={s.questsClearedText}>{completedQuestCount}/{activeQuests.length} cleared</Text>
            </View>
            <View style={s.questGrid}>
              {activeQuests.map((quest) => {
                const progress = questProgressPercent(quest);
                const complete = quest.status === "complete";
                return (
                  <View key={quest.id} style={[s.questGridCard, complete && s.questGridCardComplete]}>
                    <View style={s.questCardHead}>
                      <View style={[s.questIcon, isNativeApp && s.questIconApp]}>
                        {complete ? <Feather name="check" size={15} color="#FFFFFF" /> : <Feather name="activity" size={15} color={isNativeApp ? "#0F7EA8" : "#E85D2A"} />}
                      </View>
                      <View style={s.questCardHeadText}>
                        <Text style={s.questKicker}>{quest.type} · +{quest.xpReward} XP</Text>
                        <Text style={[s.questTitle, isMobile && s.questTitleMobile]}>{quest.title}</Text>
                      </View>
                      <View style={[s.questBadge, complete && s.questBadgeComplete]}>
                        <Text style={[s.questBadgeText, complete && s.questBadgeTextComplete]}>{complete ? "Logged" : quest.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={s.questDescription}>{quest.description}</Text>
                    <View style={s.questCardPtsRow}>
                      <Text style={s.questCardPts}>{questProgressLabel(quest)}</Text>
                      <Text style={s.questCardPctText}>{progress}% complete</Text>
                    </View>
                    <ProgressBar value={progress} />
                    <Text style={s.questCardFooter}>{quest.systemMessage}</Text>
                  </View>
                );
              })}
            </View>
            <View style={s.questNotice}>
              <Text style={s.questNoticeText}>The system calibrates targets slightly above your current baseline once per day.</Text>
            </View>
          </View>

          <View style={[s.grid, isCompact && s.gridCompact, isMobile && s.gridMobile]}>
            <View style={[s.mainColumn, isMobile && s.mainColumnMobile]}>

              <View style={cardStyle}>
                <SectionLabel>Favourite Games</SectionLabel>
                {favouriteGames.length ? (
                <View style={[s.favGrid, isMobile && s.favGridMobile]}>
                  {favouriteGames.slice(0, 3).map((game) => {
                    const category = getCategoryConfig(game.category);
                    return (
                    <TouchableOpacity key={game.id} style={[s.favItem, isNativeApp && s.favItemApp]} onPress={() => router.push(`/game/${game.id}` as any)}>
                      <View style={[s.favIcon, { backgroundColor: `${game.color}18` }]}>
                        <Text style={s.taskEmoji}>{category.emoji}</Text>
                      </View>
                      <Text style={s.favText}>{game.title}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
                ) : (
                  <View style={s.favEmpty}>
                    <Feather name="heart" size={17} color="#9E9E9E" />
                    <Text style={s.favEmptyText}>No favourite games selected.</Text>
                  </View>
                )}
              </View>

            </View>

            <View style={[s.sideColumn, isMobile && s.sideColumnMobile]}>
              {!isNativeApp && <View style={darkCardStyle}>
                <SectionLabel>Progress Snapshot</SectionLabel>
                <View style={[s.statGrid, isMobile && s.statGridMobile]}>
                  <StatCard label="Streak" value={String(gameStats.streakDays)} icon="🔥" style={isMobile && s.statMiniMobile} />
                  <StatCard label="XP Earned" value={gameStats.totalXp.toLocaleString("en-GB")} icon="✨" style={isMobile && s.statMiniMobile} />
                  <StatCard label="Best Recall" value={String(gameStats.bestNumbers)} icon="🧠" style={isMobile && s.statMiniMobile} />
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
                <Text style={[s.chartLabel, s.chartLabelTrend, s.darkMutedText]}>Accuracy trend - last 7 attempts</Text>
                <View style={s.chart}>
                  {(gameResults.length ? gameResults.slice(0, 7).reverse().map((result) => result.accuracy) : [0, 0, 0, 0, 0, 0, 0]).map((value, index) => (
                    <View key={index} style={s.chartColumn}>
                      <View style={[s.chartBar, { height: `${value}%` as any, backgroundColor: index === 6 ? "#E85D2A" : "#DADADA" }]} />
                      <Text style={[s.chartDay, index === 6 && s.chartDayActive]}>{index + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>}

            </View>

            {!isNativeApp && <View style={[s.card, s.darkCard, s.performanceCard, isMobile && s.cardMobile, isMobile && s.performanceCardMobile]}>
              <View style={[s.cardHeader, isMobile && s.cardHeaderMobile]}>
                <View>
                  <SectionLabel>Performance Graph</SectionLabel>
                  <Text style={[s.cardTitle, s.darkCardTitle]}>Points per second by game</Text>
                </View>
                {focusedGraphResult && (
                  <View style={[s.performanceScorePill, isMobile && s.performanceScorePillMobile]}>
                    <Text style={s.performanceScore}>{focusedGraphResult.pointsPerSecond.toFixed(2)}</Text>
                    <Text style={s.performanceScoreLabel}>points/sec</Text>
                  </View>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[s.graphSelector, isMobile && s.graphSelectorMobile]}
                contentContainerStyle={[s.graphSelectorContent, isMobile && s.graphSelectorContentMobile]}
              >
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
              <View style={[s.timeScaleRow, isMobile && s.timeScaleRowMobile]}>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[s.graphChartScroll, isMobile && s.graphChartScrollMobile]}
                contentContainerStyle={[s.graphChartScrollContent, isMobile && s.graphChartScrollContentMobile]}
              >
                <View
                  style={[s.graphLineChart, isMobile && s.graphLineChartMobile, graphSelected && s.graphLineChartSelected]}
                  {...({
                    onClick: () => setGraphSelected(true),
                    onPointerDown: () => setGraphSelected(true),
                    onWheel: handleGraphWheel,
                    onWheelCapture: handleGraphWheel,
                  } as any)}
                >
                  <View style={s.graphLineGrid} />
                  <View style={[s.graphTodayMarker, { left: GRAPH_PADDING.left + plotWidth }]} />
                  <Text style={[s.graphTodayLabel, isMobile && s.graphTodayLabelMobile, { left: GRAPH_PADDING.left + plotWidth }]}>
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
                    <Text key={label.id} style={[s.graphAxisLabel, isMobile && s.graphAxisLabelMobile, { left: label.left }]}>{label.label}</Text>
                  ))}
                  {!graphLinePoints.length && (
                    <View style={s.graphEmptyState}>
                      <Text style={s.graphEmptyTitle}>No score history yet</Text>
                      <Text style={s.graphDetailText}>Play {graphGame.title} to start drawing your points/sec line.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={[s.graphDetailPanelWide, isMobile && s.graphDetailPanelWideMobile]}>
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
            </View>}
          </View>

          {!isNativeApp && <Modal transparent visible={leaderboardOpen} animationType="fade" onRequestClose={() => setLeaderboardOpen(false)}>
            <View style={s.modalRoot}>
              <TouchableOpacity activeOpacity={1} style={s.modalScrim} onPress={() => setLeaderboardOpen(false)} />
              <View style={[s.leaderboardModalCard, isMobile && s.leaderboardModalCardMobile]}>
                <View style={s.modalHeader}>
                  <View>
                    <Text style={[s.modalTitle, s.leaderboardModalTitle]}>Leaderboard</Text>
                    <Text style={s.leaderboardModalSub}>Your position is pinned first, followed by the top XP ranks.</Text>
                  </View>
                  <TouchableOpacity style={s.modalClose} onPress={() => setLeaderboardOpen(false)}>
                    <Feather name="x" size={16} color="#121212" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={s.leaderboardModalList} contentContainerStyle={s.leaderboardModalListContent} showsVerticalScrollIndicator={false}>
                  {leaderboardModalRows.map((row) => <LeaderboardRow key={`modal-${row.rank}-${row.userId}`} row={row} isMobile={isMobile} showLevel />)}
                </ScrollView>
              </View>
            </View>
          </Modal>}

        </View>
        );
      }}
    </DashboardShell>
  );
}
