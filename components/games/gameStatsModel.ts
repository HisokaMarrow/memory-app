import type { StoredGameResult } from "./resultsStore";

function dayKey(date: string) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateGameStats(results: StoredGameResult[], questXp = 0) {
  const today = new Date();
  const activeDays = new Set(results.map((result) => dayKey(result.createdAt)));
  let streakDays = 0;
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = dayKey(date.toISOString());
    return {
      active: activeDays.has(key),
      isToday: index === 6,
      key,
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date).slice(0, 1),
    };
  });

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    if (!activeDays.has(dayKey(date.toISOString()))) break;
    streakDays += 1;
  }

  const bestNumbers = results.reduce((best, result) => Math.max(best, result.numbersCorrect), 0);
  const bestDigits = results.reduce((best, result) => Math.max(best, result.digitsCorrect), 0);
  const gameplayXp = results.reduce((sum, result) => sum + result.numbersCorrect * 3, 0);
  const safeQuestXp = Math.max(0, Number.isFinite(questXp) ? questXp : 0);
  const latest = results[0];
  const averageAccuracy = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length)
    : 0;

  return {
    averageAccuracy,
    bestDigits,
    bestNumbers,
    latest,
    resultsCount: results.length,
    streakDays,
    totalXp: gameplayXp + safeQuestXp,
    gameplayXp,
    questXp: safeQuestXp,
    weekActivity,
  };
}
