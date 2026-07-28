export function buttonElevation(isHovered: boolean) {
  return {
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
    boxShadow: isHovered ? "0 8px 24px rgba(232,93,42,0.35)" : "none",
  };
}
