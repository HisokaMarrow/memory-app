import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameResultStat from "../GameResultStat";
import GameSegmentedControl from "../GameSegmentedControl";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSetupLayout from "../GameSetupLayout";
import { useExitToMenu } from "../useExitToMenu";
import { useGameTimers } from "../useGameTimers";
import { buildGameResult, formatTime, shuffle, useIsMobile } from "../gameUtils";
import { saveGameResult, type StoredGameResult } from "../resultsStore";
import { PLAYING_CARD_BY_ID, PLAYING_CARDS } from "./cardAssets";

type Phase = "setup" | "countdown" | "memorise" | "recall" | "result";
type Mode = "auto" | "manual";
type CardInstance = { instanceId: string; cardId: string; deckIndex: number };
type CheckedCard = {
  index: number;
  expectedId: string;
  actualId: string | null;
  correct: boolean;
};

function buildDeck(deckCount: number) {
  return shuffle(
    Array.from({ length: deckCount }, (_, deckIndex) =>
      PLAYING_CARDS.map((card) => ({
        instanceId: `${deckIndex}-${card.id}`,
        cardId: card.id,
        deckIndex,
      })),
    ).flat(),
  );
}

export default function CardsGame({ game }: { game: GameConfig }) {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("auto");
  const [deckCount, setDeckCount] = useState(1);
  const [intervalSeconds, setIntervalSeconds] = useState(2);
  const [studySeconds, setStudySeconds] = useState(120);
  const [recallSeconds, setRecallSeconds] = useState(300);
  const [countdown, setCountdown] = useState(3);
  const [sequence, setSequence] = useState<CardInstance[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const [studyTimeLeft, setStudyTimeLeft] = useState(120);
  const [recallTimeLeft, setRecallTimeLeft] = useState(300);
  const [paused, setPaused] = useState(false);
  const [placements, setPlacements] = useState<(string | null)[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [checked, setChecked] = useState<CheckedCard[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const phaseRef = useRef<Phase>("setup");
  const beginRecallRef = useRef<() => void>(() => {});
  const checkResultsRef = useRef<() => void>(() => {});
  const moveCardRef = useRef<(direction: -1 | 1) => void>(() => {});
  const resultSavedRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const {
    clearGameInterval,
    clearGameTimeout,
    clearGameTimers,
    setGameInterval,
    setGameTimeout,
  } = useGameTimers();
  const exitToMenu = useExitToMenu({
    phase,
    setPhase,
    onExit: () => {
      phaseRef.current = "setup";
      resultSavedRef.current = true;
      clearGameTimers();
      setPaused(false);
    },
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const visibleSequence = useMemo(
    () => sequence.slice(0, Math.min(sequence.length, maxSeenIndex + 1)),
    [maxSeenIndex, sequence],
  );
  const currentCard = sequence[currentIndex]
    ? PLAYING_CARD_BY_ID[sequence[currentIndex].cardId]
    : null;
  const placedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    placements.forEach((cardId) => {
      if (cardId) counts[cardId] = (counts[cardId] ?? 0) + 1;
    });
    return counts;
  }, [placements]);

  function beginRecall() {
    if (phaseRef.current !== "memorise") return;
    const shownCount = Math.max(1, Math.min(sequence.length, maxSeenIndex + 1));
    phaseRef.current = "recall";
    setPaused(false);
    setPlacements(Array(shownCount).fill(null));
    setSelectedSlot(0);
    setRecallTimeLeft(recallSeconds);
    setPhase("recall");
  }
  beginRecallRef.current = beginRecall;

  function checkResults() {
    if (resultSavedRef.current || phaseRef.current === "result") return;
    resultSavedRef.current = true;
    phaseRef.current = "result";
    const rows = visibleSequence.map((item, index) => {
      const actualId = placements[index] ?? null;
      return {
        index,
        expectedId: item.cardId,
        actualId,
        correct: item.cardId === actualId,
      };
    });
    const correct = rows.filter((row) => row.correct).length;
    const accuracy = rows.length
      ? Math.round((correct / rows.length) * 100)
      : 0;
    const result = buildGameResult({
      gameId: game.id,
      gameTitle: game.title,
      mode,
      exerciseSeconds: studySeconds + recallSeconds,
      timeTakenSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      numbersShown: rows.length,
      numbersCorrect: correct,
      digitsShown: rows.length,
      digitsCorrect: correct,
      accuracy,
      settings: {
        digits: 1,
        min: 0,
        max: deckCount * 52,
        mode,
        deckCount,
        intervalSeconds,
        studySeconds,
        recallSeconds,
        cardSequence: JSON.stringify(
          visibleSequence.map((item) => item.cardId),
        ),
        placements: JSON.stringify(placements),
      },
    });
    setChecked(rows);
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }
  checkResultsRef.current = checkResults;

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      phaseRef.current = "memorise";
      setPhase("memorise");
      return;
    }
    const timer = setGameTimeout(
      () => setCountdown((value) => value - 1),
      1000,
    );
    return () => clearGameTimeout(timer);
  }, [clearGameTimeout, countdown, phase, setGameTimeout]);

  useEffect(() => {
    if (phase !== "memorise" || paused) return;
    const timer = setGameInterval(() => {
      setStudyTimeLeft((value) => {
        if (value <= 1) {
          clearGameInterval(timer);
          setGameTimeout(() => beginRecallRef.current(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearGameInterval(timer);
  }, [clearGameInterval, paused, phase, setGameInterval, setGameTimeout]);

  useEffect(() => {
    if (phase !== "memorise" || paused || mode !== "auto") return;
    const timer = setGameInterval(() => {
      setCurrentIndex((index) => {
        if (index >= sequence.length - 1) {
          clearGameInterval(timer);
          setGameTimeout(() => beginRecallRef.current(), 0);
          return index;
        }
        const nextIndex = index + 1;
        setMaxSeenIndex((seen) => Math.max(seen, nextIndex));
        return nextIndex;
      });
    }, intervalSeconds * 1000);
    return () => clearGameInterval(timer);
  }, [
    clearGameInterval,
    intervalSeconds,
    mode,
    paused,
    phase,
    sequence.length,
    setGameInterval,
    setGameTimeout,
  ]);

  useEffect(() => {
    if (phase !== "recall" || paused) return;
    const timer = setGameInterval(() => {
      setRecallTimeLeft((value) => {
        if (value <= 1) {
          clearGameInterval(timer);
          setGameTimeout(() => checkResultsRef.current(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearGameInterval(timer);
  }, [clearGameInterval, paused, phase, setGameInterval, setGameTimeout]);

  function startGame() {
    const nextSequence = buildDeck(deckCount);
    resultSavedRef.current = false;
    startedAtRef.current = Date.now();
    phaseRef.current = "countdown";
    setSequence(nextSequence);
    setCurrentIndex(0);
    setMaxSeenIndex(0);
    setStudyTimeLeft(studySeconds);
    setRecallTimeLeft(recallSeconds);
    setCountdown(3);
    setPaused(false);
    setPlacements([]);
    setSelectedSlot(null);
    setChecked([]);
    setSavedResult(null);
    setPhase("countdown");
  }

  function moveCard(direction: -1 | 1) {
    if (paused) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= sequence.length) {
      beginRecall();
      return;
    }
    setCurrentIndex(nextIndex);
    setMaxSeenIndex((seen) => Math.max(seen, nextIndex));
  }
  moveCardRef.current = moveCard;

  useEffect(() => {
    if (typeof window === "undefined" || mode !== "manual") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== "memorise" || paused) return;
      const target = event.target as HTMLElement | null;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      moveCardRef.current(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, paused]);

  function remainingFor(cardId: string) {
    return Math.max(0, deckCount - (placedCounts[cardId] ?? 0));
  }

  function placeCard(cardId: string, preferredSlot = selectedSlot) {
    if (paused) return;
    if (remainingFor(cardId) <= 0) return;
    let slot = preferredSlot;
    if (slot === null || slot < 0 || slot >= placements.length)
      slot = placements.findIndex((value) => value === null);
    if (slot < 0 || slot === null) return;
    const next = [...placements];
    next[slot] = cardId;
    setPlacements(next);
    const nextEmpty = next.findIndex(
      (value, index) => index > slot! && value === null,
    );
    setSelectedSlot(
      nextEmpty >= 0 ? nextEmpty : next.findIndex((value) => value === null),
    );
  }

  function handleSlotPress(index: number) {
    if (paused) return;
    if (selectedSlot === index && placements[index]) {
      const next = [...placements];
      next[index] = null;
      setPlacements(next);
    }
    setSelectedSlot(index);
  }

  function slotDropProps(index: number) {
    return {
      onDragOver: (event: any) => event.preventDefault?.(),
      onDrop: (event: any) => {
        if (paused) return;
        event.preventDefault?.();
        const cardId = event.dataTransfer?.getData?.("text/card-id");
        if (cardId && PLAYING_CARD_BY_ID[cardId]) placeCard(cardId, index);
      },
    } as any;
  }

  function cardDragProps(cardId: string) {
    return {
      draggable: !paused && remainingFor(cardId) > 0,
      onDragStart: (event: any) =>
        event.dataTransfer?.setData?.("text/card-id", cardId),
    } as any;
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
      title="Prepare your card run"
      startLabel="Start Cards"
    >
      <View style={[s.settingBlockWide, isMobile && s.settingBlockWideMobile]}>
        <Text style={s.fieldLabel}>Mode</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={["auto", "manual"] as Mode[]}
          value={mode}
          onChange={setMode}
        />
        <Text style={s.fieldHint}>
          Auto advances cards for you. Manual adds previous and next controls.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Decks</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[1, 2, 4]}
          value={deckCount}
          onChange={setDeckCount}
          labelForOption={(value) => `${value} deck${value === 1 ? "" : "s"}`}
        />
        <Text style={s.fieldHint}>
          {deckCount * 52} shuffled cards available in this run.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Card interval</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[1, 2, 3, 5]}
          value={intervalSeconds}
          onChange={setIntervalSeconds}
          labelForOption={(value) => `${value}s`}
        />
        <Text style={s.fieldHint}>
          {mode === "manual"
            ? "Used when switching back to Auto on your next run."
            : "Seconds each card remains visible."}
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Study time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[60, 120, 300, 600]}
          value={studySeconds}
          onChange={setStudySeconds}
          labelForOption={(value) =>
            value < 60 ? `${value}s` : `${value / 60}m`
          }
        />
        <Text style={s.fieldHint}>
          The run moves to recall when the timer or available cards finish.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Recall time</Text>
        <GameSegmentedControl
          accentColor={game.color}
          compact={isMobile}
          options={[120, 300, 600, 900]}
          value={recallSeconds}
          onChange={setRecallSeconds}
          labelForOption={(value) => `${value / 60}m`}
        />
        <Text style={s.fieldHint}>
          Time available to rebuild the studied card order.
        </Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setup;

  if (phase === "countdown")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile} onClose={exitToMenu}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View
              style={[s.countdownPanel, isMobile && s.countdownPanelMobile]}
            >
              <Text style={s.countdownKicker}>Shuffle complete</Text>
              <Text
                style={[s.countdownNumber, isMobile && s.countdownNumberMobile]}
              >
                {countdown}
              </Text>
              <Text style={s.countdownText}>{deckCount * 52} cards ready.</Text>
            </View>
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  if (phase === "memorise")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile} onClose={exitToMenu}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <View>
                <Text style={[s.kicker, { color: game.color }]}>
                  Card {currentIndex + 1} of {sequence.length}
                </Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  {sequence.length - currentIndex - 1} cards remaining
                </Text>
              </View>
              <Text
                style={[
                  s.gameTimerPill,
                  {
                    color: game.color,
                    borderColor: `${game.color}44`,
                    backgroundColor: `${game.color}14`,
                  },
                ]}
              >
                {formatTime(studyTimeLeft)}
              </Text>
            </View>
            <View style={[s.playTimerRow, isMobile && s.playTimerRowMobile]}>
              <View style={[s.progressTrack, s.cardProgressTrack]}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width:
                        `${((currentIndex + 1) / sequence.length) * 100}%` as any,
                      backgroundColor: game.color,
                    },
                  ]}
                />
              </View>
              <Text style={s.timerText}>
                {Math.round(((currentIndex + 1) / sequence.length) * 100)}%
              </Text>
            </View>
            <View
              style={[
                s.cardStudyStage,
                s.sessionSurface,
                { borderColor: `${game.color}33` },
              ]}
            >
              {paused ? (
                <View style={s.pauseCurtain}>
                  <Feather name="pause" size={28} color={game.color} />
                  <Text style={s.pauseText}>Paused</Text>
                </View>
              ) : currentCard ? (
                <>
                  <Image
                    source={currentCard.image}
                    resizeMode="contain"
                    style={[
                      s.playingCardLarge,
                      isMobile && s.playingCardLargeMobile,
                    ]}
                  />
                  <Text style={s.cardStudyLabel}>{currentCard.label}</Text>
                </>
              ) : null}
            </View>
            {mode === "manual" ? (
              <View style={s.cardManualControls}>
                <TouchableOpacity
                  disabled={paused || currentIndex === 0}
                  style={[
                    s.iconButton,
                    (paused || currentIndex === 0) && s.buttonDisabled,
                  ]}
                  onPress={() => moveCard(-1)}
                >
                  <Feather name="chevron-left" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={s.cardManualHint}>
                  Use ← and → keys, or these buttons
                </Text>
                <TouchableOpacity
                  disabled={paused}
                  style={[s.iconButton, paused && s.buttonDisabled]}
                  onPress={() => moveCard(1)}
                >
                  <Feather name="chevron-right" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="End Early"
              primaryIcon="flag"
              onPrimary={beginRecall}
              tertiaryDestructive
              tertiaryLabel="Give Up"
              tertiaryIcon="x-circle"
              onTertiary={checkResults}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  if (phase === "recall") {
    const columns = isMobile ? 4 : 8;
    const slotRows = Array.from(
      { length: Math.ceil(placements.length / columns) },
      (_, row) => placements.slice(row * columns, (row + 1) * columns),
    );
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile} onClose={exitToMenu}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <View>
                <Text style={[s.kicker, { color: game.color }]}>
                  Recall the order
                </Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  {placements.filter(Boolean).length} of {placements.length}{" "}
                  positions filled
                </Text>
              </View>
              <Text
                style={[
                  s.gameTimerPill,
                  {
                    color: game.color,
                    borderColor: `${game.color}44`,
                    backgroundColor: `${game.color}14`,
                  },
                ]}
              >
                {formatTime(recallTimeLeft)}
              </Text>
            </View>
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={28} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : null}
            <View style={s.cardRecallLayout}>
              <View style={s.cardPlacementSection}>
                <View style={s.cardSectionHeader}>
                  <Text style={s.fieldLabel}>Card positions</Text>
                  <Text style={s.cardSectionHint}>
                    Tap a slot, then tap or drag a card into it. Tap a selected
                    filled slot again to clear it.
                  </Text>
                </View>
                <ScrollView
                  style={[
                    s.cardPlacementScroll,
                    isMobile && s.cardPlacementScrollMobile,
                  ]}
                  contentContainerStyle={s.cardPlacementContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {slotRows.map((rowValues, row) => (
                    <View
                      key={row}
                      style={[
                        s.cardPlacementRow,
                        isMobile && s.cardPlacementRowMobile,
                      ]}
                    >
                      {Array.from({ length: columns }, (_, column) => {
                        const index = row * columns + column;
                        if (index >= placements.length)
                          return <View key={column} style={s.cardSlotSpacer} />;
                        const cardId = rowValues[column];
                        const card = cardId ? PLAYING_CARD_BY_ID[cardId] : null;
                        return (
                          <TouchableOpacity
                            key={index}
                            disabled={paused}
                            activeOpacity={0.86}
                            onPress={() => handleSlotPress(index)}
                            onLongPress={() => {
                              const next = [...placements];
                              next[index] = null;
                              setPlacements(next);
                              setSelectedSlot(index);
                            }}
                            style={[
                              s.cardRecallSlot,
                              isMobile && s.cardRecallSlotMobile,
                              selectedSlot === index && {
                                borderColor: game.color,
                                backgroundColor: `${game.color}10`,
                              },
                            ]}
                            {...slotDropProps(index)}
                          >
                            {card ? (
                              <Image
                                source={card.image}
                                resizeMode="contain"
                                style={s.cardRecallSlotImage}
                              />
                            ) : (
                              <>
                                <Text style={s.cardSlotIndex}>{index + 1}</Text>
                                <Feather
                                  name="plus"
                                  size={16}
                                  color={
                                    selectedSlot === index
                                      ? game.color
                                      : "#A0A0A0"
                                  }
                                />
                              </>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={s.cardTraySection}>
                <View style={s.cardSectionHeader}>
                  <Text style={s.fieldLabel}>Card tray</Text>
                  <Text style={s.cardSectionHint}>
                    {selectedSlot === null
                      ? "Select a position above."
                      : `Placing into position ${selectedSlot + 1}.`}{" "}
                    Tap a card, or drag it on desktop.
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  style={s.cardTrayScroll}
                  contentContainerStyle={s.cardTrayContent}
                  showsHorizontalScrollIndicator
                >
                  {PLAYING_CARDS.map((card) => {
                    const remaining = remainingFor(card.id);
                    return (
                      <TouchableOpacity
                        key={card.id}
                        disabled={remaining <= 0 || paused}
                        activeOpacity={0.84}
                        style={[
                          s.cardTrayCard,
                          isMobile && s.cardTrayCardMobile,
                          (remaining <= 0 || paused) && s.cardTrayCardDisabled,
                        ]}
                        onPress={() => placeCard(card.id)}
                        {...cardDragProps(card.id)}
                      >
                        <Image
                          source={card.image}
                          resizeMode="contain"
                          style={s.cardTrayImage}
                        />
                        {deckCount > 1 ? (
                          <View
                            style={[
                              s.cardCountBadge,
                              remaining <= 0 && s.cardCountBadgeEmpty,
                            ]}
                          >
                            <Text style={s.cardCountText}>{remaining}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="Finalise"
              primaryIcon="check-circle"
              onPrimary={checkResults}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );
  }

  return (
    <>
      {setup}
      <GameFocusOverlay mobile={isMobile} onClose={exitToMenu}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <Text style={[s.kicker, { color: game.color }]}>
            Card results saved
          </Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
            You placed {savedResult?.numbersCorrect ?? 0} of{" "}
            {savedResult?.numbersShown ?? 0} cards correctly
          </Text>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <GameResultStat
              label="Accuracy"
              value={`${savedResult?.accuracy ?? 0}%`}
              color={game.color}
            />
            <GameResultStat
              label="Cards correct"
              value={`${savedResult?.numbersCorrect ?? 0}/${savedResult?.numbersShown ?? 0}`}
            />
            <GameResultStat label="Decks" value={String(deckCount)} />
            <GameResultStat
              label="Time taken"
              value={`${savedResult?.timeTakenSeconds ?? 0}s`}
            />
          </View>
          <ScrollView
            style={[s.cardResultList, isMobile && s.cardResultListMobile]}
            contentContainerStyle={s.cardResultContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {checked.map((item) => {
              const expected = PLAYING_CARD_BY_ID[item.expectedId];
              const actual = item.actualId
                ? PLAYING_CARD_BY_ID[item.actualId]
                : null;
              return (
                <View
                  key={item.index}
                  style={[
                    s.cardResultRow,
                    isMobile && s.cardResultRowMobile,
                    item.correct ? s.answerRowGood : s.answerRowBad,
                  ]}
                >
                  <Text style={s.answerIndex}>#{item.index + 1}</Text>
                  <View style={s.cardResultPair}>
                    <View style={s.cardResultCard}>
                      <Text style={s.answerLabel}>Correct</Text>
                      <Image
                        source={expected.image}
                        resizeMode="contain"
                        style={s.cardResultImage}
                      />
                      <Text style={s.cardResultName}>
                        {expected.shortLabel}
                      </Text>
                    </View>
                    <View style={s.cardResultCard}>
                      <Text style={s.answerLabel}>Your card</Text>
                      {actual ? (
                        <Image
                          source={actual.image}
                          resizeMode="contain"
                          style={s.cardResultImage}
                        />
                      ) : (
                        <View style={s.cardResultMissing}>
                          <Feather name="minus" size={16} color="#9A9A9A" />
                        </View>
                      )}
                      <Text style={s.cardResultName}>
                        {actual?.shortLabel ?? "—"}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={item.correct ? "check-circle" : "x-circle"}
                    size={18}
                    color={item.correct ? "#2A9D8F" : "#E85D3F"}
                  />
                </View>
              );
            })}
          </ScrollView>
          <GameSessionActions
            accentColor={game.color}
            mobile={isMobile}
            secondaryLabel="Back to Menu"
            secondaryIcon="arrow-left"
            onSecondary={exitToMenu}
            primaryLabel="Play Again"
            primaryIcon="refresh-cw"
            onPrimary={startGame}
          />
        </GameSessionPanel>
      </GameFocusOverlay>
    </>
  );
}
