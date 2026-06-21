import { useEffect, useRef, useState } from "react";
import { Animated, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { calculateGameStats, loadGameResults, type StoredGameResult } from "../games/resultsStore";
import { profilePanel as s } from "./ProfilePanel.styles";

type ProfilePanelProps = {
  visible: boolean;
  user: User | null;
  profileName: string;
  avatarColor: string;
  avatarImageUri: string;
  isMobile: boolean;
  onClose: () => void;
  onAvatarImageChange: (nextImageUri: string) => void;
  onOpenSettings: () => void;
};

export default function ProfilePanel({
  visible,
  user,
  profileName,
  avatarColor,
  avatarImageUri,
  isMobile,
  onClose,
  onAvatarImageChange,
  onOpenSettings,
}: ProfilePanelProps) {
  const [mounted, setMounted] = useState(visible);
  const [gameResults, setGameResults] = useState<StoredGameResult[]>([]);
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(motion, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      return;
    }

    Animated.timing(motion, {
      toValue: 0,
      duration: 150,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [motion, visible]);

  useEffect(() => {
    let alive = true;

    async function refreshProfileStats() {
      const results = await loadGameResults();
      if (alive) setGameResults(results);
    }

    if (visible) refreshProfileStats();

    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {
      alive = false;
    };

    window.addEventListener("focus", refreshProfileStats);
    window.addEventListener("memoro-results-updated", refreshProfileStats);
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshProfileStats);
      window.removeEventListener("memoro-results-updated", refreshProfileStats);
    };
  }, [visible]);

  if (!mounted) return null;

  const initial = (profileName || user?.email || "A").slice(0, 1).toUpperCase();
  const cardScale = motion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const statLayout = isMobile ? s.statGridStacked : null;
  const gameStats = calculateGameStats(gameResults);
  const achievements = [
    {
      title: "First Recall",
      text: "Complete your first memory session.",
      icon: "🧠",
      progress: gameStats.resultsCount ? 100 : 0,
      unlocked: gameStats.resultsCount > 0,
    },
    {
      title: "Seven Day Flame",
      text: "Train for 7 days in a row.",
      icon: "🔥",
      progress: Math.min(100, Math.round((gameStats.streakDays / 7) * 100)),
      unlocked: gameStats.streakDays >= 7,
    },
    {
      title: "Digit Climber",
      text: "Clear a 20 digit recall protocol.",
      icon: "📈",
      progress: Math.min(100, Math.round((gameStats.bestDigits / 20) * 100)),
      unlocked: gameStats.bestDigits >= 20,
    },
    { title: "Vault Scholar", text: "Unlock five memory techniques.", icon: "🧩", progress: 40, unlocked: false },
  ];
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  function chooseAvatarImage() {
    if (typeof document === "undefined") return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || file.size > 2 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const nextImageUri = String(reader.result ?? "");
        onAvatarImageChange(nextImageUri);
        if (user) {
          await supabase.auth.updateUser({
            data: { avatar_image_uri: nextImageUri, avatar_color: avatarColor, full_name: profileName },
          });
          await supabase.from("profiles").upsert({
            id: user.id,
            display_name: profileName,
            avatar_color: avatarColor,
            avatar_image_uri: nextImageUri,
            updated_at: new Date().toISOString(),
          });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={s.root}>
        <Animated.View style={[s.blurLayer, { opacity: motion }]} pointerEvents="none" />
        <TouchableOpacity style={s.hitLayer} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[s.card, { opacity: motion, transform: [{ scale: cardScale }] }]}>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.hero}>
              <View style={s.topRow}>
                <View>
                  <Text style={s.eyebrow}>MEMORO profile</Text>
                  <Text style={s.title}>Profile</Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Feather name="x" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={s.identityRow}>
                <View style={[s.avatar, { backgroundColor: avatarColor }]}>
                  {avatarImageUri ? (
                    <Image source={{ uri: avatarImageUri }} style={s.avatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={s.avatarText}>{initial}</Text>
                  )}
                </View>
                <View style={s.titleBlock}>
                  <Text style={s.title}>{profileName}</Text>
                  <Text style={s.subtitle}>{user?.email || "Preview account"} · Memory athlete</Text>
                  <View style={s.actionRow}>
                    <TouchableOpacity style={s.orangeBtn} onPress={() => {
                      onClose();
                      router.push("/games" as any);
                    }}>
                      <Feather name="play" size={14} color="#FFFFFF" />
                      <Text style={s.orangeBtnText}>Start training</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={onOpenSettings}>
                      <Feather name="settings" size={14} color="#FFFFFF" />
                      <Text style={s.ghostText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={chooseAvatarImage}>
                      <Feather name="image" size={14} color="#FFFFFF" />
                      <Text style={s.ghostText}>Upload icon</Text>
                    </TouchableOpacity>
                    {!!avatarImageUri && (
                      <TouchableOpacity style={s.ghostBtn} onPress={async () => {
                        onAvatarImageChange("");
                        if (user) {
                          await supabase.auth.updateUser({ data: { avatar_image_uri: "" } });
                          await supabase.from("profiles").upsert({
                            id: user.id,
                            display_name: profileName,
                            avatar_color: avatarColor,
                            avatar_image_uri: "",
                            updated_at: new Date().toISOString(),
                          });
                        }
                      }}>
                        <Feather name="trash-2" size={14} color="#FFFFFF" />
                        <Text style={s.ghostText}>Remove icon</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={s.body}>
              <View style={[s.statGrid, statLayout]}>
                {[
                  [String(gameStats.streakDays), "Day streak"],
                  [gameStats.totalXp.toLocaleString("en-GB"), "XP earned"],
                  [String(gameStats.bestNumbers), "Best recall"],
                ].map(([value, label]) => (
                  <View key={label} style={s.statCard}>
                    <Text style={s.statValue}>{value}</Text>
                    <Text style={s.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionHeaderCopy}>
                    <Text style={s.sectionTitle}>Achievements</Text>
                    <Text style={s.sectionSub}>Progress badges that make training feel earned.</Text>
                  </View>
                  <View style={s.smallPill}>
                    <Text style={s.smallPillText}>{unlockedCount} / {achievements.length} unlocked</Text>
                  </View>
                </View>

                <View style={s.achievementList}>
                  {achievements.map((achievement) => (
                    <View key={achievement.title} style={[s.achievement, !achievement.unlocked && s.achievementLocked]}>
                      <View style={[s.badge, !achievement.unlocked && s.badgeLocked]}>
                        <Text style={s.badgeEmoji}>{achievement.icon}</Text>
                      </View>
                      <View style={s.achievementCopy}>
                        <Text style={s.achievementTitle}>{achievement.title}</Text>
                        <Text style={s.achievementText}>{achievement.text}</Text>
                        <View style={s.progressTrack}>
                          <View style={[s.progressFill, { width: `${achievement.progress}%` as any }]} />
                        </View>
                      </View>
                      {achievement.unlocked && <Text style={s.unlockedEmoji}>✅</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
