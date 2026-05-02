import { GAMES, type GameConfig } from "../../data/gamesCatalog";

export type UserGoal = {
  text: string;
  tag: string;
  targetCount: number;
  targetMetric: string;
  targetSeconds: number;
  deadline: string;
};

const FAVOURITES_KEY = "memoro-favourite-games";
const GOAL_KEY = "memoro-user-goal";
const GOALS_KEY = "memoro-user-goals";
const DAILY_PLAN_KEY = "memoro-daily-plan";

const DEFAULT_GOAL: UserGoal = {
  text: "Remember digits",
  tag: "Memory",
  targetCount: 20,
  targetMetric: "digits",
  targetSeconds: 60,
  deadline: "2026-05-31",
};

export function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavouriteGameIds() {
  const value = readJson<string[]>(FAVOURITES_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function setFavouriteGameIds(ids: string[]) {
  writeJson(FAVOURITES_KEY, Array.from(new Set(ids)));
}

export function toggleFavouriteGame(gameId: string) {
  const ids = getFavouriteGameIds();
  const next = ids.includes(gameId) ? ids.filter((id) => id !== gameId) : [gameId, ...ids];
  setFavouriteGameIds(next);
  return next;
}

export function getUserGoal(): UserGoal {
  return getUserGoals()[0] ?? DEFAULT_GOAL;
}

export function saveUserGoal(goal: UserGoal) {
  saveUserGoals([goal]);
}

export function getUserGoals(): UserGoal[] {
  const goals = readJson<UserGoal[]>(GOALS_KEY, []);
  if (Array.isArray(goals) && goals.length > 0) return goals.slice(0, 3);

  const legacyGoal = readJson<UserGoal | null>(GOAL_KEY, null);
  return legacyGoal ? [legacyGoal] : [DEFAULT_GOAL];
}

export function saveUserGoals(goals: UserGoal[]) {
  writeJson(GOALS_KEY, goals.slice(0, 3));
}

function seededPick(seed: string, games: GameConfig[]) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const pool = [...games];
  const picked: GameConfig[] = [];
  while (pool.length && picked.length < 3) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const index = hash % pool.length;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export function getDailyPlanGames() {
  const today = todayKey();
  const saved = readJson<{ date: string; gameIds: string[] } | null>(DAILY_PLAN_KEY, null);

  if (saved?.date === today) {
    const savedGames = saved.gameIds
      .map((id) => GAMES.find((game) => game.id === id))
      .filter(Boolean) as GameConfig[];
    if (savedGames.length === 3) return savedGames;
  }

  const plan = seededPick(today, GAMES);
  writeJson(DAILY_PLAN_KEY, { date: today, gameIds: plan.map((game) => game.id) });
  return plan;
}
