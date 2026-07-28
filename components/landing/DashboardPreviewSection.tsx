import { View, Text, useWindowDimensions } from "react-native";
import { dash as ds } from "./DashboardPreviewSection.styles";
import { useInViewOnce } from "./useInViewOnce";

// ── Dashboard Preview ─────────────────────────────────────────────────────────
const CHART_VALS = [45, 52, 48, 60, 58, 70, 67, 80, 75, 88, 85, 94];
const LAST_BAR   = CHART_VALS.length - 1;
const QUESTS = [
  { label: "Precision Protocol",    pct: 85 },
  { label: "Memory Extension Trial", pct: 62 },
  { label: "Archive Link",          pct: 44 },
];
const STATS = [
  { label: "Memory Digits", val: "17",    note: "↑ from 12", icon: "🧠" },
  { label: "Day Streak",    val: "23",    note: "days",       icon: "🔥" },
  { label: "XP Earned",     val: "1,840", note: "xp",         icon: "✨" },
  { label: "Exercises",     val: "312",   note: "total",      icon: "✅" },
];

export default function DashboardPreviewSection() {
  const { width } = useWindowDimensions();
  const animated = useInViewOnce("dashboard-section");
  const isMobile = width < 700;
  const isTablet = width < 980;

  return (
    <View nativeID="dashboard-section" style={[ds.section, isMobile && ds.sectionMobile]}>
      <View style={ds.inner}>
        <View style={[ds.head, isMobile && ds.headMobile]}>
          <Text style={ds.eyebrow}>Progress Dashboard</Text>
          <Text style={[ds.h2, isMobile && ds.h2Mobile]}>Watch yourself improve</Text>
        </View>
        <View style={[ds.panel, isMobile && ds.panelMobile]}>
          <View style={[ds.statsGrid, isTablet && ds.statsGridTablet, isMobile && ds.statsGridMobile]}>
            {STATS.map((s) => (
              <View key={s.label} style={[ds.statCard, isMobile && ds.statCardMobile]}>
                <View style={ds.statHeader}>
                  <Text style={ds.statLabel}>{s.label}</Text>
                  <Text style={ds.statIconText}>{s.icon}</Text>
                </View>
                <Text style={ds.statNum}>{s.val}</Text>
                <Text style={ds.statNote}>{s.note}</Text>
              </View>
            ))}
          </View>
          <View style={[ds.chartsGrid, isMobile && ds.chartsGridMobile]}>
            <View style={[ds.chartCard, isMobile && ds.chartCardMobile]}>
              <Text style={ds.chartLabel}>Memory Score — Last 12 Sessions</Text>
              <View style={ds.chartBars}>
                {CHART_VALS.map((v, i) => (
                  <View key={i} style={[i === LAST_BAR ? ds.chartBarLast : ds.chartBarBase, { height: animated ? `${v}%` as any : "0%", transition: `height 0.6s ${(i * 0.04).toFixed(2)}s ease` as any }]} />
                ))}
              </View>
              <View style={ds.chartFooter}>
                <Text style={ds.chartFooterLabel}>Session 1</Text>
                <Text style={ds.chartFooterGold}>↑ +49 pts</Text>
              </View>
            </View>
            <View style={[ds.chartCard, isMobile && ds.chartCardMobile]}>
              <Text style={ds.goalsLabel}>Active Quests</Text>
              {QUESTS.map((g, i) => (
                <View key={g.label} style={i < QUESTS.length - 1 ? ds.goalRow : ds.goalRowLast}>
                  <View style={ds.goalHeader}>
                    <Text style={ds.goalTitle}>{g.label}</Text>
                    <Text style={ds.goalPct}>{g.pct}%</Text>
                  </View>
                  <View style={ds.goalTrack}>
                    <View style={[ds.goalFill, { width: animated ? `${g.pct}%` as any : "0%", transition: `width 0.8s ${(i * 0.15 + 0.3).toFixed(2)}s ease` as any }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
