import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

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
const RESULTS_SYNC_EVENT = "memoro-results-sync";
const ACTIVE_RESULTS_USER_KEY = "memoro-active-results-user-id";
const RESULTS_SYNC_DEBOUNCE_MS = 15_000;

let backgroundResultsSync: Promise<StoredGameResult[]> | null = null;
let lastBackgroundSyncAt = 0;
let memoryActiveResultsUserId: string | null = null;
let memoryLegacyResults: StoredGameResult[] = [];
const memoryResultsByKey = new Map<string, StoredGameResult[]>();
let deviceResultsHydrated = false;
let deviceResultsHydration: Promise<void> | null = null;

type RemoteGameResultRow = {
  id: string;
  user_id: string;
  game_id: string;
  game_title: string;
  created_at: string;
  mode: StoredGameResult["mode"];
  exercise_seconds: number;
  time_taken_seconds: number;
  numbers_shown: number;
  numbers_correct: number;
  digits_shown: number;
  digits_correct: number;
  accuracy: number;
  settings: StoredGameResult["settings"];
};

export type GameResultsSyncStatus = {
  ok: boolean;
  message: string;
  syncedCount?: number;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarImageUri: string;
  xp: number;
  resultsCount: number;
  rank: number;
  you?: boolean;
};

function notifyResultsChanged() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event("memoro-results-updated"));
}

function notifySyncStatus(status: GameResultsSyncStatus) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  if (typeof CustomEvent === "undefined") {
    window.dispatchEvent(new Event(RESULTS_SYNC_EVENT));
    return;
  }
  window.dispatchEvent(new CustomEvent(RESULTS_SYNC_EVENT, { detail: status }));
}

function canUseBrowserStorage() {
  return typeof localStorage !== "undefined";
}

function shouldUseDeviceStorage() {
  return Platform.OS !== "web";
}

function parseStoredResults(raw: string | null) {
  try {
    const existing = raw ? JSON.parse(raw) : [];
    return Array.isArray(existing) ? existing.map(normalizeResult) : [];
  } catch {
    return [];
  }
}

function persistDeviceValue(key: string, value: string | null) {
  if (!shouldUseDeviceStorage()) return;

  const operation = value === null ? AsyncStorage.removeItem(key) : AsyncStorage.setItem(key, value);
  operation.catch(() => {});
}

function persistDeviceResults(results: StoredGameResult[], userId?: string | null) {
  if (!shouldUseDeviceStorage()) return;
  persistDeviceValue(resultsKey(userId), JSON.stringify(results.slice(0, 100)));
}

async function hydrateDeviceResults() {
  if (!shouldUseDeviceStorage() || deviceResultsHydrated) return;
  if (deviceResultsHydration) return deviceResultsHydration;

  deviceResultsHydration = (async () => {
    const baseKeys = [ACTIVE_RESULTS_USER_KEY, resultsKey(null), RESULTS_KEY];
    const entries = await AsyncStorage.multiGet(baseKeys);
    const values = new Map(entries);
    const activeUserId = values.get(ACTIVE_RESULTS_USER_KEY) ?? null;

    memoryActiveResultsUserId = activeUserId;
    memoryResultsByKey.set(resultsKey(null), parseStoredResults(values.get(resultsKey(null)) ?? null));
    memoryLegacyResults = parseStoredResults(values.get(RESULTS_KEY) ?? null);

    if (activeUserId) {
      const activeResults = await AsyncStorage.getItem(resultsKey(activeUserId));
      memoryResultsByKey.set(resultsKey(activeUserId), parseStoredResults(activeResults));
    }

    deviceResultsHydrated = true;
    deviceResultsHydration = null;
  })().catch((error) => {
    deviceResultsHydrated = true;
    deviceResultsHydration = null;
    notifySyncStatus({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load device results.",
    });
  });

  return deviceResultsHydration;
}

function readActiveResultsUserId() {
  if (!canUseBrowserStorage()) return memoryActiveResultsUserId;
  return localStorage.getItem(ACTIVE_RESULTS_USER_KEY);
}

function writeActiveResultsUserId(userId: string) {
  if (!canUseBrowserStorage()) {
    if (memoryActiveResultsUserId === userId) return false;
    memoryActiveResultsUserId = userId;
    persistDeviceValue(ACTIVE_RESULTS_USER_KEY, userId);
    return true;
  }
  if (localStorage.getItem(ACTIVE_RESULTS_USER_KEY) === userId) return false;
  localStorage.setItem(ACTIVE_RESULTS_USER_KEY, userId);
  return true;
}

export function setActiveResultsUser(userId: string) {
  if (writeActiveResultsUserId(userId)) {
    notifyResultsChanged();
  }
}

export function clearActiveResultsUser() {
  if (!canUseBrowserStorage()) {
    if (!memoryActiveResultsUserId) return;
    memoryActiveResultsUserId = null;
    persistDeviceValue(ACTIVE_RESULTS_USER_KEY, null);
    notifyResultsChanged();
    return;
  }
  if (!localStorage.getItem(ACTIVE_RESULTS_USER_KEY)) return;
  localStorage.removeItem(ACTIVE_RESULTS_USER_KEY);
  notifyResultsChanged();
}

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

function resultsKey(userId?: string | null) {
  return `${RESULTS_KEY}:${userId ?? "guest"}`;
}

function readLocalResults(userId?: string | null) {
  if (!canUseBrowserStorage()) return memoryResultsByKey.get(resultsKey(userId)) ?? [];

  try {
    const raw = localStorage.getItem(resultsKey(userId));
    return parseStoredResults(raw);
  } catch {
    return [];
  }
}

function readLegacyLocalResults() {
  if (!canUseBrowserStorage()) return memoryLegacyResults;

  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return parseStoredResults(raw);
  } catch {
    return [];
  }
}

function clearGuestAndLegacyResults() {
  if (!canUseBrowserStorage()) {
    memoryResultsByKey.delete(resultsKey(null));
    memoryLegacyResults = [];
    persistDeviceValue(resultsKey(null), null);
    persistDeviceValue(RESULTS_KEY, null);
    return;
  }
  localStorage.removeItem(resultsKey(null));
  localStorage.removeItem(RESULTS_KEY);
}

export function readLocalGameResultsSnapshot(userId?: string | null) {
  if (userId !== undefined) {
    return readLocalResults(userId);
  }

  const activeUserId = readActiveResultsUserId();
  if (activeUserId) {
    return readLocalResults(activeUserId);
  }

  return mergeResults([...readLocalResults(null), ...readLegacyLocalResults()]);
}

function writeLocalResults(results: StoredGameResult[], userId?: string | null) {
  const nextResults = results.slice(0, 100);

  if (!canUseBrowserStorage()) {
    memoryResultsByKey.set(resultsKey(userId), nextResults);
    persistDeviceResults(nextResults, userId);
    return;
  }
  localStorage.setItem(resultsKey(userId), JSON.stringify(nextResults));
}

function mergeResults(results: StoredGameResult[]) {
  const byId = new Map<string, StoredGameResult>();
  results.forEach((result) => byId.set(result.id, result));
  return Array.from(byId.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function sameResults(a: StoredGameResult[], b: StoredGameResult[]) {
  if (a.length !== b.length) return false;
  return a.every((result, index) => result.id === b[index]?.id && result.createdAt === b[index]?.createdAt);
}

function toRemoteRow(result: StoredGameResult, userId: string): RemoteGameResultRow {
  return {
    id: result.id,
    user_id: userId,
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
  };
}

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function upsertRemoteResults(results: StoredGameResult[], authenticatedUser?: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  const user = authenticatedUser ?? await getAuthenticatedUser();
  if (!user || !results.length) return { ok: false, message: "Sign in to sync results." };

  const rows = results.map((result) => toRemoteRow(result, user.id));
  const { error } = await supabase
    .from("game_results")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Results synced.", syncedCount: rows.length };
}

export async function syncLocalGameResults() {
  await hydrateDeviceResults();
  const user = await getAuthenticatedUser();
  if (user) setActiveResultsUser(user.id);
  const userId = user?.id ?? readActiveResultsUserId();
  const localResults = readLocalResults(userId);
  const status = await upsertRemoteResults(localResults, user);
  notifySyncStatus(status);
  return status;
}

export async function saveGameResult(result: StoredGameResult) {
  await hydrateDeviceResults();
  const cachedUserId = readActiveResultsUserId();
  const localTargetUserId = cachedUserId ?? null;
  writeLocalResults(mergeResults([result, ...readLocalResults(localTargetUserId)]), localTargetUserId);
  notifyResultsChanged();

  try {
    const user = await getAuthenticatedUser();
    if (user) {
      setActiveResultsUser(user.id);
      if (user.id !== localTargetUserId) {
        writeLocalResults(mergeResults([result, ...readLocalResults(user.id)]), user.id);
        notifyResultsChanged();
      }
    }
    const status = await upsertRemoteResults([result], user);
    notifySyncStatus(status);
  } catch (error) {
    notifySyncStatus({
      ok: false,
      message: error instanceof Error ? error.message : "Could not sync result.",
    });
  }
}

async function syncRemoteResultsIntoLocal() {
  try {
    await hydrateDeviceResults();
    const user = await getAuthenticatedUser();
    if (!user) {
      return readLocalGameResultsSnapshot();
    }

    setActiveResultsUser(user.id);
    const previousLocalResults = readLocalResults(user.id);
    const guestResults = readLocalResults(null);
    const legacyResults = readLegacyLocalResults();
    const localResults = mergeResults([...previousLocalResults, ...guestResults, ...legacyResults]);

    if (localResults.length) {
      await upsertRemoteResults(localResults, user);
    }

    const { data, error } = await supabase
      .from("game_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return localResults;

    const remoteResults = data.map(normalizeResult);
    const merged = mergeResults([...remoteResults, ...localResults]);
    writeLocalResults(merged, user.id);
    clearGuestAndLegacyResults();
    notifySyncStatus({ ok: true, message: "Results loaded from Supabase.", syncedCount: merged.length });
    if (!sameResults(previousLocalResults, merged)) {
      notifyResultsChanged();
    }
    return merged;
  } catch (error) {
    notifySyncStatus({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load Supabase results.",
    });
    return readLocalGameResultsSnapshot();
  }
}

function syncRemoteResultsInBackground(force = false) {
  const now = Date.now();
  if (backgroundResultsSync) return backgroundResultsSync;
  if (!force && now - lastBackgroundSyncAt < RESULTS_SYNC_DEBOUNCE_MS) {
    return Promise.resolve(readLocalGameResultsSnapshot());
  }

  lastBackgroundSyncAt = now;
  backgroundResultsSync = syncRemoteResultsIntoLocal().finally(() => {
    backgroundResultsSync = null;
  });
  return backgroundResultsSync;
}

export async function loadGameResults({ sync = true }: { sync?: boolean } = {}) {
  await hydrateDeviceResults();
  const localResults = readLocalGameResultsSnapshot();
  if (sync) {
    syncRemoteResultsInBackground();
  }
  return localResults;
}

export async function refreshGameResultsFromSupabase() {
  return syncRemoteResultsInBackground(true);
}

export async function loadLeaderboard(limit = 20) {
  const user = await getAuthenticatedUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("leaderboard_xp")
    .select("user_id, display_name, avatar_color, avatar_image_uri, xp, results_count, rank")
    .order("rank", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any): LeaderboardEntry => ({
    userId: row.user_id,
    displayName: row.display_name || "athlete",
    avatarColor: row.avatar_color || "#E85D2A",
    avatarImageUri: row.avatar_image_uri || "",
    xp: Number(row.xp ?? 0),
    resultsCount: Number(row.results_count ?? 0),
    rank: Number(row.rank ?? 0),
    you: row.user_id === user.id,
  }));
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
  const totalXp = results.reduce((sum, result) => sum + result.numbersCorrect * 3, 0);
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
