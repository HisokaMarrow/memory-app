import { createWebStyles } from "../web";
import { C, FONT, P, RADIUS, SPACE } from "../tokens";

// ── LOGIN PAGE ───────────────────────────────────────────────────────────────
export const login = createWebStyles({
  root: {
    flex:            1,
    backgroundColor: P.dark,
  },
  bgImage: {
    position: "absolute" as any,
    top: 0, left: 0, right: 0, bottom: 0,
    width:   "100%" as any,
    height:  "100%" as any,
    zIndex:  0,
  },
  overlay: {
    position:        "absolute" as any,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "transparent",
    zIndex:          1,
  },
  scrollInner: {
    flex:          1,
    minHeight:     "100vh" as any,
    flexDirection: "column",
  },
  main: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    paddingTop:     120,
    paddingBottom:  SPACE.xl,
    position:       "relative" as any,
    zIndex:         10,
  },
  card: {
    width:               420,
    backgroundColor:     "rgba(18,18,18,0.82)",
    backdropFilter:      "blur(28px) saturate(140%)" as any,
    WebkitBackdropFilter:"blur(28px) saturate(140%)" as any,
    borderWidth:         1,
    borderColor:         "rgba(255,255,255,0.10)",
    borderRadius:        RADIUS.lg,
    paddingHorizontal:   44,
    paddingTop:          48,
    paddingBottom:       40,
    boxShadow:           "0 32px 80px rgba(0,0,0,0.60)" as any,
  },

  // ── Logo row ────────────────────────────────────────────────────────────────
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36 },
  logoImg: { width: 48, height: 48, borderRadius: 24 },
  logoName: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      20,
    fontWeight:    "600" as const,
    color:         C.textInverse,
    letterSpacing: 0.5,
  },

  // ── Heading ─────────────────────────────────────────────────────────────────
  headWrap:  { marginBottom: 32 },
  h1: {
    fontFamily:    "Cormorant Garamond, Georgia, serif" as any,
    fontSize:      36,
    fontWeight:    "600" as const,
    color:         C.textInverse,
    letterSpacing: -0.7,
    lineHeight:    40,
    marginBottom:  SPACE.xs,
  },
  subtitle: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   14,
    color:      C.mutedInverse,
    lineHeight: 22,
  },

  // ── Form ────────────────────────────────────────────────────────────────────
  form:      { gap: 14 },
  googleBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    cursor: "pointer" as any,
  },
  googleIcon: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  googleText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 14,
    color: "rgba(255,255,255,0.74)",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  dividerText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 12,
    color: "rgba(255,255,255,0.28)",
  },
  fieldWrap: { gap: 7 },
  label: {
    fontFamily:    "DM Sans, system-ui, sans-serif" as any,
    fontSize:      FONT.xs.fontSize,
    fontWeight:    "500" as const,
    color:         "rgba(255,255,255,0.50)",
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.12)",
    borderRadius:    RADIUS.sm,
    paddingHorizontal: SPACE.sm,
    paddingVertical:   14,
    color:           C.textInverse,
    fontFamily:      "DM Sans, system-ui, sans-serif" as any,
    fontSize:        15,
    transition:      "all 0.2s" as any,
  },
  inputFocused: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor:     "rgba(232,93,42,0.55)",
    boxShadow:       "0 0 0 3px rgba(232,93,42,0.12)" as any,
  },
  inputPass: { paddingRight: 54 },

  // ── Password header ─────────────────────────────────────────────────────────
  passHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgotText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   FONT.xs.fontSize,
    color:      "rgba(232,93,42,0.70)",
    cursor:     "pointer" as any,
    transition: "color 0.2s" as any,
  },
  passWrap: { position: "relative" as any },
  eyeBtn: {
    position:         "absolute" as any,
    right:            14,
    top:              0,
    bottom:           0,
    justifyContent:   "center",
    paddingHorizontal: 4,
    cursor:           "pointer" as any,
  },
  eyeText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize:   12,
    color:      "rgba(255,255,255,0.40)",
  },

  // ── Message boxes ────────────────────────────────────────────────────────────
  msgBox:        { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },
  msgBoxError:   { backgroundColor: "rgba(248,113,113,0.10)", borderWidth: 1, borderColor: "rgba(248,113,113,0.20)" },
  msgBoxSuccess: { backgroundColor: "rgba(134,239,172,0.10)", borderWidth: 1, borderColor: "rgba(134,239,172,0.20)" },
  msgText:        { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: FONT.small.fontSize },
  msgTextError:   { color: "#f87171" },
  msgTextSuccess: { color: "#86efac" },

  // ── Submit button ────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: P.gold,
    borderRadius:    RADIUS.sm,
    paddingVertical: 15,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       6,
    cursor:          "pointer" as any,
    boxShadow:       "0 8px 24px rgba(232,93,42,0.30)" as any,
    transition:      "box-shadow 0.2s" as any,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(232,93,42,0.55)",
    boxShadow:       "none" as any,
  },
  submitBtnText: {
    fontFamily:    "DM Sans, system-ui, sans-serif" as any,
    fontSize:      15,
    fontWeight:    "600" as const,
    color:         C.textInverse,
    letterSpacing: 0.2,
  },

  // ── Mode toggle ──────────────────────────────────────────────────────────────
  footerRow:  { alignItems: "center", marginTop: 28 },
  footerText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: FONT.small.fontSize, color: "rgba(255,255,255,0.35)" },
  footerLink: { color: "rgba(232,93,42,0.80)", fontWeight: "500" as const, cursor: "pointer" as any },

  // ── Footer z-index wrapper ───────────────────────────────────────────────────
  footerWrap: { position: "relative" as any, zIndex: 10 },
});
