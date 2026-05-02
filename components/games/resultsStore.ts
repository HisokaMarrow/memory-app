import { supabase } from "../../lib/supabase";

export type StoredGameResult = {
  id: string;
  gameId: string;
  gameTitle: string;
  createdAt: string;
  mode: "auto" | "manual";
  exerciseSeconds: number;
  timeTakenSeconds: number;
  numbersShown: number;
  numbersCorrect: number;
  digitsShown: number;
  digitsCorrect: number;
  accuracy: number;
  settings: {
    digits: number;
    min: number;
    max: number;
    intervalSeconds?: number;
  };
};

const RESULTS_KEY = "memoro-game-results";

function normalizeResult(row: any): StoredGameResult {
  return {
    id: row.id,
    gameId: row.game_id ?? row.gameId,
    gameTitle: row.game_title ?? row.gameTitle,
    createdAt: row.created_at ?? row.createdAt,
    mode: row.mode,
    exerciseSeconds: row.exercise_seconds ?? row.exerciseSeconds,
    timeTakenSeconds: row.time_taken_seconds ?? row.timeTakenSeconds,
    numbersShown: row.numbers_shown ?? row.numbersShown,
    numbersCorrect: row.numbers_correct ?? row.numbersCorrect,
    digitsShown: row.digits_shown ?? row.digitsShown,
    digitsCorrect: row.digits_correct ?? row.digitsCorrect,
    accuracy: row.accuracy,
    settings: row.settings ?? { digits: 2, min: 0, max: 99 },
  };
}

function readLocalResults() {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    return Array.isArray(existing) ? existing.map(normalizeResult) : [];
  } catch {
    return [];
  }
}

function writeLocalResults(results: StoredGameResult[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(0, 100)));
}

function mergeResults(results: StoredGameResult[]) {
  const byId = new Map<string, StoredGameResult>();
  results.forEach((result) => byId.set(result.id, result));
  return Array.from(byId.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveGameResult(result: StoredGameResult) {
  const localResults = readLocalResults() ?? [];
  writeLocalResults(mergeResults([result, ...localResults]));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("memoro-results-updated"));
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("game_results").insert({
      id: result.id,
      user_id: user.id,
      game_id: result.gameId,
      game_title: result.gameTitle,
      created_at: result.createdAt,
      mode: result.mode,
      exercise_seconds: result.exerciseSeconds,
      time_taken_seconds: result.timeTakenSeconds,
      numbers_shown: result.numbersShown,
      numbers_correct: result.numbersCorrect,
      digits_shown: result.digitsShown,
      digits_correct: result.digitsCorrect,
      accuracy: result.accuracy,
      settings: result.settings,
    });
  } catch {
    // Local storage already has the result; remote sync can be retried later.
  }
}

export async function loadGameResults() {
  const localResults = readLocalResults() ?? [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localResults;

    const { data, error } = await supabase
      .from("game_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return localResults;

    const remoteResults = data.map(normalizeResult);
    const merged = mergeResults([...remoteResults, ...localResults]);
    writeLocalResults(merged);
    return merged;
  } catch {
    return localResults;
  }
}

function dayKey(date: string) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateGameStats(results: StoredGameResult[]) {
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
  const totalXp = results.reduce((sum, result) => sum + result.digitsCorrect * 10 + result.numbersCorrect * 5, 0);
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
    totalXp,
    weekActivity,
  };
}
