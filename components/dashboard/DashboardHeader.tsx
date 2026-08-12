import { useState } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { dashboard as s } from "../../styles/screens/dashboard.styles";
import type { DashboardNavId } from "./DashboardSidebar";

type HeaderNavId = DashboardNavId;

type DashboardHeaderProps = {
  active: HeaderNavId;
  avatarColor: string;
  avatarImageUri?: string;
  initial: string;
  isCompact: boolean;
  isMobile: boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  streakDays: number;
};

const MOBILE_MENU_ITEMS: { id: HeaderNavId; label: string; icon: string; href: string; locked?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid", href: "/dashboard" },
  { id: "games", label: "Games", icon: "zap", href: "/games" },
  { id: "flashcards", label: "Flashcards", icon: "layers", href: "/flashcards" },
  { id: "insights", label: "Progress", icon: "bar-chart-2", href: "/insights" },
  { id: "vault", label: "Vault", icon: "book-open", href: "/vault", locked: true },
];

export default function DashboardHeader({
  active,
  avatarColor,
  avatarImageUri,
  initial,
  isCompact,
  isMobile,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  streakDays,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const showMobileWebMenu = isMobile && Platform.OS === "web";

  function navigateTo(href: string, target?: HeaderNavId) {
    setMenuOpen(false);
    if (target === active) return;
    router.replace(href as any);
  }

  function openProfileSettings() {
    setMenuOpen(false);
    onOpenSettings();
  }

  function signOut() {
    setMenuOpen(false);
    onSignOut();
  }

  return (
    <View style={[s.topHeader, isCompact && s.topHeaderCompact, showMobileWebMenu && s.topHeaderMobileWeb]}>
      <TouchableOpacity
        style={[s.brandBlock, isCompact && s.brandBlockCompact, showMobileWebMenu && s.brandBlockMobileWeb]}
        onPress={() => navigateTo("/dashboard", "dashboard")}
      >
        <Image source={require("../../assets/images/logo.png")} style={[s.logoImg, showMobileWebMenu && s.logoImgMobileWeb]} resizeMode="cover" />
        <Text style={[s.logoText, showMobileWebMenu && s.logoTextMobileWeb]}>MEMORO</Text>
      </TouchableOpacity>

      {showMobileWebMenu ? (
        <>
          <View style={s.mobileHeaderStreak}>
            <View style={[s.streakPill, s.streakPillMobileWeb]}>
              <Text style={s.headerEmoji}>🔥</Text>
              <Text style={s.streakValue}>{streakDays}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.dashboardMenuButton, menuOpen && s.dashboardMenuButtonActive]}
            onPress={() => setMenuOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <Feather name={menuOpen ? "x" : "menu"} size={22} color="#121212" />
          </TouchableOpacity>

          {menuOpen && (
            <View style={s.dashboardMobileMenu}>
              {MOBILE_MENU_ITEMS.map((item) => {
                const selected = active === item.id;
                const locked = item.locked;
                return (
                  <TouchableOpacity
                    key={item.id}
                    disabled={locked}
                    accessibilityRole="button"
                    accessibilityLabel={locked ? `${item.label} — coming soon` : item.label}
                    style={[s.dashboardMobileMenuItem, selected && !locked && s.dashboardMobileMenuItemActive, locked && s.navItemLocked]}
                    onPress={() => { if (!locked) navigateTo(item.href, item.id); }}
                  >
                    <View style={s.dashboardMobileMenuLabel}>
                      <Feather name={item.icon as any} size={16} color={selected && !locked ? "#E85D2A" : "rgba(255,255,255,0.62)"} />
                      <Text style={[s.dashboardMobileMenuText, selected && !locked && s.dashboardMobileMenuTextActive]}>{item.label}</Text>
                    </View>
                    {locked ? (
                      <View style={s.navLockBadge}>
                        <Feather name="lock" size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={s.navLockBadgeText}>Soon</Text>
                      </View>
                    ) : (
                      <Feather name="arrow-right" size={15} color="rgba(255,255,255,0.36)" />
                    )}
                  </TouchableOpacity>
                );
              })}

              <View style={s.dashboardMobileMenuDivider} />

              <TouchableOpacity style={s.dashboardMobileMenuItem} onPress={openProfileSettings}>
                <View style={s.dashboardMobileMenuLabel}>
                  <Feather name="user" size={16} color="rgba(255,255,255,0.62)" />
                  <Text style={s.dashboardMobileMenuText}>Profile & Settings</Text>
                </View>
                <Feather name="settings" size={15} color="rgba(255,255,255,0.36)" />
              </TouchableOpacity>

              <TouchableOpacity style={s.dashboardMobileMenuItem} onPress={signOut}>
                <View style={s.dashboardMobileMenuLabel}>
                  <Feather name="log-out" size={16} color="rgba(255,255,255,0.62)" />
                  <Text style={s.dashboardMobileMenuText}>Log out</Text>
                </View>
                <Feather name="arrow-right" size={15} color="rgba(255,255,255,0.36)" />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={[s.headerRight, isMobile && s.headerRightMobile]}>
          <View style={s.streakPill}>
          <Text style={s.headerEmoji}>🔥</Text>
          <Text style={s.streakValue}>{streakDays}</Text>
          {!isMobile && <Text style={s.streakText}>day streak</Text>}
          </View>
          <TouchableOpacity style={[s.avatar, isMobile && s.avatarMobileHidden, { backgroundColor: avatarColor }]} onPress={onOpenProfile}>
            {avatarImageUri ? (
              <Image source={{ uri: avatarImageUri }} style={s.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={s.avatarText}>{initial}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
