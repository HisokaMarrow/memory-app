import { createWebStyles } from "../../styles/web";
import { INNER_W, P } from "../../styles/tokens";

// ── FOOTER ────────────────────────────────────────────────────────────────────
export const foot = createWebStyles({
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
