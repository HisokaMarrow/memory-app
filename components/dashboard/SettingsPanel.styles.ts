import { createWebStyles } from "../../styles/web";

const orange = "#E85D2A";
const black = "#121212";
const body = "#2A2A2A";
const white = "#FFFFFF";
const offWhite = "#F7F7F7";
const border = "#DADADA";
const muted = "#8C8C8C";
const panel = "#161616";
const darkBorder = "rgba(255,255,255,0.10)";

export const settingsPanel = createWebStyles({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  hitLayer: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
    width: "min(92vw, 820px)" as any,
    maxHeight: "86vh" as any,
    backgroundColor: white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(18,18,18,0.12)",
    overflow: "hidden",
    boxShadow: "0 28px 90px rgba(0,0,0,0.30)" as any,
  },
  scroll: { maxHeight: "86vh" as any },
  header: {
    backgroundColor: panel,
    paddingHorizontal: 26,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: darkBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  titleBlock: { flex: 1 },
  eyebrow: {
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as any,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 8,
  },
  title: { fontFamily: "Cormorant Garamond, Georgia, serif" as any, fontSize: 31, fontWeight: "600" as const, color: white, lineHeight: 34 },
  subtitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, color: "rgba(255,255,255,0.58)", marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: darkBorder, alignItems: "center", justifyContent: "center" },

  body: { padding: 26, gap: 18 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 18, flexWrap: "wrap" as any },
  avatarPreview: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(232,93,42,0.20)",
    overflow: "hidden",
  },
  avatarImage: { width: "100%" as any, height: "100%" as any },
  avatarText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 28, fontWeight: "800" as const, color: white },
  profileText: { flex: 1, minWidth: 220 },
  profileName: { fontFamily: "Cormorant Garamond, Georgia, serif" as any, fontSize: 26, fontWeight: "600" as const, color: black },
  profileEmail: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, color: muted, marginTop: 2 },

  section: { borderWidth: 1, borderColor: "rgba(18,18,18,0.10)", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.78)", padding: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(232,93,42,0.10)", alignItems: "center", justifyContent: "center" },
  sectionEmoji: { fontSize: 15, lineHeight: 20 },
  sectionTitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 15, fontWeight: "700" as const, color: black },
  sectionSub: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: muted, marginTop: 2 },

  fieldGrid: { display: "grid" as any, gridTemplateColumns: "1fr 1fr" as any, gap: 14 },
  fieldGridStacked: { display: "flex" as any, flexDirection: "column" },
  field: { gap: 7 },
  label: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.9, textTransform: "uppercase" as any, color: muted },
  input: {
    backgroundColor: offWhite,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: "DM Sans, system-ui, sans-serif" as any,
    fontSize: 14,
    color: black,
    outlineStyle: "none" as any,
  },
  colorRow: { flexDirection: "row", gap: 9, flexWrap: "wrap" as any },
  colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
  colorSwatchActive: { borderColor: black, boxShadow: "0 0 0 3px rgba(232,93,42,0.18)" as any },
  iconActionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" as any },

  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16, flexWrap: "wrap" as any },
  primaryBtn: { backgroundColor: orange, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  primaryBtnDisabled: { opacity: 0.58 },
  primaryText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, fontWeight: "700" as const, color: white },
  ghostBtn: { borderWidth: 1, borderColor: border, backgroundColor: offWhite, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  ghostText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, fontWeight: "600" as const, color: body },

  msg: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  msgOk: { backgroundColor: "rgba(42,157,143,0.10)", borderWidth: 1, borderColor: "rgba(42,157,143,0.18)" },
  msgBad: { backgroundColor: "rgba(232,93,42,0.10)", borderWidth: 1, borderColor: "rgba(232,93,42,0.20)" },
  msgText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: body },

  helpList: { gap: 10 },
  helpItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, backgroundColor: offWhite, borderWidth: 1, borderColor: border },
  helpEmoji: { fontSize: 14, lineHeight: 18 },
  helpCopy: { flex: 1 },
  helpTitle: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 13, fontWeight: "700" as const, color: black },
  helpText: { fontFamily: "DM Sans, system-ui, sans-serif" as any, fontSize: 12, color: muted, marginTop: 2, lineHeight: 17 },
});
