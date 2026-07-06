import { ReactNode } from "react";
import { Image, Platform, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
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
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const isNativeApp = Platform.OS !== "web";
  const useLightHeader = isNativeApp || Platform.OS === "web";

  return (
    <View style={[s.page, isNativeApp && s.pageApp, isMobile && s.pageMobile]}>
      <View style={[s.heroBand, isMobile && s.heroBandMobile]}>
        <View style={[s.heroCopy, isMobile && s.heroCopyMobile]}>
          <TouchableOpacity
            style={[s.backLink, { backgroundColor: toneColor, boxShadow: `0 7px 18px ${toneColor}38` as any }]}
            onPress={() => router.push("/games" as any)}
          >
            <Feather name="arrow-left" size={14} color="#FFFFFF" />
            <Text style={s.backLinkText}>All games</Text>
          </TouchableOpacity>
          <View style={s.eyebrowRow}>
            <Text style={[s.eyebrow, useLightHeader && s.eyebrowApp]}>{eyebrow}</Text>
            <View style={[s.phasePill, { borderColor: `${toneColor}55`, backgroundColor: `${toneColor}1F` }]}>
              <Text style={[s.phaseText, { color: toneColor }]}>{phase}</Text>
            </View>
          </View>
          <Text style={[s.title, useLightHeader && s.titleApp, isMobile && s.titleMobile]}>{game.title}</Text>
          <Text style={[s.subtitle, useLightHeader && s.subtitleApp, isMobile && s.subtitleMobile]}>{game.desc}</Text>
        </View>

        <View style={[s.heroIcon, isMobile && s.heroIconMobile, { backgroundColor: `${toneColor}24`, borderColor: `${toneColor}42` }]}>
          {game.artwork ? (
            <Image source={game.artwork} resizeMode="contain" style={s.heroArtwork} />
          ) : (
            <MaterialCommunityIcons name={game.icon} size={isMobile ? 26 : 34} color={useLightHeader ? toneColor : "#FFFFFF"} />
          )}
        </View>
      </View>

      <View style={[s.stage, isNativeApp && s.stageApp, isMobile && s.stageMobile]}>
        <View style={[s.stageGlow, { backgroundColor: `${toneColor}1A` }]} pointerEvents="none" />
        {children}
      </View>

    </View>
  );
}
