import { createWebStyles } from "../../styles/web";

const orange = "#E85D2A";
const black = "#121212";
const white = "#FFFFFF";
const offWhite = "#F7F7F7";
const border = "#DADADA";
const muted = "#8C8C8C";
const panel = "#161616";
const darkBorder = "rgba(255,255,255,0.10)";

export const profilePanel = createWebStyles({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  hitLayer: { position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0 },
  blurLayer: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8,8,8,0.44)",
    backdropFilter: "blur(12px)" as any,
    WebkitBackdropFilter: "blur(12px)" as any,
  },
  card: {
    width: "min(92vw, 760px)" as any,
    maxHeight: "86vh" as any,
    backgroundColor: white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(18,18,18,0.12)",
    overflow: "hidden",
    boxShadow: "0 28px 90px rgba(0,0,0,0.30)" as any,
  },
  scroll: { maxHeight: "86vh" as any },
  hero: {
    backgroundColor: panel,
    padding: 26,
    borderBottomWidth: 1,
    borderBottomColor: darkBorder,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: darkBorder, alignItems: "center", justifyContent: "center" },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8, flexWrap: "wrap" as any },
  avatar: { width: 86, height: 86, borderRadius: 43, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  avatarImage: { width: "100%" as any, height: "100%" as any, borderRadius: 43 },
  avatarText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 32, fontWeight: "800" as const, color: white },
  titleBlock: { flex: 1, minWidth: 0, maxWidth: "100%" as any },
  eyebrow: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as any,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 8,
  },
  title: { fontFamily: "Cormorant Garamond, Georgia, serif" as any, fontSize: 32, fontWeight: "600" as const, color: white, lineHeight: 35 },
  subtitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, color: "rgba(255,255,255,0.58)", marginTop: 4, lineHeight: 19, flexShrink: 1 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18, flexWrap: "wrap" as any },
  orangeBtn: { backgroundColor: orange, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  orangeBtnText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, fontWeight: "700" as const, color: white },
  ghostBtn: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: darkBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  ghostText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, fontWeight: "600" as const, color: white },

  body: { padding: 26, gap: 18 },
  statGrid: { display: "grid" as any, gridTemplateColumns: "1fr 1fr 1fr" as any, gap: 12 },
  statGridStacked: { display: "flex" as any, flexDirection: "column" },
  statCard: { backgroundColor: offWhite, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 16 },
  statValue: { fontFamily: "Cormorant Garamond, Georgia, serif" as any, fontSize: 30, fontWeight: "700" as const, color: orange, lineHeight: 32 },
  statLabel: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: muted, marginTop: 4 },

  section: { borderWidth: 1, borderColor: "rgba(18,18,18,0.10)", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.78)", padding: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 15, fontWeight: "700" as const, color: black },
  sectionSub: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: muted, marginTop: 2, lineHeight: 17, flexShrink: 1 },
  achievementList: { gap: 10 },
  achievement: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: offWhite, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 13 },
  achievementLocked: { opacity: 0.56 },
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,93,42,0.12)" },
  badgeLocked: { backgroundColor: "#E8E8E8" },
  badgeEmoji: { fontSize: 17, lineHeight: 22 },
  achievementCopy: { flex: 1, minWidth: 0 },
  achievementTitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 14, fontWeight: "700" as const, color: black },
  achievementText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: muted, marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: border, borderRadius: 999, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%" as any, backgroundColor: orange, borderRadius: 999 },
  unlockedEmoji: { fontSize: 18, lineHeight: 22 },
  smallPill: { backgroundColor: "rgba(232,93,42,0.10)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  smallPillText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 11, fontWeight: "700" as const, color: orange },
});
