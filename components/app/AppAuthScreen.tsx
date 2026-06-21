import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { setActiveResultsUser } from "../games/resultsStore";
import { supabase } from "../../lib/supabase";
import { C } from "../../styles/tokens";

type AuthMode = "signin" | "signup";

const AUTH_OPTIONS = [
  { mode: "signin" as const, title: "Continue with email", subtitle: "Return to your daily practice.", icon: "mail" },
  { mode: "signup" as const, title: "Create an account", subtitle: "Start a clean training profile.", icon: "user-plus" },
] as const;

export default function AppAuthScreen({ initialMode = "signin" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive || !session?.user) return;
      setActiveResultsUser(session.user.id);
      router.replace("/dashboard");
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleAuth() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || loading) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          Alert.alert("Could not sign in", error.message);
          return;
        }
        if (data.user) setActiveResultsUser(data.user.id);
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
      if (error) {
        Alert.alert("Could not create account", error.message);
        return;
      }
      if (data.session?.user) {
        setActiveResultsUser(data.session.user.id);
        router.replace("/dashboard");
        return;
      }
      Alert.alert("Check your email", "We sent you a confirmation link.");
    } finally {
      setLoading(false);
    }
  }

  function chooseMode(nextMode: AuthMode) {
    setMode(nextMode);
    setFormOpen(true);
  }

  const disabled = !email.trim() || password.length < 6 || loading;

  return (
    <ImageBackground source={require("../../assets/images/hero-mobile.jpg")} resizeMode="cover" style={styles.background}>
      <View style={styles.imageWash} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="cover" />
              <Text style={styles.logoText}>MEMORO</Text>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Guided memory practice</Text>
              <Text style={styles.title}>Breathe. Focus. Remember.</Text>
              <Text style={styles.subtitle}>A calm daily training space for recall, focus, and steady progress.</Text>
            </View>

            <View style={styles.optionStack}>
              <Text style={styles.optionTitle}>How would you like to continue?</Text>
              {AUTH_OPTIONS.map((option) => {
                const selected = formOpen && mode === option.mode;
                return (
                  <Pressable key={option.mode} style={[styles.optionButton, selected && styles.optionButtonActive]} onPress={() => chooseMode(option.mode)}>
                    <View style={[styles.optionIcon, selected && styles.optionIconActive]}>
                      <Feather name={option.icon as any} size={18} color={selected ? C.white : "#0F7EA8"} />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionLabel}>{option.title}</Text>
                      <Text style={styles.optionSub}>{option.subtitle}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={selected ? "#0F7EA8" : "#91A0AA"} />
                  </Pressable>
                );
              })}

              {formOpen && (
                <View style={styles.formInline}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#8A99A4"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8A99A4"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <TouchableOpacity style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]} onPress={handleAuth} disabled={disabled}>
                    {loading ? (
                      <ActivityIndicator color={C.white} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>{mode === "signin" ? "Sign in" : "Create account"}</Text>
                        <Feather name="arrow-right" size={16} color={C.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#F5F8FA" },
  imageWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245,248,250,0.88)",
  },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 17 },
  logoText: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 18,
    fontWeight: "900",
    color: "#172A38",
    letterSpacing: 1.4,
  },
  heroCopy: { paddingTop: 80, gap: 10 },
  eyebrow: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#0F7EA8",
  },
  title: {
    maxWidth: 330,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
    color: "#172A38",
  },
  subtitle: {
    maxWidth: 330,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 15,
    lineHeight: 23,
    color: "#607482",
  },
  optionStack: { gap: 10 },
  optionTitle: {
    marginBottom: 2,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 13,
    fontWeight: "800",
    color: "#607482",
  },
  optionButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(20,42,58,0.08)",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionButtonActive: {
    borderColor: "rgba(15,126,168,0.30)",
    backgroundColor: "#EAF7FC",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF7FC",
  },
  optionIconActive: { backgroundColor: "#0F7EA8" },
  optionCopy: { flex: 1, minWidth: 0 },
  optionLabel: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 15,
    fontWeight: "900",
    color: "#172A38",
  },
  optionSub: {
    marginTop: 3,
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 12,
    color: "#7A8A95",
  },
  formInline: {
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(20,42,58,0.08)",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    padding: 12,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(20,42,58,0.10)",
    borderRadius: 18,
    backgroundColor: "#F7FBFD",
    paddingHorizontal: 14,
    color: "#172A38",
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#0F7EA8",
  },
  primaryButtonDisabled: { opacity: 0.48 },
  primaryButtonText: {
    fontFamily: "DM Sans, system-ui, sans-serif",
    fontSize: 15,
    fontWeight: "900",
    color: C.white,
  },
});
