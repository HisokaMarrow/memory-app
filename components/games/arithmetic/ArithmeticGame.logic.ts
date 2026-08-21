export type ArithmeticKind =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "percentage";

export type Level = "calm" | "focused" | "challenge";

export type ArithmeticQuestion = {
  prompt: string;
  answer: number;
};

export const LEVEL_MAX: Record<Level, number> = {
  calm: 10,
  focused: 50,
  challenge: 100,
};

function randomInt(min: number, max: number, random: () => number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[], random: () => number) {
  return items[randomInt(0, items.length - 1, random)];
}

function greatestCommonDivisor(a: number, b: number) {
  let left = a;
  let right = b;
  while (right !== 0) {
    const next = left % right;
    left = right;
    right = next;
  }
  return left;
}

/**
 * Picks a base for which `percentage% of base` lands on a whole number.
 *
 * Only multiples of `100 / gcd(percentage, 100)` qualify, so we step through
 * those directly rather than filtering a range — that way the result is always
 * defined, even if the range is later narrowed past the first valid multiple.
 */
function pickPercentageBase(
  percentage: number,
  min: number,
  max: number,
  random: () => number,
) {
  const step = 100 / greatestCommonDivisor(percentage, 100);
  const first = Math.ceil(min / step) * step;
  const last = Math.floor(max / step) * step;
  if (first > last) return step;
  return first + randomInt(0, (last - first) / step, random) * step;
}

function makePercentageQuestion(
  level: Level,
  random: () => number,
): ArithmeticQuestion {
  if (level === "calm") {
    const percentage = randomItem([10, 25, 50] as const, random);
    const base = randomInt(1, 9, random) * 100;
    return {
      prompt: `${percentage}% of ${base}`,
      answer: (base * percentage) / 100,
    };
  }

  if (level === "focused") {
    const percentage = randomInt(1, 19, random) * 5;
    const base = pickPercentageBase(percentage, 10, 99, random);
    return {
      prompt: `${percentage}% of ${base}`,
      answer: (base * percentage) / 100,
    };
  }

  const form = randomItem(
    ["plain", "reverse", "increase", "decrease"] as const,
    random,
  );
  const percentage =
    form === "decrease"
      ? randomInt(1, 15, random) * 5
      : randomInt(1, 20, random) * 5;
  const base = pickPercentageBase(percentage, 20, 400, random);
  const change = (base * percentage) / 100;

  if (form === "plain") {
    return { prompt: `${percentage}% of ${base}`, answer: change };
  }

  if (form === "reverse") {
    return {
      prompt: `${change} is what % of ${base}?`,
      answer: percentage,
    };
  }

  return {
    prompt: `${form === "increase" ? "Increase" : "Decrease"} ${base} by ${percentage}%`,
    answer: form === "increase" ? base + change : base - change,
  };
}

export function makeQuestion(
  kind: ArithmeticKind,
  level: Level,
  random: () => number = Math.random,
): ArithmeticQuestion {
  if (kind === "percentage") return makePercentageQuestion(level, random);

  const max = LEVEL_MAX[level];
  if (kind === "multiplication") {
    const limit = level === "calm" ? 5 : level === "focused" ? 12 : 20;
    const a = randomInt(2, limit, random);
    const b = randomInt(2, limit, random);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }
  if (kind === "division") {
    const divisor = randomInt(2, level === "challenge" ? 15 : 10, random);
    const answer = randomInt(2, Math.max(5, Math.floor(max / divisor)), random);
    return { prompt: `${divisor * answer} ÷ ${divisor}`, answer };
  }
  const a = randomInt(level === "calm" ? 1 : 10, max, random);
  const b = randomInt(1, max, random);
  if (kind === "subtraction")
    return {
      prompt: `${Math.max(a, b)} − ${Math.min(a, b)}`,
      answer: Math.abs(a - b),
    };
  return { prompt: `${a} + ${b}`, answer: a + b };
}
