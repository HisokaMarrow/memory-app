import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import DashboardShell from "../components/dashboard/DashboardShell";
import { buildPerformanceTimeline, pointsForResult } from "../components/dashboard/performanceGraphModel";
import { calculateGameStats, loadLeaderboard, refreshGameResultsFromSupabase, type LeaderboardEntry, type StoredGameResult } from "../components/games/resultsStore";
import { C } from "../styles/tokens";
import { dashboard as s } from "../styles/screens/dashboard.styles";

function StatTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={app.statTile}>
      <Feather name={icon as any} size={16} color={C.orange} />
      <Text style={app.statValue}>{value}</Text>
      <Text style={app.statLabel}>{label}</Text>
    </View>
  );
}

function LeaderRow({ row }: { row: LeaderboardEntry }) {
  return (
    <View style={[app.leaderRow, row.you && app.leaderRowYou]}>
      <View style={[app.rankDot, row.rank === 1 && app.rankGold, row.rank === 2 && app.rankSilver, row.rank === 3 && app.rankBronze]}>
        <Text style={app.rankText}>{row.rank}</Text>
      </View>
      <View style={app.leaderCopy}>
        <Text style={app.leaderName}>{row.displayName}{row.you ? "  you" : ""}</Text>
        <Text style={app.leaderMeta}>{row.resultsCount} sessions</Text>
      </View>
      <Text style={app.leaderXp}>{row.xp.toLocaleString("en-GB")} XP</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const [results, setResults] = useState<StoredGameResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      const [nextResults, nextLeaderboard] = await Promise.all([
        refreshGameResultsFromSupabase(),
        loadLeaderboard(30),
      ]);
      if (!alive) return;
      setResults(nextResults);
      setLeaderboard(nextLeaderboard);
    }
    refresh();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => calculateGameStats(results), [results]);
  const week = useMemo(() => buildPerformanceTimeline(results, "week"), [results]);
  const peak = Math.max(1, ...week.map((item) => item.points));
  const accuracyTrend = results.length ? results.slice(0, 7).reverse().map((result) => result.accuracy) : [0, 0, 0, 0, 0, 0, 0];
  const latest = results[0];
  const ownRow = leaderboard.find((row) => row.you);
  const visibleRows = ownRow
    ? [ownRow, ...leaderboard.filter((row) => !row.you).slice(0, 3)]
    : leaderboard.slice(0, 3);

  return (
    <DashboardShell
      active="insights"
      title="Progress"
      subtitle="Snapshot, graph, and leaderboard in one place."
    >
      {({ isMobile }) => (
        <View style={[s.grid, s.gridCompact, isMobile && s.gridMobile]}>
          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <View style={app.sectionHeader}>
              <View>
                <Text style={app.eyebrow}>Progress snapshot</Text>
                <Text style={app.title}>Training pulse</Text>
              </View>
              <Feather name="trending-up" size={22} color={C.orange} />
            </View>

            <View style={app.statsGrid}>
              <StatTile label="Streak" value={`${stats.streakDays}d`} icon="zap" />
              <StatTile label="XP earned" value={stats.totalXp.toLocaleString("en-GB")} icon="star" />
              <StatTile label="Best recall" value={String(stats.bestNumbers)} icon="award" />
            </View>

            <Text style={app.subLabel}>Weekly streak</Text>
            <View style={app.weekRow}>
              {stats.weekActivity.map((day) => (
                <View key={day.key} style={app.weekDay}>
                  <View style={[app.weekDot, day.active && app.weekDotActive, day.isToday && app.weekDotToday]}>
                    {day.active && <Feather name="check" size={11} color={C.white} />}
                  </View>
                  <Text style={[app.weekLabel, day.isToday && app.weekLabelToday]}>{day.label}</Text>
                </View>
              ))}
            </View>

            <Text style={app.subLabel}>Accuracy trend</Text>
            <View style={app.accuracyRow}>
              {accuracyTrend.map((value, index) => (
                <View key={`${index}-${value}`} style={app.accuracyColumn}>
                  <View style={[app.accuracyBar, { height: `${Math.max(6, value)}%` as any }, index === accuracyTrend.length - 1 && app.accuracyBarLatest]} />
                </View>
              ))}
            </View>
          </View>

          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <View style={app.sectionHeader}>
              <View>
                <Text style={app.eyebrow}>Performance graph</Text>
                <Text style={app.title}>This week</Text>
              </View>
              <View style={app.scorePill}>
                <Text style={app.scoreText}>{latest ? pointsForResult(latest) : 0}</Text>
                <Text style={app.scoreLabel}>latest pts</Text>
              </View>
            </View>

            <View style={app.chart}>
              {week.map((point) => {
                const height = 12 + Math.round((point.points / peak) * 118);
                return (
                  <View key={point.id} style={app.barSlot}>
                    <View style={[app.bar, point.hasData && app.barActive, { height }]} />
                    <Text style={app.barLabel}>{point.label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={app.statsGrid}>
              <StatTile label="Sessions" value={String(stats.resultsCount)} icon="activity" />
              <StatTile label="Accuracy" value={`${stats.averageAccuracy}%`} icon="target" />
              <StatTile label="Streak" value={`${stats.streakDays}d`} icon="zap" />
            </View>
          </View>

          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <View style={app.sectionHeader}>
              <View>
                <Text style={app.eyebrow}>Leaderboard</Text>
                <Text style={app.title}>XP ranking</Text>
              </View>
              <Feather name="award" size={22} color={C.orange} />
            </View>

            <View style={app.leaderList}>
              {visibleRows.length ? (
                visibleRows.map((row) => <LeaderRow key={`${row.rank}-${row.userId}`} row={row} />)
              ) : (
                <View style={app.emptyPanel}>
                  <Text style={app.emptyTitle}>No leaderboard yet</Text>
                  <Text style={app.emptyText}>Play a game to create your first XP entry.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}

const app = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  eyebrow: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.orange,
  },
  title: {
    marginTop: 4,
    fontFamily: "Cormorant Garamond, Georgia, serif",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: C.white,
  },
  scorePill: {
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(232,93,42,0.28)",
    backgroundColor: "rgba(232,93,42,0.10)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreText: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 19, fontWeight: "900", color: C.orange },
  scoreLabel: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 10, fontWeight: "800", color: C.mutedInverse, textTransform: "uppercase" },
  chart: {
    minHeight: 178,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  barSlot: { flex: 1, alignItems: "center", gap: 8 },
  bar: { width: "100%", maxWidth: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  barActive: { backgroundColor: C.orange },
  barLabel: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 10, fontWeight: "800", color: C.mutedInverse },
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  statTile: {
    flex: 1,
    minHeight: 92,
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
  },
  statValue: { fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, lineHeight: 30, fontWeight: "700", color: C.white },
  statLabel: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 10, fontWeight: "800", color: C.mutedInverse, textTransform: "uppercase" },
  subLabel: {
    marginTop: 16,
    marginBottom: 10,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: C.mutedInverse,
    textTransform: "uppercase",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  weekDay: { alignItems: "center", gap: 7 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  weekDotActive: { backgroundColor: C.orange, borderColor: C.orange },
  weekDotToday: { borderColor: C.white },
  weekLabel: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 10, fontWeight: "800", color: C.mutedInverse },
  weekLabelToday: { color: C.white },
  accuracyRow: {
    height: 96,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accuracyColumn: { flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center" },
  accuracyBar: { width: "100%", maxWidth: 24, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)" },
  accuracyBarLatest: { backgroundColor: C.orange },
  leaderList: { gap: 10 },
  leaderRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  leaderRowYou: { borderColor: "rgba(232,93,42,0.42)", backgroundColor: "rgba(232,93,42,0.10)" },
  rankDot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#2A2A2A" },
  rankGold: { backgroundColor: "#E85D2A" },
  rankSilver: { backgroundColor: "#4A4A4A" },
  rankBronze: { backgroundColor: "#7A4B32" },
  rankText: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 13, fontWeight: "900", color: C.white },
  leaderCopy: { flex: 1, minWidth: 0 },
  leaderName: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 14, fontWeight: "900", color: C.white },
  leaderMeta: { marginTop: 3, fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 11, color: C.mutedInverse },
  leaderXp: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, fontWeight: "900", color: C.orange },
  emptyPanel: { borderWidth: 1, borderColor: C.borderGreen, backgroundColor: "#202020", borderRadius: 16, padding: 16 },
  emptyTitle: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 14, fontWeight: "900", color: C.white },
  emptyText: { marginTop: 4, fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, lineHeight: 18, color: C.mutedInverse },
});
