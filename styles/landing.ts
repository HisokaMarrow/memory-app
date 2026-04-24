import { StyleSheet } from "react-native";
import { C, FONT, SPACE, RADIUS, SHADOW, INNER } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO  (two-column: text left, video right)
// ─────────────────────────────────────────────────────────────────────────────
export const hero = StyleSheet.create({
  root: {
    backgroundColor: C.cream,
    paddingTop:      56,
    paddingBottom:   96,
  },
  inner: {
    ...INNER,
    flexDirection:  "row",
    alignItems:     "center",
    gap:            64,
  },

  // Left column
  left: {
    flex: 1,
    gap:  SPACE.md,
  },
  eyebrow: {
    ...FONT.label,
    color:           C.greenDeep,
    backgroundColor: C.greenBg,
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:    RADIUS.full,
    alignSelf:       "flex-start",
    overflow:        "hidden" as any,
  },
  headline: {
    ...FONT.hero,
    color: C.text,
  },
  sub: {
    ...FONT.bodyLg,
    color:    C.body,
    maxWidth: 480,
  },
  btnRow: {
    flexDirection: "row",
    gap:           14,
    marginTop:     8,
    flexWrap:      "wrap" as any,
  },
  btnPrimary: {
    backgroundColor: C.greenDeep,
    borderRadius:    RADIUS.md,
    paddingVertical:   17,
    paddingHorizontal: 32,
    boxShadow:       "0 4px 20px rgba(26,61,43,0.30)" as any,
  },
  btnPrimaryText: {
    ...FONT.body,
    fontWeight: "700" as const,
    color:      C.textInverse,
  },
  btnSecondary: {
    borderWidth:   1,
    borderColor:   C.border,
    borderRadius:  RADIUS.md,
    paddingVertical:   17,
    paddingHorizontal: 28,
    backgroundColor: C.white,
  },
  btnSecondaryText: {
    ...FONT.body,
    fontWeight: "600" as const,
    color:      C.body,
  },

  // Social proof
  proof: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
    marginTop:     4,
  },
  proofAvatars: {
    flexDirection: "row",
  },
  proofAvatar: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: C.greenBgMid,
    borderWidth:     2,
    borderColor:     C.cream,
    alignItems:      "center",
    justifyContent:  "center",
    marginLeft:      -8,
  },
  proofAvatarFirst: {
    marginLeft: 0,
  },
  proofAvatarText: {
    fontSize:   10,
    color:      C.greenDeep,
    fontWeight: "700" as const,
  },
  proofText: {
    ...FONT.small,
    color: C.muted,
  },
  proofHighlight: {
    ...FONT.small,
    fontWeight: "600" as const,
    color:      C.body,
  },

  // Right column — video container
  right: {
    flex:          1,
    maxWidth:      520,
    alignItems:    "flex-end",
  },
  videoWrap: {
    width:         "100%" as any,
    aspectRatio:   4 / 3,
    borderRadius:  RADIUS.xl,
    overflow:      "hidden",
    backgroundColor: C.creamMid,
    boxShadow:     SHADOW.video as any,
    position:      "relative" as any,
  },
  videoOverlayBadge: {
    position:        "absolute" as any,
    bottom:          20,
    left:            20,
    zIndex:          2,
    backgroundColor: "rgba(255,255,255,0.92)",
    backdropFilter:  "blur(12px)" as any,
    borderRadius:    RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical:   12,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             10,
    boxShadow:       SHADOW.sm as any,
  },
  badgeDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.greenBright,
  },
  badgeText: {
    ...FONT.small,
    fontWeight: "600" as const,
    color:      C.text,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. INTERACTIVE TEST  (before / after improvement)
// ─────────────────────────────────────────────────────────────────────────────
export const test = StyleSheet.create({
  root: {
    backgroundColor: C.white,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.md,
  },
  label: {
    ...FONT.label,
    color: C.greenMid,
  },
  headline: {
    ...FONT.h1,
    color:       C.text,
    textAlign:   "center",
  },
  sub: {
    ...FONT.bodyLg,
    color:     C.body,
    textAlign: "center",
    maxWidth:  520,
  },
  card: {
    width:           "100%" as any,
    maxWidth:        640,
    backgroundColor: C.cream,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.xl,
    overflow:        "hidden",
    boxShadow:       SHADOW.md as any,
  },
  cardPad: {
    padding:    40,
    alignItems: "center",
    gap:        SPACE.md,
  },
  pill: {
    ...FONT.label,
    color:           C.greenDeep,
    backgroundColor: C.greenBg,
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:    RADIUS.full,
    overflow:        "hidden" as any,
  },
  title: {
    ...FONT.h3,
    color:     C.text,
    textAlign: "center",
  },
  body: {
    ...FONT.body,
    color:     C.body,
    textAlign: "center",
    maxWidth:  440,
  },

  // Countdown timer
  timerRow: {
    alignItems: "center",
    gap:        2,
  },
  timerNum: {
    fontSize:   60,
    fontWeight: "800" as const,
    color:      C.greenDeep,
    lineHeight: 64,
  },
  timerLabel: {
    ...FONT.small,
    color: C.muted,
  },
  timerTrack: {
    width:           "100%" as any,
    maxWidth:        480,
    height:          5,
    borderRadius:    3,
    backgroundColor: C.border,
    overflow:        "hidden",
  },
  timerFill: {
    height:          "100%" as any,
    backgroundColor: C.greenBright,
    borderRadius:    3,
    transition:      "width 1s linear" as any,
  },

  // Word grid
  wordGrid: {
    flexDirection:  "row",
    flexWrap:       "wrap" as any,
    justifyContent: "center",
    gap:            8,
    maxWidth:       500,
  },
  wordPill: {
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical:   11,
    boxShadow:       SHADOW.xs as any,
  },
  wordPillText: {
    ...FONT.h4,
    color:      C.text,
    letterSpacing: 0.3,
  },
  recallPill: {
    borderWidth:     2,
    borderColor:     C.border,
    borderRadius:    RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical:   11,
    backgroundColor: C.white,
    cursor:          "pointer" as any,
    transition:      "all 0.12s" as any,
  },
  recallPillOn: {
    backgroundColor: C.greenBg,
    borderColor:     C.greenBright,
  },
  recallPillText: {
    ...FONT.body,
    fontWeight: "600" as const,
    color:      C.body,
  },
  recallPillTextOn: {
    color: C.greenDeep,
  },

  // Technique tip card
  tipCard: {
    width:           "100%" as any,
    backgroundColor: C.goldBg,
    borderWidth:     1,
    borderColor:     C.goldLight,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.md,
    gap:             10,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipTitle: {
    ...FONT.h4,
    color: C.goldText,
  },
  tipBody: {
    ...FONT.body,
    color:      C.goldText,
    lineHeight: 26,
    opacity:    0.85,
  },
  tipChain: {
    ...FONT.small,
    fontWeight: "600" as const,
    color:      C.goldText,
    fontStyle:  "italic",
    lineHeight: 22,
  },

  // Before / after comparison
  compareWrap: {
    width:         "100%" as any,
    flexDirection: "row",
    gap:           SPACE.md,
    alignItems:    "stretch",
  },
  compareCard: {
    flex:            1,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.md,
    alignItems:      "center",
    gap:             6,
  },
  compareCardAfter: {
    backgroundColor: C.greenBg,
    borderColor:     C.greenBright,
  },
  compareLabel: {
    ...FONT.label,
    color:      C.muted,
  },
  compareLabelAfter: {
    color: C.greenDeep,
  },
  compareScore: {
    fontSize:   44,
    fontWeight: "800" as const,
    color:      C.text,
    lineHeight: 48,
  },
  compareScoreAfter: {
    color: C.greenDeep,
  },
  compareSub: {
    ...FONT.small,
    color: C.muted,
  },
  compareArrow: {
    alignSelf:  "center",
    paddingTop: SPACE.lg,
  },
  compareArrowText: {
    fontSize: 24,
    color:    C.greenBright,
  },
  improveBadge: {
    backgroundColor: C.greenDeep,
    borderRadius:    RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical:   6,
    overflow:        "hidden" as any,
  },
  improveBadgeText: {
    ...FONT.small,
    fontWeight: "700" as const,
    color:      C.textInverse,
  },

  // Buttons
  primaryBtn: {
    width:           "100%" as any,
    maxWidth:        360,
    backgroundColor: C.greenDeep,
    borderRadius:    RADIUS.md,
    paddingVertical: 18,
    alignItems:      "center",
    boxShadow:       "0 4px 16px rgba(26,61,43,0.25)" as any,
  },
  primaryBtnText: {
    ...FONT.body,
    fontWeight: "700" as const,
    color:      C.textInverse,
  },
  btnOff: { opacity: 0.35 },
  ghostBtn: {
    paddingVertical: 10,
    alignItems:      "center",
    cursor:          "pointer" as any,
  },
  ghostBtnText: {
    ...FONT.small,
    color:      C.muted,
    fontWeight: "500" as const,
  },
  actions: {
    gap:       12,
    width:     "100%" as any,
    maxWidth:  360,
    alignItems: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. WHAT YOU TRAIN  (4 category cards)
// ─────────────────────────────────────────────────────────────────────────────
export const train = StyleSheet.create({
  root: {
    backgroundColor: C.creamMid,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.md,
  },
  label: {
    ...FONT.label,
    color: C.greenMid,
  },
  headline: {
    ...FONT.h1,
    color:     C.text,
    textAlign: "center",
  },
  sub: {
    ...FONT.bodyLg,
    color:     C.body,
    textAlign: "center",
    maxWidth:  540,
    marginBottom: 8,
  },
  grid: {
    flexDirection:  "row",
    flexWrap:       "wrap" as any,
    gap:            20,
    width:          "100%" as any,
    justifyContent: "center",
  },
  card: {
    flex:            1,
    minWidth:        230,
    maxWidth:        260,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.lg,
    gap:             12,
    boxShadow:       SHADOW.sm as any,
    transition:      "transform 0.2s, box-shadow 0.2s" as any,
    cursor:          "default" as any,
  },
  cardIconWrap: {
    width:           52,
    height:          52,
    borderRadius:    RADIUS.md,
    backgroundColor: C.greenBg,
    alignItems:      "center",
    justifyContent:  "center",
  },
  cardIcon: {
    fontSize:   26,
    lineHeight: 28,
  },
  cardTitle: {
    ...FONT.h3,
    color: C.text,
  },
  cardDesc: {
    ...FONT.body,
    color:      C.body,
    lineHeight: 26,
  },
  cardGames: {
    gap:       6,
    marginTop: 4,
  },
  cardGameItem: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
  },
  cardGameDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: C.greenBright,
  },
  cardGameText: {
    ...FONT.small,
    color: C.muted,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. HOW IT WORKS  (3 steps, dark forest green bg)
// ─────────────────────────────────────────────────────────────────────────────
export const howItWorks = StyleSheet.create({
  root: {
    backgroundColor: C.bgForest,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.md,
  },
  label: {
    ...FONT.label,
    color: C.greenBright,
  },
  headline: {
    ...FONT.h1,
    color:     C.textInverse,
    textAlign: "center",
  },
  sub: {
    ...FONT.bodyLg,
    color:     "rgba(255,255,255,0.55)",
    textAlign: "center",
    maxWidth:  480,
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection:  "row",
    gap:            32,
    flexWrap:       "wrap" as any,
    justifyContent: "center",
    width:          "100%" as any,
  },
  step: {
    flex:            1,
    minWidth:        240,
    maxWidth:        320,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.09)",
    borderRadius:    RADIUS.lg,
    padding:         SPACE.lg,
    gap:             16,
  },
  stepNumWrap: {
    width:           48,
    height:          48,
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.15)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  stepNum: {
    ...FONT.h3,
    color:    C.greenBright,
    fontSize: 20,
  },
  stepIcon: {
    fontSize: 32,
    lineHeight: 36,
  },
  stepTitle: {
    ...FONT.h3,
    color: C.textInverse,
  },
  stepDesc: {
    ...FONT.body,
    color:      "rgba(255,255,255,0.55)",
    lineHeight: 26,
  },
  stepExample: {
    ...FONT.small,
    color:           C.creamText,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:    RADIUS.sm,
    borderLeftWidth: 2,
    borderLeftColor: C.greenBright,
    lineHeight:      20,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DASHBOARD PREVIEW  (mock UI showing real progress)
// ─────────────────────────────────────────────────────────────────────────────
export const dashboard = StyleSheet.create({
  root: {
    backgroundColor: C.white,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.md,
  },
  label: {
    ...FONT.label,
    color: C.greenMid,
  },
  headline: {
    ...FONT.h1,
    color:     C.text,
    textAlign: "center",
  },
  sub: {
    ...FONT.bodyLg,
    color:     C.body,
    textAlign: "center",
    maxWidth:  520,
    marginBottom: 8,
  },
  mockWrap: {
    width:           "100%" as any,
    maxWidth:        860,
    backgroundColor: C.cream,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.xl,
    overflow:        "hidden",
    boxShadow:       SHADOW.lg as any,
  },
  mockBar: {
    height:          40,
    backgroundColor: C.creamMid,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: 16,
    gap:             6,
  },
  mockDot: {
    width:         10,
    height:        10,
    borderRadius:  5,
    backgroundColor: C.border,
  },
  mockContent: {
    padding:   SPACE.lg,
    gap:       SPACE.md,
  },
  mockRow: {
    flexDirection: "row",
    gap:           SPACE.md,
  },
  // Goal card
  goalCard: {
    flex:            2,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.md,
    gap:             12,
    boxShadow:       SHADOW.xs as any,
  },
  goalLabel: {
    ...FONT.label,
    color: C.greenMid,
  },
  goalTitle: {
    ...FONT.h3,
    color: C.text,
  },
  goalProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems:    "flex-end",
  },
  goalCurrent: {
    fontSize:   40,
    fontWeight: "800" as const,
    color:      C.greenDeep,
    lineHeight: 44,
  },
  goalTarget: {
    ...FONT.body,
    color: C.muted,
    paddingBottom: 4,
  },
  goalBar: {
    height:          8,
    borderRadius:    4,
    backgroundColor: C.border,
    overflow:        "hidden",
  },
  goalFill: {
    height:          "100%" as any,
    borderRadius:    4,
    backgroundColor: C.greenBright,
  },
  goalNote: {
    ...FONT.small,
    color: C.muted,
  },
  goalNoteGreen: {
    ...FONT.small,
    fontWeight: "600" as const,
    color:      C.greenDeep,
  },
  // Stat cards
  statCard: {
    flex:            1,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.md,
    gap:             6,
    alignItems:      "center",
    justifyContent:  "center",
    boxShadow:       SHADOW.xs as any,
  },
  statEmoji: {
    fontSize:   28,
    lineHeight: 32,
  },
  statNum: {
    fontSize:   34,
    fontWeight: "800" as const,
    color:      C.text,
    lineHeight: 38,
  },
  statLabel: {
    ...FONT.small,
    color: C.muted,
  },
  // Graph card
  graphCard: {
    flex:            3,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.md,
    gap:             16,
    boxShadow:       SHADOW.xs as any,
  },
  graphTitle: {
    ...FONT.h4,
    color: C.text,
  },
  graphBars: {
    flexDirection: "row",
    alignItems:    "flex-end",
    gap:           8,
    height:        80,
  },
  graphBar: {
    flex:          1,
    borderRadius:  4,
    backgroundColor: C.greenBg,
    minHeight:     8,
  },
  graphBarActive: {
    backgroundColor: C.greenDeep,
  },
  graphDays: {
    flexDirection: "row",
    gap:           8,
  },
  graphDay: {
    flex:      1,
    textAlign: "center" as any,
    ...FONT.xs,
    color:     C.muted,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. VAULT / TECHNIQUES  (warm gold background)
// ─────────────────────────────────────────────────────────────────────────────
export const vault = StyleSheet.create({
  root: {
    backgroundColor: C.goldBg,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.md,
  },
  label: {
    ...FONT.label,
    color: C.goldText,
  },
  headline: {
    ...FONT.h1,
    color:     C.text,
    textAlign: "center",
  },
  sub: {
    ...FONT.bodyLg,
    color:     C.body,
    textAlign: "center",
    maxWidth:  540,
    marginBottom: 8,
  },
  grid: {
    flexDirection:  "row",
    gap:            20,
    width:          "100%" as any,
    flexWrap:       "wrap" as any,
    justifyContent: "center",
  },
  card: {
    flex:            1,
    minWidth:        240,
    maxWidth:        340,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.goldLight,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.lg,
    gap:             14,
    boxShadow:       SHADOW.sm as any,
  },
  cardTag: {
    ...FONT.label,
    color:           C.goldText,
    backgroundColor: C.goldBg,
    borderWidth:     1,
    borderColor:     C.goldLight,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:    RADIUS.full,
    alignSelf:       "flex-start",
    overflow:        "hidden" as any,
  },
  cardTitle: {
    ...FONT.h3,
    color: C.text,
  },
  cardDesc: {
    ...FONT.body,
    color:      C.body,
    lineHeight: 26,
  },
  cardExample: {
    ...FONT.small,
    color:           C.goldText,
    backgroundColor: C.goldBg,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:    RADIUS.sm,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    fontStyle:       "italic",
    lineHeight:      20,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
    marginTop:     8,
  },
  moreBtnText: {
    ...FONT.body,
    fontWeight: "600" as const,
    color:      C.goldText,
    cursor:     "pointer" as any,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────
export const cta = StyleSheet.create({
  root: {
    backgroundColor: C.bgGreen,
    paddingVertical: SPACE.xxl,
  },
  inner: {
    ...INNER,
    alignItems: "center",
    gap:        SPACE.sm,
  },
  label: {
    ...FONT.label,
    color: "rgba(255,255,255,0.50)",
  },
  headline: {
    ...FONT.h1,
    color:       C.textInverse,
    textAlign:   "center",
    marginBottom: 4,
  },
  sub: {
    ...FONT.bodyLg,
    color:     "rgba(255,255,255,0.55)",
    textAlign: "center",
    maxWidth:  480,
  },
  btn: {
    backgroundColor: C.textInverse,
    borderRadius:    RADIUS.md,
    paddingVertical:   20,
    paddingHorizontal: 52,
    marginTop:       SPACE.sm,
    boxShadow:       "0 4px 24px rgba(0,0,0,0.20)" as any,
  },
  btnText: {
    ...FONT.body,
    fontWeight: "700" as const,
    color:      C.greenDeep,
    letterSpacing: 0.2,
  },
  note: {
    ...FONT.small,
    color: "rgba(255,255,255,0.30)",
  },
});
