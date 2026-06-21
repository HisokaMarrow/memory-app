import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";

import DashboardShell from "../components/dashboard/DashboardShell";
import { calculateGameStats, clearActiveResultsUser, refreshGameResultsFromSupabase, type StoredGameResult } from "../components/games/resultsStore";
import { supabase } from "../lib/supabase";
import { C } from "../styles/tokens";
import { dashboard as s } from "../styles/screens/dashboard.styles";

const AVATAR_COLORS = ["#E85D2A", "#121212", "#5B5BD6", "#2A9D8F", "#CD7F32"] as const;

function ProfileStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={app.statCard}>
      <Feather name={icon as any} size={17} color={C.orange} />
      <Text style={app.statValue}>{value}</Text>
      <Text style={app.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<StoredGameResult[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(C.orange);
  const [avatarImageUri, setAvatarImageUri] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "bad">("ok");

  useEffect(() => {
    let alive = true;
    async function refresh() {
      const [{ data }, nextResults] = await Promise.all([
        supabase.auth.getUser(),
        refreshGameResultsFromSupabase(),
      ]);
      if (!alive) return;

      const nextUser = data.user ?? null;
      const metadata = nextUser?.user_metadata ?? {};
      const nextName = metadata.full_name || metadata.name || nextUser?.email?.split("@")[0] || "Athlete";
      setUser(nextUser);
      setResults(nextResults);
      setDisplayName(nextName);
      setEmail(nextUser?.email ?? "");
      setSelectedColor(metadata.avatar_color || C.orange);
      setAvatarImageUri(metadata.avatar_image_uri || "");
    }
    refresh();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => calculateGameStats(results), [results]);
  const initial = (displayName || user?.email || "A").slice(0, 1).toUpperCase();

  function showMessage(text: string, type: "ok" | "bad" = "ok") {
    setMessage(text);
    setMessageType(type);
  }

  async function saveProfile() {
    const cleanName = displayName.trim();
    if (!cleanName) {
      showMessage("Please choose a display name.", "bad");
      return;
    }

    setSavingProfile(true);
    try {
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: cleanName, avatar_color: selectedColor, avatar_image_uri: avatarImageUri },
        });
        if (error) {
          showMessage(error.message, "bad");
          return;
        }

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: cleanName,
          avatar_color: selectedColor,
          avatar_image_uri: avatarImageUri,
          updated_at: new Date().toISOString(),
        });
        if (profileError) {
          showMessage(profileError.message, "bad");
          return;
        }
      }

      showMessage("Profile updated.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAccount() {
    const cleanEmail = email.trim().toLowerCase();
    const updates: { email?: string; password?: string } = {};

    if (cleanEmail && cleanEmail !== user?.email) {
      if (!cleanEmail.includes("@")) {
        showMessage("Please enter a valid email address.", "bad");
        return;
      }
      updates.email = cleanEmail;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        showMessage("Password must be at least 6 characters.", "bad");
        return;
      }
      updates.password = newPassword;
    }

    if (!updates.email && !updates.password) {
      showMessage("Nothing to update yet.", "bad");
      return;
    }

    if (!user) {
      showMessage("Sign in before changing account details.", "bad");
      return;
    }

    setSavingAccount(true);
    try {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        showMessage(error.message, "bad");
        return;
      }
      setNewPassword("");
      showMessage(updates.email ? "Check your inbox to confirm the email change." : "Account updated.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function signOut() {
    clearActiveResultsUser();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/");
  }

  return (
    <DashboardShell
      active="profile"
      title="Profile"
      subtitle="Profile, account settings, and app help."
    >
      {({ isMobile }) => (
        <View style={[s.grid, s.gridCompact, isMobile && s.gridMobile]}>
          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <View style={app.profileHero}>
              <View style={[app.avatar, { backgroundColor: selectedColor }]}>
                {avatarImageUri ? (
                  <Image source={{ uri: avatarImageUri }} style={app.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={app.avatarText}>{initial}</Text>
                )}
              </View>
              <View style={app.profileCopy}>
                <Text style={app.eyebrow}>Memoro profile</Text>
                <Text style={app.name}>{displayName || "Athlete"}</Text>
                <Text style={app.email}>{user?.email ?? "Signed in athlete"}</Text>
              </View>
            </View>

            <View style={app.statGrid}>
              <ProfileStat label="Sessions" value={String(stats.resultsCount)} icon="activity" />
              <ProfileStat label="Streak" value={`${stats.streakDays}d`} icon="zap" />
              <ProfileStat label="Best digits" value={String(stats.bestDigits)} icon="hash" />
            </View>
          </View>

          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <Text style={app.eyebrow}>Profile</Text>
            <Text style={app.sectionTitle}>Identity</Text>
            <Text style={app.bodyText}>Change how your name and avatar appear across the app.</Text>

            <Text style={app.label}>Display name</Text>
            <TextInput style={app.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="rgba(255,255,255,0.38)" />

            <Text style={app.label}>Avatar colour</Text>
            <View style={app.colorRow}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  accessibilityLabel={`Use avatar colour ${color}`}
                  style={[app.colorSwatch, { backgroundColor: color }, selectedColor === color && app.colorSwatchActive]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={app.infoPanel}>
              <Feather name="image" size={16} color={C.orange} />
              <Text style={app.infoText}>Custom icon upload is available on web. Native media picker comes next.</Text>
            </View>

            <TouchableOpacity style={[app.actionButton, savingProfile && app.actionButtonDisabled]} onPress={saveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color={C.white} /> : <Feather name="save" size={16} color={C.white} />}
              <Text style={app.actionText}>Save profile</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <Text style={app.eyebrow}>Account</Text>
            <Text style={app.sectionTitle}>Security</Text>
            <Text style={app.bodyText}>Update your email or set a new password for your Supabase account.</Text>

            <Text style={app.label}>Email</Text>
            <TextInput style={app.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,0.38)" autoCapitalize="none" keyboardType="email-address" />

            <Text style={app.label}>New password</Text>
            <TextInput style={app.input} value={newPassword} onChangeText={setNewPassword} placeholder="Leave blank to keep current" placeholderTextColor="rgba(255,255,255,0.38)" secureTextEntry />

            <TouchableOpacity style={[app.actionButton, savingAccount && app.actionButtonDisabled]} onPress={saveAccount} disabled={savingAccount}>
              {savingAccount ? <ActivityIndicator color={C.white} /> : <Feather name="shield" size={16} color={C.white} />}
              <Text style={app.actionText}>Update account</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.card, s.darkCard, isMobile && s.cardMobile]}>
            <Text style={app.eyebrow}>Help</Text>
            <Text style={app.sectionTitle}>App notes</Text>
            {[
              ["Training", "Start with Quick Resume or the Games tab when you want a fast session."],
              ["Quests", "Daily quests calibrate slightly above your current baseline."],
              ["Account", "Email changes may require inbox confirmation before they apply."],
            ].map(([title, text]) => (
              <View key={title} style={app.helpItem}>
                <Feather name="check-circle" size={16} color={C.orange} />
                <View style={app.helpCopy}>
                  <Text style={app.helpTitle}>{title}</Text>
                  <Text style={app.helpText}>{text}</Text>
                </View>
              </View>
            ))}

            {!!message && (
              <View style={[app.message, messageType === "bad" && app.messageBad]}>
                <Text style={app.messageText}>{message}</Text>
              </View>
            )}

            <TouchableOpacity style={[app.actionButton, app.signOutButton]} onPress={signOut}>
              <Feather name="log-out" size={16} color={C.orange} />
              <Text style={[app.actionText, app.signOutText]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}

const app = StyleSheet.create({
  profileHero: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 28, fontWeight: "900", color: C.white },
  profileCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.orange,
  },
  name: {
    marginTop: 4,
    fontFamily: "Cormorant Garamond, Georgia, serif",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: C.white,
  },
  email: { marginTop: 4, fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 13, color: C.mutedInverse },
  statGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    minHeight: 94,
    borderWidth: 1,
    borderColor: C.borderGreen,
    borderRadius: 16,
    backgroundColor: "#202020",
    padding: 12,
    justifyContent: "space-between",
  },
  statValue: { fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 25, lineHeight: 29, fontWeight: "700", color: C.white },
  statLabel: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 10, fontWeight: "800", color: C.mutedInverse, textTransform: "uppercase" },
  sectionTitle: {
    marginTop: 4,
    fontFamily: "Cormorant Garamond, Georgia, serif",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: C.white,
  },
  bodyText: {
    marginTop: 8,
    marginBottom: 16,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 13,
    lineHeight: 20,
    color: C.mutedInverse,
  },
  label: {
    marginTop: 12,
    marginBottom: 7,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: C.mutedInverse,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: C.borderGreen,
    borderRadius: 16,
    backgroundColor: "#202020",
    paddingHorizontal: 14,
    color: C.white,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 15,
  },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  colorSwatchActive: { borderColor: C.white },
  infoPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: "#202020",
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, lineHeight: 18, color: C.mutedInverse },
  actionButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: C.orange,
    marginTop: 14,
  },
  actionButtonDisabled: { opacity: 0.5 },
  signOutButton: { backgroundColor: "rgba(232,93,42,0.10)", borderWidth: 1, borderColor: "rgba(232,93,42,0.28)" },
  actionText: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 14, fontWeight: "900", color: C.white },
  signOutText: { color: C.orange },
  helpItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 14 },
  helpCopy: { flex: 1, minWidth: 0 },
  helpTitle: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 13, fontWeight: "900", color: C.white },
  helpText: { marginTop: 3, fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, lineHeight: 18, color: C.mutedInverse },
  message: {
    borderWidth: 1,
    borderColor: "rgba(42,157,143,0.32)",
    backgroundColor: "rgba(42,157,143,0.12)",
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  messageBad: { borderColor: "rgba(232,93,42,0.34)", backgroundColor: "rgba(232,93,42,0.12)" },
  messageText: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, fontWeight: "800", color: C.white },
});
