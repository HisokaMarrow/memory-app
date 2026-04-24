// Header is always on a light background — no dark-hero mode
import { StyleSheet } from "react-native";
import { C, FONT, NAV_H, MAX_W, RADIUS, SHADOW } from "./theme";

export const s = StyleSheet.create({
  root: {
    height: NAV_H,
    position:            "fixed" as any,
    top:                 0,
    left:                0,
    right:               0,
    zIndex:              200,
    backgroundColor:     C.cream,
    borderBottomWidth:   1,
    borderBottomColor:   "transparent",
    transition:          "border-color 0.25s, box-shadow 0.25s" as any,
  },
  rootScrolled: {
    backgroundColor:     C.cream,
    borderBottomColor:   C.border,
    boxShadow:           SHADOW.sm as any,
  },
  inner: {
    flex:                1,
    flexDirection:       "row",
    alignItems:          "center",
    justifyContent:      "space-between",
    maxWidth:            MAX_W,
    marginHorizontal:    "auto" as any,
    paddingHorizontal:   48,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logo: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    cursor:        "pointer" as any,
  },
  logoMark: {
    width:           36,
    height:          36,
    borderRadius:    RADIUS.sm,
    backgroundColor: C.greenDeep,
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoMarkGlyph: {
    fontSize:   15,
    color:      C.textInverse,
    fontWeight: "800" as const,
  },
  logoName: {
    ...FONT.label,
    fontSize:    16,
    color:       C.text,
    letterSpacing: 3.5,
  },

  // ── Nav links ─────────────────────────────────────────────────────────────
  nav: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           32,
  },
  navLink: {
    ...FONT.small,
    fontWeight:  "500" as const,
    color:       C.body,
    cursor:      "pointer" as any,
    transition:  "color 0.15s" as any,
  },

  // ── CTA row ───────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
  },
  btnGhost: {
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    RADIUS.sm,
    paddingHorizontal: 18,
    paddingVertical:   9,
  },
  btnGhostText: {
    ...FONT.small,
    fontWeight: "600" as const,
    color:      C.body,
  },
  btnFilled: {
    backgroundColor: C.greenDeep,
    borderRadius:    RADIUS.sm,
    paddingHorizontal: 20,
    paddingVertical:   10,
    boxShadow:       "0 2px 8px rgba(26,61,43,0.25)" as any,
  },
  btnFilledText: {
    ...FONT.small,
    fontWeight: "700" as const,
    color:      C.textInverse,
  },
});
