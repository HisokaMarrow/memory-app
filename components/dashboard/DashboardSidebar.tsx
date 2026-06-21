import { Image, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { dashboard as s } from "../../styles/screens/dashboard.styles";

export type DashboardNavId = "dashboard" | "games" | "insights" | "vault" | "profile";

type DashboardSidebarProps = {
  active: DashboardNavId;
  isCompact: boolean;
  isMobile: boolean;
  onOpenSettings: () => void;
  onSignOut: () => void;
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid", locked: false },
  { id: "games", label: "Games", icon: "zap", locked: false },
  { id: "vault", label: "Vault", icon: "book-open", locked: true },
] as const;

function navigate(next: DashboardNavId) {
  if (next === "dashboard") router.replace("/dashboard");
  if (next === "games") router.replace("/games" as any);
  if (next === "insights") router.replace("/insights" as any);
  if (next === "vault") router.replace("/vault" as any);
  if (next === "profile") router.replace("/profile" as any);
}

export default function DashboardSidebar({
  active,
  isCompact,
  isMobile,
  onOpenSettings,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <View style={[s.sidebar, isCompact && s.sidebarCompact, isMobile && s.sidebarMobile]}>
      {!isCompact && (
        <TouchableOpacity style={s.sidebarLogoRow} onPress={() => router.replace("/dashboard")}>
          <Image source={require("../../assets/images/logo.png")} style={s.sidebarLogoImg} resizeMode="cover" />
          <Text style={s.sidebarLogoText}>MEMORO</Text>
        </TouchableOpacity>
      )}
      <View style={[s.sidebarMain, isCompact && s.sidebarMainCompact]}>
        {NAV_ITEMS.map((item) => {
          const on = active === item.id;
          const locked = item.locked;
          return (
            <TouchableOpacity
              key={item.id}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel={locked ? `${item.label} — coming soon` : item.label}
              style={[s.navItem, on && !locked && s.navItemActive, locked && s.navItemLocked]}
              onPress={() => {
                if (!on && !locked) navigate(item.id);
              }}
            >
              <Feather name={item.icon as any} size={18} color={on && !locked ? "#E85D2A" : "#6A6A6A"} />
              <Text style={[s.navText, on && !locked && s.navTextActive]}>{item.label}</Text>
              {locked ? (
                <View style={s.navLockBadge}>
                  <Feather name="lock" size={11} color="rgba(255,255,255,0.5)" />
                  <Text style={s.navLockBadgeText}>Soon</Text>
                </View>
              ) : on ? (
                <View style={s.navDot} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.sidebarBottom, isCompact && s.sidebarBottomCompact]}>
        <TouchableOpacity style={s.navItem} onPress={onOpenSettings}>
          <Feather name="settings" size={18} color="#6A6A6A" />
          <Text style={s.navText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={onSignOut}>
          <Feather name="log-out" size={18} color="#6A6A6A" />
          <Text style={s.navText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
