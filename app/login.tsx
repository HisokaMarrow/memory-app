import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function handleAuth() {
    if (!email || !password) return;
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert("Error", error.message);
      else router.replace("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert("Error", error.message);
      else Alert.alert("Check your email", "We sent you a confirmation link.");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.inner}>

        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.brand}>
          <View style={s.logoBox}>
            <Text style={s.logoGlyph}>◆</Text>
          </View>
          <Text style={s.logoText}>MEMORO</Text>
          <Text style={s.tagline}>
            {mode === "signin" ? "Welcome back." : "Start your training."}
          </Text>
        </View>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[s.btn, (!email || !password || loading) && s.btnOff]}
            onPress={handleAuth}
            disabled={!email || !password || loading}
          >
            {loading
              ? <ActivityIndicator color="#0A0A0A" />
              : <Text style={s.btnText}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={s.switchRow}
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            <Text style={s.switchText}>
              {mode === "signin" ? "New here? Create account →" : "Have an account? Sign in →"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  inner: {
    flex: 1, justifyContent: "center",
    paddingHorizontal: 32, maxWidth: 420,
    alignSelf: "center", width: "100%",
  },
  backRow: { position: "absolute", top: 56, left: 32 },
  backText: { color: "#6B7280", fontSize: 15 },
  brand: { alignItems: "center", marginBottom: 44 },
  logoBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#4ADE80",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#4ADE80", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 24,
  },
  logoGlyph: { fontSize: 24, color: "#0A0A0A" },
  logoText: {
    fontSize: 26, fontWeight: "800", color: "#FFFFFF",
    letterSpacing: 5, marginBottom: 6,
  },
  tagline: { fontSize: 15, color: "#6B7280" },
  form: { gap: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16,
    color: "#FFFFFF", fontSize: 16,
  },
  btn: {
    backgroundColor: "#4ADE80", borderRadius: 14,
    paddingVertical: 18, alignItems: "center", marginTop: 4,
  },
  btnOff: { opacity: 0.4 },
  btnText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  switchRow: { alignItems: "center", paddingVertical: 14 },
  switchText: { color: "#6B7280", fontSize: 14 },
});
