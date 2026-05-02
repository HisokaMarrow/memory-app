import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { dash as ds } from "./DashboardPreviewSection.styles";

// ── Dashboard Preview ─────────────────────────────────────────────────────────
const CHART_VALS = [45, 52, 48, 60, 58, 70, 67, 80, 75, 88, 85, 94];
const LAST_BAR   = CHART_VALS.length - 1;
const GOALS = [
  { label: "Memorise 20 digits",   pct: 85 },
  { label: "Mental Maths Level 5", pct: 62 },
  { label: "500 Vocabulary Words", pct: 44 },
];
const STATS = [
  { label: "Memory Digits", val: "17",    note: "↑ from 12", icon: "🧠" },
  { label: "Day Streak",    val: "23",    note: "days",       icon: "🔥" },
  { label: "XP Earned",     val: "1,840", note: "xp",         icon: "✨" },
  { label: "Exercises",     val: "312",   note: "total",      icon: "✅" },
];

export default function DashboardPreviewSection() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const el = document.getElementById("dashboard-section");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <View nativeID="dashboard-section" style={ds.section}>
      <View style={ds.inner}>
        <View style={ds.head}>
          <Text style={ds.eyebrow}>Progress Dashboard</Text>
          <Text style={ds.h2}>Watch yourself improve</Text>
        </View>
        <View style={ds.panel}>
          <View style={ds.statsGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={ds.statCard}>
                <View style={ds.statHeader}>
                  <Text style={ds.statLabel}>{s.label}</Text>
                  <Text style={ds.statIconText}>{s.icon}</Text>
                </View>
                <Text style={ds.statNum}>{s.val}</Text>
                <Text style={ds.statNote}>{s.note}</Text>
              </View>
            ))}
          </View>
          <View style={ds.chartsGrid}>
            <View style={ds.chartCard}>
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
            <View style={ds.chartCard}>
              <Text style={ds.goalsLabel}>Active Goals</Text>
              {GOALS.map((g, i) => (
                <View key={g.label} style={i < GOALS.length - 1 ? ds.goalRow : ds.goalRowLast}>
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
