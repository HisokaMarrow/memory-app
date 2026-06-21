import { createWebStyles } from "../../styles/web";
import { INNER_W, P } from "../../styles/tokens";

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dash = createWebStyles({
  section: {
    paddingVertical:   100,
    paddingHorizontal: 56,
    backgroundColor:   P.green,
  },
  sectionMobile: {
    paddingVertical:   64,
    paddingHorizontal: 20,
  },
  inner: INNER_W as any,
  head: {
    alignItems:   "center",
    marginBottom: 60,
  },
  headMobile: {
    marginBottom: 34,
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
    letterSpacing: 0,
    textAlign:     "center",
  },
  h2Mobile: {
    fontSize:   38,
    lineHeight: 42,
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.09)",
    borderRadius:    22,
    padding:         36,
  },
  panelMobile: {
    borderRadius: 16,
    padding:      16,
  },
  statsGrid: {
    display:             "grid" as any,
    gridTemplateColumns: "repeat(4, 1fr)" as any,
    gap:                 18,
    marginBottom:        36,
  },
  statsGridTablet: {
    gridTemplateColumns: "repeat(2, 1fr)" as any,
  },
  statsGridMobile: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))" as any,
    gap:                 10,
    marginBottom:        16,
  },
  statCard: {
    backgroundColor:   "rgba(255,255,255,0.06)",
    borderRadius:      14,
    paddingHorizontal: 18,
    paddingVertical:   22,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.07)",
  },
  statCardMobile: {
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   14,
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
  chartsGridMobile: {
    gridTemplateColumns: "1fr" as any,
    gap:                 12,
  },
  chartCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius:    14,
    padding:         24,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.05)",
  },
  chartCardMobile: {
    borderRadius: 12,
    padding:      16,
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
    backgroundImage: "linear-gradient(90deg, #E85D2A, #F28C52)" as any,
    backgroundColor: "#E85D2A",
  },

  // Bar chart variants — static parts (height & transition stay computed)
  chartBarBase: { flex: 1, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)" },
  chartBarLast: { flex: 1, borderRadius: 3, backgroundColor: "#E85D2A" },

  statIconText: { fontSize: 17 },
});
