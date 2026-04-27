// Dark transparent nav
// Transparent on top, dark-blur when scrolled
import { StyleSheet } from "react-native";

// Nav-specific palette
export const NAV_ORANGE = "#E85D2A";
export const NAV_TEXT   = "rgba(255,255,255,0.60)";

export const s = StyleSheet.create({
  // ── Root bar ───────────────────────────────────────────────────────────────
  root: {
    position:          "fixed" as any,
    top:               0,
    left:              0,
    right:             0,
    zIndex:            200,
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 56,
    paddingVertical:   24,
    transition:        "all 0.35s ease" as any,
  },
  rootScrolled: {
    paddingVertical:      14,
    backgroundColor:      "rgba(10,10,10,0.85)",
    backdropFilter:       "blur(18px)" as any,
    WebkitBackdropFilter: "blur(18px)" as any,
    borderBottomWidth:    1,
    borderBottomColor:    "rgba(255,255,255,0.07)",
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
  logo: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    cursor:        "pointer" as any,
  },
  logoMark: {
    width:           32,
    height:          32,
    borderRadius:    8,
    backgroundColor: "#121212",
    borderWidth:     1,
    borderColor:     "rgba(232,93,42,0.35)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoMarkScrolled: {
    backgroundColor: "rgba(232,93,42,0.15)",
  },
  logoMarkText: {
    fontSize:   14,
    color:      "#E85D2A",
    fontWeight: "700" as const,
  },
  logoImg: {
    width:        62,
    height:       62,
    borderRadius: 31,
  },
  logoName: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      20,
    fontWeight:    "600" as const,
    color:         "#FFFFFF",
    letterSpacing: 0.4,
  },

  // ── Nav links ──────────────────────────────────────────────────────────────
  nav: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           32,
  },
  navLink: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   14,
    color:      NAV_TEXT,
    cursor:     "pointer" as any,
    transition: "color 0.2s" as any,
  },
  navLinkActive: { color: "rgba(255,255,255,0.95)" },

  // ── CTA button ─────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: "row",
    alignItems:    "center",
  },
  btnFilled: {
    backgroundColor:   NAV_ORANGE,
    borderRadius:      999,
    paddingHorizontal: 22,
    paddingVertical:   9,
    cursor:            "pointer" as any,
    transition:        "opacity 0.2s" as any,
  },
  btnFilledText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   14,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
});
