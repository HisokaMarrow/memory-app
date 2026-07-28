import type { Feather } from "@expo/vector-icons";

import { supabase } from "../../lib/supabase";

export type MemoryLesson = {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  promise: string;
  explanation: string;
  example: string;
  tryIt: string;
  highlight?: boolean;
  roomMap?: boolean;
};

const MEMORY_PROGRESS_KEY = "memoro-memory-vault-progress";
const LATEST_TREE_KEY = "memoro-latest-vault-tree";
const MEMORY_TREE_ID = "Memory";
const LEGACY_MEMORY_TREE_ID = "memory";
const VAULT_PROGRESS_EVENT = "memoro-vault-progress-updated";
let activeVaultUserId: string | null = null;

export const MEMORY_COLOR = "#5B5BD6";

export const MEMORY_LESSONS: MemoryLesson[] = [
  {
    id: "three-pillars",
    title: "Three Pillars of Memory",
    icon: "eye",
    promise: "Learn the three skills that make every memory technique work.",
    explanation: "Memory depends on attention, imagination, and association. Attention means noticing the thing clearly. Imagination turns it into a vivid image. Association connects it to something you already know.",
    example: "Instead of trying to remember apple, imagine a giant red apple exploding with juice on the floor.",
    tryIt: "Make these words vivid: apple, sword, candle, tiger, crown.",
  },
  {
    id: "chunking",
    title: "Chunking",
    icon: "layers",
    promise: "Turn long information into smaller groups.",
    explanation: "Chunking reduces mental load by grouping information into meaningful blocks.",
    example: "194519891999 becomes 1945 / 1989 / 1999.",
    tryIt: "Chunk this number: 7419823650.",
  },
  {
    id: "story-method",
    title: "Story Method",
    icon: "book-open",
    promise: "Remember lists by turning them into one strange story.",
    explanation: "The brain remembers connected images better than separate facts. Link each item into a short, weird story.",
    example: "A dog jumps onto the moon, plays a giant piano, slips on a banana, and crashes into a castle.",
    tryIt: "Create a story using: key, river, dragon, glass, crown.",
  },
  {
    id: "look-alike",
    title: "Look-Alike Associations",
    icon: "image",
    promise: "Turn numbers and symbols into images.",
    explanation: "Abstract things are hard to remember. Convert them into images that look similar.",
    example: "1 = tower, 2 = swan, 3 = heart, 4 = sailboat, 5 = hook, 6 = cherry, 7 = axe, 8 = snowman, 9 = balloon, 0 = egg.",
    tryIt: "Create images for: 21, 80, 47, 36.",
  },
  {
    id: "peg-system",
    title: "Peg System",
    icon: "map-pin",
    promise: "Use fixed memory hooks to remember ordered information.",
    explanation: "A peg system gives each number a permanent image. You attach new information to those fixed images.",
    example: "1 = tower. To remember milk, imagine milk pouring down a tower. 2 = swan. Imagine a swan eating bread.",
    tryIt: "Attach these items to pegs 1-5: milk, keys, phone, apple, book.",
  },
  {
    id: "memory-palace",
    title: "Memory Palace",
    icon: "home",
    promise: "Store memories inside a room you can walk through.",
    explanation: "A memory palace uses fixed locations as storage points. Place one vivid image at each location, then mentally walk through the room to recall them.",
    example: "To remember dragon at station 1, imagine a dragon burning the door. To remember gold at station 2, imagine the shoe mat made of gold.",
    tryIt: "Place these items in the first 5 stations: dragon, gold, apple, sword, candle.",
    highlight: true,
    roomMap: true,
  },
  {
    id: "advanced-associations",
    title: "Advanced Associations",
    icon: "zap",
    promise: "Compress long numbers and cards into powerful images.",
    explanation: "Advanced systems turn numbers into reusable images. PAO uses Person, Action, Object. The Major System turns digits into sounds and then words.",
    example: "23 = Michael Jordan / dunking / basketball. 07 = James Bond / shooting / pistol. 230710 can become Michael Jordan shooting a football.",
    tryIt: "Create images for: 32, 15, 91, 47, 80.",
  },
  {
    id: "master-review",
    title: "Master Review",
    icon: "award",
    promise: "Review the full memory system and combine the techniques.",
    explanation: "Each method has a job: pillars make memory work, chunking reduces overload, stories link lists, look-alikes turn symbols into images, pegs order items, palaces store larger information, and PAO/Major compress numbers and cards.",
    example: "Use chunking for the digits, a story for loose words, and a palace when the list becomes too large.",
    tryIt: "Complete a final mixed challenge: remember 8 words, 10 ordered items, and 6 digits.",
  },
];

function clampProgress(value: number) {
  return Math.max(0, Math.min(MEMORY_LESSONS.length, value));
}

function progressKey(userId?: string | null) {
  return `${MEMORY_PROGRESS_KEY}:${userId ?? "guest"}`;
}

function latestTreeKey(userId?: string | null) {
  return `${LATEST_TREE_KEY}:${userId ?? "guest"}`;
}

function normalizeTreeId(treeId?: string | null) {
  if (!treeId) return MEMORY_TREE_ID;
  return treeId.toLowerCase() === LEGACY_MEMORY_TREE_ID ? MEMORY_TREE_ID : treeId;
}

function notifyVaultProgressChanged() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event(VAULT_PROGRESS_EVENT));
}

function readProgressValue(key: string) {
  if (typeof localStorage === "undefined") return 0;
  const value = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
  return Number.isFinite(value) ? clampProgress(value) : 0;
}

function readLocalProgress(userId?: string | null) {
  if (typeof localStorage === "undefined") return 0;
  const scopedValue = localStorage.getItem(progressKey(userId));
  if (scopedValue !== null) return readProgressValue(progressKey(userId));

  const legacyValue = localStorage.getItem(MEMORY_PROGRESS_KEY);
  if (legacyValue !== null) return readProgressValue(MEMORY_PROGRESS_KEY);

  return 0;
}

function writeLocalProgress(value: number, userId?: string | null) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(progressKey(userId), String(clampProgress(value)));
}

function readLatestTree(userId?: string | null) {
  if (typeof localStorage === "undefined") return MEMORY_TREE_ID;
  const scopedValue = localStorage.getItem(latestTreeKey(userId));
  if (scopedValue) return normalizeTreeId(scopedValue);

  const legacyValue = localStorage.getItem(LATEST_TREE_KEY);
  return normalizeTreeId(legacyValue);
}

function writeLatestTree(treeId: string, userId?: string | null) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(latestTreeKey(userId), normalizeTreeId(treeId));
}

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    activeVaultUserId = null;
    return null;
  }
  activeVaultUserId = user.id;
  return user.id;
}

export function getCachedMemoryVaultProgress() {
  return readLocalProgress(activeVaultUserId);
}

export function getCachedLatestVaultTreeId() {
  return readLatestTree(activeVaultUserId);
}

export async function loadMemoryVaultProgress() {
  const userId = await getUserId();
  const local = readLocalProgress(userId);
  if (!userId) return local;

  const { data, error } = await supabase
    .from("vault_progress")
    .select("completed_count")
    .eq("user_id", userId)
    .in("tree_id", [MEMORY_TREE_ID, LEGACY_MEMORY_TREE_ID])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return local;

  if (!data) {
    writeLocalProgress(local, userId);
    await supabase.from("vault_progress").upsert({
      user_id: userId,
      tree_id: MEMORY_TREE_ID,
      completed_count: local,
      updated_at: new Date().toISOString(),
    });
    return local;
  }

  const remote = clampProgress(Number(data.completed_count ?? 0));
  writeLocalProgress(remote, userId);
  return remote;
}

export async function saveMemoryVaultProgress(value: number) {
  const next = clampProgress(value);
  const userId = await getUserId();
  writeLocalProgress(next, userId);
  writeLatestTree(MEMORY_TREE_ID, userId);

  if (userId) {
    await supabase.from("vault_progress").upsert({
      user_id: userId,
      tree_id: MEMORY_TREE_ID,
      completed_count: next,
      updated_at: new Date().toISOString(),
    });
  }

  notifyVaultProgressChanged();
  return next;
}

export async function loadLatestVaultTreeId() {
  const userId = await getUserId();
  const local = readLatestTree(userId);
  if (!userId) return local;

  const { data, error } = await supabase
    .from("vault_progress")
    .select("tree_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.tree_id) return local;

  const latestTreeId = normalizeTreeId(data.tree_id);
  writeLatestTree(latestTreeId, userId);
  return latestTreeId;
}

export async function saveLatestVaultTreeId(treeId: string) {
  const nextTreeId = normalizeTreeId(treeId);
  const userId = await getUserId();
  writeLatestTree(nextTreeId, userId);

  if (userId) {
    const completedCount = nextTreeId === MEMORY_TREE_ID ? readLocalProgress(userId) : 0;
    await supabase.from("vault_progress").upsert({
      user_id: userId,
      tree_id: nextTreeId,
      completed_count: completedCount,
      updated_at: new Date().toISOString(),
    });
  }

  notifyVaultProgressChanged();
  return nextTreeId;
}

export function memoryVaultProgressEventName() {
  return VAULT_PROGRESS_EVENT;
}
