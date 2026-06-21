import { createWebStyles } from "../../styles/web";
// Dark transparent nav
// Transparent on top, dark-blur when scrolled

// Nav-specific palette
export const NAV_ORANGE = "#E85D2A";
export const NAV_TEXT   = "rgba(255,255,255,0.60)";

export const s = createWebStyles({
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
  rootCompact: {
    paddingHorizontal: 28,
    paddingVertical:   18,
  },
  rootMobile: {
    paddingHorizontal: 18,
    paddingTop:        14,
    paddingBottom:     12,
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
    position:      "relative" as any,
    zIndex:        230,
  },
  logoMobileSurface: {
    paddingRight:    10,
    borderRadius:    999,
    backgroundColor: "rgba(8,8,8,0.34)",
    backdropFilter:  "blur(10px)" as any,
    WebkitBackdropFilter: "blur(10px)" as any,
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
  logoImgMobile: {
    width:        46,
    height:       46,
    borderRadius: 23,
  },
  logoName: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      20,
    fontWeight:    "600" as const,
    color:         "#FFFFFF",
    letterSpacing: 0.4,
    textShadow: "0 1px 10px rgba(0,0,0,0.72)" as any,
  },
  logoNameMobile: {
    fontSize: 18,
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
  btnFilledMobile: {
    paddingHorizontal: 18,
    paddingVertical:   10,
    minHeight:         42,
    justifyContent:    "center",
  },
  btnFilledHover: {
    opacity: 0.85,
  },
  btnFilledText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   14,
    fontWeight: "600" as const,
    color:      "#FFFFFF",
  },
  btnFilledTextMobile: {
    fontSize: 13,
  },
  menuButton: {
    position:        "relative" as any,
    width:           44,
    height:          44,
    borderRadius:    999,
    backgroundColor: "rgba(10,10,10,0.58)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.12)",
    alignItems:      "center",
    justifyContent:  "center",
    cursor:          "pointer" as any,
    zIndex:          240,
  },
  menuButtonActive: {
    backgroundColor: "rgba(232,93,42,0.95)",
    borderColor:     "rgba(232,93,42,0.95)",
  },
  mobileMenu: {
    position:          "absolute",
    top:               82,
    right:             28,
    width:             320,
    backgroundColor:   "rgba(10,10,10,0.94)",
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.10)",
    borderRadius:      16,
    padding:           10,
    gap:               4,
    boxShadow:         "0 18px 48px rgba(0,0,0,0.32)" as any,
    backdropFilter:    "blur(18px)" as any,
    WebkitBackdropFilter: "blur(18px)" as any,
  },
  mobileMenuPhone: {
    position:       "fixed" as any,
    top:            0,
    left:           0,
    right:          0,
    bottom:         0,
    width:          "100%" as any,
    minHeight:      "100vh" as any,
    borderRadius:   0,
    paddingTop:     92,
    paddingLeft:    22,
    paddingRight:   22,
    paddingBottom:  26,
    backgroundColor:"rgba(7,7,7,0.985)",
    borderWidth:    0,
    gap:            8,
  },
  mobileMenuItem: {
    minHeight:        48,
    borderRadius:     11,
    paddingHorizontal: 14,
    flexDirection:    "row",
    alignItems:       "center",
    justifyContent:   "space-between",
  },
  mobileMenuText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   15,
    fontWeight: "600" as const,
    color:      "rgba(255,255,255,0.82)",
  },
  mobileMenuCta: {
    minHeight:        50,
    borderRadius:     12,
    backgroundColor:  NAV_ORANGE,
    marginTop:        6,
    alignItems:       "center",
    justifyContent:   "center",
    paddingHorizontal: 16,
  },
  mobileMenuCtaText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   15,
    fontWeight: "700" as const,
    color:      "#FFFFFF",
  },
});
