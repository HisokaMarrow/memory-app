import type { ReactNode } from "react";
import { View } from "react-native";

import { game as s } from "../../styles/screens/game.styles";

type GameSessionPanelProps = {
  accentColor: string;
  children: ReactNode;
  mobile?: boolean;
};

/**
 * The shared container for every focused game phase.
 *
 * Games own the content inside this frame; the surface, spacing, radius and
 * shadow stay consistent across display/input and results screens.
 */
export default function GameSessionPanel({
  accentColor,
  children,
  mobile = false,
}: GameSessionPanelProps) {
  return (
    <View style={[s.sessionPanel, mobile && s.sessionPanelMobile]}>
      <View
        style={[s.sessionAccent, { backgroundColor: accentColor }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
