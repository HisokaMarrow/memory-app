// ─────────────────────────────────────────────────────────────────────────────
// Main style file — design tokens + all landing-page section styles
// This is the single source of truth for the whole project.
// Zero inline styles allowed in component files — every value lives here
// or in styles/games/shared.ts for game-specific styles.
// ─────────────────────────────────────────────────────────────────────────────
import { StyleSheet } from "react-native";

// ── Design tokens ─────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  white:        "#FFFFFF",
  cream:        "#F7F7F7",          // soft off-white — card / alt section bg
  creamMid:     "#EFEFEF",          // slightly deeper alternate sections
  bgForest:     "#1A1A1A",          // near-black — dark sections
  bgForestDeep: "#121212",          // primary dark — footer, hero-dark
  bgGreen:      "#121212",          // near-black — CTA section

  // Borders
  border:       "#DADADA",          // light grey border / dividers
  borderGreen:  "rgba(255,255,255,0.09)",

  // Text
  text:         "#121212",          // near-black primary
  body:         "#2A2A2A",          // secondary text / UI elements
  muted:        "#9E9E9E",          // muted / placeholder text
  textInverse:  "#FFFFFF",
  mutedInverse: "rgba(255,255,255,0.45)",
  creamText:    "#FFFFFF",          // text on dark backgrounds

  // Primary — Orange (accent / CTA)
  greenDeep:    "#E85D2A",          // main accent — buttons, key highlights
  greenMid:     "#F28C52",          // hover state / lighter orange
  greenBright:  "#F28C52",          // active states, badges, progress
  greenBg:      "#FEF0EB",          // very light orange tint
  greenBgMid:   "#FBDECF",          // stronger orange tint

  // Gold (subtle — kept for legacy uses)
  gold:         "#C8A85A",
  goldLight:    "#E8D49A",
  goldBg:       "#FAF5E4",
  goldText:     "#7A6230",

  // Orange (explicit tokens mirroring the primary)
  orange:       "#E85D2A",
  orangeLight:  "#F28C52",
  orangeBg:     "#FEF0EB",
} as const;

export const FONT = {
  display: { fontSize: 64, fontWeight: "800" as const, letterSpacing: -1.5, lineHeight: 70 },
  hero:    { fontSize: 56, fontWeight: "800" as const, letterSpacing: -1.2, lineHeight: 62 },
  h1:      { fontSize: 44, fontWeight: "800" as const, letterSpacing: -0.8, lineHeight: 52 },
  h2:      { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.4, lineHeight: 42 },
  h3:      { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.2, lineHeight: 30 },
  h4:      { fontSize: 18, fontWeight: "600" as const, lineHeight: 26 },
  body:    { fontSize: 16, fontWeight: "400" as const, lineHeight: 27 },
  bodyLg:  { fontSize: 18, fontWeight: "400" as const, lineHeight: 30 },
  small:   { fontSize: 14, fontWeight: "400" as const, lineHeight: 22 },
  xs:      { fontSize: 12, fontWeight: "400" as const, lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: "700" as const, letterSpacing: 2.5 },
} as const;

export const SPACE = {
  xs:  8,
  sm:  16,
  md:  24,
  lg:  40,
  xl:  64,
  xxl: 104,
} as const;

export const RADIUS = {
  sm:   10,
  md:   16,
  lg:   24,
  xl:   32,
  full: 999,
} as const;

export const SHADOW = {
  xs:    "0 1px 4px rgba(0,0,0,0.05)",
  sm:    "0 2px 12px rgba(0,0,0,0.07)",
  md:    "0 4px 32px rgba(0,0,0,0.09)",
  lg:    "0 8px 48px rgba(0,0,0,0.12)",
  glow:  "0 0 40px rgba(232,93,42,0.20)",
  video: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
} as const;

export const MAX_W = 1140;
export const NAV_H = 68;
export const INNER = {
  maxWidth:          MAX_W,
  marginHorizontal:  "auto" as const,
  paddingHorizontal: 48,
  width:             "100%" as const,
};

// ── Local palette ─────────────────────────────────────────────────────────────
export const P = {
  dark:       "#080808",          // canvas bg (hero)
  green:      "#121212",          // main dark section bg
  greenMid:   "#2A2A2A",          // secondary dark
  greenLight: "#DADADA",          // light grey border / divider
  cream:      "#FFFFFF",          // white section bg
  creamAlt:   "#F7F7F7",          // alternate soft section bg
  gold:       "#E85D2A",          // primary orange accent
  goldLight:  "#FEF0EB",          // light orange tint bg
  amber:      "#E85D2A",          // orange accent (same token, kept for clarity)
  textMid:    "#2A2A2A",          // secondary text
  textLight:  "#9E9E9E",          // muted text
  white:      "#FFFFFF",          // text on dark backgrounds
  pureWhite:  "#FFFFFF",
};

// ── Shared helpers ────────────────────────────────────────────────────────────
export const SECTION_PAD = { paddingVertical: 100, paddingHorizontal: 56 } as const;
export const INNER_W     = { maxWidth: 1100, marginHorizontal: "auto" as const, width: "100%" as const };

// ── Root layout ───────────────────────────────────────────────────────────────
export const layout = StyleSheet.create({
  root:   { flex: 1, backgroundColor: P.dark },
  scroll: { flex: 1 },
});

// ── Hover state values (DOM onMouseEnter/Leave — exported so the component
//    has no magic strings; values used as e.currentTarget.style.* = HOVER.xxx)
export const HOVER = {
  heroPrimaryTransform:   "translateY(-2px)",
  heroPrimaryHoverShadow: "0 16px 40px rgba(232,93,42,0.50)",
  heroPrimaryBaseShadow:  "0 8px 32px rgba(232,93,42,0.30)",
  heroSecondaryHoverBg:   "rgba(255,255,255,0.15)",
  heroSecondaryBaseBg:    "rgba(255,255,255,0.08)",
  cardHoverTransform:     "translateY(-6px)",
  cardHoverShadow:        "0 20px 48px rgba(0,0,0,0.12)",
  ctaHoverTransform:      "translateY(-3px)",
  ctaHoverShadow:         "0 22px 50px rgba(232,93,42,0.45)",
  ctaBaseShadow:          "0 12px 40px rgba(232,93,42,0.30)",
  navBtnOpacity:          "0.85",
  navBtnOpacityBase:      "1",
};

// ── HTML <input> style (web DOM element — cannot use RN StyleSheet) ───────────
export const INPUT_STYLE = {
  background:    "rgba(255,255,255,0.07)",
  border:        "1px solid rgba(255,255,255,0.18)",
  borderRadius:  10,
  padding:       "13px 20px",
  fontFamily:    "Cormorant Garamond, Georgia, serif",
  fontSize:      20,
  color:         "#FFFFFF",
  textAlign:     "center" as const,
  width:         230,
  outline:       "none",
  letterSpacing: "0.15em",
  marginBottom:  18,
};

// ── Hero background image (web DOM — objectFit/objectPosition are CSS-only) ────
export const HERO_IMG_STYLE = {
  position:       "absolute",
  top:            0,
  left:           0,
  width:          "100%",
  height:         "100%",
  objectFit:      "cover",
  objectPosition: "right center",
  display:        "block",
} as const;

// ── Word memory test — small grid input cells ──────────────────────────────────
export const WORD_INPUT_STYLE = {
  background:  "rgba(255,255,255,0.06)",
  border:      "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding:     "9px 8px",
  fontFamily:  "Cormorant Garamond, Georgia, serif",
  fontSize:    15,
  color:       "#FFFFFF",
  width:       "100%",
  outline:     "none",
  textAlign:   "center" as const,
  textTransform: "lowercase" as const,
};

// ── HERO ──────────────────────────────────────────────────────────────────────
export const hero = StyleSheet.create({
  // Light fallback — samurai image has a natural white/cream left side
  section: {
    height:          "100vh" as any,
    minHeight:       640,
    position:        "relative",
    overflow:        "hidden",
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "#F7F7F7",
  },
  heroBgImage: {
    position: "absolute",
    top:      0,
    left:     0,
    width:    "100%" as any,
    height:   "100%" as any,
    zIndex:   0,
  },
  // Subtle light wash on left so dark text stays readable; fades out toward samurai
  overlay: {
    position:      "absolute",
    top:           0,
    left:          0,
    right:         0,
    bottom:        0,
    zIndex:        1,
    background:    "linear-gradient(to right, rgba(247,247,247,0.96) 0%, rgba(247,247,247,0.88) 32%, rgba(247,247,247,0.40) 58%, transparent 76%)" as any,
    pointerEvents: "none" as any,
  },
  content: {
    position:          "relative",
    zIndex:            2,
    paddingHorizontal: 80,
    paddingVertical:   60,
    maxWidth:          660,
  },

  // ── Headline ────────────────────────────────────────────────────────────────
  h1: {
    fontFamily:   "Playfair Display, Georgia, serif" as any,
    fontSize:     82,
    fontWeight:   "700" as const,
    lineHeight:   90,                // ~1.1 tight
    color:        "#080808",         // near-black — maximum contrast
    marginBottom: 24,
    letterSpacing: -1.5,
  },
  h1Em: {
    color:      C.orange,            // ONLY orange accent word
    fontStyle:  "italic",
  },

  // ── Subtext ─────────────────────────────────────────────────────────────────
  subText: {
    fontFamily:   "Inter, -apple-system, BlinkMacSystemFont, sans-serif" as any,
    fontSize:     19,
    fontWeight:   "400" as const,
    lineHeight:   30,                // 1.55
    color:        "#9E9E9E",         // grey — secondary hierarchy
    marginBottom: 40,
    maxWidth:     400,
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           24,
    flexWrap:      "wrap" as any,
  },
  btnPrimary: {
    backgroundColor: C.orange,
    borderRadius:    8,
    paddingHorizontal: 26,
    paddingVertical:   14,
    cursor:          "pointer" as any,
    transition:      "transform 0.18s, box-shadow 0.18s" as any,
  },
  btnPrimaryText: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" as any,
    fontSize:   16,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
  btnLink: {
    paddingVertical: 14,
    cursor:          "pointer" as any,
  },
  btnLinkText: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" as any,
    fontSize:   16,
    fontWeight: "500" as const,
    color:      "#9E9E9E",
    transition: "color 0.2s" as any,
  },

  // ── Feature strip ───────────────────────────────────────────────────────────
  featureStrip: {
    flexDirection:  "row",
    marginTop:      52,
    paddingTop:     28,
    borderTopWidth: 1,
    borderTopColor: "#DADADA",
    maxWidth:       480,
  },
  featureItem: {
    flex:            1,
    paddingLeft:     20,
    borderLeftWidth: 1,
    borderLeftColor: "#DADADA",
  },
  featureItemFirst: {
    paddingLeft:     0,
    borderLeftWidth: 0,
  },
  featureTitle: {
    fontFamily:   "Inter, -apple-system, BlinkMacSystemFont, sans-serif" as any,
    fontSize:     14,
    fontWeight:   "600" as const,
    color:        "#121212",
    marginBottom: 3,
  },
  featureSub: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" as any,
    fontSize:   13,
    fontWeight: "400" as const,
    color:      "#9E9E9E",
  },
  featureIconImg: {
    width:        36,
    height:       36,
    borderRadius: 9,
    marginBottom: 9,
    overflow:     "hidden" as any,
  },
});

// ── MEMORY TEST ───────────────────────────────────────────────────────────────
export const test = StyleSheet.create({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.green,
  },
  inner: {
    maxWidth:         860,
    marginHorizontal: "auto" as any,
    width:            "100%" as any,
  },
  head: {
    alignItems:   "center",
    marginBottom: 52,
  },
  eyebrow: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    color:         P.gold,
    marginBottom:  14,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      50,
    fontWeight:    "600" as const,
    color:         P.white,
    letterSpacing: -1.0,
    textAlign:     "center",
  },
  subText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   16,
    color:      "rgba(255,255,255,0.45)",
    marginTop:  14,
    maxWidth:   440,
    textAlign:  "center",
    lineHeight: 27,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.09)",
    borderRadius:    22,
    padding:         40,
    alignItems:      "center",
  },
  phaseTitle: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     32,
    fontWeight:   "600" as const,
    color:        P.white,
    marginBottom: 10,
    textAlign:    "center",
  },
  phaseText: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     15,
    color:        "rgba(255,255,255,0.45)",
    marginBottom: 32,
    textAlign:    "center",
    lineHeight:   26,
  },
  digitRow: {
    flexDirection:  "row",
    justifyContent: "center",
    gap:            10,
    marginBottom:   30,
  },
  digitBox: {
    width:           54,
    height:          68,
    borderRadius:    11,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.18)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  digitText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   38,
    fontWeight: "600" as const,
    color:      P.white,
  },
  countdown: {
    width:           54,
    height:          54,
    borderRadius:    999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth:     2,
    borderColor:     P.gold,
    alignItems:      "center",
    justifyContent:  "center",
    alignSelf:       "center",
  },
  countdownNum: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   26,
    fontWeight: "600" as const,
    color:      P.gold,
  },
  recallDigitBox: {
    width:           54,
    height:          68,
    borderRadius:    11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.09)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  eyebrowGold: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      15,
    letterSpacing: 1.0,
    textTransform: "uppercase" as any,
    color:         P.gold,
    marginBottom:  22,
    textAlign:     "center",
  },
  chunkBox: {
    backgroundColor:   "rgba(255,255,255,0.05)",
    borderRadius:      14,
    padding:           24,
    maxWidth:          460,
    alignSelf:         "center",
    marginBottom:      28,
    width:             "100%" as any,
  },
  chunkText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   15,
    color:      "rgba(255,255,255,0.65)",
    lineHeight: 26,
  },
  chunkRow: {
    flexDirection:  "row",
    justifyContent: "center",
    gap:            14,
    marginTop:      18,
  },
  chunkPill: {
    backgroundColor:   "rgba(255,255,255,0.09)",
    borderRadius:      9,
    paddingHorizontal: 17,
    paddingVertical:   9,
  },
  chunkPillText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   28,
    fontWeight: "600" as const,
    color:      P.gold,
  },
  chunkNote: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.35)",
    marginTop:  10,
    textAlign:  "center",
  },
  resultScoreRow: {
    flexDirection:  "row",
    justifyContent: "center",
    gap:            44,
    marginBottom:   36,
  },
  resultScoreItem: {
    alignItems: "center",
  },
  resultScoreLabel: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    letterSpacing: 1.0,
    textTransform: "uppercase" as any,
    color:         "rgba(255,255,255,0.35)",
    marginBottom:  10,
  },
  resultCircle: {
    width:          96,
    height:         96,
    borderRadius:   999,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   10,
    borderWidth:    2,
  },
  resultCircleNum: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   34,
    fontWeight: "700" as const,
  },
  resultCircleSub: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.40)",
  },
  improvementBadge: {
    backgroundColor:   "rgba(255,255,255,0.05)",
    borderRadius:      10,
    paddingHorizontal: 22,
    paddingVertical:   12,
    marginBottom:      28,
    alignSelf:         "center",
  },
  improvementText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   14,
    color:      P.gold,
  },
  resultNote: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     14,
    color:        "rgba(255,255,255,0.40)",
    marginBottom: 28,
    textAlign:    "center",
  },
  resultBtnRow: {
    flexDirection:  "row",
    gap:            14,
    justifyContent: "center",
    flexWrap:       "wrap" as any,
  },
  btn: {
    borderRadius:      999,
    paddingHorizontal: 32,
    paddingVertical:   13,
    cursor:            "pointer" as any,
    transition:        "transform 0.2s" as any,
  },
  btnPrimary:     { backgroundColor: P.gold },
  btnPrimaryText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   15,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.15)",
  },
  btnSecondaryText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   15,
    color:      "rgba(255,255,255,0.60)",
  },
  scoreBadge: {
    backgroundColor:   P.gold,
    borderRadius:      999,
    paddingHorizontal: 16,
    paddingVertical:   6,
    marginBottom:      22,
    alignSelf:         "center",
  },
  scoreBadgeText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
  emojiIcon: {
    fontSize:     60,
    marginBottom: 20,
    textAlign:    "center",
  },

  // ── Phase wrappers ──────────────────────────────────────────────────────────
  phaseWrap: { alignItems: "center", width: "100%" as any },

  // ── Recall digit character ──────────────────────────────────────────────────
  recallCharText:  { fontFamily: "Cormorant Garamond, Georgia, serif" as any, fontSize: 34, fontWeight: "600" as const, color: "#FFFFFF" },
  recallCharEmpty: { color: "rgba(255,255,255,0.18)" },

  // ── Inline emphasis (nested Text children) ──────────────────────────────────
  emphasis:     { color: "#E85D2A", fontStyle: "italic" },
  emphasisBold: { color: "#E85D2A", fontWeight: "700" as const },

  // ── Result circle variants ──────────────────────────────────────────────────
  resultCircleDefault:   { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" },
  resultCircleHighlight: { backgroundColor: "#E85D2A",                borderColor: "#E85D2A" },
  resultNumDefault:      { color: "#FFFFFF" },
  resultNumHighlight:    { color: "#FFFFFF" },

  // ── Word memory test — show phase ───────────────────────────────────────────
  wordTimerTrack: {
    width:           300,
    height:          3,
    borderRadius:    2,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginBottom:    36,
    overflow:        "hidden",
  },
  wordTimerFill: {
    height:          "100%" as any,
    backgroundColor: "#E85D2A",
    borderRadius:    2,
    transition:      "width 1s linear" as any,
  },
  wordBig: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      76,
    fontWeight:    "600" as const,
    color:         "#FFFFFF",
    letterSpacing: -1.5,
    textAlign:     "center",
    marginVertical: 8,
    animation:     "fadeUp 0.35s ease" as any,
  },
  wordCounter: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      16,
    color:         "rgba(255,255,255,0.40)",
    letterSpacing: 1.0,
    marginTop:     12,
  },

  // ── Word memory test — recall grid ──────────────────────────────────────────
  inputGrid: {
    display:             "grid" as any,
    gridTemplateColumns: "repeat(4, 1fr)" as any,
    gap:                 8,
    width:               "100%" as any,
    maxWidth:            520,
    marginBottom:        24,
  },

  // ── Word memory test — result phase ─────────────────────────────────────────
  scoreRow: {
    flexDirection:  "row",
    alignItems:     "flex-end",
    justifyContent: "center",
    gap:            4,
    marginBottom:   10,
  },
  scoreNum: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   84,
    fontWeight: "700" as const,
    color:      "#E85D2A",
    lineHeight: 84,
  },
  scoreDenom: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     36,
    color:        "rgba(255,255,255,0.30)",
    paddingBottom: 12,
  },
  wordResultGrid: {
    flexDirection:  "row",
    flexWrap:       "wrap" as any,
    justifyContent: "center",
    gap:            6,
    maxWidth:       540,
    marginBottom:   24,
  },
  wordResultChip: {
    borderRadius:      8,
    paddingHorizontal: 11,
    paddingVertical:   6,
    borderWidth:       1,
  },
  wordResultHit:  { backgroundColor: "rgba(232,93,42,0.12)", borderColor: "rgba(232,93,42,0.40)" },
  wordResultMiss: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" },
  wordResultText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   15,
    fontWeight: "500" as const,
  },
  wordResultTextHit:  { color: "#E85D2A" },
  wordResultTextMiss: { color: "rgba(255,255,255,0.30)" },

  // ── Technique tip box ────────────────────────────────────────────────────────
  tipIntro: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     18,
    fontWeight:   "600" as const,
    color:        "#FFFFFF",
    textAlign:    "center",
    marginBottom: 14,
    maxWidth:     420,
  },
  tipBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth:     1,
    borderColor:     "rgba(232,93,42,0.20)",
    borderRadius:    14,
    padding:         22,
    maxWidth:        480,
    width:           "100%" as any,
    marginBottom:    24,
    gap:             8,
  },

  // ── Score comparison (second attempt+) ─────────────────────────────────────
  compareWrap: {
    width:           "100%" as any,
    maxWidth:        400,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop:       4,
    marginBottom:    24,
    alignItems:      "center",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.07)",
  },
  compareScoreRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            16,
    marginBottom:   12,
  },
  compareBox: {
    alignItems:        "center",
    backgroundColor:   "rgba(255,255,255,0.06)",
    borderRadius:      12,
    paddingHorizontal: 22,
    paddingVertical:   14,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.08)",
    minWidth:          96,
  },
  compareBoxActive: {
    backgroundColor: "rgba(232,93,42,0.12)",
    borderColor:     "rgba(232,93,42,0.35)",
  },
  compareBoxLabel: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      11,
    letterSpacing: 1.2,
    textTransform: "uppercase" as any,
    color:         "rgba(255,255,255,0.35)",
    marginBottom:  6,
  },
  compareBoxNum: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   44,
    fontWeight: "700" as const,
    color:      "#FFFFFF",
    lineHeight: 46,
  },
  compareBoxNumHighlight: { color: "#E85D2A" },
  compareBoxDenom: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.30)",
    marginTop:  2,
  },
  compareArrow: {
    fontSize: 20,
    color:    "rgba(255,255,255,0.22)",
  },
  compareDelta: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   14,
    color:      "#E85D2A",
    textAlign:  "center",
    lineHeight: 22,
  },
  compareDeltaNeutral: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   14,
    color:      "rgba(255,255,255,0.35)",
    textAlign:  "center",
    lineHeight: 22,
  },

  // ── Second-attempt motivational CTA ─────────────────────────────────────────
  ctaHook: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     24,
    fontWeight:   "600" as const,
    color:        "#FFFFFF",
    textAlign:    "center",
    lineHeight:   32,
    marginBottom: 22,
    maxWidth:     340,
  },
  resultBtnRow: {
    flexDirection:  "row",
    gap:            12,
    justifyContent: "center",
    flexWrap:       "wrap" as any,
  },
});

// ── TRAIN CARDS ───────────────────────────────────────────────────────────────
export const train = StyleSheet.create({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.cream,
  },
  inner: INNER_W as any,
  head:  { marginBottom: 60 },
  eyebrow: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    color:         P.amber,
    marginBottom:  14,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      50,
    fontWeight:    "600" as const,
    color:         P.green,
    letterSpacing: -1.0,
    lineHeight:    56,
  },
  grid: {
    display:             "grid" as any,
    gridTemplateColumns: "repeat(4, 1fr)" as any,
    gap:                 18,
  },
  card: {
    backgroundColor: P.pureWhite,
    borderRadius:    20,
    padding:         30,
    borderWidth:     1,
    borderColor:     P.greenLight,
    cursor:          "pointer" as any,
    position:        "relative",
    transition:      "transform 0.25s, box-shadow 0.25s" as any,
  },
  cardBadge: {
    position:          "absolute",
    top:               14,
    right:             14,
    backgroundColor:   P.goldLight,
    borderWidth:       1,
    borderColor:       "rgba(232,93,42,0.25)",
    borderRadius:      999,
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  cardBadgeText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   12,
    fontWeight: "500" as const,
    color:      P.gold,
  },
  cardIcon: {
    width:           46,
    height:          46,
    borderRadius:    13,
    backgroundColor: "#FEF0EB",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    18,
  },
  cardIconText:  { fontSize: 22 },
  cardTitle: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     26,
    fontWeight:   "600" as const,
    color:        P.green,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     14,
    color:        P.textMid,
    lineHeight:   22,
    marginBottom: 22,
  },
  cardDivider: {
    borderTopWidth: 1,
    borderTopColor: P.greenLight,
    paddingTop:     18,
  },
  cardExLabel: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      12,
    letterSpacing: 0.8,
    textTransform: "uppercase" as any,
    color:         P.textLight,
    marginBottom:  9,
  },
  cardEx: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
    marginBottom:  5,
  },
  cardExDot: {
    width:           4,
    height:          4,
    borderRadius:    999,
    backgroundColor: P.amber,
  },
  cardExText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   14,
    color:      P.textMid,
  },
});

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
export const how = StyleSheet.create({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.creamAlt,
  },
  inner: {
    ...INNER_W,
    display:             "grid" as any,
    gridTemplateColumns: "1fr 1fr" as any,
    gap:                 80,
    alignItems:          "center" as any,
  },
  eyebrow: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    color:         P.amber,
    marginBottom:  14,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      50,
    fontWeight:    "600" as const,
    color:         P.green,
    letterSpacing: -1.0,
    lineHeight:    56,
    marginBottom:  18,
  },
  subText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   17,
    color:      P.textMid,
    lineHeight: 29,
    maxWidth:   360,
  },
  stepRow: {
    flexDirection: "row",
    gap:           22,
    alignItems:    "flex-start",
  },
  stepLeft: {
    flexDirection: "column",
    alignItems:    "center",
  },
  stepIconWrap: {
    width:           52,
    height:          52,
    borderRadius:    15,
    backgroundColor: P.green,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  stepIconText: {
    fontSize: 22,
  },
  stepLine: {
    width:           1,
    height:          36,
    marginTop:       6,
    background:      "linear-gradient(to bottom, rgba(42,42,42,0.4), transparent)" as any,
    backgroundColor: "rgba(42,42,42,0.2)",
  },
  stepContent:  { paddingTop: 6 },
  stepPad:      { paddingBottom: 36 },
  stepPadLast:  { paddingBottom: 0 },
  stepNum: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    color:         P.gold,
    fontWeight:    "500" as const,
    letterSpacing: 0.8,
    marginBottom:  5,
  },
  stepTitle: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     24,
    fontWeight:   "600" as const,
    color:        P.green,
    marginBottom: 6,
  },
  stepDesc: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   14,
    color:      P.textMid,
    lineHeight: 23,
  },
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dash = StyleSheet.create({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.green,
  },
  inner: INNER_W as any,
  head: {
    alignItems:   "center",
    marginBottom: 60,
  },
  eyebrow: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    color:         P.gold,
    marginBottom:  14,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      50,
    fontWeight:    "600" as const,
    color:         P.white,
    letterSpacing: -1.0,
    textAlign:     "center",
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.09)",
    borderRadius:    22,
    padding:         36,
  },
  statsGrid: {
    display:             "grid" as any,
    gridTemplateColumns: "repeat(4, 1fr)" as any,
    gap:                 18,
    marginBottom:        36,
  },
  statCard: {
    backgroundColor:   "rgba(255,255,255,0.06)",
    borderRadius:      14,
    paddingHorizontal: 18,
    paddingVertical:   22,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.07)",
  },
  statHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   10,
  },
  statLabel: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.38)",
  },
  statNum: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   36,
    fontWeight: "700" as const,
    color:      P.white,
    lineHeight: 36,
  },
  statNote: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.32)",
    marginTop:  4,
  },
  chartsGrid: {
    display:             "grid" as any,
    gridTemplateColumns: "1fr 1fr" as any,
    gap:                 20,
  },
  chartCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius:    14,
    padding:         24,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.05)",
  },
  chartLabel: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     13,
    color:        "rgba(255,255,255,0.40)",
    marginBottom: 18,
  },
  chartBars: {
    flexDirection: "row",
    alignItems:    "flex-end",
    gap:           5,
    height:        90,
  },
  chartFooter: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginTop:      7,
  },
  chartFooterLabel: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.22)",
  },
  chartFooterGold: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      P.gold,
  },
  goalsLabel: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     13,
    color:        "rgba(255,255,255,0.40)",
    marginBottom: 18,
  },
  goalRow:    { marginBottom: 18 },
  goalRowLast: { marginBottom: 0 },
  goalHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   6,
  },
  goalTitle: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.65)",
  },
  goalPct: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      P.gold,
  },
  goalTrack: {
    height:          5,
    borderRadius:    3,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  // Goal progress fill — static parts (width & transition stay computed in component)
  goalFill: {
    height:          "100%" as any,
    borderRadius:    3,
    background:      "linear-gradient(90deg, #E85D2A, #F28C52)" as any,
    backgroundColor: "#E85D2A",
  },

  // Bar chart variants — static parts (height & transition stay computed)
  chartBarBase: { flex: 1, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)" },
  chartBarLast: { flex: 1, borderRadius: 3, backgroundColor: "#E85D2A" },

  statIconText: { fontSize: 17 },
});

// ── TECHNIQUES / VAULT ────────────────────────────────────────────────────────
export const vault = StyleSheet.create({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.cream,
  },
  inner: {
    ...INNER_W,
    display:             "grid" as any,
    gridTemplateColumns: "1fr 1.2fr" as any,
    gap:                 72,
    alignItems:          "start" as any,
  },
  eyebrow: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    color:         P.amber,
    marginBottom:  14,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      50,
    fontWeight:    "600" as const,
    color:         P.green,
    letterSpacing: -1.0,
    lineHeight:    56,
    marginBottom:  18,
  },
  subText: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     16,
    color:        P.textMid,
    lineHeight:   27,
    marginBottom: 36,
  },
  tabList: {
    flexDirection: "column",
    gap:           9,
  },
  tab: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               14,
    paddingHorizontal: 18,
    paddingVertical:   14,
    borderRadius:      13,
    borderWidth:       1,
    cursor:            "pointer" as any,
    transition:        "all 0.2s" as any,
  },
  tabDot: {
    width:        7,
    height:       7,
    borderRadius: 999,
  },
  tabCat: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      12,
    letterSpacing: 0.8,
    textTransform: "uppercase" as any,
    marginBottom:  2,
  },
  tabTitle: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   17,
    fontWeight: "600" as const,
  },
  detailCard: {
    borderRadius: 22,
    padding:      44,
    boxShadow:    "0 20px 56px rgba(0,0,0,0.20)" as any,
  },
  detailCat: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      12,
    letterSpacing: 1.0,
    textTransform: "uppercase" as any,
    color:         "rgba(255,255,255,0.45)",
    marginBottom:  14,
  },
  detailTitle: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     34,
    fontWeight:   "600" as const,
    color:        P.white,
    marginBottom: 18,
    lineHeight:   40,
  },
  detailDesc: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     15,
    color:        "rgba(255,255,255,0.65)",
    lineHeight:   26,
    marginBottom: 28,
  },
  exampleBox: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.10)",
    borderRadius:    13,
    padding:         22,
  },
  exampleLabel: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      12,
    letterSpacing: 0.8,
    textTransform: "uppercase" as any,
    color:         "rgba(255,255,255,0.35)",
    marginBottom:  8,
  },
  exampleText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   19,
    color:      P.gold,
    lineHeight: 28,
    fontStyle:  "italic",
  },
  detailFooter: {
    marginTop:     28,
    flexDirection: "row",
    alignItems:    "center",
    gap:           9,
  },
  detailFooterIcon: {
    width:           30,
    height:          30,
    borderRadius:    999,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  detailFooterText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.42)",
  },
  checkIconText: { fontSize: 13, color: "#FFFFFF" },

  // ── Technique detail card backgrounds (one per technique, index-matched) ────
  detailCardBg0: { backgroundColor: "#121212" },
  detailCardBg1: { backgroundColor: "#1A1A1A" },
  detailCardBg2: { backgroundColor: "#161616" },
  detailCardBg3: { backgroundColor: "#1E1E1E" },

  // ── Tab active / inactive state variants ────────────────────────────────────
  tabActive:        { backgroundColor: "#121212", borderColor: "#121212" },
  tabInactive:      { backgroundColor: "#FFFFFF", borderColor: "#DADADA" },
  tabDotActive:     { backgroundColor: "#E85D2A" },
  tabDotInactive:   { backgroundColor: "#DADADA" },
  tabCatActive:     { color: "#E85D2A" },
  tabCatInactive:   { color: "#9E9E9E" },
  tabTitleActive:   { color: "#FFFFFF" },
  tabTitleInactive: { color: "#121212" },
});

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
export const cta = StyleSheet.create({
  section: {
    paddingVertical:   120,
    paddingHorizontal: 56,
    background:        "linear-gradient(160deg, #1A1A1A 0%, #0A0A0A 100%)" as any,
    backgroundColor:   "#121212",
    alignItems:        "center",
    position:          "relative",
    overflow:          "hidden",
  },
  inner: {
    position:   "relative",
    zIndex:     1,
    alignItems: "center",
  },
  badge: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               8,
    borderWidth:       1,
    borderColor:       "rgba(232,93,42,0.30)",
    borderRadius:      999,
    paddingHorizontal: 18,
    paddingVertical:   7,
    marginBottom:      30,
  },
  badgeDot: {
    width:           6,
    height:          6,
    borderRadius:    999,
    backgroundColor: P.gold,
  },
  badgeText: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      13,
    fontWeight:    "500" as const,
    color:         P.gold,
    letterSpacing: 1.0,
    textTransform: "uppercase" as any,
  },
  h2: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      70,
    fontWeight:    "600" as const,
    color:         P.white,
    lineHeight:    74,
    letterSpacing: -1.5,
    marginBottom:  22,
    textAlign:     "center",
  },
  h2Em: {
    color:     P.gold,
    fontStyle: "italic",
  },
  subText: {
    fontFamily:   "Cormorant Garamond, Georgia, serif" as any,
    fontSize:     17,
    color:        "rgba(255,255,255,0.48)",
    marginBottom: 44,
    maxWidth:     440,
    textAlign:    "center",
    lineHeight:   29,
  },
  btn: {
    backgroundColor:   P.gold,
    borderRadius:      999,
    paddingHorizontal: 44,
    paddingVertical:   17,
    boxShadow:         "0 12px 40px rgba(232,93,42,0.30)" as any,
    cursor:            "pointer" as any,
    transition:        "transform 0.2s, box-shadow 0.2s" as any,
  },
  btnText: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   17,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
  note: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.25)",
    marginTop:  36,
    textAlign:  "center",
  },
});

// ── FOOTER ────────────────────────────────────────────────────────────────────
export const foot = StyleSheet.create({
  section: {
    backgroundColor:   P.green,
    paddingVertical:   40,
    paddingHorizontal: 56,
    borderTopWidth:    1,
    borderTopColor:    "rgba(255,255,255,0.06)",
  },
  inner: {
    ...INNER_W,
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
  },
  logoWrap: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           9,
  },
  logoImg: {
    width:        56,
    height:       56,
    borderRadius: 28,
  },
  logoMark: {
    width:           27,
    height:          27,
    borderRadius:    7,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoMarkText: {
    fontSize:   13,
    color:      P.gold,
    fontWeight: "700" as const,
  },
  logoName: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   16,
    fontWeight: "600" as const,
    color:      "rgba(255,255,255,0.55)",
  },
  links: {
    flexDirection: "row",
    gap:           28,
  },
  link: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.32)",
    cursor:     "pointer" as any,
    transition: "color 0.2s" as any,
  },
  linkActive: { color: "rgba(255,255,255,0.65)" },
  copy: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize:   13,
    color:      "rgba(255,255,255,0.22)",
  },
});
