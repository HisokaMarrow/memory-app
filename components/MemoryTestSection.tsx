import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { test as ts, WORD_INPUT_STYLE } from "../styles/main";

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

function buildWordSet(isFirst: boolean, prev: string[]): string[] {
  if (isFirst) return [...WORDS_A];
  return [...prev.slice(0, 10), ...WORDS_B];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemoryTestSection() {
  type Phase = "show" | "recall" | "result";
  const TOTAL     = 20;
  const SHOW_SECS = 40;

  const [started,    setStarted]    = useState(false);
  const [isFirst,    setIsFirst]    = useState(true);
  const [phase,      setPhase]      = useState<Phase>("show");
  const [words,      setWords]      = useState<string[]>([]);
  const [wordIdx,    setWordIdx]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(SHOW_SECS);
  const [inputs,     setInputs]     = useState<string[]>(Array(TOTAL).fill(""));
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [firstScore, setFirstScore] = useState<number | null>(null);

  // Advance one word every 2 s; move to recall when all shown
  useEffect(() => {
    if (phase !== "show" || !started) return;
    if (wordIdx >= TOTAL) { setPhase("recall"); return; }
    const t = setTimeout(() => setWordIdx((i) => i + 1), (SHOW_SECS / TOTAL) * 1000);
    return () => clearTimeout(t);
  }, [phase, wordIdx, started]);

  // Countdown tick
  useEffect(() => {
    if (phase !== "show" || !started || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, started]);

  function start(first: boolean, prev: string[]) {
    const w = buildWordSet(first, prev);
    setWords(w);
    setWordIdx(0);
    setTimeLeft(SHOW_SECS);
    setInputs(Array(TOTAL).fill(""));
    setCorrectSet(new Set());
    setPhase("show");
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

  return (
    <View nativeID="memory-test" style={ts.section}>
      <View style={ts.inner}>

        {/* ── Section header — always visible ─────────────────────────────── */}
        <View style={ts.head}>
          <Text style={ts.eyebrow}>Memory Test</Text>
          <Text style={ts.h2}>How good is your memory?</Text>
          <Text style={ts.subText}>
            20 words appear one by one over 40 seconds.{"\n"}
            Memorise as many as you can, then type them all back.{"\n"}
            Get a technique — and try again.
          </Text>
        </View>

        {/* ── CTA — shown before test starts ──────────────────────────────── */}
        {!started && (
          <TouchableOpacity
            style={[ts.btn, ts.btnPrimary]}
            onPress={() => start(isFirst, words)}
          >
            <Text style={ts.btnPrimaryText}>Test your memory →</Text>
          </TouchableOpacity>
        )}

        {/* ── Test card — appears once started ────────────────────────────── */}
        {started && (
          <View style={ts.card}>

            {/* SHOW WORDS */}
            {phase === "show" && wordIdx < TOTAL && (
              <View style={ts.phaseWrap}>
                <Text style={ts.eyebrowGold}>{wordIdx + 1} / {TOTAL}</Text>
                <View style={ts.wordTimerTrack}>
                  <View style={[ts.wordTimerFill, { width: `${(timeLeft / SHOW_SECS) * 100}%` as any }]} />
                </View>
                <Text key={wordIdx} style={ts.wordBig}>{words[wordIdx]}</Text>
                <Text style={ts.wordCounter}>{timeLeft}s remaining</Text>
              </View>
            )}

            {/* RECALL */}
            {phase === "recall" && (
              <View style={ts.phaseWrap}>
                <Text style={ts.eyebrowGold}>Type every word you remember</Text>
                <Text style={ts.phaseText}>One word per box — order doesn't matter</Text>
                <View style={ts.inputGrid}>
                  {inputs.map((val, i) => (
                    <input
                      key={i}
                      value={val}
                      placeholder={String(i + 1)}
                      // @ts-ignore — web-only
                      autoFocus={i === 0}
                      onChange={(e) => {
                        const next = [...inputs];
                        next[i] = e.target.value.replace(/[^a-zA-Z]/g, "");
                        setInputs(next);
                      }}
                      style={WORD_INPUT_STYLE}
                    />
                  ))}
                </View>
                <TouchableOpacity style={[ts.btn, ts.btnPrimary]} onPress={check}>
                  <Text style={ts.btnPrimaryText}>
                    Check — {filled} {filled === 1 ? "word" : "words"} entered
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RESULT */}
            {phase === "result" && (
              <View style={ts.phaseWrap}>

                {/* Score */}
                <View style={ts.scoreRow}>
                  <Text style={ts.scoreNum}>{score}</Text>
                  <Text style={ts.scoreDenom}> / {TOTAL}</Text>
                </View>
                <Text style={ts.phaseTitle}>
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
                <View style={ts.wordResultGrid}>
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
                      There's a technique that helps you remember more.
                    </Text>
                    <View style={ts.tipBox}>
                      <Text style={ts.eyebrowGold}>Story Method</Text>
                      <Text style={ts.chunkText}>
                        Link each word to the next in one vivid, ridiculous story.{" "}
                        <Text style={ts.emphasisBold}>The more absurd and visual, the stronger it sticks.</Text>
                      </Text>
                      <Text style={ts.chunkNote}>
                        Example: "{words.slice(0, 5).join(" → ")}" — one scene, five words locked in.
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
                      Memory isn't genetics.{"\n"}It's a trainable skill.
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
