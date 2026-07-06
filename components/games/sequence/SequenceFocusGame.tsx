import { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import type { GameConfig } from "../../../data/gamesCatalog";
import { game as s } from "../../../styles/screens/game.styles";
import GameFocusOverlay from "../GameFocusOverlay";
import GameSessionActions from "../GameSessionActions";
import GameSessionPanel from "../GameSessionPanel";
import GameSetupLayout from "../GameSetupLayout";
import { saveGameResult, type StoredGameResult } from "../resultsStore";

type Phase = "setup" | "play" | "result";
type ChimpAttempt = { level: number; correct: boolean };

const GRID_ROWS = 5;
const GRID_COLUMNS = 8;
const GRID_CELLS = GRID_ROWS * GRID_COLUMNS;
const STARTING_LEVEL = 4;
const STARTING_LIVES = 3;

function createBoard(numberCount: number) {
  const cells = Array.from({ length: GRID_CELLS }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }
  const board: (number | null)[] = Array(GRID_CELLS).fill(null);
  cells.slice(0, numberCount).forEach((cell, index) => {
    board[cell] = index + 1;
  });
  return board;
}

export default function SequenceFocusGame({ game }: { game: GameConfig }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [phase, setPhase] = useState<Phase>("setup");
  const [level, setLevel] = useState(STARTING_LEVEL);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [board, setBoard] = useState<(number | null)[]>(() =>
    createBoard(STARTING_LEVEL),
  );
  const [nextNumber, setNextNumber] = useState(1);
  const [numbersHidden, setNumbersHidden] = useState(false);
  const [correctCell, setCorrectCell] = useState<number | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [status, setStatus] = useState(
    "Click 1 to begin. The remaining numbers will disappear.",
  );
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState<ChimpAttempt[]>([]);
  const [savedResult, setSavedResult] = useState<StoredGameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const timersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const attemptsRef = useRef<ChimpAttempt[]>([]);
  const levelRef = useRef(STARTING_LEVEL);
  const livesRef = useRef(STARTING_LIVES);
  const completedLevelsRef = useRef(0);
  const correctTapsRef = useRef(0);
  const totalTapsRef = useRef(0);
  const inputLockedRef = useRef(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  function clearTimers() {
    timersRef.current.forEach((timer) => globalThis.clearTimeout(timer));
    timersRef.current = [];
  }

  useEffect(() => () => clearTimers(), []);

  function loadLevel(nextLevel: number) {
    clearTimers();
    levelRef.current = nextLevel;
    inputLockedRef.current = false;
    setLevel(nextLevel);
    setBoard(createBoard(nextLevel));
    setNextNumber(1);
    setNumbersHidden(false);
    setCorrectCell(null);
    setWrongCell(null);
    setStatus("Click 1 to begin. The remaining numbers will disappear.");
    setPhase("play");
  }

  function finishGame(
    finalAttempts = attemptsRef.current,
    endedByMistake = false,
  ) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    inputLockedRef.current = true;
    setPaused(false);
    clearTimers();
    const accuracy = totalTapsRef.current
      ? Math.round((correctTapsRef.current / totalTapsRef.current) * 100)
      : 0;
    const result: StoredGameResult = {
      id: `${game.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gameId: game.id,
      gameTitle: game.title,
      createdAt: new Date().toISOString(),
      mode: "manual",
      exerciseSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      timeTakenSeconds: Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      ),
      numbersShown: totalTapsRef.current,
      numbersCorrect: correctTapsRef.current,
      digitsShown: totalTapsRef.current,
      digitsCorrect: correctTapsRef.current,
      accuracy,
      settings: {
        digits: 1,
        min: STARTING_LEVEL,
        max: GRID_CELLS,
        livesRemaining: livesRef.current,
        finalLevel: levelRef.current,
        completedLevels: completedLevelsRef.current,
        attempts: JSON.stringify(finalAttempts),
      },
    };
    setGameOver(endedByMistake);
    setSavedResult(result);
    saveGameResult(result);
    setPhase("result");
  }

  function startGame() {
    clearTimers();
    finishedRef.current = false;
    inputLockedRef.current = false;
    attemptsRef.current = [];
    completedLevelsRef.current = 0;
    livesRef.current = STARTING_LIVES;
    correctTapsRef.current = 0;
    totalTapsRef.current = 0;
    startedAtRef.current = Date.now();
    setAttempts([]);
    setLives(STARTING_LIVES);
    setSavedResult(null);
    setGameOver(false);
    setPaused(false);
    loadLevel(STARTING_LEVEL);
  }

  function chooseTile(cell: number, value: number) {
    if (
      phase !== "play" ||
      paused ||
      finishedRef.current ||
      inputLockedRef.current ||
      value < nextNumber
    )
      return;
    totalTapsRef.current += 1;
    inputLockedRef.current = true;

    if (value !== nextNumber) {
      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);
      setWrongCell(cell);
      setStatus(
        nextLives > 0
          ? `Wrong square. ${nextLives} ${nextLives === 1 ? "heart" : "hearts"} left — retrying level ${levelRef.current}.`
          : `Wrong square. No hearts left — game over.`,
      );
      const failedAttempt = { level: levelRef.current, correct: false };
      const finalAttempts = [...attemptsRef.current, failedAttempt];
      attemptsRef.current = finalAttempts;
      setAttempts(finalAttempts);
      if (nextLives <= 0) {
        timersRef.current.push(
          globalThis.setTimeout(() => finishGame(finalAttempts, true), 650),
        );
      } else {
        timersRef.current.push(
          globalThis.setTimeout(() => loadLevel(levelRef.current), 650),
        );
      }
      return;
    }

    correctTapsRef.current += 1;
    setCorrectCell(cell);
    if (value === 1) setNumbersHidden(true);

    if (value === levelRef.current) {
      const passedAttempt = { level: levelRef.current, correct: true };
      const nextAttempts = [...attemptsRef.current, passedAttempt];
      attemptsRef.current = nextAttempts;
      completedLevelsRef.current += 1;
      setAttempts(nextAttempts);
      setStatus(`Level ${levelRef.current} complete.`);
      if (levelRef.current >= GRID_CELLS) {
        timersRef.current.push(
          globalThis.setTimeout(() => finishGame(nextAttempts), 650),
        );
      } else {
        timersRef.current.push(
          globalThis.setTimeout(() => loadLevel(levelRef.current + 1), 650),
        );
      }
      return;
    }

    timersRef.current.push(
      globalThis.setTimeout(() => {
        const upcoming = value + 1;
        setNextNumber(upcoming);
        setCorrectCell(null);
        setStatus(`Correct. Now find number ${upcoming}.`);
        inputLockedRef.current = false;
      }, 170),
    );
  }

  const setup = (
    <GameSetupLayout
      game={game}
      canStart
      isMobile={isMobile}
      onStart={startGame}
      title="Prepare your Chimp Test"
      startLabel="Start Test"
    >
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Game mode</Text>
        <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
          Continuous
        </Text>
        <Text style={s.fieldHint}>
          Keep progressing until all three hearts are gone.
        </Text>
      </View>
      <View style={[s.settingBlock, isMobile && s.settingBlockMobile]}>
        <Text style={s.fieldLabel}>Board</Text>
        <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
          5 × 8 · 40 squares
        </Text>
        <Text style={s.fieldHint}>
          The test begins at level 4 and adds one number per completed round.
        </Text>
      </View>
    </GameSetupLayout>
  );

  if (phase === "setup") return setup;

  if (phase === "play")
    return (
      <>
        {setup}
        <GameFocusOverlay mobile={isMobile}>
          <GameSessionPanel accentColor={game.color} mobile={isMobile}>
            <View style={s.gameStatusRow}>
              <View>
                <Text style={[s.kicker, { color: game.color }]}>
                  Current level
                </Text>
                <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
                  {level} numbers
                </Text>
              </View>
              <View
                style={[
                  s.chimpLives,
                  {
                    borderColor: `${game.color}34`,
                    backgroundColor: `${game.color}10`,
                  },
                ]}
              >
                {Array.from({ length: STARTING_LIVES }, (_, index) => (
                  <Feather
                    key={index}
                    name="heart"
                    size={17}
                    color={index < lives ? game.color : "#C8C8C8"}
                  />
                ))}
              </View>
            </View>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                s.chimpStatus,
                wrongCell !== null && s.chimpStatusWrong,
                correctCell !== null &&
                  wrongCell === null &&
                  s.chimpStatusCorrect,
              ]}
            >
              {status}
            </Text>
            {paused ? (
              <View style={s.pauseCurtain}>
                <Feather name="pause" size={28} color={game.color} />
                <Text style={s.pauseText}>Paused</Text>
              </View>
            ) : (
              <View style={[s.chimpBoard, isMobile && s.chimpBoardMobile]}>
                {Array.from({ length: GRID_ROWS }, (_, row) => (
                  <View
                    key={row}
                    style={[s.chimpRow, isMobile && s.chimpRowMobile]}
                  >
                    {board
                      .slice(row * GRID_COLUMNS, (row + 1) * GRID_COLUMNS)
                      .map((value, column) => {
                        const cell = row * GRID_COLUMNS + column;
                        const isCorrect = correctCell === cell;
                        if (
                          value === null ||
                          (value < nextNumber && !isCorrect)
                        ) {
                          return <View key={cell} style={s.chimpEmptyTile} />;
                        }
                        const hidden = numbersHidden && value > 1 && !isCorrect;
                        return (
                          <TouchableOpacity
                            key={cell}
                            activeOpacity={0.82}
                            onPress={() => chooseTile(cell, value)}
                            style={[
                              s.chimpTile,
                              isMobile && s.chimpTileMobile,
                              {
                                backgroundColor: hidden
                                  ? game.color
                                  : `${game.color}18`,
                                borderColor: game.color,
                              },
                              isCorrect && s.chimpTileCorrect,
                              wrongCell === cell && s.chimpTileWrong,
                            ]}
                          >
                            {isCorrect ? (
                              <Feather
                                name="check"
                                size={isMobile ? 16 : 20}
                                color="#FFFFFF"
                              />
                            ) : !hidden ? (
                              <Text
                                style={[
                                  s.chimpTileNumber,
                                  isMobile && s.chimpTileNumberMobile,
                                  { color: game.color },
                                ]}
                              >
                                {value}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                ))}
              </View>
            )}
            <GameSessionActions
              accentColor={game.color}
              mobile={isMobile}
              secondaryLabel={paused ? "Unpause" : "Pause"}
              secondaryIcon={paused ? "play" : "pause"}
              onSecondary={() => setPaused((value) => !value)}
              primaryLabel="Finalise"
              primaryIcon="check-circle"
              onPrimary={() => finishGame()}
            />
          </GameSessionPanel>
        </GameFocusOverlay>
      </>
    );

  return (
    <>
      {setup}
      <GameFocusOverlay mobile={isMobile}>
        <GameSessionPanel accentColor={game.color} mobile={isMobile}>
          <Text style={[s.kicker, { color: game.color }]}>
            {gameOver ? "Game over" : "Test complete"}
          </Text>
          <Text style={[s.panelTitle, isMobile && s.panelTitleMobile]}>
            Final level reached: {level}
          </Text>
          <Text style={s.emptyText}>
            {gameOver
              ? "All three hearts are gone. Try again and push the sequence further."
              : "Run ended with progress saved."}
          </Text>
          <View style={[s.resultStats, isMobile && s.resultStatsMobile]}>
            <View style={[s.statTile, s.statTileLight]}>
              <Text
                style={[s.statValue, s.statValueLight, { color: game.color }]}
              >
                {level}
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Final level</Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {completedLevelsRef.current}
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>
                Levels cleared
              </Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {savedResult?.accuracy ?? 0}%
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Tap accuracy</Text>
            </View>
            <View style={[s.statTile, s.statTileLight]}>
              <Text style={[s.statValue, s.statValueLight]}>
                {savedResult?.timeTakenSeconds ?? 0}s
              </Text>
              <Text style={[s.statLabel, s.statLabelLight]}>Time</Text>
            </View>
          </View>
          <View style={[s.answerList, isMobile && s.answerListMobile]}>
            {attempts.map((attempt, index) => (
              <View
                key={`${attempt.level}-${index}`}
                style={[
                  s.answerRow,
                  attempt.correct ? s.answerRowGood : s.answerRowBad,
                ]}
              >
                <Text style={s.answerIndex}>L{attempt.level}</Text>
                <View style={s.answerCol}>
                  <Text style={s.answerLabel}>Number count</Text>
                  <Text style={s.answerValue}>{attempt.level} tiles</Text>
                </View>
                <View style={s.answerCol}>
                  <Text style={s.answerLabel}>Outcome</Text>
                  <Text style={s.answerValue}>
                    {attempt.correct ? "Completed" : "Wrong square"}
                  </Text>
                </View>
                <Feather
                  name={attempt.correct ? "check-circle" : "x-circle"}
                  size={18}
                  color={attempt.correct ? "#2A9D8F" : "#E85D3F"}
                />
              </View>
            ))}
          </View>
          <GameSessionActions
            accentColor={game.color}
            mobile={isMobile}
            secondaryLabel="Back to Menu"
            secondaryIcon="arrow-left"
            onSecondary={() => router.push("/games" as any)}
            primaryLabel="Play Again"
            primaryIcon="refresh-cw"
            onPrimary={startGame}
          />
        </GameSessionPanel>
      </GameFocusOverlay>
    </>
  );
}
