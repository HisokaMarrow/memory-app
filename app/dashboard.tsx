import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

const GAMES = [
  { id: "number-memory", label: "Number Memory", icon: "🔢", desc: "Memorise digit sequences", category: "Memory" },
  { id: "word-builder", label: "Word Builder", icon: "🔤", desc: "Build words from a single word", category: "Linguistics" },
  { id: "math-sprint", label: "Math Sprint", icon: "⚡", desc: "Fast arithmetic under pressure", category: "Math" },
];

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [streak] = useState(1);
  const [today] = useState({ done: 0, total: 3 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      setEmail(user.email ?? "");
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good training,</Text>
          <Text style={s.userLine}>{email.split("@")[0] || "athlete"}</Text>
        </View>
        <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Streak + progress */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{streak}</Text>
          <Text style={s.statLabel}>Day streak 🔥</Text>
        </View>
        <View style={[s.statCard, s.statCardWide]}>
          <Text style={s.statNum}>{today.done}<Text style={s.statNumSub}>/{today.total}</Text></Text>
          <Text style={s.statLabel}>Today's sessions</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(today.done / today.total) * 100}%` as any }]} />
          </View>
        </View>
      </View>

      {/* Today's training CTA */}
      <TouchableOpacity style={s.trainingCTA} onPress={() => Alert.alert("Coming soon", "Games are being built.")}>
        <View>
          <Text style={s.ctaLabel}>TODAY'S TRAINING</Text>
          <Text style={s.ctaTitle}>Start 5-min session</Text>
          <Text style={s.ctaSub}>Memory · Math · Words</Text>
        </View>
        <View style={s.ctaArrow}>
          <Text style={s.ctaArrowText}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Games */}
      <Text style={s.sectionTitle}>Games</Text>
      <View style={s.gameGrid}>
        {GAMES.map(g => (
          <TouchableOpacity
            key={g.id}
            style={s.gameCard}
            onPress={() => Alert.alert("Coming soon", `${g.label} is being built.`)}
          >
            <Text style={s.gameIcon}>{g.icon}</Text>
            <Text style={s.gameCat}>{g.category}</Text>
            <Text style={s.gameName}>{g.label}</Text>
            <Text style={s.gameDesc}>{g.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vault teaser */}
      <TouchableOpacity style={s.vaultCard} onPress={() => Alert.alert("Coming soon", "The Vault is being built.")}>
        <View style={s.vaultLeft}>
          <Text style={s.vaultPill}>VAULT</Text>
          <Text style={s.vaultTitle}>Memory Techniques</Text>
          <Text style={s.vaultSub}>Learn the methods. Train them. Master them.</Text>
        </View>
        <Text style={s.vaultGlyph}>◆</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 48 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 28,
  },
  greeting: { fontSize: 14, color: "#6B7280", marginBottom: 2 },
  userLine: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  signOutBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  signOutText: { color: "#6B7280", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18, padding: 18,
  },
  statCardWide: { flex: 2 },
  statNum: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 },
  statNumSub: { fontSize: 18, fontWeight: "600", color: "#4B5563" },
  statLabel: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
  progressBar: {
    height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#4ADE80", borderRadius: 2 },

  trainingCTA: {
    backgroundColor: "#4ADE80", borderRadius: 20,
    padding: 24, marginBottom: 32,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  ctaLabel: { fontSize: 11, fontWeight: "700", color: "#16A34A", letterSpacing: 2, marginBottom: 4 },
  ctaTitle: { fontSize: 20, fontWeight: "800", color: "#0A0A0A", marginBottom: 2 },
  ctaSub: { fontSize: 13, color: "rgba(0,0,0,0.55)" },
  ctaArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  ctaArrowText: { fontSize: 18, color: "#0A0A0A" },

  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#FFFFFF",
    marginBottom: 14,
  },
  gameGrid: { gap: 12, marginBottom: 24 },
  gameCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18, padding: 20,
  },
  gameIcon: { fontSize: 28, marginBottom: 10 },
  gameCat: { fontSize: 11, fontWeight: "700", color: "#4ADE80", letterSpacing: 2, marginBottom: 4 },
  gameName: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  gameDesc: { fontSize: 13, color: "#6B7280" },

  vaultCard: {
    backgroundColor: "rgba(251,191,36,0.07)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.15)",
    borderRadius: 20, padding: 24,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  vaultLeft: { flex: 1 },
  vaultPill: { fontSize: 11, fontWeight: "700", color: "#FBBF24", letterSpacing: 2, marginBottom: 6 },
  vaultTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  vaultSub: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  vaultGlyph: { fontSize: 32, color: "#FBBF24", opacity: 0.4 },
});
