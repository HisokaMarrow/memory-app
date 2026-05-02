import { StyleSheet } from "react-native";

export function createWebStyles(styles: Record<string, unknown>): any {
  return StyleSheet.create(styles as any) as any;
}

export const HOVER = {
  heroPrimaryTransform:   "translateY(-2px)",
  heroPrimaryHoverShadow: "0 16px 40px rgba(232,93,42,0.50)",
  heroPrimaryBaseShadow:  "0 8px 32px rgba(232,93,42,0.30)",
  heroSecondaryHoverBg:   "rgba(255,255,255,0.15)",
  heroSecondaryBaseBg:    "rgba(255,255,255,0.08)",
  cardHoverTransform:     "translateY(-6px)",
  cardHoverShadow:        "0 20px 48px rgba(0,0,0,0.12)",
  ctaHoverTransform:      "translateY(-3px)",
  ctaHoverShadow:         "0 22px 50px rgba(232,93,42,0.45)",
  ctaBaseShadow:          "0 12px 40px rgba(232,93,42,0.30)",
  navBtnOpacity:          "0.85",
  navBtnOpacityBase:      "1",
};

export const INPUT_STYLE = {
  background:    "rgba(255,255,255,0.07)",
  border:        "1px solid rgba(255,255,255,0.18)",
  borderRadius:  10,
  padding:       "13px 20px",
  fontFamily:    "Cormorant Garamond, Georgia, serif",
  fontSize:      20,
  color:         "#FFFFFF",
  textAlign:     "center" as const,
  width:         230,
  outline:       "none",
  letterSpacing: "0.15em",
  marginBottom:  18,
};

export const HERO_IMG_STYLE = {
  position:       "absolute",
  top:            0,
  left:           0,
  width:          "100%",
  height:         "100%",
  objectFit:      "cover",
  objectPosition: "right center",
  display:        "block",
} as const;

export const WORD_INPUT_STYLE = {
  background:     "rgba(255,255,255,0.06)",
  border:         "1px solid rgba(255,255,255,0.12)",
  borderRadius:   8,
  padding:        "9px 8px",
  fontFamily:     "Cormorant Garamond, Georgia, serif",
  fontSize:       15,
  color:          "#FFFFFF",
  width:          "100%",
  outline:        "none",
  textAlign:      "center" as const,
  textTransform:  "lowercase" as const,
};
