import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { supabase } from "../../lib/supabase";
import {
  enqueuePendingDelete,
  enqueuePendingWrite,
  expectedRevisionForMutation,
  newestPendingSystems,
  pendingSystemId,
  rebasePendingWrite,
  shouldUsePendingBundle,
  type PendingDeleteMutation,
  type PendingMutation,
  type PendingWriteMutation,
} from "./paoMutationQueue";
import type { PaoField, PaoImportRecord, PaoItem, PaoSystem, PaoSystemBundle, PegProgress, SystemKind } from "./paoTypes";

const CACHE_PREFIX = "memoro-pao";
const PENDING_KEY = `${CACHE_PREFIX}:pending`;
const SYSTEMS_KEY = `${CACHE_PREFIX}:systems`;

type ImportFile = {
  name: string;
  size: number;
  bytes?: ArrayBuffer;
};

type CreateSystemInput = {
  name: string;
  kind: SystemKind;
  fields: PaoField[];
  keyFormat: PaoSystem["keyFormat"];
  expectedSize: number;
  items: PaoItem[];
  file?: ImportFile;
};

type PaoSystemRow = {
  id: string;
  name: string;
  kind: SystemKind;
  fields: PaoField[];
  key_format: PaoSystem["keyFormat"];
  expected_size: number;
  revision: number;
  created_at: string;
  updated_at: string;
};

const memoryValues = new Map<string, string>();
let paoNotificationScheduled = false;

function notifyPaoChanged() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  if (paoNotificationScheduled) return;
  paoNotificationScheduled = true;
  const dispatch = () => {
    paoNotificationScheduled = false;
    window.dispatchEvent(new Event("memoro-pao-updated"));
  };
  if (typeof queueMicrotask === "function") queueMicrotask(dispatch);
  else setTimeout(dispatch, 0);
}

function browserStorageAvailable() {
  return typeof localStorage !== "undefined";
}

function readValueSync(key: string) {
  if (browserStorageAvailable()) return localStorage.getItem(key);
  return memoryValues.get(key) ?? null;
}

async function readValue(key: string) {
  if (browserStorageAvailable()) return localStorage.getItem(key);
  const value = await AsyncStorage.getItem(key);
  if (value != null) memoryValues.set(key, value);
  return value;
}

async function writeValue(key: string, value: string | null) {
  if (browserStorageAvailable()) {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return;
  }
  if (value == null) {
    memoryValues.delete(key);
    await AsyncStorage.removeItem(key);
  } else {
    memoryValues.set(key, value);
    await AsyncStorage.setItem(key, value);
  }
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function systemsCacheKey(userId: string) {
  return `${SYSTEMS_KEY}:${userId}`;
}

function bundleCacheKey(userId: string, systemId: string) {
  return `${CACHE_PREFIX}:${userId}:${systemId}`;
}

function pendingCacheKey(userId: string) {
  return `${PENDING_KEY}:${userId}`;
}

function randomId(prefix: string) {
  const nativeUuid = globalThis.crypto?.randomUUID?.();
  return nativeUuid ? `${prefix}-${nativeUuid}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function stableItemId(systemId: string, key: string) {
  return `${systemId}:${encodeURIComponent(key)}`;
}

function normalizeSystem(row: PaoSystemRow): PaoSystem {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    fields: Array.isArray(row.fields) ? row.fields : [],
    keyFormat: row.key_format,
    expectedSize: row.expected_size,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeItem(row: any): PaoItem {
  return {
    id: row.id,
    systemId: row.system_id,
    key: row.item_key,
    displayLabel: row.display_label,
    cardAssetId: row.card_asset_id ?? undefined,
    values: row.values ?? {},
    starred: Boolean(row.starred),
    notes: row.notes ?? "",
    position: row.position ?? 0,
  };
}

function normalizeProgress(row: any): PegProgress {
  return {
    itemId: row.item_id,
    field: row.field,
    strength: row.strength,
    dueAt: row.due_at,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    streak: row.streak,
    avgMs: row.avg_ms,
    lastSeenAt: row.last_seen_at,
  };
}

function normalizeImport(row: any): PaoImportRecord {
  return {
    id: row.id,
    systemId: row.system_id,
    revision: row.revision,
    fileName: row.file_name,
    fileSize: row.file_size,
    storagePath: row.storage_path ?? undefined,
    itemCount: row.item_count,
    createdAt: row.created_at,
  };
}

function toRpcItems(systemId: string, items: PaoItem[]) {
  return items.map((item, position) => ({
    id: item.id && !item.id.startsWith("import:") ? item.id : stableItemId(systemId, item.key),
    item_key: item.key,
    display_label: item.displayLabel,
    card_asset_id: item.cardAssetId ?? null,
    values: item.values,
    starred: Boolean(item.starred),
    notes: item.notes ?? "",
    position: item.position ?? position,
  }));
}

async function currentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in to use Flashcards.");
  return user.id;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String((error as any).message);
  return "The PAO system could not be saved.";
}

function isOfflineError(error: unknown) {
  const message = errorMessage(error);
  const browserOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  return browserOffline || /failed to fetch|network request failed|load failed|networkerror/i.test(message);
}

async function cacheSystems(userId: string, systems: PaoSystem[]) {
  await writeValue(systemsCacheKey(userId), JSON.stringify(systems));
}

async function cacheBundle(userId: string, bundle: PaoSystemBundle) {
  await writeValue(bundleCacheKey(userId, bundle.system.id), JSON.stringify(bundle));
  const systems = await readCachedPaoSystems(userId);
  const next = [bundle.system, ...systems.filter((system) => system.id !== bundle.system.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  await cacheSystems(userId, next);
}

export function readCachedPaoSystemsSnapshot(userId: string) {
  return parseJson<PaoSystem[]>(readValueSync(systemsCacheKey(userId)), []);
}

export function readCachedPaoBundleSnapshot(userId: string, systemId: string) {
  return parseJson<PaoSystemBundle | null>(readValueSync(bundleCacheKey(userId, systemId)), null);
}

export async function readCachedPaoSystems(userId: string) {
  return parseJson<PaoSystem[]>(await readValue(systemsCacheKey(userId)), []);
}

export async function readCachedPaoBundle(userId: string, systemId: string) {
  return parseJson<PaoSystemBundle | null>(await readValue(bundleCacheKey(userId, systemId)), null);
}

export async function loadPaoSystems(userId: string): Promise<PaoSystem[]> {
  const cached = await readCachedPaoSystems(userId);
  const { data, error } = await supabase
    .from("pao_systems")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    if (cached.length && isOfflineError(error)) return cached;
    throw new Error(error.message);
  }
  const pendingMutations = await readPending(userId);
  const pending = newestPendingSystems(pendingMutations);
  const pendingIds = new Set(pending.map((system) => system.id));
  const deletedIds = new Set(pendingMutations.filter((entry) => entry.type === "delete").map(pendingSystemId));
  const remote = (data ?? []).map((row) => normalizeSystem(row as PaoSystemRow));
  const systems = [...pending, ...remote.filter((system) => !pendingIds.has(system.id) && !deletedIds.has(system.id))];
  await cacheSystems(userId, systems);
  return systems;
}

export async function loadPaoSystem(userId: string, systemId: string, options?: { forceRemote?: boolean }): Promise<PaoSystemBundle> {
  const cached = await readCachedPaoBundle(userId, systemId);
  if (shouldUsePendingBundle(cached, options?.forceRemote)) return cached!;
  const { data: systemRow, error: systemError } = await supabase.from("pao_systems").select("*").eq("id", systemId).eq("user_id", userId).maybeSingle();
  if (systemError || !systemRow) {
    if (cached && (isOfflineError(systemError) || cached.system.pendingUpload)) return cached;
    throw new Error(systemError?.message ?? "This memory system could not be found.");
  }
  const system = normalizeSystem(systemRow as PaoSystemRow);
  if (cached && cached.system.revision === system.revision && !cached.system.pendingUpload) return cached;

  const [itemsResult, progressResult, importsResult] = await Promise.all([
    supabase.from("pao_items").select("*").eq("system_id", systemId).order("position", { ascending: true }),
    supabase.from("pao_progress").select("*").eq("user_id", userId),
    supabase.from("pao_imports").select("*").eq("system_id", systemId).order("revision", { ascending: false }),
  ]);
  const firstError = itemsResult.error ?? progressResult.error ?? importsResult.error;
  if (firstError) {
    if (cached && isOfflineError(firstError)) return cached;
    throw new Error(firstError.message);
  }
  const items = (itemsResult.data ?? []).map(normalizeItem);
  const itemIds = new Set(items.map((item) => item.id));
  const bundle: PaoSystemBundle = {
    system,
    items,
    progress: (progressResult.data ?? []).map(normalizeProgress).filter((entry) => itemIds.has(entry.itemId)),
    imports: (importsResult.data ?? []).map(normalizeImport),
  };
  await cacheBundle(userId, bundle);
  return bundle;
}

async function readPending(userId: string) {
  return parseJson<PendingMutation[]>(await readValue(pendingCacheKey(userId)), []);
}

async function queuePending(mutation: PendingWriteMutation) {
  const pending = await readPending(mutation.userId);
  const next = enqueuePendingWrite(pending, mutation);
  await writeValue(pendingCacheKey(mutation.userId), JSON.stringify(next));
  await cacheBundle(mutation.userId, mutation.bundle);
  notifyPaoChanged();
}

async function queuePendingDelete(userId: string, systemId: string) {
  const pending = await readPending(userId);
  const deletion: PendingDeleteMutation = { id: `delete:${systemId}`, type: "delete", userId, systemId };
  const next = enqueuePendingDelete(pending, deletion);
  await writeValue(pendingCacheKey(userId), JSON.stringify(next));
}

async function callReplace(systemId: string, expectedRevision: number, items: PaoItem[], file?: Pick<ImportFile, "name" | "size">) {
  const { data, error } = await supabase.rpc("pao_replace_items", {
    p_system_id: systemId,
    p_items: toRpcItems(systemId, items),
    p_expected_revision: expectedRevision,
    p_file_name: file?.name ?? null,
    p_file_size: file?.size ?? 0,
  });
  if (error) throw error;
  return Number(data);
}

async function uploadOriginal(userId: string, systemId: string, revision: number, file?: ImportFile) {
  if (!file?.bytes) return;
  const extension = file.name.split(".").pop()?.toLowerCase() || "xlsx";
  const storagePath = `${userId}/${systemId}/${revision}.${extension}`;
  const { error } = await supabase.storage.from("pao-uploads").upload(storagePath, file.bytes, {
    upsert: true,
    contentType: extension === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  if (error) return;
  await supabase.from("pao_imports").update({ storage_path: storagePath }).eq("id", `${systemId}:${revision}`).eq("user_id", userId);
}

function withSystemItems(systemId: string, items: PaoItem[]) {
  return items.map((item, position) => ({
    ...item,
    id: item.id && !item.id.startsWith("import:") ? item.id : stableItemId(systemId, item.key),
    systemId,
    position: item.position ?? position,
  }));
}

export async function createPaoSystem(input: CreateSystemInput) {
  const userId = await currentUserId();
  const systemId = randomId("pao");
  const now = new Date().toISOString();
  const items = withSystemItems(systemId, input.items);
  const system: PaoSystem = {
    id: systemId,
    name: input.name.trim() || "My PAO",
    kind: input.kind,
    fields: input.fields,
    keyFormat: input.keyFormat,
    expectedSize: input.expectedSize,
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
  const pendingBundle: PaoSystemBundle = { system: { ...system, pendingUpload: true }, items, progress: [], imports: [] };

  try {
    const { error } = await supabase.from("pao_systems").insert({
      id: system.id,
      user_id: userId,
      name: system.name,
      kind: system.kind,
      fields: system.fields,
      key_format: system.keyFormat,
      expected_size: system.expectedSize,
      revision: 0,
    });
    if (error) throw error;
    const revision = await callReplace(system.id, 0, items, input.file);
    await uploadOriginal(userId, system.id, revision, input.file);
    const saved = await loadPaoSystem(userId, system.id, { forceRemote: true });
    notifyPaoChanged();
    return saved;
  } catch (error) {
    if (!isOfflineError(error)) throw new Error(errorMessage(error));
    await queuePending({
      id: `create:${system.id}`,
      type: "create",
      userId,
      bundle: pendingBundle,
      expectedRevision: 0,
      fileName: input.file?.name,
      fileSize: input.file?.size,
    });
    return pendingBundle;
  }
}

export async function replacePaoItems(bundle: PaoSystemBundle, items: PaoItem[], file?: ImportFile) {
  const userId = await currentUserId();
  const normalizedItems = withSystemItems(bundle.system.id, items);
  try {
    const revision = await callReplace(bundle.system.id, bundle.system.revision, normalizedItems, file);
    await uploadOriginal(userId, bundle.system.id, revision, file);
    const saved = await loadPaoSystem(userId, bundle.system.id, { forceRemote: true });
    notifyPaoChanged();
    return saved;
  } catch (error) {
    if (!isOfflineError(error)) throw new Error(errorMessage(error));
    const pendingBundle: PaoSystemBundle = {
      ...bundle,
      system: { ...bundle.system, pendingUpload: true, updatedAt: new Date().toISOString() },
      items: normalizedItems,
    };
    await queuePending({
      id: `replace:${bundle.system.id}`,
      type: "replace",
      userId,
      bundle: pendingBundle,
      expectedRevision: bundle.system.revision,
      fileName: file?.name,
      fileSize: file?.size,
    });
    return pendingBundle;
  }
}

export async function updatePaoItem(bundle: PaoSystemBundle, item: PaoItem) {
  const userId = await currentUserId();
  const { error } = await supabase.rpc("pao_update_item", {
    p_system_id: bundle.system.id,
    p_item_key: item.key,
    p_values: item.values,
    p_starred: Boolean(item.starred),
    p_notes: item.notes ?? "",
    p_expected_revision: bundle.system.revision,
  });
  if (error) throw new Error(error.message);
  const saved = await loadPaoSystem(userId, bundle.system.id, { forceRemote: true });
  notifyPaoChanged();
  return saved;
}

export async function savePaoProgress(entries: PegProgress[]) {
  if (!entries.length) return;
  const userId = await currentUserId();
  const rows = entries.map((entry) => ({
    user_id: userId,
    item_id: entry.itemId,
    field: entry.field,
    strength: entry.strength,
    due_at: entry.dueAt,
    correct_count: entry.correctCount,
    wrong_count: entry.wrongCount,
    streak: entry.streak,
    avg_ms: entry.avgMs,
    last_seen_at: entry.lastSeenAt,
  }));
  const { error } = await supabase.from("pao_progress").upsert(rows, { onConflict: "user_id,item_id,field" });
  if (error) throw new Error(error.message);
  notifyPaoChanged();
}

export async function deletePaoSystem(userId: string, systemId: string) {
  const { error } = await supabase.from("pao_systems").delete().eq("id", systemId).eq("user_id", userId);
  if (error && !isOfflineError(error)) throw new Error(error.message);
  if (error) {
    await queuePendingDelete(userId, systemId);
  } else {
    const pending = await readPending(userId);
    const next = pending.filter((entry) => pendingSystemId(entry) !== systemId);
    await writeValue(pendingCacheKey(userId), next.length ? JSON.stringify(next) : null);
  }
  await writeValue(bundleCacheKey(userId, systemId), null);
  await cacheSystems(userId, (await readCachedPaoSystems(userId)).filter((system) => system.id !== systemId));
  notifyPaoChanged();
}

export async function flushPendingPaoMutations(userId: string) {
  const pending = await readPending(userId);
  if (!pending.length) return;
  const remaining: PendingMutation[] = [];
  const ordered = [...pending].reverse();
  const syncedRevisions = new Map<string, number>();
  let changed = false;
  for (let index = 0; index < ordered.length; index += 1) {
    const mutation = ordered[index];
    try {
      const systemId = pendingSystemId(mutation);
      if (mutation.type === "delete") {
        const { error } = await supabase.from("pao_systems").delete().eq("id", systemId).eq("user_id", userId);
        if (error) throw error;
        await writeValue(bundleCacheKey(userId, systemId), null);
        await cacheSystems(userId, (await readCachedPaoSystems(userId)).filter((system) => system.id !== systemId));
        changed = true;
        continue;
      }
      if (mutation.type === "create") {
        const system = mutation.bundle.system;
        const { error } = await supabase.from("pao_systems").upsert({
          id: system.id,
          user_id: userId,
          name: system.name,
          kind: system.kind,
          fields: system.fields,
          key_format: system.keyFormat,
          expected_size: system.expectedSize,
          revision: 0,
        }, { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
      }
      const expectedRevision = expectedRevisionForMutation(mutation, syncedRevisions);
      const revision = await callReplace(systemId, expectedRevision, mutation.bundle.items, mutation.fileName ? { name: mutation.fileName, size: mutation.fileSize ?? 0 } : undefined);
      syncedRevisions.set(systemId, revision);
      await loadPaoSystem(userId, systemId, { forceRemote: true });
      changed = true;
    } catch (error) {
      if (/revision_conflict/i.test(errorMessage(error))) {
        try {
          const systemId = pendingSystemId(mutation);
          const { data: remote, error: remoteError } = await supabase
            .from("pao_systems")
            .select("revision")
            .eq("id", systemId)
            .eq("user_id", userId)
            .maybeSingle();
          if (remoteError) throw remoteError;
          if (remote && mutation.type !== "delete") {
            const revision = Number(remote.revision);
            const rebased = rebasePendingWrite(mutation, revision);
            remaining.push(rebased);
            await cacheBundle(userId, rebased.bundle);
            continue;
          }
        } catch {
          // Keep the queued mutation below.
        }
      }
      remaining.push(mutation);
      if (isOfflineError(error)) {
        remaining.push(...ordered.slice(index + 1));
        break;
      }
    }
  }
  await writeValue(pendingCacheKey(userId), remaining.length ? JSON.stringify([...remaining].reverse()) : null);
  if (changed) notifyPaoChanged();
}

export async function clearPaoCache(userId?: string) {
  const systemIds = userId ? (await readCachedPaoSystems(userId)).map((system) => system.id) : [];
  if (userId) {
    await Promise.all([
      writeValue(systemsCacheKey(userId), null),
      writeValue(pendingCacheKey(userId), null),
      ...systemIds.map((systemId) => writeValue(bundleCacheKey(userId, systemId), null)),
    ]);
  }
  if (Platform.OS !== "web" && !userId) {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(CACHE_PREFIX)));
  }
  notifyPaoChanged();
}

export function calculatePaoStats(bundle: PaoSystemBundle) {
  const progressByItem = new Map<string, PegProgress[]>();
  bundle.progress.forEach((entry) => progressByItem.set(entry.itemId, [...(progressByItem.get(entry.itemId) ?? []), entry]));
  const strengths = bundle.items.flatMap((item) => {
    const rows = progressByItem.get(item.id) ?? [];
    return bundle.system.fields.map((field) => Math.max(0, Math.min(3, rows.find((entry) => entry.field === field.id)?.strength ?? 0)));
  });
  const now = Date.now();
  return {
    coverage: bundle.items.filter((item) => bundle.system.fields.some((field) => Boolean(item.values[field.id]?.trim()))).length,
    mastery: strengths.length ? Math.round((strengths.reduce((sum, value) => sum + value, 0) / (strengths.length * 3)) * 100) : 0,
    due: bundle.progress.filter((entry) => Date.parse(entry.dueAt) <= now).length,
    trouble: new Set(bundle.progress.filter((entry) => entry.streak <= -3).map((entry) => entry.itemId)).size,
  };
}

export type PaoOverview = {
  systemCount: number;
  pegCount: number;
  coverage: number;
  mastery: number;
  due: number;
  trouble: number;
};

export async function loadPaoOverview(userId: string): Promise<PaoOverview> {
  const systems = await loadPaoSystems(userId);
  const bundles = (await Promise.all(systems.map((system) => loadPaoSystem(userId, system.id).catch(() => null)))).filter(Boolean) as PaoSystemBundle[];
  const stats = bundles.map((bundle) => ({ bundle, stats: calculatePaoStats(bundle) }));
  const totalExpected = stats.reduce((sum, entry) => sum + Math.max(0, entry.bundle.system.expectedSize), 0);
  return {
    systemCount: systems.length,
    pegCount: stats.reduce((sum, entry) => sum + entry.bundle.items.length, 0),
    coverage: stats.reduce((sum, entry) => sum + entry.stats.coverage, 0),
    mastery: totalExpected
      ? Math.round(stats.reduce((sum, entry) => sum + entry.stats.mastery * entry.bundle.system.expectedSize, 0) / totalExpected)
      : 0,
    due: stats.reduce((sum, entry) => sum + entry.stats.due, 0),
    trouble: stats.reduce((sum, entry) => sum + entry.stats.trouble, 0),
  };
}

export function diffPaoItems(previous: PaoItem[], next: PaoItem[]) {
  const previousByKey = new Map(previous.map((item) => [item.key, item]));
  const nextByKey = new Map(next.map((item) => [item.key, item]));
  let changed = 0;
  nextByKey.forEach((item, key) => {
    const prior = previousByKey.get(key);
    if (prior && JSON.stringify(prior.values) !== JSON.stringify(item.values)) changed += 1;
  });
  const added = [...nextByKey.keys()].filter((key) => !previousByKey.has(key)).length;
  const removed = [...previousByKey.keys()].filter((key) => !nextByKey.has(key)).length;
  return { changed, added, removed, kept: Math.max(0, next.length - changed - added) };
}

export async function downloadPaoImport(record: PaoImportRecord) {
  if (!record.storagePath) throw new Error("The original file is not available for this revision.");
  const { data, error } = await supabase.storage.from("pao-uploads").download(record.storagePath);
  if (error || !data) throw new Error(error?.message ?? "The original file could not be downloaded.");
  return { name: record.fileName, size: record.fileSize, bytes: await data.arrayBuffer() };
}
