import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { User } from "@supabase/supabase-js";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import { PLAYING_CARDS } from "../../../components/games/cards/cardAssets";
import { detectImport } from "../../../components/flashcards/paoImport";
import { calculatePaoStats, deletePaoSystem, downloadPaoImport, loadPaoSystem, readCachedPaoBundleSnapshot, replacePaoItems, updatePaoItem } from "../../../components/flashcards/paoStore";
import type { PaoItem, PaoSystemBundle, PegProgress } from "../../../components/flashcards/paoTypes";
import { exportPaoWorkbook, readWorkbookGrid } from "../../../components/flashcards/paoWorkbook";
import { FLASHCARD_ACCENT, flashcards as s } from "../../../styles/screens/flashcards.styles";

export default function FlashcardSystemScreen() {
  const { systemId } = useLocalSearchParams<{ systemId: string }>();
  return (
    <DashboardShell
      active="flashcards"
      lightHeader
      title="Memory system"
      subtitle="See the whole system at a glance, then focus on the pegs that need work."
    >
      {({ user, isMobile }) => <SystemDetail user={user} systemId={systemId} isMobile={isMobile} />}
    </DashboardShell>
  );
}

function SystemDetail({ user, systemId, isMobile }: { user: User | null; systemId: string; isMobile: boolean }) {
  const [bundle, setBundle] = useState<PaoSystemBundle | null>(() => user ? readCachedPaoBundleSnapshot(user.id, systemId) : null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftItems, setDraftItems] = useState<Record<string, PaoItem>>({});
  const [savingKey, setSavingKey] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [heatmapWidth, setHeatmapWidth] = useState(0);
  const bundleRef = useRef<PaoSystemBundle | null>(bundle);
  const draftItemsRef = useRef<Record<string, PaoItem>>({});
  const dirtyKeysRef = useRef(new Set<string>());
  const draftVersionsRef = useRef(new Map<string, number>());
  const saveQueueRef = useRef(new Map<string, { item: PaoItem; version: number }>());
  const saveLoopRunningRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user || !systemId) return;
    try {
      const next = await loadPaoSystem(user.id, systemId);
      bundleRef.current = next;
      setBundle(next);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "This memory system could not be loaded.");
    }
  }, [systemId, user]);

  useEffect(() => {
    void refresh();
    if (typeof window === "undefined") return;
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!bundle) return;
    bundleRef.current = bundle;
    setDraftItems((current) => {
      const next = Object.fromEntries(bundle.items.map((item) => [
        item.key,
        dirtyKeysRef.current.has(item.key) ? current[item.key] ?? item : item,
      ]));
      draftItemsRef.current = next;
      return next;
    });
    setSelectedKey((current) => current ?? bundle.items[0]?.key ?? null);
  }, [bundle]);

  const stats = useMemo(() => bundle ? calculatePaoStats(bundle) : null, [bundle]);
  const selected = bundle?.items.find((item) => item.key === selectedKey) ?? null;
  const heatmapGap = 5;
  const heatmapColumns = bundle ? Math.max(1, Math.min(bundle.items.length, heatmapWidth ? Math.floor((heatmapWidth + heatmapGap) / 51) : 10)) : 1;
  const heatCellSize = heatmapWidth ? (heatmapWidth - heatmapGap * (heatmapColumns - 1)) / heatmapColumns : 46;

  function stageDraft(item: PaoItem) {
    const version = (draftVersionsRef.current.get(item.key) ?? 0) + 1;
    draftVersionsRef.current.set(item.key, version);
    dirtyKeysRef.current.add(item.key);
    draftItemsRef.current = { ...draftItemsRef.current, [item.key]: item };
    setDraftItems(draftItemsRef.current);
    return version;
  }

  function saveItem(item: PaoItem) {
    if (!bundleRef.current) return;
    const version = stageDraft(item);
    saveQueueRef.current.set(item.key, { item, version });
    void drainItemSaves();
  }

  async function drainItemSaves() {
    if (saveLoopRunningRef.current) return;
    saveLoopRunningRef.current = true;
    let failed = false;
    try {
      while (saveQueueRef.current.size) {
        const [key, queued] = saveQueueRef.current.entries().next().value as [string, { item: PaoItem; version: number }];
        saveQueueRef.current.delete(key);
        const currentBundle = bundleRef.current;
        if (!currentBundle) break;
        setSavingKey(key);
        setError("");
        try {
          const next = await updatePaoItem(currentBundle, queued.item);
          bundleRef.current = next;
          if (!saveQueueRef.current.has(key) && draftVersionsRef.current.get(key) === queued.version) dirtyKeysRef.current.delete(key);
          setBundle(next);
        } catch (nextError) {
          failed = true;
          setError(nextError instanceof Error ? `${nextError.message} Your unsaved draft has been kept.` : "The peg could not be saved. Your draft has been kept.");
          await refresh();
          break;
        }
      }
    } finally {
      saveLoopRunningRef.current = false;
      setSavingKey("");
      if (!failed && saveQueueRef.current.size) void drainItemSaves();
    }
  }

  async function restoreImport(importId: string) {
    if (!bundle) return;
    const record = bundle.imports.find((entry) => entry.id === importId);
    if (!record) return;
    setBusyAction(importId);
    setError("");
    try {
      const source = await downloadPaoImport(record);
      const detection = detectImport(await readWorkbookGrid(source));
      const next = await replacePaoItems(bundle, detection.items, { ...source, name: `Rollback - ${source.name}` });
      setBundle(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "That revision could not be restored.");
    } finally {
      setBusyAction("");
    }
  }

  if (!bundle && !error) {
    return <View style={[s.page, isMobile && s.pageMobile]}><View style={s.emptyCard}><ActivityIndicator color={FLASHCARD_ACCENT} /><Text style={[s.emptyText, { marginBottom: 0 }]}>Opening memory system…</Text></View></View>;
  }

  if (!bundle) {
    return (
      <View style={[s.page, isMobile && s.pageMobile]}>
        <View style={s.errorBanner}><Feather name="alert-circle" size={17} color="#B34036" /><Text style={s.errorText}>{error}</Text></View>
        <TouchableOpacity style={s.secondaryButton} onPress={() => router.replace("/flashcards" as any)}><Feather name="arrow-left" size={14} color="#526672" /><Text style={s.secondaryButtonText}>Back to Flashcards</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.page, isMobile && s.pageMobile]}>
      <View style={s.toolbar}>
        <View style={s.toolbarGroup}>
          <TouchableOpacity style={s.secondaryButton} onPress={() => router.push("/flashcards" as any)}><Feather name="arrow-left" size={14} color="#526672" /><Text style={s.secondaryButtonText}>Library</Text></TouchableOpacity>
          <View>
            <Text style={s.panelKicker}>{bundle.system.kind} · revision {bundle.system.revision}</Text>
            <Text style={s.panelTitle}>{bundle.system.name}</Text>
          </View>
        </View>
        <View style={s.toolbarGroup}>
          <TouchableOpacity style={s.primaryButton} onPress={() => router.push(`/flashcards/${systemId}/train` as any)}><Feather name="play" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Train</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={() => setEditMode((value) => !value)}><Feather name="edit-3" size={14} color="#526672" /><Text style={s.secondaryButtonText}>{editMode ? "Done editing" : "Edit table"}</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={() => router.push(`/flashcards?import=1&systemId=${systemId}` as any)}><Feather name="refresh-cw" size={14} color="#526672" /><Text style={s.secondaryButtonText}>Re-import</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={() => { setBusyAction("export"); void exportPaoWorkbook(bundle).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Export failed.")).finally(() => setBusyAction("")); }}>
            {busyAction === "export" ? <ActivityIndicator size="small" color={FLASHCARD_ACCENT} /> : <Feather name="download" size={14} color="#526672" />}<Text style={s.secondaryButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <View style={s.errorBanner}><Feather name="alert-circle" size={17} color="#B34036" /><Text style={s.errorText}>{error}</Text></View> : null}
      {bundle.system.pendingUpload ? <View style={s.successBanner}><Feather name="cloud-off" size={16} color="#826414" /><Text style={[s.successText, { color: "#826414" }]}>This version is saved on this device and will sync automatically when the connection returns.</Text></View> : null}

      <View style={s.statsGrid}>
        <Stat value={`${stats?.coverage ?? 0}/${bundle.system.expectedSize}`} label="Coverage" />
        <Stat value={`${stats?.mastery ?? 0}%`} label="Mastery" />
        <Stat value={String(stats?.due ?? 0)} label="Fields due now" />
        <Stat value={String(stats?.trouble ?? 0)} label="Trouble pegs" />
      </View>

      <View style={[s.contentCard, isMobile && s.contentCardMobile]}>
        <View style={s.sectionHeader}>
          <View><Text style={s.sectionTitle}>System heatmap</Text><Text style={s.sectionText}>Grey is unsorted; red needs work; green is strong. Tap any peg for its details.</Text></View>
          <Text style={s.kindText}>{bundle.items.length} pegs</Text>
        </View>
        <View style={s.heatmapFrame} onLayout={(event) => setHeatmapWidth(Math.round(event.nativeEvent.layout.width))}>
          <View style={s.heatmap}>
            {bundle.items.map((item) => {
              const strength = itemStrength(item, bundle.progress, bundle.system.fields.map((field) => field.id));
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.heatCell, { width: heatCellSize, height: heatCellSize, backgroundColor: heatColor(strength), borderColor: selectedKey === item.key ? "#22224B" : "rgba(255,255,255,0.6)" }]}
                  onPress={() => setSelectedKey(item.key)}
                >
                  <Text style={s.heatCellText}>{item.displayLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selected ? (
          <View style={s.pegSheet}>
            <View style={s.pegSheetTop}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {selected.cardAssetId ? <CardThumb assetId={selected.cardAssetId} /> : null}
                <View><Text style={s.pegKey}>{selected.displayLabel}</Text><Text style={s.sectionText}>Seen {seenCount(selected, bundle.progress)} times · average {averageMs(selected, bundle.progress)} ms</Text></View>
              </View>
              <View style={s.toolbarGroup}>
                <TouchableOpacity style={s.secondaryButton} onPress={() => { const current = draftItemsRef.current[selected.key] ?? selected; saveItem({ ...current, starred: !current.starred }); }}><Feather name="star" size={14} color={selected.starred ? "#D39A16" : "#526672"} /><Text style={s.secondaryButtonText}>{selected.starred ? "Starred" : "Star"}</Text></TouchableOpacity>
                <TouchableOpacity style={s.primaryButton} onPress={() => router.push(`/flashcards/${systemId}/train?itemKey=${encodeURIComponent(selected.key)}` as any)}><Feather name="target" size={14} color="#FFFFFF" /><Text style={s.primaryButtonText}>Drill this peg</Text></TouchableOpacity>
              </View>
            </View>
            <View style={s.pegValues}>
              {bundle.system.fields.map((field) => <View key={field.id} style={s.pegValue}><Text style={s.pegValueLabel}>{field.label}</Text><Text style={s.pegValueText}>{selected.values[field.id] || "Not set"}</Text></View>)}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[s.contentCard, isMobile && s.contentCardMobile]}>
        <View style={s.sectionHeader}>
          <View><Text style={s.sectionTitle}>Peg list</Text><Text style={s.sectionText}>{editMode ? "Changes save to Supabase when you leave a field." : "Turn on Edit table to update values in place."}</Text></View>
        </View>
        {bundle.items.map((item) => {
          const draft = draftItems[item.key] ?? item;
          return (
            <View key={item.id} style={s.editableRow}>
              <View style={s.editableTop}>
                <TouchableOpacity onPress={() => setSelectedKey(item.key)}><Text style={s.editableKey}>{item.displayLabel}</Text></TouchableOpacity>
                <View style={s.editableFields}>
                  {bundle.system.fields.map((field) => editMode ? (
                    <TextInput
                      key={field.id}
                      style={s.editableInput}
                      value={draft.values[field.id] ?? ""}
                      placeholder={field.label}
                      onChangeText={(value) => {
                        const current = draftItemsRef.current[item.key] ?? item;
                        stageDraft({ ...current, values: { ...current.values, [field.id]: value } });
                      }}
                      onBlur={() => {
                        const latest = draftItemsRef.current[item.key];
                        if (latest && JSON.stringify(latest.values) !== JSON.stringify(item.values)) void saveItem(latest);
                      }}
                    />
                  ) : <View key={field.id} style={s.pegValue}><Text style={s.pegValueLabel}>{field.label}</Text><Text style={s.pegValueText}>{item.values[field.id] || "—"}</Text></View>)}
                </View>
                {savingKey === item.key ? <ActivityIndicator color={FLASHCARD_ACCENT} size="small" /> : (
                  <TouchableOpacity onPress={() => { const current = draftItemsRef.current[item.key] ?? item; saveItem({ ...current, starred: !current.starred }); }}><Feather name="star" size={17} color={item.starred ? "#D39A16" : "#A2ABB1"} /></TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {bundle.imports.length ? (
        <View style={[s.contentCard, isMobile && s.contentCardMobile]}>
          <View><Text style={s.sectionTitle}>Upload history</Text><Text style={s.sectionText}>The exact source file is private to your account and can restore a previous revision.</Text></View>
          {bundle.imports.map((record) => (
            <View key={record.id} style={s.historyRow}>
              <View style={{ flex: 1 }}><Text style={s.historyName}>{record.fileName}</Text><Text style={s.historyMeta}>{new Date(record.createdAt).toLocaleDateString()} · revision {record.revision} · {record.itemCount} pegs</Text></View>
              <TouchableOpacity disabled={!record.storagePath || busyAction === record.id} style={[s.secondaryButton, (!record.storagePath || busyAction === record.id) && s.disabled]} onPress={() => void restoreImport(record.id)}>
                {busyAction === record.id ? <ActivityIndicator size="small" color={FLASHCARD_ACCENT} /> : <Feather name="rotate-ccw" size={14} color="#526672" />}<Text style={s.secondaryButtonText}>Restore</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[s.contentCard, isMobile && s.contentCardMobile]}>
        <View><Text style={s.sectionTitle}>Danger zone</Text><Text style={s.sectionText}>Deleting removes this system, its source history and all mastery data from every device.</Text></View>
        {deleteConfirm ? (
          <View style={s.toolbarGroup}>
            <TouchableOpacity style={[s.secondaryButton, s.dangerButton]} onPress={async () => { if (!user) return; setBusyAction("delete"); try { await deletePaoSystem(user.id, systemId); router.replace("/flashcards" as any); } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Delete failed."); setBusyAction(""); } }}>
              {busyAction === "delete" ? <ActivityIndicator size="small" color="#B7352C" /> : <Feather name="trash-2" size={14} color="#B7352C" />}<Text style={[s.secondaryButtonText, s.dangerButtonText]}>Yes, delete permanently</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryButton} onPress={() => setDeleteConfirm(false)}><Text style={s.secondaryButtonText}>Cancel</Text></TouchableOpacity>
          </View>
        ) : <TouchableOpacity style={[s.secondaryButton, s.dangerButton, { alignSelf: "flex-start" }]} onPress={() => setDeleteConfirm(true)}><Feather name="trash-2" size={14} color="#B7352C" /><Text style={[s.secondaryButtonText, s.dangerButtonText]}>Delete system</Text></TouchableOpacity>}
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={s.statCard}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

function itemStrength(item: PaoItem, progress: PegProgress[], fields: string[]) {
  const values = fields.map((field) => progress.find((entry) => entry.itemId === item.id && entry.field === field)?.strength);
  if (!values.length || values.some((value) => value === undefined)) return null;
  return Math.max(0, Math.min(3, Math.min(...values.map((value) => value ?? 0))));
}

function heatColor(strength: number | null) {
  if (strength === null) return "#87949D";
  return ["#C9544B", "#D79543", "#91A656", "#237A55"][Math.max(0, Math.min(3, Math.round(strength)))];
}

function seenCount(item: PaoItem, progress: PegProgress[]) {
  return progress.filter((entry) => entry.itemId === item.id).reduce((sum, entry) => sum + entry.correctCount + entry.wrongCount, 0);
}

function averageMs(item: PaoItem, progress: PegProgress[]) {
  const rows = progress.filter((entry) => entry.itemId === item.id && entry.avgMs > 0);
  return rows.length ? Math.round(rows.reduce((sum, entry) => sum + entry.avgMs, 0) / rows.length) : 0;
}

function CardThumb({ assetId }: { assetId: string }) {
  const card = PLAYING_CARDS.find((entry) => entry.id === assetId);
  return card ? <Image source={card.image} resizeMode="contain" style={{ width: 48, height: 68 }} /> : null;
}
