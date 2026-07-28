import { useState, useEffect, useRef } from "react";
import { Image, View, Text, TextInput, TouchableOpacity, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { test as ts } from "./MemoryTestSection.styles";

// ── Word data ─────────────────────────────────────────────────────────────────
const WORDS_A = [
  "dragon",   "bridge",  "castle",   "river",    "sword",
  "forest",   "knight",  "tower",    "moon",     "wolf",
  "fire",     "crown",   "ship",     "storm",    "horse",
  "eagle",    "cave",    "treasure", "lantern",  "shadow",
];
const WORDS_B = [
  "garden", "mirror", "clock",  "bell",   "door",
  "key",    "candle", "wizard", "throne", "fountain",
];

const STORY_METHOD_IMAGE = require("../../assets/images/story-method-memory-test.jpg");

function buildWordSet(isFirst: boolean, prev: string[]): string[] {
  if (isFirst) return [...WORDS_A];
  return [...prev.slice(0, 10), ...WORDS_B];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemoryTestSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  type Phase = "countdown" | "show" | "recall" | "result";
  const TOTAL     = 20;
  const SHOW_SECS = 40;
  const WORD_INTERVAL_MS = (SHOW_SECS / TOTAL) * 1000;
  const WORD_GAP_MS = 140;

  const [started,    setStarted]    = useState(false);
  const [isFirst,    setIsFirst]    = useState(true);
  const [phase,      setPhase]      = useState<Phase>("countdown");
  const [words,      setWords]      = useState<string[]>([]);
  const [wordIdx,    setWordIdx]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(SHOW_SECS);
  const [countdown,  setCountdown]  = useState(3);
  const [wordVisible, setWordVisible] = useState(true);
  const [inputs,     setInputs]     = useState<string[]>(Array(TOTAL).fill(""));
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [firstScore, setFirstScore] = useState<number | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (phase !== "show" || !started) return;
    if (wordIdx >= TOTAL) { setPhase("recall"); return; }

    setWordVisible(true);
    const hideTimer = setTimeout(() => setWordVisible(false), WORD_INTERVAL_MS - WORD_GAP_MS);
    const advanceTimer = setTimeout(() => {
      if (wordIdx >= TOTAL - 1) {
        setPhase("recall");
        return;
      }
      setWordIdx((i) => i + 1);
      setWordVisible(true);
    }, WORD_INTERVAL_MS);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(advanceTimer);
    };
  }, [WORD_GAP_MS, WORD_INTERVAL_MS, phase, wordIdx, started]);

  useEffect(() => {
    if (phase !== "show" || !started || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((n) => {
      if (n <= 1) {
        setPhase("recall");
        return 0;
      }
      return n - 1;
    }), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, started]);

  useEffect(() => {
    if (phase !== "countdown" || !started) return;

    const t = setTimeout(() => {
      setCountdown((n) => {
        if (n <= 1) {
          setPhase("show");
          return 0;
        }
        return n - 1;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [phase, countdown, started]);

  useEffect(() => {
    if (phase !== "recall") return;
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, [phase]);

  function start(first: boolean, prev: string[]) {
    const w = buildWordSet(first, prev);
    setWords(w);
    setWordIdx(0);
    setTimeLeft(SHOW_SECS);
    setCountdown(3);
    setWordVisible(true);
    setInputs(Array(TOTAL).fill(""));
    setCorrectSet(new Set());
    setPhase("countdown");
    setStarted(true);
  }

  function check() {
    const wSet = new Set(words.map((w) => w.toLowerCase()));
    const hit  = new Set(
      inputs.map((s) => s.trim().toLowerCase()).filter((w) => wSet.has(w))
    );
    // Save first-attempt score once, before moving to result
    if (isFirst && firstScore === null) setFirstScore(hit.size);
    setCorrectSet(hit);
    setPhase("result");
  }

  function tryAgain() {
    setIsFirst(false);
    start(false, words);
  }

  const filled = inputs.filter((s) => s.trim()).length;
  const score  = correctSet.size;
  const delta  = firstScore !== null ? score - firstScore : 0;
  const progress = Math.max(0, Math.min(100, ((SHOW_SECS - timeLeft) / SHOW_SECS) * 100));

  return (
    <View nativeID="memory-test" style={[ts.section, isMobile && ts.sectionMobile]}>
      <View style={ts.inner}>

        {/* ── Section header — always visible ─────────────────────────────── */}
        <View style={[ts.head, isMobile && ts.headMobile]}>
          <Text style={ts.eyebrow}>Memory Test</Text>
          <Text style={[ts.h2, isMobile && ts.h2Mobile]}>How good is your memory?</Text>
          <Text style={[ts.subText, isMobile && ts.subTextMobile]}>
            20 words appear one by one over 40 seconds.{"\n"}
            Memorise as many as you can, then type them all back.{"\n"}
            Get a technique — and try again.
          </Text>
        </View>

        {/* ── CTA — shown before test starts ──────────────────────────────── */}
        {!started && (
          <TouchableOpacity
            style={[ts.primaryButton, isMobile && ts.primaryButtonMobile]}
            onPress={() => start(isFirst, words)}
          >
            <Feather name="play" size={15} color="#FFFFFF" />
            <Text style={ts.primaryButtonText}>Start Memory Test</Text>
          </TouchableOpacity>
        )}

        {/* ── Test card — appears once started ────────────────────────────── */}
        {started && (
          <View style={[ts.card, isMobile && ts.cardMobile]}>

            {phase === "countdown" && (
              <View style={[ts.countdownPanel, isMobile && ts.countdownPanelMobile]}>
                <Text style={ts.countdownKicker}>Get ready</Text>
                <Text style={[ts.countdownNumber, isMobile && ts.countdownNumberMobile]}>{countdown}</Text>
                <Text style={ts.countdownText}>Words begin after the countdown.</Text>
              </View>
            )}

            {/* SHOW WORDS */}
            {phase === "show" && wordIdx < TOTAL && (
              <View style={[ts.playPanel, isMobile && ts.playPanelMobile]}>
                <View style={ts.playTimerRow}>
                  <View style={ts.progressTrack}>
                    <View style={[ts.progressFill, { width: `${progress}%` as any }]} />
                  </View>
                  <Text style={ts.timerText}>{timeLeft}s</Text>
                </View>

                <View style={ts.playTop}>
                  <View style={ts.statTile}>
                    <Text style={ts.statValue}>{wordIdx + 1}</Text>
                    <Text style={ts.statLabel}>Word</Text>
                  </View>
                  <View style={ts.statTile}>
                    <Text style={ts.statValue}>{TOTAL}</Text>
                    <Text style={ts.statLabel}>Total</Text>
                  </View>
                  <View style={ts.statTile}>
                    <Text style={ts.statValue}>2s</Text>
                    <Text style={ts.statLabel}>Each</Text>
                  </View>
                </View>

                <View style={[ts.wordStage, isMobile && ts.wordStageMobile]}>
                  <Text key={wordIdx} style={[ts.wordDisplay, isMobile && ts.wordDisplayMobile, !wordVisible && ts.wordDisplayHidden]}>
                    {words[wordIdx]}
                  </Text>
                </View>

                <Text style={ts.wordCounter}>Memorise the word. It will clear before the next one.</Text>
              </View>
            )}

            {/* RECALL */}
            {phase === "recall" && (
              <View style={[ts.recallPanel, isMobile && ts.recallPanelMobile]}>
                <View style={[ts.panelHeader, isMobile && ts.panelHeaderMobile]}>
                  <View style={ts.panelTitleWrap}>
                    <Text style={ts.kicker}>Recall</Text>
                    <Text style={[ts.panelTitle, isMobile && ts.panelTitleMobile]}>Type every word you remember</Text>
                  </View>
                  <View style={[ts.settingsIcon, isMobile && ts.settingsIconMobile]}>
                    <Feather name="edit-3" size={18} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[ts.phaseText, isMobile && ts.phaseTextMobile]}>{"One word per box — order doesn't matter."}</Text>
                <View style={[ts.inputGrid, isMobile && ts.inputGridMobile]}>
                  {inputs.map((val, i) => (
                    <View key={i} style={ts.recallBoxWrap}>
                      <Text style={ts.recallBoxIndex}>{i + 1}</Text>
                      <TextInput
                        ref={(el) => { inputRefs.current[i] = el; }}
                        value={val}
                        placeholder="word"
                        placeholderTextColor="rgba(255,255,255,0.24)"
                        autoFocus={i === 0}
                        onChangeText={(value) => {
                          const next = [...inputs];
                          next[i] = value.replace(/[^a-zA-Z]/g, "");
                          setInputs(next);
                        }}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === "Enter") {
                            if (i < TOTAL - 1) {
                              inputRefs.current[i + 1]?.focus();
                            } else {
                              check();
                            }
                          }
                        }}
                        style={ts.recallBoxInput}
                      />
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={[ts.primaryButtonInline, isMobile && ts.primaryButtonInlineMobile]} onPress={check}>
                  <Feather name="check" size={15} color="#FFFFFF" />
                  <Text style={ts.primaryButtonText}>
                    Check — {filled} {filled === 1 ? "word" : "words"} entered
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RESULT */}
            {phase === "result" && (
              <View style={ts.recallPanel}>

                {/* Score */}
                <View style={ts.scoreRow}>
                  <Text style={[ts.scoreNum, isMobile && ts.scoreNumMobile]}>{score}</Text>
                  <Text style={ts.scoreDenom}> / {TOTAL}</Text>
                </View>
                <Text style={[ts.phaseTitle, isMobile && ts.phaseTitleMobile]}>
                  {score >= 16 ? "Exceptional recall." :
                   score >= 12 ? "Strong memory."      :
                   score >= 8  ? "Good start."          :
                                 "Room to grow."}
                </Text>

                {/* ── Score comparison — second attempt+ only ───────────── */}
                {!isFirst && firstScore !== null && (
                  <View style={ts.compareWrap}>
                    <View style={ts.compareScoreRow}>
                      <View style={ts.compareBox}>
                        <Text style={ts.compareBoxLabel}>1st try</Text>
                        <Text style={ts.compareBoxNum}>{firstScore}</Text>
                        <Text style={ts.compareBoxDenom}>/20</Text>
                      </View>
                      <Text style={ts.compareArrow}>→</Text>
                      <View style={[ts.compareBox, ts.compareBoxActive]}>
                        <Text style={ts.compareBoxLabel}>This try</Text>
                        <Text style={[ts.compareBoxNum, ts.compareBoxNumHighlight]}>{score}</Text>
                        <Text style={ts.compareBoxDenom}>/20</Text>
                      </View>
                    </View>
                    {delta > 0 && (
                      <Text style={ts.compareDelta}>
                        ↑ {delta} more word{delta !== 1 ? "s" : ""} — the technique is working.
                      </Text>
                    )}
                    {delta === 0 && (
                      <Text style={ts.compareDeltaNeutral}>Same score — consistency is a start.</Text>
                    )}
                    {delta < 0 && (
                      <Text style={ts.compareDeltaNeutral}>↓ Happens — keep practising.</Text>
                    )}
                  </View>
                )}

                {/* Word breakdown — ✓ remembered / ✗ missed */}
                <View style={[ts.wordResultGrid, isMobile && ts.wordResultGridMobile]}>
                  {words.map((w) => {
                    const hit = correctSet.has(w.toLowerCase());
                    return (
                      <View key={w} style={[ts.wordResultChip, hit ? ts.wordResultHit : ts.wordResultMiss]}>
                        <Text style={[ts.wordResultText, hit ? ts.wordResultTextHit : ts.wordResultTextMiss]}>
                          {hit ? "✓ " : "✗ "}{w}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* ── First attempt: story method tip + try again ───────── */}
                {isFirst && (
                  <>
                    <Text style={ts.tipIntro}>
                      {"There's a technique that helps you remember more."}
                    </Text>
                    <View style={ts.tipBox}>
                      <Text style={ts.eyebrowGold}>Story Method</Text>
                      <Text style={ts.chunkText}>
                        Link each word to the next in one vivid, ridiculous story.{" "}
                        <Text style={ts.emphasisBold}>The more absurd and visual, the stronger it sticks.</Text>
                      </Text>
                      <View style={[ts.storyImageFrame, isMobile && ts.storyImageFrameMobile]}>
                        <Image
                          source={STORY_METHOD_IMAGE}
                          style={ts.storyImage}
                          resizeMode="contain"
                          accessibilityLabel="Illustrated story chain: dragon destroys bridge, bridge debris breaks castle, river flows through castle, sword slashes the river."
                        />
                      </View>
                      <Text style={ts.chunkNote}>
                        Picture a dragon destroying a bridge, debris crashing into a castle, a river flowing from its gate, and a sword splitting that river in half: one connected scene, five words locked in.
                      </Text>
                    </View>
                    <TouchableOpacity style={[ts.btn, ts.btnPrimary]} onPress={tryAgain}>
                      <Text style={ts.btnPrimaryText}>Try again</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ── Second attempt+: comparison shown above, CTA here ─── */}
                {!isFirst && (
                  <>
                    <Text style={ts.ctaHook}>
                      {"Memory isn't genetics."}{"\n"}{"It's a trainable skill."}
                    </Text>
                    <View style={ts.resultBtnRow}>
                      <TouchableOpacity style={[ts.btn, ts.btnSecondary]} onPress={tryAgain}>
                        <Text style={ts.btnSecondaryText}>Try again</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[ts.btn, ts.btnPrimary]} onPress={() => router.push("/login")}>
                        <Text style={ts.btnPrimaryText}>Get started →</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

              </View>
            )}

          </View>
        )}

      </View>
    </View>
  );
}
