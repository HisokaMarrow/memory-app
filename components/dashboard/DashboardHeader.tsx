import { Image, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { dashboard as s } from "../../styles/screens/dashboard.styles";

type DashboardHeaderProps = {
  avatarColor: string;
  avatarImageUri?: string;
  initial: string;
  isCompact: boolean;
  isMobile: boolean;
  onOpenProfile: () => void;
  streakDays: number;
};

export default function DashboardHeader({
  avatarColor,
  avatarImageUri,
  initial,
  isCompact,
  isMobile,
  onOpenProfile,
  streakDays,
}: DashboardHeaderProps) {
  return (
    <View style={[s.topHeader, isCompact && s.topHeaderCompact]}>
      <TouchableOpacity style={[s.brandBlock, isCompact && s.brandBlockCompact]} onPress={() => router.push("/dashboard")}>
        <Image source={require("../../assets/images/logo.png")} style={s.logoImg} resizeMode="cover" />
        <Text style={s.logoText}>MEMORO</Text>
      </TouchableOpacity>

      <View style={[s.headerRight, isMobile && s.headerRightMobile]}>
        <View style={s.streakPill}>
          <Text style={s.headerEmoji}>🔥</Text>
          <Text style={s.streakValue}>{streakDays}</Text>
          {!isMobile && <Text style={s.streakText}>day streak</Text>}
        </View>
        <TouchableOpacity style={[s.avatar, { backgroundColor: avatarColor }]} onPress={onOpenProfile}>
          {avatarImageUri ? (
            <Image source={{ uri: avatarImageUri }} style={s.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={s.avatarText}>{initial}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
