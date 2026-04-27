// ─────────────────────────────────────────────────────────────────────────────
// Memoro — Landing Page
// Reusable across pages: NavBar, FooterSection, MemoryTestSection (components/)
// Landing-only sections live directly in this file.
// All styles come from styles/main.ts — zero inline styles.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { router } from "expo-router";

import {
  hero as hs2, train as trs, how as hw,
  dash as ds, vault as vs, cta as cs,
  layout, HOVER,
} from "../styles/main";

import NavBar            from "../components/NavBar";
import MemoryTestSection from "../components/MemoryTestSection";
import FooterSection     from "../components/FooterSection";

// ── Hero ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: require("../assets/images/icon-goal.png"),     title: "Daily Practice",  sub: "Build the habit"   },
  { icon: require("../assets/images/icon-progress.png"), title: "Track Progress",  sub: "See real results"  },
  { icon: require("../assets/images/icon-brain.png"),    title: "Stronger Mind",   sub: "Sharpen focus"     },
];

function HeroSection({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  return (
    <View style={hs2.section}>
      <Image source={require("../assets/images/hero.png")} style={hs2.heroBgImage} resizeMode="cover" />
      <View style={hs2.overlay} />
      <View style={hs2.content}>

        {/* Headline */}
        <Text style={hs2.h1}>
          Train your{"\n"}memory like{"\n"}
          <Text style={hs2.h1Em}>a skill.</Text>
        </Text>

        {/* Subtext */}
        <Text style={hs2.subText}>
          Remember numbers, names, anything.{"\n"}
          With daily practice, become unforgettable.
        </Text>

        {/* Buttons */}
        <View style={hs2.btnRow}>
          <TouchableOpacity
            style={hs2.btnPrimary}
            onPress={() => router.push("/login")}
            // @ts-ignore
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(232,93,42,0.35)"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <Text style={hs2.btnPrimaryText}>Start training</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={hs2.btnLink}
            onPress={() => onScrollTo("memory-test")}
            // @ts-ignore
            onMouseEnter={(e: any) => { e.currentTarget.style.color = "#121212"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.color = ""; }}
          >
            <Text style={hs2.btnLinkText}>Learn more →</Text>
          </TouchableOpacity>
        </View>

        {/* Feature strip */}
        <View style={hs2.featureStrip}>
          {FEATURES.map((f, i) => (
            <View key={f.title} style={[hs2.featureItem, i === 0 && hs2.featureItemFirst]}>
              <Image source={f.icon} style={hs2.featureIconImg} resizeMode="cover" />
              <Text style={hs2.featureTitle}>{f.title}</Text>
              <Text style={hs2.featureSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

      </View>
    </View>
  );
}

// ── Train Cards ───────────────────────────────────────────────────────────────
const CARDS = [
  { title: "Memory", icon: "🧠", desc: "Expand the limits of what your mind can hold and recall with precision.",  games: ["Number Sequence", "Face & Name", "Story Recall"],          badge: true  },
  { title: "Maths",  icon: "🔢", desc: "Build mental arithmetic speed and numerical intuition.",                   games: ["Mental Multiplication", "Number Bonds", "Speed Estimation"], badge: false },
  { title: "Words",  icon: "✍️", desc: "Strengthen vocabulary, verbal fluency and linguistic thinking.",           games: ["Word Builder", "Synonym Sprint", "Anagram Solver"],           badge: false },
  { title: "Logic",  icon: "🧩", desc: "Train systematic reasoning and pattern recognition.",                     games: ["Pattern Sequences", "Deduction Grids", "Lateral Puzzles"],    badge: false },
];

function TrainCardsSection() {
  return (
    <View nativeID="what-you-train" style={trs.section}>
      <View style={trs.inner}>
        <View style={trs.head}>
          <Text style={trs.eyebrow}>What You Train</Text>
          <Text style={trs.h2}>Four pillars of{"\n"}a sharper mind</Text>
        </View>
        <View style={trs.grid}>
          {CARDS.map((card) => (
            <View
              key={card.title}
              style={trs.card}
              // @ts-ignore
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = HOVER.cardHoverTransform; e.currentTarget.style.boxShadow = HOVER.cardHoverShadow; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              {card.badge && <View style={trs.cardBadge}><Text style={trs.cardBadgeText}>⭐ Popular</Text></View>}
              <View style={trs.cardIcon}><Text style={trs.cardIconText}>{card.icon}</Text></View>
              <Text style={trs.cardTitle}>{card.title}</Text>
              <Text style={trs.cardDesc}>{card.desc}</Text>
              <View style={trs.cardDivider}>
                <Text style={trs.cardExLabel}>Exercises</Text>
                {card.games.map((g) => (
                  <View key={g} style={trs.cardEx}>
                    <View style={trs.cardExDot} />
                    <Text style={trs.cardExText}>{g}</Text>
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

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: "🎯", title: "Choose a goal",            desc: "Select what matters most — sharper memory, faster maths, richer vocabulary, or clearer thinking." },
  { n: "02", icon: "🧘", title: "Train daily — 2 to 5 min", desc: "Focused micro-sessions, scientifically ordered for maximum cognitive transfer." },
  { n: "03", icon: "📈", title: "Track your progress",      desc: "Watch your scores, streaks and capabilities climb — with data that makes improvement visible." },
];

function HowItWorksSection() {
  const last = STEPS.length - 1;
  return (
    <View nativeID="how-it-works" style={hw.section}>
      <View style={hw.inner}>
        <View>
          <Text style={hw.eyebrow}>How It Works</Text>
          <Text style={hw.h2}>Simple to start.{"\n"}Built to last.</Text>
          <Text style={hw.subText}>
            Consistency over intensity. Five minutes a day outperforms one hour a week — every time.
          </Text>
        </View>
        <View>
          {STEPS.map((step, i) => (
            <View key={step.n} style={i < last ? hw.stepPad : hw.stepPadLast}>
              <View style={hw.stepRow}>
                <View style={hw.stepLeft}>
                  <View style={hw.stepIconWrap}><Text style={hw.stepIconText}>{step.icon}</Text></View>
                  {i < last && <View style={hw.stepLine} />}
                </View>
                <View style={hw.stepContent}>
                  <Text style={hw.stepNum}>STEP {step.n}</Text>
                  <Text style={hw.stepTitle}>{step.title}</Text>
                  <Text style={hw.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Dashboard Preview ─────────────────────────────────────────────────────────
const CHART_VALS = [45, 52, 48, 60, 58, 70, 67, 80, 75, 88, 85, 94];
const LAST_BAR   = CHART_VALS.length - 1;
const GOALS = [
  { label: "Memorise 20 digits",   pct: 85 },
  { label: "Mental Maths Level 5", pct: 62 },
  { label: "500 Vocabulary Words", pct: 44 },
];
const STATS = [
  { label: "Memory Digits", val: "17",    note: "↑ from 12", icon: "🧠" },
  { label: "Day Streak",    val: "23",    note: "days",       icon: "🔥" },
  { label: "XP Earned",     val: "1,840", note: "xp",         icon: "✨" },
  { label: "Exercises",     val: "312",   note: "total",      icon: "✅" },
];

function DashboardSection() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const el = document.getElementById("dashboard-section");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <View nativeID="dashboard-section" style={ds.section}>
      <View style={ds.inner}>
        <View style={ds.head}>
          <Text style={ds.eyebrow}>Progress Dashboard</Text>
          <Text style={ds.h2}>Watch yourself improve</Text>
        </View>
        <View style={ds.panel}>
          <View style={ds.statsGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={ds.statCard}>
                <View style={ds.statHeader}>
                  <Text style={ds.statLabel}>{s.label}</Text>
                  <Text style={ds.statIconText}>{s.icon}</Text>
                </View>
                <Text style={ds.statNum}>{s.val}</Text>
                <Text style={ds.statNote}>{s.note}</Text>
              </View>
            ))}
          </View>
          <View style={ds.chartsGrid}>
            <View style={ds.chartCard}>
              <Text style={ds.chartLabel}>Memory Score — Last 12 Sessions</Text>
              <View style={ds.chartBars}>
                {CHART_VALS.map((v, i) => (
                  <View key={i} style={[i === LAST_BAR ? ds.chartBarLast : ds.chartBarBase, { height: animated ? `${v}%` as any : "0%", transition: `height 0.6s ${(i * 0.04).toFixed(2)}s ease` as any }]} />
                ))}
              </View>
              <View style={ds.chartFooter}>
                <Text style={ds.chartFooterLabel}>Session 1</Text>
                <Text style={ds.chartFooterGold}>↑ +49 pts</Text>
              </View>
            </View>
            <View style={ds.chartCard}>
              <Text style={ds.goalsLabel}>Active Goals</Text>
              {GOALS.map((g, i) => (
                <View key={g.label} style={i < GOALS.length - 1 ? ds.goalRow : ds.goalRowLast}>
                  <View style={ds.goalHeader}>
                    <Text style={ds.goalTitle}>{g.label}</Text>
                    <Text style={ds.goalPct}>{g.pct}%</Text>
                  </View>
                  <View style={ds.goalTrack}>
                    <View style={[ds.goalFill, { width: animated ? `${g.pct}%` as any : "0%", transition: `width 0.8s ${(i * 0.15 + 0.3).toFixed(2)}s ease` as any }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Vault ─────────────────────────────────────────────────────────────────────
const TECHNIQUES = [
  { cat: "Memory",   title: "The Chunking Method",   desc: "Group information into meaningful clusters. Your working memory handles 7±2 items — chunking lets you hold more by treating groups as single units.", example: '"48 · 372 · 91" instead of "4 · 8 · 3 · 7 · 2 · 9 · 1"' },
  { cat: "Memory",   title: "Memory Palace",          desc: "Place information along a familiar mental route. Spatial memory is among the strongest — we can recall vivid locations for decades.",               example: "Walk through your home, placing each item to remember in each room."         },
  { cat: "Maths",    title: "Multiplication Bridges", desc: "Break hard multiplications into easier ones. 19×6 becomes (20×6)−6 = 114. Much faster mentally.",                                                   example: "47×8 → (50×8)−(3×8) = 400−24 = 376"                                        },
  { cat: "Language", title: "Etymology Mapping",      desc: "Learning root words unlocks clusters of vocabulary at once. One Latin root can decode 20+ English words instantly.",                                 example: '"port" (carry) → import, export, transport, portable, porter…'              },
];

function VaultSection() {
  const [active, setActive] = useState(0);
  const t = TECHNIQUES[active];
  return (
    <View nativeID="vault" style={vs.section}>
      <View style={vs.inner}>
        <View>
          <Text style={vs.eyebrow}>The Vault</Text>
          <Text style={vs.h2}>Real techniques,{"\n"}not tricks</Text>
          <Text style={vs.subText}>
            Every session teaches a proven cognitive method used by memory champions, chess grandmasters, and elite students.
          </Text>
          <View style={vs.tabList}>
            {TECHNIQUES.map((tech, i) => (
              <TouchableOpacity key={i} style={[vs.tab, active === i ? vs.tabActive : vs.tabInactive]} onPress={() => setActive(i)}>
                <View style={[vs.tabDot, active === i ? vs.tabDotActive : vs.tabDotInactive]} />
                <View>
                  <Text style={[vs.tabCat,   active === i ? vs.tabCatActive   : vs.tabCatInactive]}>{tech.cat}</Text>
                  <Text style={[vs.tabTitle, active === i ? vs.tabTitleActive : vs.tabTitleInactive]}>{tech.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[vs.detailCard, (vs as any)[`detailCardBg${active}`]]}>
          <Text style={vs.detailCat}>{t.cat}</Text>
          <Text style={vs.detailTitle}>{t.title}</Text>
          <Text style={vs.detailDesc}>{t.desc}</Text>
          <View style={vs.exampleBox}>
            <Text style={vs.exampleLabel}>Example</Text>
            <Text style={vs.exampleText}>{t.example}</Text>
          </View>
          <View style={vs.detailFooter}>
            <View style={vs.detailFooterIcon}><Text style={vs.checkIconText}>✓</Text></View>
            <Text style={vs.detailFooterText}>Part of your daily training session</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <View style={cs.section}>
      <View style={cs.inner}>
        <View style={cs.badge}>
          <View style={cs.badgeDot} />
          <Text style={cs.badgeText}>Free to start — no card required</Text>
        </View>
        <Text style={cs.h2}>
          The sharpest minds{"\n"}
          <Text style={cs.h2Em}>train daily.</Text>
        </Text>
        <Text style={cs.subText}>Five minutes. Every day. Measurable results.</Text>
        <TouchableOpacity
          style={cs.btn}
          onPress={() => router.push("/login")}
          // @ts-ignore
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = HOVER.ctaHoverTransform; e.currentTarget.style.boxShadow = HOVER.ctaHoverShadow; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = HOVER.ctaBaseShadow; }}
        >
          <Text style={cs.btnText}>Start Your Training</Text>
        </TouchableOpacity>
        <Text style={cs.note}>Joins 12,000+ daily learners · No credit card · Cancel anytime</Text>
      </View>
    </View>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <View style={layout.root}>
      <NavBar scrolled={scrolled} onNavClick={scrollToSection} />
      <ScrollView
        style={layout.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 60)}
      >
        <HeroSection       onScrollTo={scrollToSection} />
        <MemoryTestSection />
        <TrainCardsSection />
        <HowItWorksSection />
        <DashboardSection />
        <VaultSection />
        <CTASection />
        <FooterSection />
      </ScrollView>
    </View>
  );
}
