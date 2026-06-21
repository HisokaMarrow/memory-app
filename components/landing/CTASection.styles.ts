import { createWebStyles } from "../../styles/web";
import { P } from "../../styles/tokens";

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
export const cta = createWebStyles({
  section: {
    paddingVertical:   120,
    paddingHorizontal: 56,
    backgroundImage:   "linear-gradient(160deg, #1A1A1A 0%, #0A0A0A 100%)" as any,
    backgroundColor:   "#121212",
    alignItems:        "center",
    position:          "relative",
    overflow:          "hidden",
  },
  sectionMobile: {
    paddingVertical:   78,
    paddingHorizontal: 20,
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
  badgeMobile: {
    paddingHorizontal: 14,
    marginBottom:      24,
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
    letterSpacing: 0,
    marginBottom:  22,
    textAlign:     "center",
  },
  h2Mobile: {
    fontSize:   44,
    lineHeight: 48,
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
  subTextMobile: {
    fontSize:     16,
    lineHeight:   24,
    marginBottom: 32,
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
  btnMobile: {
    width:          "100%" as any,
    maxWidth:       320,
    minHeight:      50,
    alignItems:     "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  btnHover: {
    transform: "translateY(-3px)" as any,
    boxShadow: "0 22px 50px rgba(232,93,42,0.45)" as any,
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
  noteMobile: {
    marginTop:  26,
    lineHeight: 20,
  },
});
