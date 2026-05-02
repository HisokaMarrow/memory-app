import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../data/gamesCatalog";
import { game as s } from "../../styles/screens/game.styles";

type GameExperienceShellProps = {
  children: ReactNode;
  eyebrow: string;
  game: GameConfig;
  phase: string;
  toneColor: string;
};

export default function GameExperienceShell({
  children,
  eyebrow,
  game,
  phase,
  toneColor,
}: GameExperienceShellProps) {
  return (
    <View style={s.page}>
      <View style={s.heroBand}>
        <View style={s.heroCopy}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>{eyebrow}</Text>
            <View style={[s.phasePill, { borderColor: `${toneColor}55`, backgroundColor: `${toneColor}1F` }]}>
              <Text style={[s.phaseText, { color: toneColor }]}>{phase}</Text>
            </View>
          </View>
          <Text style={s.title}>{game.title}</Text>
          <Text style={s.subtitle}>{game.desc}</Text>
        </View>

        <View style={[s.heroIcon, { backgroundColor: `${toneColor}24`, borderColor: `${toneColor}42` }]}>
          <MaterialCommunityIcons name={game.icon} size={34} color="#FFFFFF" />
        </View>
      </View>

      <View style={s.stage}>
        <View style={s.stageGlow} pointerEvents="none" />
        {children}
      </View>

      <TouchableOpacity style={s.backButton} onPress={() => router.push("/games" as any)}>
        <Feather name="arrow-left" size={14} color="#2A2A2A" />
        <Text style={s.backButtonText}>Back to games</Text>
      </TouchableOpacity>
    </View>
  );
}
