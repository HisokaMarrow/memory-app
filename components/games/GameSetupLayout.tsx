import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { GameConfig } from "../../data/gamesCatalog";
import { game as s } from "../../styles/screens/game.styles";

type GameSetupLayoutProps = {
  game: GameConfig;
  children: ReactNode;
  canStart: boolean;
  isMobile: boolean;
  onStart: () => void;
  title?: string;
  kicker?: string;
  description?: string;
  startLabel?: string;
  headerVisual?: ReactNode;
};

/**
 * Shared frame for every game's setup screen.
 *
 * The frame owns the stable design (panel, header, visual slot, settings grid,
 * and primary action). Each game supplies only its own controls and behaviour.
 */
export default function GameSetupLayout({
  game,
  children,
  canStart,
  isMobile,
  onStart,
  title = game.setup?.title ?? `Prepare your ${game.title.toLowerCase()} run`,
  kicker = game.setup?.kicker ?? "Game Settings",
  description = game.setup?.description,
  startLabel = game.setup?.startLabel ?? "Start Exercise",
  headerVisual,
}: GameSetupLayoutProps) {
  return (
    <View style={[s.panel, isMobile && s.panelMobile]}>
      <View style={[s.panelHeader, isMobile && s.panelHeaderMobile]}>
        <View style={isMobile && s.panelHeaderCopyMobile}>
          <Text style={[s.kicker, { color: game.color }]}>{kicker}</Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>{title}</Text>
          {description ? <Text style={s.setupDescription}>{description}</Text> : null}
        </View>
        <View style={[s.settingsIcon, isMobile && s.settingsIconMobile]}>
          {headerVisual ?? <Feather name="sliders" size={18} color="#FFFFFF" />}
        </View>
      </View>

      <View style={[s.settingsGrid, isMobile && s.settingsGridMobile]}>
        {children}
      </View>

      <TouchableOpacity
        disabled={!canStart}
        style={[
          s.primaryButton,
          { backgroundColor: game.color, boxShadow: `0 10px 26px ${game.color}38` as any },
          isMobile && s.primaryButtonMobile,
          !canStart && s.buttonDisabled,
        ]}
        onPress={onStart}
      >
        <Feather name="play" size={15} color="#FFFFFF" />
        <Text style={s.primaryButtonText}>{startLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
