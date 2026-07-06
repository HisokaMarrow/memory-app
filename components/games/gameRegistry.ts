import { createElement, type ComponentType } from "react";

import type { GameConfig } from "../../data/gamesCatalog";
import ArithmeticGame from "./arithmetic/ArithmeticGame";
import CardsGame from "./cards/CardsGame";
import DoomsdayGame from "./doomsday/DoomsdayGame";
import NumbersGame from "./numbers/NumbersGame";
import ReactionSprintGame from "./reaction/ReactionSprintGame";
import SequenceFocusGame from "./sequence/SequenceFocusGame";
import WordForgeGame from "./words/WordForgeGame";
import WordRecallGame from "./words/WordRecallGame";

export type GameExperienceDefinition = {
  component: ComponentType<{ game: GameConfig }>;
  eyebrow: string;
  phaseLabel: string;
  routeSubtitle: string;
};

/** Single registration point for implemented games and their route-level copy. */
export const GAME_EXPERIENCES: Record<string, GameExperienceDefinition> = {
  "numbers-game": {
    component: NumbersGame,
    eyebrow: "Focused training",
    phaseLabel: "Setup · Play · Results",
    routeSubtitle:
      "Set your exercise, memorise the sequence, then recall it in order.",
  },
  "word-game": {
    component: WordRecallGame,
    eyebrow: "Memory training",
    phaseLabel: "Study · Recall · Results",
    routeSubtitle:
      "Memorise words one at a time, then recall the sequence in order.",
  },
  "cards-game": {
    component: CardsGame,
    eyebrow: "Memory training",
    phaseLabel: "Setup · Study · Place · Results",
    routeSubtitle:
      "Study shuffled cards one at a time, then rebuild their exact order.",
  },
  "word-forge": {
    component: WordForgeGame,
    eyebrow: "Word training",
    phaseLabel: "Setup · Forge · Results",
    routeSubtitle:
      "Transform one source word into as many valid smaller words as you can.",
  },
  addition: {
    component: ({ game }) =>
      createElement(ArithmeticGame, { game, kind: "addition" }),
    eyebrow: "Maths training",
    phaseLabel: "Setup · Sprint · Results",
    routeSubtitle: "Build addition speed and accuracy against the clock.",
  },
  subtraction: {
    component: ({ game }) =>
      createElement(ArithmeticGame, { game, kind: "subtraction" }),
    eyebrow: "Maths training",
    phaseLabel: "Setup · Sprint · Results",
    routeSubtitle: "Build subtraction speed and accuracy against the clock.",
  },
  multiplication: {
    component: ({ game }) =>
      createElement(ArithmeticGame, { game, kind: "multiplication" }),
    eyebrow: "Maths training",
    phaseLabel: "Setup · Sprint · Results",
    routeSubtitle: "Build multiplication fluency under controlled pressure.",
  },
  division: {
    component: ({ game }) =>
      createElement(ArithmeticGame, { game, kind: "division" }),
    eyebrow: "Maths training",
    phaseLabel: "Setup · Sprint · Results",
    routeSubtitle: "Practise clean mental division against the clock.",
  },
  doomsday: {
    component: DoomsdayGame,
    eyebrow: "Calendar training",
    phaseLabel: "Setup · Calculate · Results",
    routeSubtitle:
      "Calculate the weekday for dates across progressively wider historical ranges.",
  },
  "sequence-focus": {
    component: SequenceFocusGame,
    eyebrow: "Memory training",
    phaseLabel: "Study · Hide · Recall",
    routeSubtitle:
      "Remember numbered tile positions, then select them in ascending order after they hide.",
  },
  "reaction-sprint": {
    component: ReactionSprintGame,
    eyebrow: "Speed training",
    phaseLabel: "Setup · React · Results",
    routeSubtitle: "Measure reaction speed without anticipating the signal.",
  },
};

export function getGameExperience(gameId: string | undefined) {
  return gameId ? GAME_EXPERIENCES[gameId] : undefined;
}
