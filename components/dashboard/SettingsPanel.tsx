import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { settingsPanel as s } from "./SettingsPanel.styles";

const AVATAR_COLORS = ["#E85D2A", "#121212", "#5B5BD6", "#2A9D8F", "#CD7F32"] as const;

type SettingsPanelProps = {
  visible: boolean;
  user: User | null;
  profileName: string;
  avatarColor: string;
  avatarImageUri: string;
  isMobile: boolean;
  onClose: () => void;
  onProfileChange: (nextName: string, nextColor: string, nextImageUri: string) => void;
  onSignOut: () => void;
};

export default function SettingsPanel({
  visible,
  user,
  profileName,
  avatarColor,
  avatarImageUri,
  isMobile,
  onClose,
  onProfileChange,
  onSignOut,
}: SettingsPanelProps) {
  const [mounted, setMounted] = useState(visible);
  const motion = useRef(new Animated.Value(0)).current;
  const [displayName, setDisplayName] = useState(profileName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(avatarColor);
  const [selectedAvatarImageUri, setSelectedAvatarImageUri] = useState(avatarImageUri);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "bad">("ok");

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
    if (!visible) return;
    setDisplayName(profileName);
    setEmail(user?.email ?? "");
    setSelectedColor(avatarColor);
    setSelectedAvatarImageUri(avatarImageUri);
    setNewPassword("");
    setMessage("");
  }, [avatarColor, avatarImageUri, profileName, user?.email, visible]);

  const initial = (displayName || user?.email || "A").slice(0, 1).toUpperCase();
  const fieldLayout = isMobile ? s.fieldGridStacked : null;
  const cardScale = motion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

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
          data: { full_name: cleanName, avatar_color: selectedColor, avatar_image_uri: selectedAvatarImageUri },
        });
        if (error) {
          showMessage(error.message, "bad");
          return;
        }

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: cleanName,
          avatar_color: selectedColor,
          avatar_image_uri: selectedAvatarImageUri,
          updated_at: new Date().toISOString(),
        });
        if (profileError) {
          showMessage(profileError.message, "bad");
          return;
        }
      }

      onProfileChange(cleanName, selectedColor, selectedAvatarImageUri);
      showMessage("Profile updated.");
    } finally {
      setSavingProfile(false);
    }
  }

  function chooseAvatarImage() {
    if (typeof document === "undefined") {
      showMessage("Image upload is available in the web app.", "bad");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showMessage("Please choose an image under 2MB.", "bad");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedAvatarImageUri(String(reader.result ?? ""));
        showMessage("Icon selected. Save profile to keep it.");
      };
      reader.onerror = () => showMessage("Could not read that image.", "bad");
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function saveAccount() {
    const cleanEmail = email.trim();
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

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={s.root}>
        <Animated.View style={[s.blurLayer, { opacity: motion }]} pointerEvents="none" />
        <TouchableOpacity style={s.hitLayer} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[s.card, { opacity: motion, transform: [{ scale: cardScale }] }]}>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
              <View style={s.titleBlock}>
                <Text style={s.eyebrow}>{isMobile ? "MEMORO profile" : "MEMORO settings"}</Text>
                <Text style={s.title}>{isMobile ? "Profile & Settings" : "Settings"}</Text>
                <Text style={s.subtitle}>Your profile, account security, and help in one place.</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={s.body}>
              <View style={s.profileRow}>
                <View style={[s.avatarPreview, { backgroundColor: selectedColor }]}>
                  {selectedAvatarImageUri ? (
                    <Image source={{ uri: selectedAvatarImageUri }} style={s.avatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={s.avatarText}>{initial}</Text>
                  )}
                </View>
                <View style={s.profileText}>
                  <Text style={s.profileName}>{displayName || "Your profile"}</Text>
                  <Text style={s.profileEmail}>{user?.email || "Preview account"}</Text>
                </View>
                <TouchableOpacity style={s.ghostBtn} onPress={onSignOut}>
                  <Feather name="log-out" size={14} color="#2A2A2A" />
                  <Text style={s.ghostText}>Log out</Text>
                </TouchableOpacity>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionIcon}><Text style={s.sectionEmoji}>🎯</Text></View>
                  <View style={s.sectionHeaderCopy}>
                    <Text style={s.sectionTitle}>Profile</Text>
                    <Text style={s.sectionSub}>Change how your name and avatar appear on the dashboard.</Text>
                  </View>
                </View>

                <View style={[s.fieldGrid, fieldLayout]}>
                  <View style={s.field}>
                    <Text style={s.label}>Display name</Text>
                    <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="#8C8C8C" />
                  </View>
                  <View style={s.field}>
                    <Text style={s.label}>Avatar colour</Text>
                    <View style={s.colorRow}>
                      {AVATAR_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          aria-label={`Use avatar colour ${color}`}
                          style={[s.colorSwatch, { backgroundColor: color }, selectedColor === color && s.colorSwatchActive]}
                          onPress={() => setSelectedColor(color)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={s.field}>
                    <Text style={s.label}>Custom icon</Text>
                    <View style={s.iconActionRow}>
                      <TouchableOpacity style={s.ghostBtn} onPress={chooseAvatarImage}>
                        <Feather name="image" size={14} color="#2A2A2A" />
                        <Text style={s.ghostText}>Upload icon</Text>
                      </TouchableOpacity>
                      {!!selectedAvatarImageUri && (
                        <TouchableOpacity style={s.ghostBtn} onPress={() => setSelectedAvatarImageUri("")}>
                          <Feather name="trash-2" size={14} color="#2A2A2A" />
                          <Text style={s.ghostText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.primaryBtn, savingProfile && s.primaryBtnDisabled]} onPress={saveProfile} disabled={savingProfile}>
                    {savingProfile ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="save" size={14} color="#FFFFFF" />}
                    <Text style={s.primaryText}>Save profile</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionIcon}><Text style={s.sectionEmoji}>✅</Text></View>
                  <View style={s.sectionHeaderCopy}>
                    <Text style={s.sectionTitle}>Account</Text>
                    <Text style={s.sectionSub}>Update email or password for the signed-in Supabase account.</Text>
                  </View>
                </View>

                <View style={[s.fieldGrid, fieldLayout]}>
                  <View style={s.field}>
                    <Text style={s.label}>Email</Text>
                    <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#8C8C8C" autoCapitalize="none" keyboardType="email-address" />
                  </View>
                  <View style={s.field}>
                    <Text style={s.label}>New password</Text>
                    <TextInput style={s.input} value={newPassword} onChangeText={setNewPassword} placeholder="Leave blank to keep current" placeholderTextColor="#8C8C8C" secureTextEntry />
                  </View>
                </View>

                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.primaryBtn, savingAccount && s.primaryBtnDisabled]} onPress={saveAccount} disabled={savingAccount}>
                    {savingAccount ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="shield" size={14} color="#FFFFFF" />}
                    <Text style={s.primaryText}>Update account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionIcon}><Text style={s.sectionEmoji}>🧠</Text></View>
                  <View style={s.sectionHeaderCopy}>
                    <Text style={s.sectionTitle}>Help</Text>
                    <Text style={s.sectionSub}>Quick support notes without adding another dashboard icon.</Text>
                  </View>
                </View>

                <View style={s.helpList}>
                  {[
                    ["Training", "Start with Quick Start when you want the app to choose the best exercise."],
                    ["Quests", "Daily quests calibrate above your latest baseline and sync with your signed-in account."],
                    ["Account", "Email changes may require inbox confirmation before Supabase applies them."],
                  ].map(([title, text]) => (
                    <View key={title} style={s.helpItem}>
                      <Text style={s.helpEmoji}>📈</Text>
                      <View style={s.helpCopy}>
                        <Text style={s.helpTitle}>{title}</Text>
                        <Text style={s.helpText}>{text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {!!message && (
                <View style={[s.msg, messageType === "ok" ? s.msgOk : s.msgBad]}>
                  <Text style={s.msgText}>{message}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
