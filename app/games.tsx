import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useFavouriteGames } from "../components/games/useFavouriteGames";
import { GAMES, gamesByCategory, getCategoryConfig, type GameCategoryConfig, type GameConfig, type GameDifficulty } from "../data/gamesCatalog";
import { games as s } from "../styles/screens/games.styles";

type CardPosition = -2 | -1 | 0 | 1 | 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const CARD_POSITIONS = [-2, -1, 0, 1, 2];
const MOBILE_CARD_WIDTH = 290;
const MOBILE_CARD_GAP = 18;

function findVerticalScrollParent(node: EventTarget | null) {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;

  let element = node instanceof HTMLElement ? node.parentElement : null;
  while (element) {
    const style = window.getComputedStyle(element);
    const canScroll = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
    if (canScroll) return element;
    element = element.parentElement;
  }

  return document.scrollingElement as HTMLElement | null;
}

function passVerticalWheelToParent(event: any) {
  if (Platform.OS !== "web") return;

  const raw = event?.nativeEvent ?? event;
  const deltaY = Number(raw?.deltaY ?? 0);
  const deltaX = Number(raw?.deltaX ?? 0);
  if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 2) return;

  const scrollParent = findVerticalScrollParent(raw?.target ?? event?.target ?? null);
  if (!scrollParent) return;

  event?.preventDefault?.();
  raw?.preventDefault?.();
  event?.stopPropagation?.();
  raw?.stopPropagation?.();
  scrollParent.scrollTop += deltaY;
}

function difficultyStyle(level: GameDifficulty) {
  if (level === "Beginner") return { color: "#2A9D8F", bg: "rgba(42,157,143,0.12)" };
  if (level === "Advanced") return { color: "#C45AB3", bg: "rgba(196,90,179,0.12)" };
  return { color: "#E85D2A", bg: "rgba(232,93,42,0.12)" };
}

function openGame(gameId: string) {
  router.push(`/game/${gameId}` as any);
}

function dayIndexFor(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function gameOfTheDay() {
  return GAMES[dayIndexFor() % GAMES.length];
}

const GameCard = memo(function GameCard({
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

function GameOfTheDayBanner({ game, isMobile }: { game: GameConfig; isMobile: boolean }) {
  const category = getCategoryConfig(game.category);
  return (
    <View style={[s.featured, isMobile && s.featuredMobile]}>
      <View>
        <View style={s.featuredEyebrowRow}>
          <Text style={s.eyebrow}>Game of the Day</Text>
          <View style={s.hotPill}><Text style={s.hotText}>{category.title}</Text></View>
        </View>
        <Text style={s.featuredTitle}>{game.title}</Text>
        <Text style={s.featuredText}>{game.desc}</Text>
        <TouchableOpacity style={s.featuredBtn} onPress={() => openGame(game.id)}>
          <Feather name="play" size={13} color="#FFFFFF" />
          <Text style={s.featuredBtnText}>Play Today</Text>
        </TouchableOpacity>
      </View>
      <View style={s.featuredOrb}>
        <View style={s.featuredOrbInner}>
          <MaterialCommunityIcons name={game.icon} size={38} color="rgba(255,255,255,0.86)" />
        </View>
      </View>
    </View>
  );
}

function SearchResultCard({
  game,
  isFavourite,
  onToggleFavourite,
}: {
  game: GameConfig;
  isFavourite: boolean;
  onToggleFavourite: (gameId: string) => void;
}) {
  const diff = difficultyStyle(game.difficulty);
  const category = getCategoryConfig(game.category);

  return (
    <TouchableOpacity style={s.searchResultCard} disabled={!game.unlocked} onPress={() => openGame(game.id)}>
      <View style={[s.searchResultIcon, { backgroundColor: game.color }]}>
        <MaterialCommunityIcons name={game.icon} size={21} color="#FFFFFF" />
      </View>
      <View style={s.searchResultContent}>
        <View style={s.searchResultTop}>
          <Text style={s.searchResultCategory}>{category.title}</Text>
          <View style={[s.searchResultBadge, { backgroundColor: diff.bg }]}>
            <Text style={[s.searchResultBadgeText, { color: diff.color }]}>{game.difficulty}</Text>
          </View>
        </View>
        <Text style={s.searchResultTitle}>{game.title}</Text>
        <Text style={s.searchResultDesc}>{game.desc}</Text>
      </View>
      <TouchableOpacity
        style={[s.searchResultFavourite, isFavourite && s.searchResultFavouriteActive]}
        onPress={(event) => {
          event.stopPropagation?.();
          onToggleFavourite(game.id);
        }}
      >
        <Feather name="heart" size={14} color={isFavourite ? "#FFFFFF" : "rgba(18,18,18,0.42)"} />
      </TouchableOpacity>
    </TouchableOpacity>
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
      useNativeDriver: Platform.OS !== "web",
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
  const { width } = useWindowDimensions();
  const color = category.color;
  const useNativeImageFit = isCompact && Platform.OS !== "web";
  const useNativeRailFit = isCompact && Platform.OS !== "web";
  const isNativeApp = Platform.OS !== "web";
  const isWebDesktop = Platform.OS === "web" && !isCompact;
  const compactCardWidth = useNativeRailFit ? Math.min(MOBILE_CARD_WIDTH, Math.max(246, width - 84)) : MOBILE_CARD_WIDTH;
  const compactCardStride = compactCardWidth + MOBILE_CARD_GAP;
  const compactCardSidePadding = useNativeRailFit ? 18 : 28;
  const [step, setStep] = useState(0);
  const railRef = useRef<ScrollView | null>(null);
  const currentIndex = ((step % games.length) + games.length) % games.length;

  function scrollToGame(index: number, animated = true) {
    railRef.current?.scrollTo({ x: index * compactCardStride, y: 0, animated });
  }

  function handleChipPress(index: number) {
    if (isCompact) {
      setStep(index);
      scrollToGame(index);
      return;
    }

    const forward = (index - currentIndex + games.length) % games.length;
    const backward = (currentIndex - index + games.length) % games.length;
    const direction = forward <= backward ? 1 : -1;
    const distance = Math.min(forward, backward);

    if (distance <= 0) return;
    setStep((prev) => prev + direction * distance);
  }

  function handleRailScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = Number(event.nativeEvent.contentOffset?.x ?? 0);
    const nextIndex = Math.max(0, Math.min(games.length - 1, Math.round(offset / compactCardStride)));
    if (nextIndex !== currentIndex) setStep(nextIndex);
  }

  return (
    <View style={[s.carouselSection, isCompact && s.carouselSectionCompact]}>
      <View style={s.rowHeader}>
        <View style={[s.rowMarker, { backgroundColor: color }]} />
        <Text style={[s.rowTitle, isNativeApp && s.rowTitleApp, isWebDesktop && s.rowTitleWebLight]}>{category.title}</Text>
        <Text style={[s.rowCount, isNativeApp && s.rowCountApp, isWebDesktop && s.rowCountWebLight]}>{games.length} games</Text>
      </View>

      <View style={[s.carouselShell, isWebDesktop && s.carouselShellWebLight, isCompact && s.carouselShellCompact, isNativeApp && s.carouselShellApp]}>
        {category.image ? (
          <ImageBackground
            source={category.image}
            style={[
              s.categoryPanel,
              { backgroundColor: (isNativeApp || isWebDesktop) ? "#FFFFFF" : color },
              isWebDesktop && s.categoryPanelWebPoster,
              isCompact && s.categoryPanelCompact,
              isNativeApp && s.categoryPanelApp,
            ]}
            imageStyle={[
              s.categoryBgImage,
              isWebDesktop && s.categoryBgImageWebPoster,
              isCompact && s.categoryBgImageCompact,
              useNativeImageFit && s.categoryBgImageNativeFit,
            ]}
            resizeMode={useNativeImageFit ? "contain" : "cover"}
          >
            {isWebDesktop && (
              <View style={s.categoryPosterArtworkClip} pointerEvents="none">
                <Image source={category.image} resizeMode="contain" style={s.categoryPosterArtwork} />
              </View>
            )}
            <View style={[s.categoryBgWash, isWebDesktop && s.categoryBgWashWebPoster, isNativeApp && s.categoryBgWashApp]} pointerEvents="none" />
            {isWebDesktop && (
              <>
                <View style={s.categoryPosterGlow} pointerEvents="none" />
                <View style={s.categoryPosterFrame} pointerEvents="none" />
              </>
            )}
            <View style={[s.categoryContent, isWebDesktop && s.categoryContentWebPoster]}>
              <View style={[s.categoryHero, isWebDesktop && s.categoryHeroWebPoster]}>
                <Text style={s.categoryHeroEmoji}>{category.emoji}</Text>
              </View>
              <Text style={[s.categoryTitle, isNativeApp && s.categoryTitleApp, isWebDesktop && s.categoryTitleWebPoster]}>{category.title}</Text>
              <Text style={[s.categorySub, isNativeApp && s.categorySubApp, isWebDesktop && s.categorySubWebPoster]}>{category.description}</Text>
              <View style={[s.pillWrap, !isCompact && s.pillWrapVertical]}>
                {games.map((game, index) => (
                  <TouchableOpacity
                    key={game.id}
                    style={[
                      s.categoryPill,
                      isWebDesktop && s.categoryPillWebPoster,
                      isNativeApp && s.categoryPillApp,
                      index === currentIndex && s.categoryPillActive,
                      isWebDesktop && index === currentIndex && s.categoryPillActiveWebPoster,
                      isNativeApp && index === currentIndex && s.categoryPillActiveApp,
                    ]}
                    onPress={() => handleChipPress(index)}
                  >
                    <MaterialCommunityIcons name={game.icon} size={15} color={index === currentIndex ? color : (isNativeApp || isWebDesktop) ? "#4B5563" : "rgba(255,255,255,0.56)"} />
                    <Text style={[s.categoryPillText, isWebDesktop && s.categoryPillTextWebPoster, isNativeApp && s.categoryPillTextApp, index === currentIndex && s.categoryPillTextActive]}>{game.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[s.categoryPanel, { backgroundColor: (isNativeApp || isWebDesktop) ? "#FFFFFF" : color }, isWebDesktop && s.categoryPanelWebLight, isCompact && s.categoryPanelCompact, isNativeApp && s.categoryPanelApp]}>
            <View style={[s.categoryBgWash, isWebDesktop && s.categoryBgWashWebLight, isNativeApp && s.categoryBgWashApp]} pointerEvents="none" />
            <View style={s.categoryContent}>
              <View style={s.categoryHero}>
                <Text style={s.categoryHeroEmoji}>{category.emoji}</Text>
              </View>
              <Text style={[s.categoryTitle, isNativeApp && s.categoryTitleApp, isWebDesktop && s.categoryTitleWebLight]}>{category.title}</Text>
              <Text style={[s.categorySub, isNativeApp && s.categorySubApp, isWebDesktop && s.categorySubWebLight]}>{category.description}</Text>
              <View style={[s.pillWrap, !isCompact && s.pillWrapVertical]}>
                {games.map((game, index) => (
                  <TouchableOpacity
                    key={game.id}
                    style={[s.categoryPill, isWebDesktop && s.categoryPillWebLight, isNativeApp && s.categoryPillApp, index === currentIndex && s.categoryPillActive, isNativeApp && index === currentIndex && s.categoryPillActiveApp]}
                    onPress={() => handleChipPress(index)}
                  >
                    <MaterialCommunityIcons name={game.icon} size={15} color={index === currentIndex ? color : (isNativeApp || isWebDesktop) ? "#6A7A86" : "rgba(255,255,255,0.56)"} />
                    <Text style={[s.categoryPillText, isWebDesktop && s.categoryPillTextWebLight, isNativeApp && s.categoryPillTextApp, index === currentIndex && s.categoryPillTextActive]}>{game.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={[s.cardRail, isCompact && s.cardRailCompact]}>
          {!isCompact && <View pointerEvents="none" style={s.cardRailBackdrop} />}
          {isCompact ? (
            <ScrollView
              ref={railRef}
              nativeID="games-card-rail-scroller"
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.cardRailScroller}
              contentContainerStyle={[s.cardRailScroll, s.cardRailScrollCompact, { paddingLeft: compactCardSidePadding, paddingRight: compactCardSidePadding }]}
              decelerationRate="fast"
              snapToInterval={compactCardStride}
              snapToAlignment="start"
              disableIntervalMomentum
              directionalLockEnabled
              nestedScrollEnabled
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleRailScrollEnd}
              onScrollEndDrag={handleRailScrollEnd}
              {...({ onWheelCapture: passVerticalWheelToParent } as any)}
            >
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isFavourite={favouriteIds.includes(game.id)}
                  onToggleFavourite={onToggleFavourite}
                  cardStyle={useNativeRailFit && { width: compactCardWidth }}
                />
              ))}
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
  const { favouriteIds, toggleFavourite } = useFavouriteGames();
  const isCompact = width < 980;
  const isMobile = width < 640;
  const isNativeApp = Platform.OS !== "web";

  const categories = useMemo(() => gamesByCategory(), []);
  const dailyGame = useMemo(() => gameOfTheDay(), []);

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
      headerAction={(
        <View style={[s.searchBar, isNativeApp && s.searchBarApp, searchFocus && s.searchBarFocus, searchFocus && isNativeApp && s.searchBarFocusApp]}>
          <Feather name="search" size={15} color={searchFocus ? (isNativeApp ? "#0F7EA8" : "#E85D2A") : isNativeApp ? "#7A8A95" : "rgba(255,255,255,0.48)"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Search games, categories..."
            placeholderTextColor={isNativeApp ? "#8A99A4" : "rgba(255,255,255,0.42)"}
            style={[s.searchInput, isNativeApp && s.searchInputApp, isMobile && s.searchInputMobile]}
          />
          {search.length > 0 && (
            <TouchableOpacity style={s.clearSearch} onPress={() => setSearch("")}>
              <Feather name="x" size={13} color={isNativeApp ? "#7A8A95" : "rgba(255,255,255,0.48)"} />
            </TouchableOpacity>
          )}
        </View>
      )}
    >
      <View style={[s.page, isNativeApp && s.pageApp]}>
        <View style={[s.pageInner, isNativeApp && s.pageInnerApp, isMobile && s.pageInnerMobile]}>
          {search.trim() ? (
            <View>
              <Text style={s.searchMeta}>
                {results.length} result{results.length === 1 ? "" : "s"} for <Text style={s.searchMetaStrong}>{`"${search.trim()}"`}</Text>
              </Text>
              {results.length > 0 ? (
                <View style={[s.searchGrid, isMobile && s.searchGridMobile]}>
                  {results.map((game) => (
                    isMobile ? (
                      <SearchResultCard
                        key={game.id}
                        game={game}
                        isFavourite={favouriteIds.includes(game.id)}
                        onToggleFavourite={toggleFavourite}
                      />
                    ) : (
                      <GameCard
                        key={game.id}
                        game={game}
                        isFavourite={favouriteIds.includes(game.id)}
                        onToggleFavourite={toggleFavourite}
                      />
                    )
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
              {!isMobile && !isNativeApp && <GameOfTheDayBanner game={dailyGame} isMobile={isMobile} />}
              {categories.map(({ category, games }) => (
                <CategoryCarousel
                  key={category.id}
                  category={category}
                  games={games}
                  isCompact={isCompact}
                  favouriteIds={favouriteIds}
                  onToggleFavourite={toggleFavourite}
                />
              ))}
            </>
          )}
        </View>
      </View>
    </DashboardShell>
  );
}
