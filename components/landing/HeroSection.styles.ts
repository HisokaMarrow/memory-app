import { createWebStyles } from "../../styles/web";
import { C } from "../../styles/tokens";

// ── HERO ──────────────────────────────────────────────────────────────────────
export const hero = createWebStyles({
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
    backgroundImage: "linear-gradient(to right, rgba(247,247,247,0.96) 0%, rgba(247,247,247,0.88) 32%, rgba(247,247,247,0.40) 58%, transparent 76%)" as any,
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
