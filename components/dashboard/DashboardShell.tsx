import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { calculateGameStats, clearActiveResultsUser, loadGameResults, setActiveResultsUser } from "../games/resultsStore";
import { clearPaoCache } from "../flashcards/paoStore";
import { dashboard as s } from "../../styles/screens/dashboard.styles";
import DashboardFooter from "./DashboardFooter";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar, { type DashboardNavId } from "./DashboardSidebar";
import { cacheDashboardUser, clearDashboardUser, getCachedDashboardUser, loadDashboardUser } from "./dashboardSession";
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
  previewEnabled?: boolean;
  lightHeader?: boolean;
  showPageHeader?: boolean;
  showFooter?: boolean;
  pinFooter?: boolean;
};

const PERSIST_KEY = "memoro-shell-state";

const MOBILE_NAV_ITEMS = [
  { id: "games", label: "Games", icon: "zap" },
  { id: "flashcards", label: "Cards", icon: "layers" },
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "insights", label: "Progress", icon: "bar-chart-2", center: true },
  { id: "vault", label: "Vault", icon: "book-open" },
  { id: "profile", label: "Profile", icon: "user" },
] as const;

function canUseWindowEvents() {
  return typeof window !== "undefined" && typeof window.addEventListener === "function";
}

function navigateMobileTab(id: typeof MOBILE_NAV_ITEMS[number]["id"]) {
  if (id === "dashboard") router.replace("/dashboard");
  if (id === "games") router.replace("/games" as any);
  if (id === "flashcards") router.replace("/flashcards" as any);
  if (id === "insights") router.replace("/insights" as any);
  if (id === "vault") router.replace("/vault" as any);
  if (id === "profile") router.replace("/profile" as any);
}

export default function DashboardShell({
  active,
  children,
  title,
  subtitle,
  headerAction,
  actionLabel,
  onActionPress,
  previewEnabled = true,
  lightHeader = false,
  showPageHeader = true,
  showFooter = true,
  pinFooter = false,
}: DashboardShellProps) {
  const { width } = useWindowDimensions();
  const [checkingSession, setCheckingSession] = useState(() => !getCachedDashboardUser());
  const [user, setUser] = useState<User | null>(() => getCachedDashboardUser());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayNameOverride, setDisplayNameOverride] = useState("");
  const [avatarColor, setAvatarColor] = useState("#E85D2A");
  const [avatarImageUri, setAvatarImageUri] = useState("");
  const [profileStateUserId, setProfileStateUserId] = useState<string | null>(null);
  const [headerStreakDays, setHeaderStreakDays] = useState(0);
  const signingOutRef = useRef(false);

  const isCompact = width < 980;
  const isMobile = width < 640;
  const isNativeApp = Platform.OS !== "web";

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
    const applySessionUser = (nextUser: User | null, redirectIfMissing = false) => {
      if (!alive) return;
      if (signingOutRef.current && nextUser) return;
      cacheDashboardUser(nextUser);
      if (!nextUser) {
        clearActiveResultsUser();
        setUser(null);
        setCheckingSession(false);
        if (signingOutRef.current) return;
        if (redirectIfMissing) router.replace("/login");
        return;
      }
      setActiveResultsUser(nextUser.id);
      setUser(nextUser);
      setCheckingSession(false);
    };

    const cachedUser = getCachedDashboardUser();
    if (cachedUser) {
      applySessionUser(cachedUser);
    }

    loadDashboardUser()
      .then((nextUser) => applySessionUser(nextUser, true))
      .catch(() => {
        if (!alive) return;
        if (!getCachedDashboardUser()) {
          clearActiveResultsUser();
          setUser(null);
          setCheckingSession(false);
          if (!signingOutRef.current) router.replace("/login");
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionUser(session?.user ?? null, true);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [previewEnabled]);

  useEffect(() => {
    if (!user) {
      setDisplayNameOverride("");
      setAvatarColor("#E85D2A");
      setAvatarImageUri("");
      setProfileStateUserId(null);
      return;
    }

    const metadata = user.user_metadata ?? {};
    const fallbackName = metadata.full_name || metadata.name || user.email?.split("@")[0] || "";
    const fallbackColor = metadata.avatar_color || "#E85D2A";
    const fallbackImage = metadata.avatar_image_uri || "";
    let nextName = fallbackName;
    let nextColor = fallbackColor;
    let nextImageUri = fallbackImage;

    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(`${PERSIST_KEY}:${user.id}`);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.displayNameOverride === "string") nextName = saved.displayNameOverride || fallbackName;
          if (typeof saved.avatarColor === "string" && saved.avatarColor) nextColor = saved.avatarColor;
          if (typeof saved.avatarImageUri === "string") nextImageUri = saved.avatarImageUri;
        }
      } catch {
        // Ignore malformed shell state.
      }
    }

    setDisplayNameOverride(nextName);
    setAvatarColor(nextColor);
    setAvatarImageUri(nextImageUri);
    setProfileStateUserId(user.id);
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("memoro-user-changed"));
    }
  }, [user]);

  useEffect(() => {
    if (!user || profileStateUserId !== user.id || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(`${PERSIST_KEY}:${user.id}`, JSON.stringify({ displayNameOverride, avatarColor, avatarImageUri }));
    } catch {
      // Ignore malformed shell state.
    }
  }, [avatarColor, avatarImageUri, displayNameOverride, profileStateUserId, user]);

  useEffect(() => {
    if (!user || profileStateUserId !== user.id) return;
    const metadata = user.user_metadata ?? {};
    const displayName = displayNameOverride || metadata.full_name || metadata.name || user.email?.split("@")[0] || "athlete";

    supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      avatar_color: avatarColor,
      avatar_image_uri: avatarImageUri,
      updated_at: new Date().toISOString(),
    }).then(() => undefined);
  }, [avatarColor, avatarImageUri, displayNameOverride, profileStateUserId, user]);

  useEffect(() => {
    if (checkingSession) return;

    let alive = true;

    async function refreshHeaderStreak() {
      const results = await loadGameResults();
      if (!alive) return;
      setHeaderStreakDays(calculateGameStats(results).streakDays);
    }

    refreshHeaderStreak();

    if (!canUseWindowEvents()) return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshHeaderStreak);
    window.addEventListener("memoro-results-updated", refreshHeaderStreak);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshHeaderStreak);
      window.removeEventListener("memoro-results-updated", refreshHeaderStreak);
    };
  }, [checkingSession, user?.id]);

  const profileName = useMemo(() => {
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    return displayNameOverride || metaName || user?.email?.split("@")[0] || "athlete";
  }, [displayNameOverride, user]);

  const initial = profileName.slice(0, 1).toUpperCase();

  function signOut() {
    signingOutRef.current = true;
    const signingOutUserId = user?.id;
    clearDashboardUser();
    clearActiveResultsUser();
    void clearPaoCache(signingOutUserId);
    setSettingsOpen(false);
    setProfileOpen(false);
    setUser(null);
    router.replace("/");
    globalThis.setTimeout(() => {
      void supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    }, 0);
  }

  function openProfileArea() {
    if (isMobile) {
      setSettingsOpen(true);
      return;
    }
    setProfileOpen(true);
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
    <View style={[s.root, isNativeApp && s.rootApp]}>
      {/* Top header bar only on mobile/compact web (for the hamburger nav).
          On desktop it's removed — logo lives in the sidebar, controls in the page header. */}
      {!isNativeApp && isCompact && (
        <DashboardHeader
          active={active}
          avatarColor={avatarColor}
          avatarImageUri={avatarImageUri}
          initial={initial}
          isCompact={isCompact}
          isMobile={isMobile}
          onOpenProfile={openProfileArea}
          onOpenSettings={() => setSettingsOpen(true)}
          onSignOut={signOut}
          streakDays={headerStreakDays}
        />
      )}

      <View style={[s.body, !isCompact && !isNativeApp && s.bodyDesktop, isCompact && s.bodyCompact, isMobile && s.bodyMobile, isNativeApp && s.bodyApp, isNativeApp && s.bodyAppLight]}>
        {!isMobile && !isNativeApp && (
          <DashboardSidebar
            active={active}
            isCompact={isCompact}
            isMobile={isMobile}
            onOpenSettings={() => setSettingsOpen(true)}
            onSignOut={signOut}
          />
        )}

        <View style={[s.contentFrame, isCompact && s.contentFrameCompact, isMobile && s.contentFrameMobile, isNativeApp && s.contentFrameApp, isNativeApp && s.contentFrameAppLight]}>
          <View pointerEvents="none" style={[s.footerBounceBlocker, isNativeApp && s.footerBounceBlockerApp]} />
          <ScrollView
            style={[s.content, isMobile && s.contentMobile, isNativeApp && s.contentApp]}
            contentContainerStyle={[
              s.contentInner,
              isCompact && s.contentInnerCompact,
              isMobile && s.contentInnerMobile,
              isMobile && Platform.OS === "web" && s.contentInnerMobileWeb,
              isNativeApp && s.contentInnerApp,
              isNativeApp && s.contentInnerAppPolished,
              pinFooter && s.contentInnerFooterPinned,
              pinFooter && isCompact && s.contentInnerFooterPinnedCompact,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={[s.pageSurface, isNativeApp && s.pageSurfaceApp, pinFooter && s.pageSurfaceFooterPinned]}>
              <View pointerEvents="none" style={s.dashboardBgLayer}>
                <Image source={require("../../assets/images/dashboard-background.png")} resizeMode="cover" style={[s.dashboardBg, isNativeApp && s.dashboardBgApp]} />
                <View style={[s.dashboardBgWash, isNativeApp && s.dashboardBgWashApp]} />
              </View>
              <View style={s.pageSurfaceContent}>
                {showPageHeader && (
                  <View style={[s.pageHeader, lightHeader && s.pageHeaderLight, isMobile && s.pageHeaderMobile, isNativeApp && s.pageHeaderApp]}>
                    <View>
                      <Text style={[s.h1, lightHeader && s.h1Light, isNativeApp && s.h1App]}>{pageTitle}</Text>
                      <Text style={[s.headerSub, lightHeader && s.headerSubLight, isNativeApp && s.headerSubApp]}>{pageSubtitle}</Text>
                    </View>
                    {!isCompact && !isNativeApp ? (
                      <View style={s.headerRight}>
                        {headerAction}
                        <View style={s.streakPill}>
                          <Text style={s.headerEmoji}>🔥</Text>
                          <Text style={s.streakValue}>{headerStreakDays}</Text>
                          <Text style={s.streakText}>day streak</Text>
                        </View>
                        <TouchableOpacity style={[s.avatar, { backgroundColor: avatarColor }]} onPress={openProfileArea}>
                          {avatarImageUri ? (
                            <Image source={{ uri: avatarImageUri }} style={s.avatarImage} resizeMode="cover" />
                          ) : (
                            <Text style={s.avatarText}>{initial}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : headerAction ? headerAction : actionLabel ? (
                      <TouchableOpacity style={[s.startBtn, isMobile && s.startBtnMobile, isNativeApp && s.startBtnApp]} onPress={onActionPress}>
                        <Feather name="play" size={14} color="#FFFFFF" />
                        <Text style={s.startBtnText}>{actionLabel}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                {pageBody}
              </View>
            </View>

            {!isNativeApp && showFooter && <DashboardFooter hasBottomNav={false} />}
          </ScrollView>
        </View>
      </View>

      {isNativeApp && (
        <View style={[s.mobileBottomNav, s.mobileBottomNavNative]}>
          {MOBILE_NAV_ITEMS.map((item) => {
            const on = active === item.id;
            const center = "center" in item && item.center;
            return (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.label}`}
                style={[s.mobileTab, center && s.mobileTabCenter, on && s.mobileTabActive, on && s.mobileTabActiveApp]}
                onPress={() => {
                  if (on) return;
                  navigateMobileTab(item.id);
                }}
              >
                <View style={[
                  s.mobileTabIconShell,
                  center && s.mobileTabIconShellCenter,
                  on && s.mobileTabIconShellActive,
                  on && s.mobileTabIconShellActiveApp,
                  center && on && s.mobileTabIconShellCenterActive,
                  center && on && s.mobileTabIconShellCenterActiveApp,
                ]}>
                  <Feather name={item.icon as any} size={center ? 21 : 18} color={on && center ? "#FFFFFF" : on ? "#0F7EA8" : "#7A8A95"} />
                </View>
                <Text style={[s.mobileTabText, s.mobileTabTextApp, on && s.mobileTabTextActive, on && s.mobileTabTextActiveApp]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
