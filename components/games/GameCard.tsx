import { memo } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { getCategoryConfig, type GameConfig, type GameDifficulty } from "../../data/gamesCatalog";
import { games as s } from "../../styles/screens/games.styles";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function difficultyStyle(level: GameDifficulty) {
  if (level === "Beginner") return { color: "#2A9D8F", bg: "rgba(42,157,143,0.12)" };
  if (level === "Advanced") return { color: "#C45AB3", bg: "rgba(196,90,179,0.12)" };
  return { color: "#E85D2A", bg: "rgba(232,93,42,0.12)" };
}

function openGame(gameId: string) {
  router.push(`/game/${gameId}` as any);
}

export const GameCard = memo(function GameCard({
  game,
  isFavourite,
  onToggleFavourite,
  stacked = false,
  isInactive = false,
  animatedStyle,
  cardStyle,
}: {
  game: GameConfig;
  isFavourite: boolean;
  onToggleFavourite: (gameId: string) => void;
  stacked?: boolean;
  isInactive?: boolean;
  animatedStyle?: any;
  cardStyle?: any;
}) {
  const diff = difficultyStyle(game.difficulty);
  const CardComponent = stacked ? AnimatedTouchable : TouchableOpacity;
  const category = getCategoryConfig(game.category);
  const isNativeApp = Platform.OS !== "web";

  return (
    <CardComponent style={[s.gameCard, isNativeApp && s.gameCardApp, stacked && s.stackedGameCard, cardStyle, animatedStyle]} disabled={!game.unlocked || isInactive} onPress={() => openGame(game.id)}>
      <View style={[s.artZone, isNativeApp && s.artZoneApp]}>
        <View style={s.artStripe} />
        <View style={[s.artWash, { backgroundColor: `${game.color}AA` }]} />
        <View style={s.artPatternRow} pointerEvents="none">
          {category.pattern.map((mark, index) => (
            <Text key={`${game.id}-${index}`} style={s.artPatternMark}>{mark}</Text>
          ))}
        </View>
        <View style={s.cardEmojiBadge}>
          <Text style={s.cardEmojiText}>{category.emoji}</Text>
        </View>
        <View style={[s.artIcon, isNativeApp && s.artIconApp]}>
          <MaterialCommunityIcons name={game.icon} size={24} color={isNativeApp ? game.color : "#FFFFFF"} />
        </View>
        <TouchableOpacity
          style={[s.favouriteBtn, isFavourite && s.favouriteBtnActive]}
          onPress={(event) => {
            event.stopPropagation?.();
            onToggleFavourite(game.id);
          }}
        >
          <Feather name="heart" size={14} color={isFavourite ? "#FFFFFF" : isNativeApp ? "#6A7A86" : "rgba(255,255,255,0.68)"} />
        </TouchableOpacity>
        <View style={s.badgeStack}>
          {game.hot && (
            <View style={[s.smallBadge, { backgroundColor: "rgba(255,170,0,0.22)", borderColor: "rgba(255,170,0,0.30)" }]}>
              <Text style={[s.smallBadgeText, { color: "#FFD580" }]}>Hot</Text>
            </View>
          )}
          {game.fresh && (
            <View style={[s.smallBadge, { backgroundColor: "rgba(42,157,143,0.22)", borderColor: "rgba(42,157,143,0.30)" }]}>
              <Text style={[s.smallBadgeText, { color: "#7DECD4" }]}>New</Text>
            </View>
          )}
        </View>
        <View style={s.artLabel}>
          <Text style={s.artLabelText}>training art</Text>
        </View>
      </View>

      <View style={[s.cardBody, isNativeApp && s.cardBodyApp]}>
        <View style={s.cardKickerRow}>
          <Text style={[s.cardKicker, { color: game.color }]}>{game.category}</Text>
          <View style={[s.cardRule, { backgroundColor: `${game.color}55` }]} />
        </View>
        <Text style={[s.cardTitle, isNativeApp && s.cardTitleApp]}>{game.title}</Text>
        <Text style={[s.cardDesc, isNativeApp && s.cardDescApp]}>{game.desc}</Text>
        <View style={s.cardMeta}>
          <View style={[s.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[s.diffText, { color: diff.color }]}>{game.difficulty}</Text>
          </View>
          <View style={s.duration}>
            <Feather name="clock" size={11} color={isNativeApp ? "#7A8A95" : "rgba(245,239,227,0.38)"} />
            <Text style={[s.durationText, isNativeApp && s.durationTextApp]}>{game.duration}</Text>
          </View>
        </View>
        <TouchableOpacity
          disabled={!game.unlocked}
          onPress={() => openGame(game.id)}
          style={[s.playButton, { backgroundColor: game.unlocked ? `${game.color}22` : "rgba(255,255,255,0.04)", borderColor: game.unlocked ? `${game.color}44` : "rgba(255,255,255,0.07)" }]}
        >
          <Feather name={game.unlocked ? "play" : "lock"} size={12} color={game.unlocked ? game.color : "rgba(255,255,255,0.24)"} />
          <Text style={[s.playButtonText, { color: game.unlocked ? game.color : "rgba(255,255,255,0.24)" }]}>{game.unlocked ? "Play Now" : "Locked"}</Text>
        </TouchableOpacity>
      </View>
    </CardComponent>
  );
});
