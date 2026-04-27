import { StyleSheet } from "react-native";
import { C, FONT, RADIUS, MAX_W, SPACE } from "./main";

export const s = StyleSheet.create({
  root: {
    backgroundColor:  C.bgForestDeep,
    borderTopWidth:   1,
    borderTopColor:   "rgba(255,255,255,0.06)",
    paddingVertical:  SPACE.xl,
  },
  inner: {
    maxWidth:          MAX_W,
    marginHorizontal:  "auto" as any,
    paddingHorizontal: 48,
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
    flexWrap:          "wrap" as any,
    gap:               SPACE.lg,
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  brand: {
    gap:      12,
    maxWidth: 260,
  },
  logo: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    marginBottom:  4,
  },
  logoMark: {
    width:           30,
    height:          30,
    borderRadius:    RADIUS.sm,
    backgroundColor: C.greenDeep,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.12)",
  },
  logoGlyph: {
    fontSize:   12,
    color:      C.textInverse,
    fontWeight: "800" as const,
  },
  logoName: {
    ...FONT.label,
    fontSize:     14,
    color:        "rgba(255,255,255,0.80)",
    letterSpacing: 3.5,
  },
  tagline: {
    ...FONT.small,
    color:      "rgba(255,255,255,0.28)",
    lineHeight: 22,
  },
  copy: {
    ...FONT.xs,
    color:     "rgba(255,255,255,0.18)",
    marginTop: 4,
  },

  // ── Link columns ──────────────────────────────────────────────────────────
  cols: {
    flexDirection: "row",
    gap:           SPACE.xl,
    flexWrap:      "wrap" as any,
  },
  col: {
    gap:      10,
    minWidth: 110,
  },
  colTitle: {
    ...FONT.label,
    fontSize:  10,
    color:     "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  colLink: {
    ...FONT.small,
    color:      "rgba(255,255,255,0.45)",
    cursor:     "pointer" as any,
    transition: "color 0.15s" as any,
  },
});
