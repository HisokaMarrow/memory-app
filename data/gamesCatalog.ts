import type { ImageSourcePropType } from "react-native";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type GameCategory = string;
export type GameDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type GameSetupConfig = {
  kicker?: string;
  title?: string;
  description?: string;
  startLabel?: string;
};

export type GameCategoryConfig = {
  id: GameCategory;
  title: string;
  description: string;
  color: string;
  emoji: string;
  image?: ImageSourcePropType;
  pattern: string[];
};

export type GameConfig = {
  id: string;
  title: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  desc: string;
  duration: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Optional game-specific artwork; the shared shell falls back to `icon`. */
  artwork?: ImageSourcePropType;
  unlocked: boolean;
  implemented?: boolean;
  hot?: boolean;
  fresh?: boolean;
  /** Copy for the shared setup-page frame; the actual controls remain game-specific. */
  setup?: GameSetupConfig;
};

export const GAME_CATEGORIES: GameCategoryConfig[] = [
  {
    id: "Memory",
    title: "Memory",
    description: "Numbers, images, cards, names, faces, and word recall.",
    color: "#5B5BD6",
    emoji: "🧠",
    image: require("../assets/images/games/memory-games.png"),
    pattern: ["•", "╱", "•", "╲", "•", "•", "╱", "•", "╲", "•", "•", "╱"],
  },
  {
    id: "Maths",
    title: "Maths",
    description: "Arithmetic, percentages, division, and calendar calculation.",
    color: "#E85D2A",
    emoji: "🔢",
    image: require("../assets/images/games/maths-games.png"),
    pattern: ["π", "×", "√", "Σ", "÷", "17", "=", "∆", "42", "%"],
  },
  {
    id: "Words",
    title: "Words",
    description: "Letter fluency and word creation drills for language speed.",
    color: "#2A9D8F",
    emoji: "✍️",
    image: require("../assets/images/games/word-games.png"),
    pattern: ["A", "syn", "B", "lex", "C", "verb", "D", "memo"],
  },
  {
    id: "Speed",
    title: "Speed",
    description: "Fast visual decisions and reaction-heavy cognitive drills.",
    color: "#C45AB3",
    emoji: "⚡",
    image: require("../assets/images/games/speed-games.png"),
    pattern: ["→", "↗", "→", "↘", "→", "↗", "→", "↘"],
  },
  {
    id: "Focus",
    title: "Focus",
    description: "Pattern recognition, attention, and distractor control.",
    color: "#E9A800",
    emoji: "🧩",
    image: require("../assets/images/games/focus-games.png"),
    pattern: ["◎", "○", "⊙", "◌", "◎", "○", "⊙", "◌"],
  },
];

export const GAMES: GameConfig[] = [
  {
    id: "numbers-game",
    title: "Numbers Game",
    category: "Memory",
    difficulty: "Beginner",
    desc: "Memorise a growing digit sequence, then type it back perfectly.",
    duration: "2 min",
    color: "#5B5BD6",
    icon: "numeric",
    unlocked: true,
    implemented: true,
    hot: true,
    setup: {
      kicker: "Game Settings",
      title: "Prepare your number run",
      startLabel: "Start Exercise",
    },
  },
  {
    id: "word-game",
    title: "Word Game",
    category: "Memory",
    difficulty: "Beginner",
    desc: "Memorise words one by one, then recall the sequence in order.",
    duration: "2 min",
    color: "#5B5BD6",
    icon: "format-list-text",
    unlocked: true,
    implemented: true,
    setup: { title: "Prepare your word recall", startLabel: "Start Recall" },
  },
  {
    id: "image-game",
    title: "Image Game",
    category: "Memory",
    difficulty: "Intermediate",
    desc: "Remember a sequence of images and rebuild the order.",
    duration: "3 min",
    color: "#5B5BD6",
    icon: "image-multiple",
    unlocked: true,
    fresh: true,
  },
  {
    id: "cards-game",
    title: "Cards Game",
    category: "Memory",
    difficulty: "Advanced",
    desc: "Train deck order recall with card-by-card memory drills.",
    duration: "4 min",
    color: "#5B5BD6",
    icon: "cards-playing",
    unlocked: true,
    implemented: true,
    hot: true,
    setup: { title: "Prepare your card run", startLabel: "Start Cards" },
  },
  {
    id: "names-faces",
    title: "Names & Faces",
    category: "Memory",
    difficulty: "Intermediate",
    desc: "Match faces with names after a short study window.",
    duration: "3 min",
    color: "#5B5BD6",
    icon: "face-recognition",
    unlocked: true,
  },
  {
    id: "addition",
    title: "Addition",
    category: "Maths",
    difficulty: "Beginner",
    desc: "Fast mental addition with adaptive number size.",
    duration: "2 min",
    color: "#E85D2A",
    icon: "plus",
    unlocked: true,
    implemented: true,
    setup: {
      title: "Prepare your addition sprint",
      startLabel: "Start Sprint",
    },
  },
  {
    id: "subtraction",
    title: "Subtraction",
    category: "Maths",
    difficulty: "Beginner",
    desc: "Sharpen subtraction speed and accuracy under pressure.",
    duration: "2 min",
    color: "#E85D2A",
    icon: "minus",
    unlocked: true,
    implemented: true,
    setup: {
      title: "Prepare your subtraction sprint",
      startLabel: "Start Sprint",
    },
  },
  {
    id: "multiplication",
    title: "Multiplication",
    category: "Maths",
    difficulty: "Intermediate",
    desc: "Build multiplication fluency without paper or calculator.",
    duration: "3 min",
    color: "#E85D2A",
    icon: "multiplication",
    unlocked: true,
    implemented: true,
    hot: true,
    setup: {
      title: "Prepare your multiplication sprint",
      startLabel: "Start Sprint",
    },
  },
  {
    id: "division",
    title: "Division",
    category: "Maths",
    difficulty: "Intermediate",
    desc: "Practise clean division and quotient estimation mentally.",
    duration: "3 min",
    color: "#E85D2A",
    icon: "division",
    unlocked: true,
    implemented: true,
    setup: {
      title: "Prepare your division sprint",
      startLabel: "Start Sprint",
    },
  },
  {
    id: "percentage",
    title: "Percentage",
    category: "Maths",
    difficulty: "Intermediate",
    desc: "Calculate discounts, changes, and ratios at speed.",
    duration: "3 min",
    color: "#E85D2A",
    icon: "percent",
    unlocked: true,
    implemented: true,
  },
  {
    id: "doomsday",
    title: "Doomsday Calculation",
    category: "Maths",
    difficulty: "Advanced",
    desc: "Use the Doomsday algorithm to calculate weekdays for dates.",
    duration: "5 min",
    color: "#E85D2A",
    icon: "calendar-range",
    unlocked: true,
    implemented: true,
    fresh: true,
    setup: {
      title: "Prepare your calendar run",
      startLabel: "Start Calculating",
    },
  },
  {
    id: "word-list",
    title: "Word List",
    category: "Words",
    difficulty: "Beginner",
    desc: "Come up with as many words as possible from a starting letter.",
    duration: "2 min",
    color: "#2A9D8F",
    icon: "format-letter-case",
    unlocked: true,
  },
  {
    id: "word-forge",
    title: "Word Forge",
    category: "Words",
    difficulty: "Intermediate",
    desc: "Create as many words as possible from one given word.",
    duration: "3 min",
    color: "#2A9D8F",
    icon: "anvil",
    unlocked: true,
    implemented: true,
    hot: true,
    fresh: true,
    setup: {
      title: "Prepare your word forge",
      startLabel: "Start Forging",
    },
  },
  {
    id: "reaction-sprint",
    title: "Reaction Sprint",
    category: "Speed",
    difficulty: "Beginner",
    desc: "Respond to visual prompts as soon as they appear.",
    duration: "90 sec",
    color: "#C45AB3",
    icon: "flash",
    unlocked: true,
    implemented: true,
    fresh: true,
    setup: {
      title: "Prepare your reaction run",
      startLabel: "Start Reactions",
    },
  },
  {
    id: "visual-flash",
    title: "Visual Flash",
    category: "Speed",
    difficulty: "Intermediate",
    desc: "Identify symbols shown for a fraction of a second.",
    duration: "90 sec",
    color: "#C45AB3",
    icon: "eye",
    unlocked: true,
  },
  {
    id: "pattern-recognition",
    title: "Pattern Recognition",
    category: "Focus",
    difficulty: "Intermediate",
    desc: "Spot the hidden rule in a changing grid of shapes.",
    duration: "3 min",
    color: "#E9A800",
    icon: "view-grid-plus",
    unlocked: true,
    hot: true,
  },
  {
    id: "sequence-focus",
    title: "Chimp Test",
    category: "Memory",
    difficulty: "Intermediate",
    desc: "Remember numbered tile positions, then select them in ascending order.",
    duration: "4 min",
    color: "#5B5BD6",
    icon: "view-grid-outline",
    unlocked: true,
    implemented: true,
    fresh: true,
    setup: { title: "Prepare your Chimp Test", startLabel: "Start Test" },
  },
];

export const getCategoryConfig = (category: GameCategory): GameCategoryConfig =>
  GAME_CATEGORIES.find((item) => item.id === category) ?? {
    id: category,
    title: category,
    description:
      "A custom training carousel generated from the games catalogue.",
    color: "#5B5BD6",
    emoji: "🧩",
    pattern: ["◎", "○", "⊙", "◌", "◎", "○", "⊙", "◌"],
  };

export const gamesByCategory = () => {
  const extraCategories = Array.from(
    new Set(GAMES.map((game) => game.category)),
  )
    .filter((category) => !GAME_CATEGORIES.some((item) => item.id === category))
    .map(getCategoryConfig);

  return [...GAME_CATEGORIES, ...extraCategories]
    .map((category) => ({
      category,
      games: GAMES.filter((game) => game.category === category.id),
    }))
    .filter((group) => group.games.length > 0);
};
