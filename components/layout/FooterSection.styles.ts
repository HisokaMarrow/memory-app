import { createWebStyles } from "../../styles/web";
import { INNER_W } from "../../styles/tokens";

export const foot = createWebStyles({
  section: {
    backgroundColor: "#0A0A0A",
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: 56,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  sectionDashboard: {
    marginTop: 0,
  },
  sectionMobile: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  sectionWithBottomNav: {
    paddingBottom: 118,
  },
  inner: {
    ...INNER_W,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  topRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 22,
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  logoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoImgMobile: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  logoName: {
    fontFamily: "Cormorant Garamond, Georgia, serif" as any,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap" as any,
  },
  socialRowMobile: {
    justifyContent: "flex-start",
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    cursor: "pointer" as any,
  },
  socialButtonHover: {
    backgroundColor: "rgba(232,93,42,0.18)",
    borderColor: "rgba(232,93,42,0.38)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.11)",
    marginTop: 28,
    marginBottom: 28,
  },
  bottomGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  bottomGridMobile: {
    flexDirection: "column-reverse",
    gap: 24,
  },
  copyrightBlock: {
    minWidth: 220,
    gap: 4,
  },
  copyrightText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.56)",
  },
  licenseText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.38)",
  },
  linkArea: {
    flex: 1,
    alignItems: "flex-end",
    gap: 16,
  },
  linkAreaMobile: {
    width: "100%" as any,
    alignItems: "flex-start",
  },
  mainLinks: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap" as any,
    gap: 16,
  },
  mainLinksMobile: {
    justifyContent: "flex-start",
    gap: 12,
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap" as any,
    gap: 18,
  },
  legalLinksMobile: {
    justifyContent: "flex-start",
    gap: 14,
  },
  linkButton: {
    paddingVertical: 4,
    cursor: "pointer" as any,
  },
  mainLinkText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 14,
    fontWeight: "800" as const,
    color: "rgba(255,255,255,0.82)",
  },
  mainLinkTextHover: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  legalLinkText: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 13,
    color: "rgba(255,255,255,0.46)",
  },
  legalLinkTextHover: {
    color: "rgba(255,255,255,0.72)",
    textDecorationLine: "underline",
  },
});
