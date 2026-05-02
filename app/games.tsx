import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import DashboardShell from "../components/dashboard/DashboardShell";
import { getFavouriteGameIds, toggleFavouriteGame } from "../components/games/gamePreferences";
import { GAMES, gamesByCategory, getCategoryConfig, type GameCategoryConfig, type GameConfig, type GameDifficulty } from "../data/gamesCatalog";
import { games as s } from "../styles/screens/games.styles";

type CardPosition = -2 | -1 | 0 | 1 | 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const CARD_POSITIONS = [-2, -1, 0, 1, 2];

function difficultyStyle(level: GameDifficulty) {
  if (level === "Beginner") return { color: "#2A9D8F", bg: "rgba(42,157,143,0.12)" };
  if (level === "Advanced") return { color: "#C45AB3", bg: "rgba(196,90,179,0.12)" };
  return { color: "#E85D2A", bg: "rgba(232,93,42,0.12)" };
}

function openGame(gameId: string) {
  router.push(`/game/${gameId}` as any);
}

const GameCard = memo(function GameCard({
  game,
  isFavourite,
  onToggleFavourite,
  stacked = false,
  isInactive = false,
  animatedStyle,
}: {
  game: GameConfig;
  isFavourite: boolean;
  onToggleFavourite: (gameId: string) => void;
  stacked?: boolean;
  isInactive?: boolean;
  animatedStyle?: any;
}) {
  const diff = difficultyStyle(game.difficulty);
  const CardComponent = stacked ? AnimatedTouchable : TouchableOpacity;
  const category = getCategoryConfig(game.category);

  return (
    <CardComponent style={[s.gameCard, stacked && s.stackedGameCard, animatedStyle]} disabled={!game.unlocked || isInactive} onPress={() => openGame(game.id)}>
      <View style={s.artZone}>
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
        <View style={s.artIcon}>
          <MaterialCommunityIcons name={game.icon} size={24} color="#FFFFFF" />
        </View>
        <TouchableOpacity
          style={[s.favouriteBtn, isFavourite && s.favouriteBtnActive]}
          onPress={(event) => {
            event.stopPropagation?.();
            onToggleFavourite(game.id);
          }}
        >
          <Feather name="heart" size={14} color={isFavourite ? "#FFFFFF" : "rgba(255,255,255,0.68)"} />
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
          <Text style={s.artLabelText}>samurai art</Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <View style={s.cardKickerRow}>
          <Text style={[s.cardKicker, { color: game.color }]}>{game.category}</Text>
          <View style={[s.cardRule, { backgroundColor: `${game.color}55` }]} />
        </View>
        <Text style={s.cardTitle}>{game.title}</Text>
        <Text style={s.cardDesc}>{game.desc}</Text>
        <View style={s.cardMeta}>
          <View style={[s.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[s.diffText, { color: diff.color }]}>{game.difficulty}</Text>
          </View>
          <View style={s.duration}>
            <Feather name="clock" size={11} color="rgba(245,239,227,0.38)" />
            <Text style={s.durationText}>{game.duration}</Text>
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

function FeaturedBanner({ isMobile }: { isMobile: boolean }) {
  const featured = GAMES[0];
  return (
    <View style={[s.featured, isMobile && s.featuredMobile]}>
      <View>
        <View style={s.featuredEyebrowRow}>
          <Text style={s.eyebrow}>Featured Game</Text>
          <View style={s.hotPill}><Text style={s.hotText}>Most Played</Text></View>
        </View>
        <Text style={s.featuredTitle}>{featured.title}</Text>
        <Text style={s.featuredText}>{featured.desc}</Text>
        <TouchableOpacity style={s.featuredBtn} onPress={() => openGame(featured.id)}>
          <Feather name="play" size={13} color="#FFFFFF" />
          <Text style={s.featuredBtnText}>Play Now</Text>
        </TouchableOpacity>
      </View>
      <View style={s.featuredOrb}>
        <View style={s.featuredOrbInner}>
          <MaterialCommunityIcons name="brain" size={38} color="rgba(255,255,255,0.86)" />
        </View>
      </View>
    </View>
  );
}

function getCardPosition(index: number, currentIndex: number, length: number): CardPosition {
  let diff = index - currentIndex;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  if (diff === 0) return 0;
  if (diff === -1) return -1;
  if (diff === 1) return 1;
  return diff < 0 ? -2 : 2;
}

function AnimatedGameCard({
  game,
  index,
  currentIndex,
  total,
  isFavourite,
  onToggleFavourite,
}: {
  game: GameConfig;
  index: number;
  currentIndex: number;
  total: number;
  isFavourite: boolean;
  onToggleFavourite: (gameId: string) => void;
}) {
  const position = getCardPosition(index, currentIndex, total);
  const motion = useRef(new Animated.Value(position)).current;

  useEffect(() => {
    motion.stopAnimation();
    Animated.timing(motion, {
      toValue: position,
      duration: 3680,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [motion, position]);

  const animatedStyle = {
    opacity: motion.interpolate({
      inputRange: CARD_POSITIONS,
      outputRange: [0, 0.48, 1, 0.48, 0],
    }),
    transform: [
      {
        translateX: motion.interpolate({
          inputRange: CARD_POSITIONS,
          outputRange: [-172, -96, 0, 96, 172],
        }),
      },
      {
        scale: motion.interpolate({
          inputRange: CARD_POSITIONS,
          outputRange: [0.78, 0.9, 1, 0.9, 0.78],
        }),
      },
      {
        rotate: motion.interpolate({
          inputRange: CARD_POSITIONS,
          outputRange: ["-5deg", "-3deg", "0deg", "3deg", "5deg"],
        }),
      },
    ],
    zIndex: position === 0 ? 20 : Math.abs(position) === 1 ? 10 : 0,
  };

  return <GameCard game={game} isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} stacked isInactive={position !== 0} animatedStyle={animatedStyle} />;
}

function CategoryCarousel({
  category,
  games,
  isCompact,
  favouriteIds,
  onToggleFavourite,
}: {
  category: GameCategoryConfig;
  games: GameConfig[];
  isCompact: boolean;
  favouriteIds: string[];
  onToggleFavourite: (gameId: string) => void;
}) {
  const color = category.color;
  const [step, setStep] = useState(0);
  const currentIndex = ((step % games.length) + games.length) % games.length;

  function handleChipPress(index: number) {
    const forward = (index - currentIndex + games.length) % games.length;
    const backward = (currentIndex - index + games.length) % games.length;
    const direction = forward <= backward ? 1 : -1;
    const distance = Math.min(forward, backward);

    if (distance <= 0) return;
    setStep((prev) => prev + direction * distance);
  }

  return (
    <View style={s.carouselSection}>
      <View style={s.rowHeader}>
        <View style={[s.rowMarker, { backgroundColor: color }]} />
        <Text style={s.rowTitle}>{category.title}</Text>
        <Text style={s.rowCount}>{games.length} games</Text>
      </View>

      <View style={[s.carouselShell, isCompact && s.carouselShellCompact]}>
        <View style={[s.categoryPanel, { backgroundColor: color }, isCompact && s.categoryPanelCompact]}>
          {category.image && (
            <>
              <Image source={category.image} style={s.categoryBgImage} resizeMode="cover" />
              <View style={s.categoryBgWash} pointerEvents="none" />
            </>
          )}
          <View style={s.categoryContent}>
            <View style={s.categoryHero}>
              <Text style={s.categoryHeroEmoji}>{category.emoji}</Text>
            </View>
            <Text style={s.categoryTitle}>{category.title}</Text>
            <Text style={s.categorySub}>{category.description}</Text>
            <View style={[s.pillWrap, !isCompact && s.pillWrapVertical]}>
              {games.map((game, index) => (
                <TouchableOpacity
                  key={game.id}
                  style={[s.categoryPill, index === currentIndex && s.categoryPillActive]}
                  onPress={() => handleChipPress(index)}
                >
                  <MaterialCommunityIcons name={game.icon} size={15} color={index === currentIndex ? color : "rgba(255,255,255,0.56)"} />
                  <Text style={[s.categoryPillText, index === currentIndex && s.categoryPillTextActive]}>{game.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={s.cardRail}>
          {isCompact ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRailScroll}>
              {games.map((game) => <GameCard key={game.id} game={game} isFavourite={favouriteIds.includes(game.id)} onToggleFavourite={onToggleFavourite} />)}
            </ScrollView>
          ) : (
            <View style={s.cardStack}>
              {games.map((game, index) => (
                <AnimatedGameCard
                  key={game.id}
                  game={game}
                  index={index}
                  currentIndex={currentIndex}
                  total={games.length}
                  isFavourite={favouriteIds.includes(game.id)}
                  onToggleFavourite={onToggleFavourite}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function GamesScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const isCompact = width < 980;
  const isMobile = width < 640;

  const categories = useMemo(() => gamesByCategory(), []);

  useEffect(() => {
    setFavouriteIds(getFavouriteGameIds());
  }, []);

  const handleToggleFavourite = useCallback((gameId: string) => {
    setFavouriteIds(toggleFavouriteGame(gameId));
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return GAMES.filter((game) =>
      [game.title, game.category, game.difficulty, game.desc].some((value) => value.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <DashboardShell
      active="games"
      title="Games"
      subtitle={`${GAMES.length} available · all games unlocked for preview`}
      beige
      headerAction={(
        <View style={[s.searchBar, searchFocus && s.searchBarFocus]}>
          <Feather name="search" size={15} color={searchFocus ? "#E85D2A" : "rgba(255,255,255,0.48)"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Search games, categories..."
            placeholderTextColor="rgba(255,255,255,0.42)"
            style={s.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity style={s.clearSearch} onPress={() => setSearch("")}>
              <Feather name="x" size={13} color="rgba(255,255,255,0.48)" />
            </TouchableOpacity>
          )}
        </View>
      )}
    >
      <View style={s.page}>
        <View style={[s.pageInner, isMobile && s.pageInnerMobile]}>
          {search.trim() ? (
            <View>
              <Text style={s.searchMeta}>
                {results.length} result{results.length === 1 ? "" : "s"} for <Text style={s.searchMetaStrong}>{`"${search.trim()}"`}</Text>
              </Text>
              {results.length > 0 ? (
                <View style={s.searchGrid}>
                  {results.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavourite={favouriteIds.includes(game.id)}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  ))}
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyText}>No games match your search. Try a different term.</Text>
                </View>
              )}
            </View>
          ) : (
            <>
              <FeaturedBanner isMobile={isMobile} />
              {categories.map(({ category, games }) => (
                <CategoryCarousel
                  key={category.id}
                  category={category}
                  games={games}
                  isCompact={isCompact}
                  favouriteIds={favouriteIds}
                  onToggleFavourite={handleToggleFavourite}
                />
              ))}
            </>
          )}
        </View>
      </View>
    </DashboardShell>
  );
}
