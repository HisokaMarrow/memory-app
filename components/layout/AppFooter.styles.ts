import { createWebStyles } from "../../styles/web";
import { C } from "../../styles/tokens";

// The footer is just another card in the dashboard stack — same dark surface,
// radius, border and shadow as the performance graph panel, sitting on the
// page's white ground with the same 32px gutter as every other card.
const PAGE_GUTTER = 32;
// Matches SIDEBAR_INSET in dashboard.styles.ts so both cards end on the same line.
const SIDEBAR_INSET = 14;
const PANEL = "#161616";
const PANEL_BORDER = "rgba(255,255,255,0.09)";

export const appFoot = createWebStyles({
  // Genuinely transparent: it only supplies the gutter and the gap above the card.
  // It must NOT paint a background of its own — an opaque fill here repaints over
  // the previous card's drop shadow and leaves a hard seam at the boundary.
  // The bottom padding matches the sidebar's inset so the footer card and the
  // sidebar card end on exactly the same line.
  section: {
    paddingTop: 20,
    paddingBottom: SIDEBAR_INSET,
    paddingHorizontal: PAGE_GUTTER,
  },
  sectionMobile: { paddingHorizontal: 14, paddingBottom: SIDEBAR_INSET },
  sectionWithBottomNav: { paddingBottom: 118 },

  card: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: PANEL_BORDER,
    borderRadius: 14,
    paddingVertical: 34,
    paddingHorizontal: 28,
    boxShadow: "0 18px 44px rgba(0,0,0,0.18)" as any,
  },
  cardMobile: { borderRadius: 16, paddingVertical: 28, paddingHorizontal: 18 },

  stack: { width: "100%" as any, alignItems: "center", gap: 26 },
  stackMobile: { gap: 22 },

  logoWrap: { flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer" as any },
  logoImg: { width: 36, height: 36, borderRadius: 18 },
  logoName: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700" as const,
    color: C.white,
  },

  nav: { flexDirection: "row", flexWrap: "wrap" as any, justifyContent: "center", gap: 6 },
  navLink: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, cursor: "pointer" as any },
  navLinkHover: { backgroundColor: "rgba(232,93,42,0.16)" },
  navLinkText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 14,
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.72)",
  },
  navLinkTextHover: { color: C.white },

  socialRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  socialButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    cursor: "pointer" as any,
  },
  socialButtonHover: { backgroundColor: "rgba(232,93,42,0.18)", borderColor: "rgba(232,93,42,0.38)" },

  divider: { width: "100%" as any, height: 1, backgroundColor: PANEL_BORDER, marginTop: 30, marginBottom: 20 },

  copyright: { width: "100%" as any, alignItems: "center" },
  copyrightText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.45)",
  },
});
