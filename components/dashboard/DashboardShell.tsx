import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { calculateGameStats, loadGameResults } from "../games/resultsStore";
import { dashboard as s } from "../../styles/screens/dashboard.styles";
import DashboardFooter from "./DashboardFooter";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar, { type DashboardNavId } from "./DashboardSidebar";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

type ShellNav = DashboardNavId;

type ShellContext = {
  profileName: string;
  isCompact: boolean;
  isMobile: boolean;
  user: User | null;
};

type DashboardShellProps = {
  active: ShellNav;
  children: ReactNode | ((context: ShellContext) => ReactNode);
  title: string | ((context: ShellContext) => string);
  subtitle: string | ((context: ShellContext) => string);
  headerAction?: ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  beige?: boolean;
  previewEnabled?: boolean;
};

const PERSIST_KEY = "memoro-shell-state";

export default function DashboardShell({
  active,
  children,
  title,
  subtitle,
  headerAction,
  actionLabel,
  onActionPress,
  beige = false,
  previewEnabled = true,
}: DashboardShellProps) {
  const { width } = useWindowDimensions();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayNameOverride, setDisplayNameOverride] = useState("");
  const [avatarColor, setAvatarColor] = useState("#E85D2A");
  const [avatarImageUri, setAvatarImageUri] = useState("");
  const [headerStreakDays, setHeaderStreakDays] = useState(0);

  const isCompact = width < 980;
  const isMobile = width < 640;

  useEffect(() => {
    const isWebRuntime = typeof window !== "undefined";
    const params = isWebRuntime ? new URLSearchParams(window.location.search) : null;
    const isLocalPreview =
      previewEnabled &&
      params?.get("preview") === "1" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isLocalPreview) {
      setCheckingSession(false);
      return;
    }

    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setCheckingSession(false);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [previewEnabled]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;

    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.displayNameOverride) setDisplayNameOverride(saved.displayNameOverride);
      if (saved.avatarColor) setAvatarColor(saved.avatarColor);
      if (saved.avatarImageUri) setAvatarImageUri(saved.avatarImageUri);
    } catch {
      // Ignore malformed shell state.
    }
  }, []);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ displayNameOverride, avatarColor, avatarImageUri }));
  }, [avatarColor, avatarImageUri, displayNameOverride]);

  useEffect(() => {
    const metadata = user?.user_metadata;
    if (!metadata) return;
    if (metadata.full_name || metadata.name) setDisplayNameOverride((current) => current || metadata.full_name || metadata.name);
    if (metadata.avatar_color) setAvatarColor(metadata.avatar_color);
    if (metadata.avatar_image_uri) setAvatarImageUri(metadata.avatar_image_uri);
  }, [user]);

  useEffect(() => {
    let alive = true;

    async function refreshHeaderStreak() {
      const results = await loadGameResults();
      if (!alive) return;
      setHeaderStreakDays(calculateGameStats(results).streakDays);
    }

    refreshHeaderStreak();

    if (typeof window === "undefined") return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshHeaderStreak);
    window.addEventListener("memoro-results-updated", refreshHeaderStreak);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshHeaderStreak);
      window.removeEventListener("memoro-results-updated", refreshHeaderStreak);
    };
  }, []);

  const profileName = useMemo(() => {
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    return displayNameOverride || metaName || user?.email?.split("@")[0] || "athlete";
  }, [displayNameOverride, user]);

  const initial = profileName.slice(0, 1).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (checkingSession) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator color="#E85D2A" />
        <Text style={s.loadingText}>Opening Memoro...</Text>
      </View>
    );
  }

  const context = { profileName, isCompact, isMobile, user };
  const pageTitle = typeof title === "function" ? title(context) : title;
  const pageSubtitle = typeof subtitle === "function" ? subtitle(context) : subtitle;
  const pageBody = typeof children === "function" ? children(context) : children;

  return (
    <View style={s.root}>
      <DashboardHeader
        avatarColor={avatarColor}
        avatarImageUri={avatarImageUri}
        initial={initial}
        isCompact={isCompact}
        isMobile={isMobile}
        onOpenProfile={() => setProfileOpen(true)}
        streakDays={headerStreakDays}
      />

      <View style={[s.body, isCompact && s.bodyCompact]}>
        <DashboardSidebar
          active={active}
          isCompact={isCompact}
          isMobile={isMobile}
          onOpenSettings={() => setSettingsOpen(true)}
          onSignOut={signOut}
        />

        <View style={[s.contentFrame, beige && s.contentFrameBeige, isCompact && s.contentFrameCompact]}>
          {!beige && (
            <>
              <Image source={require("../../assets/images/dashboard-background.png")} resizeMode="cover" style={s.dashboardBg} />
              <View style={s.dashboardBgWash} pointerEvents="none" />
            </>
          )}

          <ScrollView style={s.content} contentContainerStyle={[s.contentInner, isCompact && s.contentInnerCompact]} showsVerticalScrollIndicator={false}>
            <View style={[s.pageHeader, isMobile && s.pageHeaderMobile]}>
              <View>
                <Text style={s.h1}>{pageTitle}</Text>
                <Text style={s.headerSub}>{pageSubtitle}</Text>
              </View>
              {headerAction ? headerAction : actionLabel && (
                <TouchableOpacity style={s.startBtn} onPress={onActionPress}>
                  <Feather name="play" size={14} color="#FFFFFF" />
                  <Text style={s.startBtnText}>{actionLabel}</Text>
                </TouchableOpacity>
              )}
            </View>

            {pageBody}

            <DashboardFooter beige={beige} />
          </ScrollView>
        </View>
      </View>

      <SettingsPanel
        visible={settingsOpen}
        user={user}
        profileName={profileName}
        avatarColor={avatarColor}
        avatarImageUri={avatarImageUri}
        isMobile={isMobile}
        onClose={() => setSettingsOpen(false)}
        onProfileChange={(nextName, nextColor, nextImageUri) => {
          setDisplayNameOverride(nextName);
          setAvatarColor(nextColor);
          setAvatarImageUri(nextImageUri);
        }}
        onSignOut={signOut}
      />

      <ProfilePanel
        visible={profileOpen}
        user={user}
        profileName={profileName}
        avatarColor={avatarColor}
        avatarImageUri={avatarImageUri}
        isMobile={isMobile}
        onClose={() => setProfileOpen(false)}
        onAvatarImageChange={(nextImageUri) => setAvatarImageUri(nextImageUri)}
        onOpenSettings={() => {
          setProfileOpen(false);
          globalThis.setTimeout(() => setSettingsOpen(true), 120);
        }}
      />
    </View>
  );
}
