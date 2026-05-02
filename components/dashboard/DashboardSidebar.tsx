import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { dashboard as s } from "../../styles/screens/dashboard.styles";

export type DashboardNavId = "dashboard" | "games" | "vault";

type DashboardSidebarProps = {
  active: DashboardNavId;
  isCompact: boolean;
  isMobile: boolean;
  onOpenSettings: () => void;
  onSignOut: () => void;
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "games", label: "Games", icon: "zap" },
  { id: "vault", label: "Vault", icon: "book-open" },
] as const;

function navigate(next: DashboardNavId) {
  if (next === "dashboard") router.push("/dashboard");
  if (next === "games") router.push("/games" as any);
  if (next === "vault") router.push("/vault" as any);
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
      <View style={[s.sidebarMain, isCompact && s.sidebarMainCompact]}>
        {NAV_ITEMS.map((item) => {
          const on = active === item.id;
          return (
            <TouchableOpacity key={item.id} style={[s.navItem, on && s.navItemActive]} onPress={() => navigate(item.id)}>
              <Feather name={item.icon as any} size={18} color={on ? "#E85D2A" : "#6A6A6A"} />
              <Text style={[s.navText, on && s.navTextActive]}>{item.label}</Text>
              {on && <View style={s.navDot} />}
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
