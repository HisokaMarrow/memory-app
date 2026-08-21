import assert from "node:assert/strict";

import {
  makeQuestion,
  type Level,
} from "../components/games/arithmetic/ArithmeticGame.logic";

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const levels: Level[] = ["calm", "focused", "challenge"];
levels.forEach((level, levelIndex) => {
  const random = seededRandom(20260818 + levelIndex);
  for (let index = 0; index < 5000; index += 1) {
    const question = makeQuestion("percentage", level, random);
    assert.ok(
      Number.isInteger(question.answer),
      `${level} generated a non-integer answer for ${question.prompt}`,
    );
    assert.ok(
      !/NaN|undefined/.test(question.prompt),
      `${level} generated an unusable prompt: ${question.prompt}`,
    );
    assert.ok(
      question.answer >= 0,
      `${level} generated a negative answer for ${question.prompt}`,
    );
  }
});

const challengeRandom = seededRandom(42);
const challengePrompts = Array.from({ length: 1000 }, () =>
  makeQuestion("percentage", "challenge", challengeRandom).prompt,
);
assert.ok(
  challengePrompts.some((prompt) => prompt.includes("what %")),
  "challenge questions must include reverse percentages",
);
assert.ok(
  challengePrompts.some((prompt) => prompt.startsWith("Increase")),
  "challenge questions must include percentage increases",
);
assert.ok(
  challengePrompts.some((prompt) => prompt.startsWith("Decrease")),
  "challenge questions must include percentage decreases",
);
assert.ok(
  challengePrompts.some((prompt) => /^\d+% of \d+$/.test(prompt)),
  "challenge questions must still include plain percentages",
);

console.log("Arithmetic question checks passed.");
