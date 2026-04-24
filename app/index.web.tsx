import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

type Phase = "idle" | "showing" | "input" | "result";

function makeDigits(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

export default function LandingPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [digits, setDigits] = useState("");
  const [answer, setAnswer] = useState("");
  const [tick, setTick] = useState(3);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  // Check session — redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, []);

  // Inject hero video + overlay into document body
  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/hero.mp4";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    Object.assign(video.style, {
      position: "fixed", top: "0", left: "0",
      width: "100%", height: "100%",
      objectFit: "cover", zIndex: "-2",
      pointerEvents: "none",
    });

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed", top: "0", left: "0",
      width: "100%", height: "100%",
      background: "linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.80) 100%)",
      zIndex: "-1",
      pointerEvents: "none",
    });

    document.body.appendChild(video);
    document.body.appendChild(overlay);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    return () => {
      if (document.body.contains(video)) document.body.removeChild(video);
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };
  }, []);

  // Countdown while showing digits
  useEffect(() => {
    if (phase !== "showing") return;
    if (tick <= 0) { setPhase("input"); return; }
    const t = setTimeout(() => setTick(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, tick]);

  function startGame() {
    setDigits(makeDigits(6));
    setAnswer("");
    setTick(3);
    setPhase("showing");
  }

  function checkAnswer() {
    setPhase("result");
  }

  const correct = answer.split("").filter((c, i) => c === digits[i]).length;

  return (
    <View style={s.root}>
      <Animated.View style={[s.inner, { opacity: fade, transform: [{ translateY: rise }] }]}>

        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoBox}>
            <Text style={s.logoGlyph}>◆</Text>
          </View>
          <Text style={s.logoText}>MEMORO</Text>
          <Text style={s.tagline}>Train your mind. Daily.</Text>
        </View>

        {/* Demo game card */}
        <View style={s.card}>

          {phase === "idle" && (
            <>
              <Text style={s.pill}>QUICK CHALLENGE</Text>
              <Text style={s.cardTitle}>Can you remember{"\n"}6 digits?</Text>
              <Text style={s.cardSub}>You have 3 seconds. No pressure.</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={startGame}>
                <Text style={s.primaryBtnText}>Start Challenge →</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === "showing" && (
            <>
              <Text style={s.pill}>MEMORISE</Text>
              <Text style={s.digitRow}>{digits.split("").join("  ")}</Text>
              <View style={s.countdown}>
                <Text style={s.countdownNum}>{tick}</Text>
              </View>
            </>
          )}

          {phase === "input" && (
            <>
              <Text style={s.pill}>RECALL</Text>
              <Text style={s.cardTitle}>What were the digits?</Text>
              <TextInput
                style={s.digitInput}
                value={answer}
                onChangeText={setAnswer}
                keyboardType="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor="rgba(255,255,255,0.18)"
                autoFocus
                textAlign="center"
              />
              <TouchableOpacity
                style={[s.primaryBtn, answer.length < 6 && s.btnOff]}
                onPress={checkAnswer}
                disabled={answer.length < 6}
              >
                <Text style={s.primaryBtnText}>Check</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === "result" && (
            <>
              <Text style={s.pill}>RESULT</Text>
              <Text style={s.scoreNum}>{correct}<Text style={s.scoreDenom}>/6</Text></Text>
              <Text style={s.cardTitle}>
                {correct >= 5 ? "Excellent recall." : correct >= 3 ? "Good start." : "Room to grow."}
              </Text>
              <Text style={s.cardSub}>
                {correct < 6
                  ? "Daily training can double your memory span in weeks."
                  : "You have strong natural memory. Keep sharpening it."}
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => router.push("/login")}>
                <Text style={s.primaryBtnText}>Start Training →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={startGame}>
                <Text style={s.ghostBtnText}>Try again</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        <TouchableOpacity style={s.signinRow} onPress={() => router.push("/login")}>
          <Text style={s.signinText}>Already training?  <Text style={s.signinLink}>Sign in →</Text></Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh" as any,
  },
  inner: {
    alignItems: "center",
    width: "100%",
    maxWidth: 460,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brand: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#4ADE80",
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#4ADE80", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 32,
  },
  logoGlyph: { fontSize: 28, color: "#0A0A0A" },
  logoText: {
    fontSize: 34, fontWeight: "800", color: "#FFFFFF",
    letterSpacing: 7, marginBottom: 8,
  },
  tagline: { fontSize: 15, color: "rgba(255,255,255,0.5)", letterSpacing: 0.4 },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.07)" as any,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 32,
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    backdropFilter: "blur(24px)" as any,
    WebkitBackdropFilter: "blur(24px)" as any,
  },
  pill: {
    fontSize: 11, fontWeight: "700",
    color: "#4ADE80", letterSpacing: 3,
    backgroundColor: "rgba(74,222,128,0.12)",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 24, fontWeight: "700", color: "#FFFFFF",
    textAlign: "center", lineHeight: 32,
  },
  cardSub: {
    fontSize: 14, color: "rgba(255,255,255,0.45)",
    textAlign: "center", lineHeight: 22,
  },
  digitRow: {
    fontSize: 44, fontWeight: "800", color: "#FFFFFF",
    letterSpacing: 6, textAlign: "center",
    marginVertical: 8,
  },
  countdown: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(74,222,128,0.12)",
    borderWidth: 2, borderColor: "#4ADE80",
    alignItems: "center", justifyContent: "center",
  },
  countdownNum: { fontSize: 32, fontWeight: "800", color: "#4ADE80" },
  digitInput: {
    width: "100%",
    fontSize: 32, fontWeight: "700", color: "#FFFFFF",
    textAlign: "center", letterSpacing: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingVertical: 16,
  },
  scoreNum: { fontSize: 64, fontWeight: "800", color: "#4ADE80" },
  scoreDenom: { fontSize: 32, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  primaryBtn: {
    width: "100%", backgroundColor: "#4ADE80",
    borderRadius: 14, paddingVertical: 18, alignItems: "center",
  },
  primaryBtnText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  btnOff: { opacity: 0.35 },
  ghostBtn: { paddingVertical: 8, alignItems: "center" },
  ghostBtnText: { color: "rgba(255,255,255,0.35)", fontSize: 14 },
  signinRow: { paddingVertical: 12 },
  signinText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  signinLink: { color: "rgba(255,255,255,0.7)" },
});
