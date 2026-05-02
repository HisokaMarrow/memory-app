import { createWebStyles } from "../../styles/web";
import { INNER_W, P } from "../../styles/tokens";

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
export const how = createWebStyles({
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
    backgroundImage: "linear-gradient(to bottom, rgba(42,42,42,0.4), transparent)" as any,
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
