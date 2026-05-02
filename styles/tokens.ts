export const C = {
  white:        "#FFFFFF",
  cream:        "#F7F7F7",
  creamMid:     "#EFEFEF",
  bgForest:     "#1A1A1A",
  bgForestDeep: "#121212",
  bgGreen:      "#121212",

  border:       "#DADADA",
  borderGreen:  "rgba(255,255,255,0.09)",

  text:         "#121212",
  body:         "#2A2A2A",
  muted:        "#9E9E9E",
  textInverse:  "#FFFFFF",
  mutedInverse: "rgba(255,255,255,0.45)",
  creamText:    "#FFFFFF",

  greenDeep:    "#E85D2A",
  greenMid:     "#F28C52",
  greenBright:  "#F28C52",
  greenBg:      "#FEF0EB",
  greenBgMid:   "#FBDECF",

  gold:         "#C8A85A",
  goldLight:    "#E8D49A",
  goldBg:       "#FAF5E4",
  goldText:     "#7A6230",

  orange:       "#E85D2A",
  orangeLight:  "#F28C52",
  orangeBg:     "#FEF0EB",
} as const;

export const FONT = {
  display: { fontSize: 64, fontWeight: "800" as const, letterSpacing: -1.5, lineHeight: 70 },
  hero:    { fontSize: 56, fontWeight: "800" as const, letterSpacing: -1.2, lineHeight: 62 },
  h1:      { fontSize: 44, fontWeight: "800" as const, letterSpacing: -0.8, lineHeight: 52 },
  h2:      { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.4, lineHeight: 42 },
  h3:      { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.2, lineHeight: 30 },
  h4:      { fontSize: 18, fontWeight: "600" as const, lineHeight: 26 },
  body:    { fontSize: 16, fontWeight: "400" as const, lineHeight: 27 },
  bodyLg:  { fontSize: 18, fontWeight: "400" as const, lineHeight: 30 },
  small:   { fontSize: 14, fontWeight: "400" as const, lineHeight: 22 },
  xs:      { fontSize: 12, fontWeight: "400" as const, lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: "700" as const, letterSpacing: 2.5 },
} as const;

export const SPACE = {
  xs:  8,
  sm:  16,
  md:  24,
  lg:  40,
  xl:  64,
  xxl: 104,
} as const;

export const RADIUS = {
  sm:   10,
  md:   16,
  lg:   24,
  xl:   32,
  full: 999,
} as const;

export const SHADOW = {
  xs:    "0 1px 4px rgba(0,0,0,0.05)",
  sm:    "0 2px 12px rgba(0,0,0,0.07)",
  md:    "0 4px 32px rgba(0,0,0,0.09)",
  lg:    "0 8px 48px rgba(0,0,0,0.12)",
  glow:  "0 0 40px rgba(232,93,42,0.20)",
  video: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
} as const;

export const MAX_W = 1140;
export const NAV_H = 68;

export const INNER = {
  maxWidth:          MAX_W,
  marginHorizontal:  "auto" as const,
  paddingHorizontal: 48,
  width:             "100%" as const,
};

export const P = {
  dark:       "#080808",
  green:      "#121212",
  greenMid:   "#2A2A2A",
  greenLight: "#DADADA",
  cream:      "#FFFFFF",
  creamAlt:   "#F7F7F7",
  gold:       "#E85D2A",
  goldLight:  "#FEF0EB",
  amber:      "#E85D2A",
  textMid:    "#2A2A2A",
  textLight:  "#9E9E9E",
  white:      "#FFFFFF",
  pureWhite:  "#FFFFFF",
} as const;

export const SECTION_PAD = { paddingVertical: 100, paddingHorizontal: 56 } as const;
export const INNER_W     = { maxWidth: 1100, marginHorizontal: "auto" as const, width: "100%" as const };
