import { GAMES, type GameConfig } from "../../data/gamesCatalog";
import { supabase } from "../../lib/supabase";

export type UserGoal = {
  text: string;
  tag: string;
  targetCount: number;
  targetMetric: string;
  targetSeconds: number;
  deadline: string;
};

export type QuestType = "daily" | "progression" | "recovery" | "special";
export type QuestDifficulty = "calibrated" | "pressure" | "elite";
export type QuestMetric = "daily_sessions" | "daily_training_trio" | "accuracy" | "best_numbers" | "best_digits" | "vault_lessons" | "streak" | "game_score";
export type QuestStatus = "active" | "complete";

export type UserQuest = {
  id: string;
  questDate: string;
  type: QuestType;
  title: string;
  description: string;
  tag: string;
  metric: QuestMetric;
  target: number;
  current: number;
  xpReward: number;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  assignedAt: string;
  expiresAt: string;
  systemMessage: string;
  calibratedAt?: string;
  completedAt?: string;
  gameId?: string;
};

const FAVOURITES_KEY = "memoro-favourite-games";
const GOAL_KEY = "memoro-user-goal";
const GOALS_KEY = "memoro-user-goals";
const QUESTS_KEY = "memoro-user-quests";
const DAILY_PLAN_KEY = "memoro-daily-plan";
const DAILY_QUEST_SELECTION_KEY = "memoro-daily-quest-selection-history";
let activeUserId: string | null = null;

const DAILY_TRAINING_PLAN_CATEGORIES = ["Memory", "Maths", "Words"] as const;
const DAILY_SKILL_QUEST_CATEGORIES = [
  { category: "Memory", label: "Memory" },
  { category: "Maths", label: "Maths" },
  { category: "Words", label: "Linguistics" },
] as const;
const DAILY_STRETCH_QUEST_CATEGORIES = ["Speed", "Focus"] as const;

type UserPreferences = {
  favouriteGameIds: string[];
  goals: UserGoal[];
  quests: UserQuest[];
};

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

function scopedKey(baseKey: string, userId?: string | null) {
  return `${baseKey}:${userId ?? "guest"}`;
}

function questExpiry(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function seededIndex(seed: string, length: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return length ? hash % length : 0;
}

function readDailyQuestSelectionHistory() {
  const history = readJson<{ date: string; gameIds: string[] }[]>(DAILY_QUEST_SELECTION_KEY, []);
  return Array.isArray(history)
    ? history.filter((item) => typeof item.date === "string" && Array.isArray(item.gameIds))
    : [];
}

function rememberDailyQuestSelection(date: string, gameIds: string[]) {
  const previous = readDailyQuestSelectionHistory().filter((item) => item.date !== date);
  writeJson(DAILY_QUEST_SELECTION_KEY, [...previous.slice(-13), { date, gameIds }]);
}

function recentQuestGameIds(date: string) {
  return new Set(
    readDailyQuestSelectionHistory()
      .filter((item) => item.date !== date)
      .slice(-6)
      .flatMap((item) => item.gameIds)
  );
}

function pickQuestGame(date: string, category: string, blockedGameIds: Set<string>, index: number) {
  const categoryGames = GAMES.filter((game) => game.category === category && game.unlocked);
  const eligibleGames = categoryGames.filter((game) => !blockedGameIds.has(game.id));
  const pool = eligibleGames.length ? eligibleGames : categoryGames;
  return pool[seededIndex(`${date}-${category}-${index}`, pool.length)];
}

function createScoreQuest(date: string, index: number, game: GameConfig, categoryLabel: string, type: QuestType = "daily") {
  return makeQuest(date, index, {
    type,
    title: `${categoryLabel}: ${game.title}`,
    description: `Beat today's adaptive ${categoryLabel.toLowerCase()} target in ${game.title}.`,
    tag: categoryLabel,
    metric: "game_score",
    target: 10,
    xpReward: type === "special" ? 150 : 170,
    difficulty: type === "special" ? "calibrated" : "pressure",
    systemMessage: "Target calibrates from your latest 7-day median, then adds 2-6 points.",
    gameId: game.id,
  });
}

function makeQuest(
  date: string,
  index: number,
  quest: Omit<UserQuest, "id" | "questDate" | "assignedAt" | "expiresAt" | "current" | "status">,
): UserQuest {
  const assignedAt = new Date().toISOString();
  return {
    ...quest,
    id: `${date}-${index}-${quest.metric}`,
    questDate: date,
    current: 0,
    status: "active",
    assignedAt,
    expiresAt: questExpiry(date),
  };
}

export function createDailyQuests(date = todayKey()): UserQuest[] {
  const history = readDailyQuestSelectionHistory();
  const savedToday = history.find((item) => item.date === date);
  const savedGames = savedToday?.gameIds
    ?.map((id) => GAMES.find((game) => game.id === id))
    .filter(Boolean) as GameConfig[] | undefined;

  if (savedGames?.length === 4) {
    const skillQuests = DAILY_SKILL_QUEST_CATEGORIES.map((item, index) => createScoreQuest(date, index + 1, savedGames[index], item.label));
    return [...skillQuests, createScoreQuest(date, 4, savedGames[3], savedGames[3].category, "special")];
  }

  const blockedGameIds = recentQuestGameIds(date);
  const pickedGames: GameConfig[] = [];
  const skillQuests = DAILY_SKILL_QUEST_CATEGORIES.map((item, index) => {
    const game = pickQuestGame(date, item.category, blockedGameIds, index);
    if (game) {
      pickedGames.push(game);
      blockedGameIds.add(game.id);
    }
    return createScoreQuest(date, index + 1, game, item.label);
  });
  const stretchCategory = DAILY_STRETCH_QUEST_CATEGORIES[seededIndex(`${date}-stretch`, DAILY_STRETCH_QUEST_CATEGORIES.length)];
  const stretchGame = pickQuestGame(date, stretchCategory, blockedGameIds, 4);
  pickedGames.push(stretchGame);
  rememberDailyQuestSelection(date, pickedGames.map((game) => game.id));

  return [...skillQuests, createScoreQuest(date, 4, stretchGame, stretchGame.category, "special")];
}

function isQuest(value: unknown): value is UserQuest {
  if (!value || typeof value !== "object") return false;
  const quest = value as Partial<UserQuest>;
  return (
    typeof quest.id === "string" &&
    typeof quest.questDate === "string" &&
    typeof quest.title === "string" &&
    typeof quest.metric === "string" &&
    typeof quest.target === "number" &&
    typeof quest.xpReward === "number"
  );
}

function preserveQuestProgress(template: UserQuest, existing?: UserQuest) {
  if (!existing) return template;
  return {
    ...template,
    assignedAt: existing.assignedAt || template.assignedAt,
    target: existing.calibratedAt && Number.isFinite(existing.target) ? existing.target : template.target,
    current: Number.isFinite(existing.current) ? existing.current : template.current,
    status: existing.status === "complete" ? "complete" as const : "active" as const,
    systemMessage: existing.calibratedAt ? existing.systemMessage || template.systemMessage : template.systemMessage,
    calibratedAt: existing.calibratedAt,
    completedAt: existing.completedAt,
  };
}

function ensureDailyScoreQuests(quests: UserQuest[], date = todayKey()) {
  const defaults = createDailyQuests(date);
  return defaults.map((template) => {
    const existing = quests.find((quest) => quest.metric === "game_score" && quest.gameId === template.gameId);
    return preserveQuestProgress(template, existing);
  });
}

function normalizeQuests(value: unknown, date = todayKey()): UserQuest[] {
  if (!Array.isArray(value)) return [];
  const quests = value
    .filter(isQuest)
    .filter((quest) => quest.questDate === date)
    .slice(0, 4)
    .map((quest) => ({
      ...quest,
      current: Number.isFinite(quest.current) ? quest.current : 0,
      status: quest.status === "complete" ? "complete" as const : "active" as const,
      expiresAt: quest.expiresAt || questExpiry(date),
    }));
  return quests.length ? ensureDailyScoreQuests(quests, date) : [];
}

function isGoal(value: unknown): value is UserGoal {
  if (!value || typeof value !== "object") return false;
  const goal = value as Partial<UserGoal>;
  return (
    typeof goal.text === "string" &&
    typeof goal.tag === "string" &&
    typeof goal.targetCount === "number" &&
    typeof goal.targetMetric === "string" &&
    typeof goal.targetSeconds === "number" &&
    typeof goal.deadline === "string"
  );
}

function normalizeGoals(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(isGoal).slice(0, 3);
}

function defaultPreferences(): UserPreferences {
  return {
    favouriteGameIds: [],
    goals: [DEFAULT_GOAL],
    quests: createDailyQuests(),
  };
}

export function getFavouriteGameIds() {
  const value = readJson<string[]>(scopedKey(FAVOURITES_KEY, activeUserId), []);
  return Array.isArray(value) ? value : [];
}

export function setFavouriteGameIds(ids: string[]) {
  const nextIds = Array.from(new Set(ids));
  writeJson(scopedKey(FAVOURITES_KEY, activeUserId), nextIds);
  saveUserPreferences({ favouriteGameIds: nextIds }).then(() => undefined);
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
  const goals = normalizeGoals(readJson<UserGoal[]>(scopedKey(GOALS_KEY, activeUserId), []));
  if (goals.length > 0) return goals;

  const legacyGoal = readJson<UserGoal | null>(scopedKey(GOAL_KEY, activeUserId), null);
  return isGoal(legacyGoal) ? [legacyGoal] : [DEFAULT_GOAL];
}

export function saveUserGoals(goals: UserGoal[]) {
  const nextGoals = goals.slice(0, 3);
  writeJson(scopedKey(GOALS_KEY, activeUserId), nextGoals);
  saveUserPreferences({ goals: nextGoals }).then(() => undefined);
}

export function getUserQuests(): UserQuest[] {
  const quests = normalizeQuests(readJson<UserQuest[]>(scopedKey(QUESTS_KEY, activeUserId), []));
  if (quests.length > 0) return quests;

  const nextQuests = createDailyQuests();
  writeJson(scopedKey(QUESTS_KEY, activeUserId), nextQuests);
  return nextQuests;
}

export function saveUserQuests(quests: UserQuest[]) {
  const nextQuests = normalizeQuests(quests.length ? quests : createDailyQuests());
  const savedQuests = nextQuests.length ? nextQuests : createDailyQuests();
  writeJson(scopedKey(QUESTS_KEY, activeUserId), savedQuests);
  saveUserPreferences({ quests: savedQuests }).then(() => undefined);
}

function localPreferences(userId?: string | null): UserPreferences {
  const favouriteGameIds = readJson<string[]>(scopedKey(FAVOURITES_KEY, userId), []);
  const goals = normalizeGoals(readJson<UserGoal[]>(scopedKey(GOALS_KEY, userId), []));
  const legacyGoal = readJson<UserGoal | null>(scopedKey(GOAL_KEY, userId), null);
  const quests = normalizeQuests(readJson<UserQuest[]>(scopedKey(QUESTS_KEY, userId), []));

  return {
    favouriteGameIds: Array.isArray(favouriteGameIds) ? favouriteGameIds : [],
    goals: goals.length > 0 ? goals : isGoal(legacyGoal) ? [legacyGoal] : [DEFAULT_GOAL],
    quests: quests.length ? quests : createDailyQuests(),
  };
}

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    activeUserId = null;
    return null;
  }
  activeUserId = user.id;
  return user.id;
}

async function saveUserPreferences(next: Partial<UserPreferences>) {
  const userId = await getUserId();
  if (!userId) return;

  const current = localPreferences(userId);
  if (next.favouriteGameIds) writeJson(scopedKey(FAVOURITES_KEY, userId), next.favouriteGameIds);
  if (next.goals) writeJson(scopedKey(GOALS_KEY, userId), next.goals);
  if (next.quests) writeJson(scopedKey(QUESTS_KEY, userId), next.quests);

  await supabase.from("user_preferences").upsert({
    user_id: userId,
    favourite_game_ids: next.favouriteGameIds ?? current.favouriteGameIds,
    goals: next.quests ?? next.goals ?? current.quests,
    updated_at: new Date().toISOString(),
  });
}

export async function loadUserPreferences() {
  const userId = await getUserId();
  const local = localPreferences(userId);
  if (!userId) return local;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("favourite_game_ids, goals")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return local;

  if (!data) {
    const defaults = defaultPreferences();
    writeJson(scopedKey(FAVOURITES_KEY, userId), defaults.favouriteGameIds);
    writeJson(scopedKey(GOALS_KEY, userId), defaults.goals);
    writeJson(scopedKey(QUESTS_KEY, userId), defaults.quests);
    await supabase.from("user_preferences").upsert({
      user_id: userId,
      favourite_game_ids: defaults.favouriteGameIds,
      goals: defaults.quests,
      updated_at: new Date().toISOString(),
    });
    return defaults;
  }

  const favouriteGameIds = Array.isArray(data.favourite_game_ids) ? data.favourite_game_ids : local.favouriteGameIds;
  const remoteGoals = normalizeGoals(data.goals);
  const goals = remoteGoals.length ? remoteGoals : local.goals;
  const remoteQuests = normalizeQuests(data.goals);
  const quests = remoteQuests.length ? remoteQuests : local.quests;

  writeJson(scopedKey(FAVOURITES_KEY, userId), favouriteGameIds);
  writeJson(scopedKey(GOALS_KEY, userId), goals);
  writeJson(scopedKey(QUESTS_KEY, userId), quests);

  return { favouriteGameIds, goals, quests };
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
    const hasDailyTrainingShape = DAILY_TRAINING_PLAN_CATEGORIES.every((category) =>
      savedGames.some((game) => game.category === category)
    );
    if (savedGames.length === 3 && hasDailyTrainingShape) return savedGames;
  }

  const plan = DAILY_TRAINING_PLAN_CATEGORIES.map((category) => {
    const categoryGames = GAMES.filter((game) => game.category === category && game.unlocked);
    const beginnerGames = categoryGames.filter((game) => game.difficulty === "Beginner");
    return seededPick(`${today}-${category}`, beginnerGames.length ? beginnerGames : categoryGames)[0];
  }).filter(Boolean) as GameConfig[];

  writeJson(DAILY_PLAN_KEY, { date: today, gameIds: plan.map((game) => game.id) });
  return plan;
}
