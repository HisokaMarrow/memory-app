import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, ScrollView } from "react-native";
import { router } from "expo-router";

import { s as hs }  from "../styles/header";
import { s as fs }  from "../styles/footer";
import { hero, test, train, howItWorks, dashboard, vault, cta } from "../styles/landing";
import { NAV_H } from "../styles/theme";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const ALL_WORDS = [
  "cloud","piano","tree","shoe","cat",
  "hat","duck","star","box","cup",
  "water","horse","grass","lion","robot",
  "rain","bird","egg","bag","apple",
];

const CATEGORIES = [
  {
    icon: "🧠", title: "Memory",
    desc: "Build a memory that doesn't let you down. Recall numbers, words, faces, and sequences under pressure.",
    games: ["Number Memory","Word Recall","Card Pairs","Name & Face"],
    bg: "#EAF5EE",
  },
  {
    icon: "⚡", title: "Mathematics",
    desc: "Think in numbers without reaching for your phone. Fast arithmetic, mental shortcuts, calendar calculations.",
    games: ["Mental Arithmetic","Fast Math","Doomsday Calendar"],
    bg: "#FDF0E8",
  },
  {
    icon: "📝", title: "Words",
    desc: "Speak and write with precision. Build vocabulary, find words faster, and think more clearly under pressure.",
    games: ["Word Builder","Anagrams","Speed Vocab"],
    bg: "#FAF5E4",
  },
  {
    icon: "🔷", title: "Logic",
    desc: "Sharpen your reasoning and pattern recognition. Train the thinking behind the thinking.",
    games: ["Pattern Sequences","Riddles","Lateral Thinking"],
    bg: "#EEF2FF",
  },
];

const STEPS = [
  {
    num: "01", icon: "🎯",
    title: "Pick a goal",
    desc: "Choose what you want to improve — memory, maths, or language. Set a concrete target.",
    example: "e.g.  Remember 20 digits in sequence",
  },
  {
    num: "02", icon: "⏱",
    title: "Train daily — 5 minutes",
    desc: "Three short games chosen for your goal. No filler. Every session moves you forward.",
    example: "e.g.  Number Memory → Word Builder → Mental Math",
  },
  {
    num: "03", icon: "📈",
    title: "Track your progress",
    desc: "See your scores improve over time. The dashboard makes progress undeniable.",
    example: "e.g.  Week 1: 8 digits  →  Week 4: 14 digits",
  },
];

const TECHNIQUES = [
  {
    tag: "CHUNKING",
    title: "Break it into groups",
    desc: "Long sequences become easy when you chunk them into groups of 3–4. Your brain handles groups better than streams.",
    example: "748 396 21  instead of  74839621",
  },
  {
    tag: "MEMORY PALACE",
    title: "Anchor to locations",
    desc: "Place each item you need to remember at a location in a familiar space. Walk through it mentally to recall.",
    example: "The front door is PIANO. The sofa is HORSE. The window is RAIN.",
  },
  {
    tag: "VIVID ASSOCIATION",
    title: "Make it impossible to forget",
    desc: "The stranger, larger, and more absurd the mental image, the more permanent the memory.",
    example: "A CLOUD driving a PIANO through a TREE",
  },
];

const GRAPH_DATA = [
  { day: "Mon", h: 30 }, { day: "Tue", h: 45 }, { day: "Wed", h: 38 },
  { day: "Thu", h: 55 }, { day: "Fri", h: 48 }, { day: "Sat", h: 70 },
  { day: "Sun", h: 85, active: true },
];

const FOOTER_COLS = [
  { title: "Train",    links: ["Games","Vault","Daily Plan","Techniques"]         },
  { title: "Account",  links: ["Sign In","Create Account"]                        },
  { title: "Company",  links: ["About","Contact","Privacy","Terms"]               },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Header
// ─────────────────────────────────────────────────────────────────────────────
function Header({ scrolled, scrollRef }: { scrolled: boolean; scrollRef: React.RefObject<ScrollView> }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <View style={[hs.root, scrolled && hs.rootScrolled]}>
      <View style={hs.inner}>
        <TouchableOpacity style={hs.logo}
          onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <View style={hs.logoMark}><Text style={hs.logoMarkGlyph}>◆</Text></View>
          <Text style={hs.logoName}>MEMORO</Text>
        </TouchableOpacity>

        <View style={hs.nav}>
          {[["How it Works","about"],["Memory Test","test"],["Vault","vault"]].map(([label, id]) => (
            <TouchableOpacity key={label} onPress={() => scrollTo(id)}>
              <Text style={hs.navLink}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={hs.btnRow}>
          <TouchableOpacity style={hs.btnGhost} onPress={() => router.push("/login")}>
            <Text style={hs.btnGhostText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={hs.btnFilled} onPress={() => router.push("/login")}>
            <Text style={hs.btnFilledText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Hero
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Inject video into the hero video container
    const container = document.getElementById("hero-video-box");
    if (container) {
      const v = document.createElement("video");
      v.src = "/hero.mp4";
      v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
      Object.assign(v.style, {
        width:"100%", height:"100%", objectFit:"cover", display:"block",
      });
      container.appendChild(v);
      return () => { v.remove(); };
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue:1, duration:1000, useNativeDriver:true }),
      Animated.timing(rise, { toValue:0, duration:900, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <View style={hero.root}>
      <View style={hero.inner}>

        {/* Left — text */}
        <Animated.View style={[hero.left, { opacity:fade, transform:[{translateY:rise}] }]}>
          <Text style={hero.eyebrow}>DAILY MENTAL TRAINING</Text>
          <Text style={hero.headline}>Train your mind{"\n"}in minutes a day</Text>
          <Text style={hero.sub}>
            Short, structured daily sessions for memory, maths, and language.
            See measurable improvement from day one.
          </Text>
          <View style={hero.btnRow}>
            <TouchableOpacity style={hero.btnPrimary} onPress={() => router.push("/login")}>
              <Text style={hero.btnPrimaryText}>Start Training →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={hero.btnSecondary}
              onPress={() => document.getElementById("test")?.scrollIntoView({ behavior:"smooth" })}>
              <Text style={hero.btnSecondaryText}>Try 1-Minute Test</Text>
            </TouchableOpacity>
          </View>
          <View style={hero.proof}>
            <View style={hero.proofAvatars}>
              {["A","B","C","D"].map((l, i) => (
                <View key={l} style={[hero.proofAvatar, i===0 && hero.proofAvatarFirst]}>
                  <Text style={hero.proofAvatarText}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={hero.proofText}>
              <Text style={hero.proofHighlight}>2 400+ people</Text>{"  "}training their minds daily
            </Text>
          </View>
        </Animated.View>

        {/* Right — video */}
        <Animated.View style={[hero.right, { opacity:fade }]}>
          <View style={hero.videoWrap}>
            <View nativeID="hero-video-box" style={{ flex:1 }} />
            <View style={hero.videoOverlayBadge}>
              <View style={hero.badgeDot} />
              <Text style={hero.badgeText}>Focus training in progress</Text>
            </View>
          </View>
        </Animated.View>

      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Interactive test (before → technique → after)
// ─────────────────────────────────────────────────────────────────────────────
type TestPhase =
  | "intro"
  | "test1_show" | "test1_recall" | "test1_result"
  | "technique"
  | "test2_show" | "test2_recall"
  | "compare";

function InteractiveTestSection() {
  const [phase,     setPhase]     = useState<TestPhase>("intro");
  const [words1,    setWords1]    = useState<string[]>([]);
  const [words2,    setWords2]    = useState<string[]>([]);
  const [pool,      setPool]      = useState<string[]>([]);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [score1,    setScore1]    = useState(0);
  const [score2,    setScore2]    = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(15);

  const isShowPhase = phase === "test1_show" || phase === "test2_show";

  useEffect(() => {
    if (!isShowPhase) return;
    if (timeLeft <= 0) {
      setPhase(phase === "test1_show" ? "test1_recall" : "test2_recall");
      return;
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  function startTest() {
    const sh = shuffle(ALL_WORDS);
    setWords1(sh.slice(0, 5));
    setWords2(sh.slice(5, 10));
    setPool(shuffle(ALL_WORDS));
    setSelected(new Set());
    setTimeLeft(15);
    setPhase("test1_show");
  }

  function toggle(word: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  }

  function submitRecall(round: 1 | 2) {
    const words = round === 1 ? words1 : words2;
    const correct = [...selected].filter(w => words.includes(w)).length;
    if (round === 1) {
      setScore1(correct);
      setPhase("test1_result");
    } else {
      setScore2(correct);
      setPhase("compare");
    }
    setSelected(new Set());
  }

  const progress = `${(timeLeft / 15) * 100}%`;
  const improvementWords = phase === "technique"
    ? words2 : [];

  return (
    <View nativeID="test" style={test.root}>
      <View style={test.inner}>
        <Text style={test.label}>TRY IT NOW</Text>
        <Text style={test.headline}>See the difference a technique makes</Text>
        <Text style={test.sub}>
          One test without technique. One tip. One test with it.
          Watch your score change in under 2 minutes.
        </Text>
        <View style={test.card}>
          <View style={test.cardPad}>

            {/* INTRO */}
            {phase === "intro" && (
              <>
                <Text style={test.pill}>ROUND 1 — NO TECHNIQUE</Text>
                <Text style={test.title}>Memorise 5 words</Text>
                <Text style={test.body}>
                  You'll have 15 seconds. Just read them — no tricks, no strategy.
                  See how many you naturally remember.
                </Text>
                <TouchableOpacity style={test.primaryBtn} onPress={startTest}>
                  <Text style={test.primaryBtnText}>Start the test →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TEST 1 — SHOW */}
            {phase === "test1_show" && (
              <>
                <Text style={test.pill}>MEMORISE</Text>
                <View style={test.timerRow}>
                  <Text style={test.timerNum}>{timeLeft}</Text>
                  <Text style={test.timerLabel}>seconds</Text>
                </View>
                <View style={test.timerTrack}>
                  <View style={[test.timerFill, { width: progress as any }]} />
                </View>
                <View style={test.wordGrid}>
                  {words1.map(w => (
                    <View key={w} style={test.wordPill}>
                      <Text style={test.wordPillText}>{w}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={test.ghostBtn} onPress={() => setPhase("test1_recall")}>
                  <Text style={test.ghostBtnText}>I'm ready →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TEST 1 — RECALL */}
            {phase === "test1_recall" && (
              <>
                <Text style={test.pill}>RECALL</Text>
                <Text style={test.title}>Tap the words you saw</Text>
                <View style={test.wordGrid}>
                  {pool.slice(0, 12).map(w => {
                    const on = selected.has(w);
                    return (
                      <TouchableOpacity key={w}
                        style={[test.recallPill, on && test.recallPillOn]}
                        onPress={() => toggle(w)}>
                        <Text style={[test.recallPillText, on && test.recallPillTextOn]}>{w}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={[test.primaryBtn, selected.size === 0 && test.btnOff]}
                  onPress={() => submitRecall(1)}
                  disabled={selected.size === 0}>
                  <Text style={test.primaryBtnText}>Submit</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TEST 1 — RESULT + TECHNIQUE */}
            {phase === "test1_result" && (
              <>
                <Text style={test.pill}>ROUND 1 RESULT</Text>
                <Text style={[test.timerNum, { fontSize: 72, lineHeight: 76 }]}>{score1}/5</Text>
                <Text style={test.title}>
                  {score1 >= 4 ? "Strong natural memory." : score1 >= 2 ? "Average — very normal." : "That's a starting point."}
                </Text>
                <View style={test.tipCard}>
                  <View style={test.tipHeader}>
                    <Text style={test.tipIcon}>💡</Text>
                    <Text style={test.tipTitle}>Technique: Visual Story</Text>
                  </View>
                  <Text style={test.tipBody}>
                    String the words together as a vivid, absurd mental story.
                    The more ridiculous the image, the harder it is to forget.
                  </Text>
                  <Text style={test.tipChain}>
                    "{words2[0]} teaches {words2[1]} to ride a {words2[2]}.
                    Meanwhile a {words2[3]} holds a {words2[4]}."
                  </Text>
                </View>
                <TouchableOpacity style={test.primaryBtn} onPress={() => { setTimeLeft(15); setPhase("test2_show"); }}>
                  <Text style={test.primaryBtnText}>Now try Round 2 →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TEST 2 — SHOW */}
            {phase === "test2_show" && (
              <>
                <Text style={test.pill}>ROUND 2 — USE THE TECHNIQUE</Text>
                <View style={test.timerRow}>
                  <Text style={test.timerNum}>{timeLeft}</Text>
                  <Text style={test.timerLabel}>seconds — build your story</Text>
                </View>
                <View style={test.timerTrack}>
                  <View style={[test.timerFill, { width: progress as any }]} />
                </View>
                <View style={test.wordGrid}>
                  {words2.map(w => (
                    <View key={w} style={test.wordPill}>
                      <Text style={test.wordPillText}>{w}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={test.ghostBtn} onPress={() => setPhase("test2_recall")}>
                  <Text style={test.ghostBtnText}>I'm ready →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TEST 2 — RECALL */}
            {phase === "test2_recall" && (
              <>
                <Text style={test.pill}>RECALL — ROUND 2</Text>
                <Text style={test.title}>Tap the words from your story</Text>
                <View style={test.wordGrid}>
                  {pool.slice(0, 12).map(w => {
                    const on = selected.has(w);
                    return (
                      <TouchableOpacity key={w}
                        style={[test.recallPill, on && test.recallPillOn]}
                        onPress={() => toggle(w)}>
                        <Text style={[test.recallPillText, on && test.recallPillTextOn]}>{w}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={[test.primaryBtn, selected.size === 0 && test.btnOff]}
                  onPress={() => submitRecall(2)}
                  disabled={selected.size === 0}>
                  <Text style={test.primaryBtnText}>Submit</Text>
                </TouchableOpacity>
              </>
            )}

            {/* COMPARE */}
            {phase === "compare" && (
              <>
                <Text style={test.pill}>BEFORE VS AFTER</Text>
                <View style={test.compareWrap}>
                  <View style={test.compareCard}>
                    <Text style={test.compareLabel}>ROUND 1</Text>
                    <Text style={test.compareScore}>{score1}/5</Text>
                    <Text style={test.compareSub}>No technique</Text>
                  </View>
                  <View style={test.compareArrow}>
                    <Text style={test.compareArrowText}>→</Text>
                  </View>
                  <View style={[test.compareCard, test.compareCardAfter]}>
                    <Text style={[test.compareLabel, test.compareLabelAfter]}>ROUND 2</Text>
                    <Text style={[test.compareScore, test.compareScoreAfter]}>{score2}/5</Text>
                    <Text style={test.compareSub}>With technique</Text>
                    {score2 > score1 && (
                      <View style={test.improveBadge}>
                        <Text style={test.improveBadgeText}>+{score2 - score1} word{score2 - score1 !== 1 ? "s" : ""}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={test.title}>
                  {score2 > score1
                    ? "Technique works. Now imagine months of training."
                    : "Close result — techniques take practice to click."}
                </Text>
                <View style={test.actions}>
                  <TouchableOpacity style={test.primaryBtn} onPress={() => router.push("/login")}>
                    <Text style={test.primaryBtnText}>Start Training →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={test.ghostBtn} onPress={() => setPhase("intro")}>
                    <Text style={test.ghostBtnText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  What You Train
// ─────────────────────────────────────────────────────────────────────────────
function WhatYouTrainSection() {
  return (
    <View nativeID="about" style={train.root}>
      <View style={train.inner}>
        <Text style={train.label}>WHAT YOU TRAIN</Text>
        <Text style={train.headline}>Four disciplines. One daily habit.</Text>
        <Text style={train.sub}>
          Not random games — a structured curriculum across the four pillars of a sharp mind.
        </Text>
        <View style={train.grid}>
          {CATEGORIES.map(cat => (
            <View key={cat.title} style={train.card}>
              <View style={[train.cardIconWrap, { backgroundColor: cat.bg }]}>
                <Text style={train.cardIcon}>{cat.icon}</Text>
              </View>
              <Text style={train.cardTitle}>{cat.title}</Text>
              <Text style={train.cardDesc}>{cat.desc}</Text>
              <View style={train.cardGames}>
                {cat.games.map(g => (
                  <View key={g} style={train.cardGameItem}>
                    <View style={train.cardGameDot} />
                    <Text style={train.cardGameText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  How It Works
// ─────────────────────────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <View style={howItWorks.root}>
      <View style={howItWorks.inner}>
        <Text style={howItWorks.label}>HOW IT WORKS</Text>
        <Text style={howItWorks.headline}>Simple. Structured. Effective.</Text>
        <Text style={howItWorks.sub}>
          No complicated setup. Start training in under a minute.
        </Text>
        <View style={howItWorks.stepsRow}>
          {STEPS.map(step => (
            <View key={step.num} style={howItWorks.step}>
              <View style={howItWorks.stepNumWrap}>
                <Text style={howItWorks.stepNum}>{step.num}</Text>
              </View>
              <Text style={howItWorks.stepIcon}>{step.icon}</Text>
              <Text style={howItWorks.stepTitle}>{step.title}</Text>
              <Text style={howItWorks.stepDesc}>{step.desc}</Text>
              <Text style={howItWorks.stepExample}>{step.example}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Dashboard Preview (mock)
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPreviewSection() {
  const maxH = Math.max(...GRAPH_DATA.map(d => d.h));
  return (
    <View style={dashboard.root}>
      <View style={dashboard.inner}>
        <Text style={dashboard.label}>PROGRESS & DASHBOARD</Text>
        <Text style={dashboard.headline}>Track every improvement</Text>
        <Text style={dashboard.sub}>
          Your progress is measured and visible. No guessing — just data showing you getting sharper.
        </Text>
        <View style={dashboard.mockWrap}>
          <View style={dashboard.mockBar}>
            {[1,2,3].map(i => <View key={i} style={dashboard.mockDot} />)}
          </View>
          <View style={dashboard.mockContent}>
            {/* Row 1 — Goal + Stats */}
            <View style={dashboard.mockRow}>
              <View style={dashboard.goalCard}>
                <Text style={dashboard.goalLabel}>CURRENT GOAL</Text>
                <Text style={dashboard.goalTitle}>Number Memory</Text>
                <View style={dashboard.goalProgress}>
                  <Text style={dashboard.goalCurrent}>12</Text>
                  <Text style={dashboard.goalTarget}>/ 20 digits</Text>
                </View>
                <View style={dashboard.goalBar}>
                  <View style={[dashboard.goalFill, { width: "60%" as any }]} />
                </View>
                <Text style={dashboard.goalNote}>
                  <Text style={dashboard.goalNoteGreen}>+4 digits</Text> gained this week · 60% to goal
                </Text>
              </View>
              <View style={dashboard.statCard}>
                <Text style={dashboard.statEmoji}>🔥</Text>
                <Text style={dashboard.statNum}>7</Text>
                <Text style={dashboard.statLabel}>Day streak</Text>
              </View>
              <View style={dashboard.statCard}>
                <Text style={dashboard.statEmoji}>⚡</Text>
                <Text style={dashboard.statNum}>340</Text>
                <Text style={dashboard.statLabel}>XP earned</Text>
              </View>
            </View>
            {/* Row 2 — Graph */}
            <View style={dashboard.graphCard}>
              <Text style={dashboard.graphTitle}>Score this week</Text>
              <View style={dashboard.graphBars}>
                {GRAPH_DATA.map(d => (
                  <View key={d.day}
                    style={[dashboard.graphBar, d.active && dashboard.graphBarActive,
                      { height: `${(d.h / maxH) * 100}%` as any }]}
                  />
                ))}
              </View>
              <View style={dashboard.graphDays}>
                {GRAPH_DATA.map(d => (
                  <Text key={d.day} style={dashboard.graphDay}>{d.day}</Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  Vault / Techniques
// ─────────────────────────────────────────────────────────────────────────────
function VaultSection() {
  return (
    <View nativeID="vault" style={vault.root}>
      <View style={vault.inner}>
        <Text style={vault.label}>THE VAULT</Text>
        <Text style={vault.headline}>Learn real techniques</Text>
        <Text style={vault.sub}>
          Games train your brain. The Vault teaches you the methods that unlock
          exponential improvement — the strategies used by memory champions.
        </Text>
        <View style={vault.grid}>
          {TECHNIQUES.map(t => (
            <View key={t.tag} style={vault.card}>
              <Text style={vault.cardTag}>{t.tag}</Text>
              <Text style={vault.cardTitle}>{t.title}</Text>
              <Text style={vault.cardDesc}>{t.desc}</Text>
              <Text style={vault.cardExample}>{t.example}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={vault.moreBtn} onPress={() => router.push("/login")}>
          <Text style={vault.moreBtnText}>Explore all techniques in the Vault →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  Final CTA
// ─────────────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <View style={cta.root}>
      <View style={cta.inner}>
        <Text style={cta.label}>START TODAY</Text>
        <Text style={cta.headline}>Your sharper mind{"\n"}is 5 minutes away</Text>
        <Text style={cta.sub}>Free to start. No credit card. Cancel any time.</Text>
        <TouchableOpacity style={cta.btn} onPress={() => router.push("/login")}>
          <Text style={cta.btnText}>Start your training →</Text>
        </TouchableOpacity>
        <Text style={cta.note}>Join 2 400+ people training daily</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9.  Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <View style={fs.root}>
      <View style={fs.inner}>
        <View style={fs.brand}>
          <View style={fs.logo}>
            <View style={fs.logoMark}><Text style={fs.logoGlyph}>◆</Text></View>
            <Text style={fs.logoName}>MEMORO</Text>
          </View>
          <Text style={fs.tagline}>
            A calm, structured system that trains memory, maths,
            and thinking through short daily sessions with visible progress.
          </Text>
          <Text style={fs.copy}>© {new Date().getFullYear()} Memoro. All rights reserved.</Text>
        </View>
        <View style={fs.cols}>
          {FOOTER_COLS.map(col => (
            <View key={col.title} style={fs.col}>
              <Text style={fs.colTitle}>{col.title.toUpperCase()}</Text>
              {col.links.map(l => (
                <TouchableOpacity key={l} onPress={() => router.push("/login")}>
                  <Text style={fs.colLink}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF8F3" }}>
      {/* Fixed header — sits above the ScrollView */}
      <Header scrolled={scrolled} scrollRef={scrollRef} />

      {/* Scrollable page content */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: NAV_H }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => setScrolled(e.nativeEvent.contentOffset.y > 40)}
      >
        <HeroSection />
        <InteractiveTestSection />
        <WhatYouTrainSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <VaultSection />
        <CTASection />
        <Footer />
      </ScrollView>
    </View>
  );
}
