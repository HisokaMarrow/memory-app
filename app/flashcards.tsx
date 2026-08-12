import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { User } from "@supabase/supabase-js";

import DashboardShell from "../components/dashboard/DashboardShell";
import FlashcardsImportPanel from "../components/flashcards/FlashcardsImportPanel";
import { calculatePaoStats, flushPendingPaoMutations, loadPaoSystem, loadPaoSystems, readCachedPaoSystemsSnapshot } from "../components/flashcards/paoStore";
import type { PaoSystem, PaoSystemBundle } from "../components/flashcards/paoTypes";
import { FLASHCARD_ACCENT, flashcards as s } from "../styles/screens/flashcards.styles";

export default function FlashcardsScreen() {
  return (
    <DashboardShell
      active="flashcards"
      lightHeader
      title="Flashcards"
      subtitle="Build, sync and master your personal memory systems."
    >
      {({ user, isMobile }) => <FlashcardsLibrary user={user} isMobile={isMobile} />}
    </DashboardShell>
  );
}

function FlashcardsLibrary({ user, isMobile }: { user: User | null; isMobile: boolean }) {
  const params = useLocalSearchParams<{ import?: string; systemId?: string }>();
  const [systems, setSystems] = useState<PaoSystem[]>(() => user ? readCachedPaoSystemsSnapshot(user.id) : []);
  const [bundles, setBundles] = useState<Record<string, PaoSystemBundle>>({});
  const [importOpen, setImportOpen] = useState(params.import === "1");
  const [loading, setLoading] = useState(Boolean(user && systems.length === 0));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const nextSystems = await loadPaoSystems(user.id);
      setSystems(nextSystems);
      setError("");
      const loaded = await Promise.all(nextSystems.map((system) => loadPaoSystem(user.id, system.id).catch(() => null)));
      setBundles(Object.fromEntries(loaded.filter(Boolean).map((bundle) => [bundle!.system.id, bundle!] as const)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Your memory systems could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void flushPendingPaoMutations(user.id).finally(() => { if (alive) void refresh(); });
    if (typeof window === "undefined") return () => { alive = false; };
    const handleUpdate = () => { if (alive) void refresh(); };
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("online", handleUpdate);
    window.addEventListener("memoro-pao-updated", handleUpdate);
    return () => {
      alive = false;
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("online", handleUpdate);
      window.removeEventListener("memoro-pao-updated", handleUpdate);
    };
  }, [refresh, user]);

  useEffect(() => {
    if (params.import === "1") setImportOpen(true);
  }, [params.import]);

  const totalPegs = useMemo(() => Object.values(bundles).reduce((sum, bundle) => sum + bundle.items.length, 0), [bundles]);

  return (
    <View style={[s.page, isMobile && s.pageMobile]}>
      <View style={s.toolbar}>
        <View>
          <Text style={s.panelKicker}>Your library</Text>
          <Text style={s.sectionText}>{systems.length} system{systems.length === 1 ? "" : "s"} · {totalPegs} pegs available on every signed-in device</Text>
        </View>
        <TouchableOpacity style={s.primaryButton} onPress={() => setImportOpen(true)}>
          <Feather name="plus" size={15} color="#FFFFFF" />
          <Text style={s.primaryButtonText}>Import or create</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={s.errorBanner}><Feather name="alert-circle" size={17} color="#B34036" /><Text style={s.errorText}>{error}</Text></View> : null}

      {importOpen ? (
        <FlashcardsImportPanel
          userId={user?.id ?? "preview"}
          systems={systems}
          preferredSystemId={params.systemId}
          isMobile={isMobile}
          onClose={() => setImportOpen(false)}
          onImported={(bundle) => {
            setBundles((current) => ({ ...current, [bundle.system.id]: bundle }));
            setSystems((current) => [bundle.system, ...current.filter((system) => system.id !== bundle.system.id)]);
            router.push(`/flashcards/${bundle.system.id}` as any);
          }}
        />
      ) : null}

      {loading ? (
        <View style={s.emptyCard}><ActivityIndicator color={FLASHCARD_ACCENT} /><Text style={[s.emptyText, { marginBottom: 0 }]}>Loading your memory systems…</Text></View>
      ) : systems.length ? (
        <View style={s.libraryGrid}>
          {systems.map((system) => {
            const bundle = bundles[system.id];
            const stats = bundle ? calculatePaoStats(bundle) : { coverage: 0, mastery: 0, due: 0, trouble: 0 };
            return (
              <TouchableOpacity key={system.id} style={[s.systemCard, isMobile && s.systemCardMobile]} onPress={() => router.push(`/flashcards/${system.id}` as any)}>
                <View style={s.systemTop}>
                  <View style={s.systemIcon}><Feather name={system.kind === "cards" ? "credit-card" : system.kind === "names" ? "users" : "hash"} size={21} color={FLASHCARD_ACCENT} /></View>
                  <View style={s.kindPill}><Text style={s.kindText}>{system.kind}</Text></View>
                </View>
                <View>
                  <Text style={s.systemTitle}>{system.name}</Text>
                  <Text style={s.systemMeta}>{system.fields.map((field) => field.label).join(" · ")} · revision {system.revision}</Text>
                </View>
                {system.pendingUpload ? <View style={s.pendingBadge}><Feather name="cloud-off" size={12} color="#826414" /><Text style={s.pendingText}>Not yet synced</Text></View> : null}
                <View style={s.cardStats}>
                  <View style={s.miniStat}><Text style={s.miniStatValue}>{stats.coverage}/{system.expectedSize}</Text><Text style={s.miniStatLabel}>Coverage</Text></View>
                  <View style={s.miniStat}><Text style={s.miniStatValue}>{stats.mastery}%</Text><Text style={s.miniStatLabel}>Mastery</Text></View>
                  <View style={s.miniStat}><Text style={s.miniStatValue}>{stats.due}</Text><Text style={s.miniStatLabel}>Due</Text></View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : !importOpen ? (
        <View style={[s.emptyCard, isMobile && s.emptyCardMobile]}>
          <View style={s.emptyIcon}><Feather name="layers" size={30} color={FLASHCARD_ACCENT} /></View>
          <Text style={s.emptyTitle}>No systems yet — import your PAO</Text>
          <Text style={s.emptyText}>Upload the spreadsheet you already maintain, paste a table, or start with a blank 00–99 grid and fill it in here.</Text>
          <TouchableOpacity style={s.primaryButton} onPress={() => setImportOpen(true)}><Feather name="upload" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Create your first system</Text></TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
