import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { FLASHCARD_ACCENT, flashcards as s } from "../../styles/screens/flashcards.styles";
import { applyMapping, detectImport, issueLabel, parseTsv, type ColumnRole, type ImportDetection, type RawGrid } from "./paoImport";
import { createPaoSystem, diffPaoItems, loadPaoSystem, replacePaoItems } from "./paoStore";
import { DEFAULT_PAO_FIELDS, type PaoItem, type PaoSystem, type PaoSystemBundle } from "./paoTypes";
import { readWorkbookGrid, type WorkbookSource } from "./paoWorkbook";

type FlashcardsImportPanelProps = {
  userId: string;
  systems: PaoSystem[];
  preferredSystemId?: string;
  isMobile: boolean;
  onClose: () => void;
  onImported: (bundle: PaoSystemBundle) => void;
};

const ROLE_ORDER: ColumnRole[] = ["key", "person", "action", "object", "ignore"];

function issueId(issue: ImportDetection["issues"][number], index: number) {
  return `${issue.type}:${"key" in issue ? issue.key : "row" in issue ? issue.row : "keys"}:${index}`;
}

function blankItems() {
  return Array.from({ length: 100 }, (_, index): PaoItem => {
    const key = String(index).padStart(2, "0");
    return {
      id: `import:${key}`,
      systemId: "",
      key,
      displayLabel: key,
      values: { person: "", action: "", object: "" },
      starred: false,
      notes: "",
      position: index,
    };
  });
}

export default function FlashcardsImportPanel({
  userId,
  systems,
  preferredSystemId,
  isMobile,
  onClose,
  onImported,
}: FlashcardsImportPanelProps) {
  const [grid, setGrid] = useState<RawGrid | null>(null);
  const [detection, setDetection] = useState<ImportDetection | null>(null);
  const [source, setSource] = useState<WorkbookSource | undefined>();
  const [pasteText, setPasteText] = useState("");
  const [systemName, setSystemName] = useState("My PAO");
  const [targetSystemId, setTargetSystemId] = useState<string>(preferredSystemId ?? "new");
  const [hiddenIssues, setHiddenIssues] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState("");

  const compatibleSystems = useMemo(
    () => detection ? systems.filter((system) => system.kind === detection.detectedKind) : [],
    [detection, systems],
  );

  function applyGrid(nextGrid: RawGrid, nextSource?: WorkbookSource) {
    if (!nextGrid.length) throw new Error("No table rows were found.");
    const nextDetection = detectImport(nextGrid);
    if (!nextDetection.items.length) throw new Error("No flashcard rows could be detected. Check that column A contains keys.");
    const nextCompatibleSystems = systems.filter((system) => system.kind === nextDetection.detectedKind);
    const preferred = preferredSystemId && nextCompatibleSystems.some((system) => system.id === preferredSystemId)
      ? preferredSystemId
      : nextCompatibleSystems[0]?.id;
    setGrid(nextGrid);
    setDetection(nextDetection);
    setSource(nextSource);
    setTargetSystemId(preferred ?? "new");
    if (preferred) setSystemName(systems.find((system) => system.id === preferred)?.name ?? "My PAO");
    setHiddenIssues(new Set());
    setError("");
  }

  async function openFilePicker() {
    setLoadingFile(true);
    setError("");
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "text/comma-separated-values",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0] as any;
      if ((asset.size ?? 0) > 5 * 1024 * 1024) throw new Error("Please choose a file smaller than 5 MB.");
      const bytes = asset.file?.arrayBuffer ? await asset.file.arrayBuffer() : await (await fetch(asset.uri)).arrayBuffer();
      const nextSource = { name: asset.name ?? "PAO.xlsx", size: asset.size ?? bytes.byteLength, bytes };
      applyGrid(await readWorkbookGrid(nextSource), nextSource);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The file could not be read.");
    } finally {
      setLoadingFile(false);
    }
  }

  async function handleDroppedFile(event: any) {
    event.preventDefault?.();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setLoadingFile(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Please choose a file smaller than 5 MB.");
      const nextSource = { name: file.name, size: file.size, bytes: await file.arrayBuffer() };
      applyGrid(await readWorkbookGrid(nextSource), nextSource);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The file could not be read.");
    } finally {
      setLoadingFile(false);
    }
  }

  function cycleRole(index: number) {
    if (!detection || !grid) return;
    const current = detection.columns[index]?.role ?? "ignore";
    const available = ROLE_ORDER.includes(current) ? ROLE_ORDER : [current, ...ROLE_ORDER];
    const nextRole = available[(available.indexOf(current) + 1) % available.length];
    const mapping = detection.columns.map((column) => column.role);
    mapping[index] = nextRole;
    setDetection(applyMapping(grid, mapping, detection.firstDataRowIndex));
    setHiddenIssues(new Set());
  }

  async function startBlank() {
    setSaving(true);
    setError("");
    try {
      const bundle = await createPaoSystem({
        name: systemName,
        kind: "numbers",
        fields: DEFAULT_PAO_FIELDS,
        keyFormat: "pad2",
        expectedSize: 100,
        items: blankItems(),
      });
      onImported(bundle);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The blank system could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmImport() {
    if (!detection) return;
    setSaving(true);
    setError("");
    try {
      let bundle: PaoSystemBundle;
      if (targetSystemId === "new") {
        bundle = await createPaoSystem({
          name: systemName,
          kind: detection.detectedKind,
          fields: detection.fields,
          keyFormat: detection.keyFormat,
          expectedSize: detection.expectedSize,
          items: detection.items,
          file: source,
        });
      } else {
        const existing = await loadPaoSystem(userId, targetSystemId);
        bundle = await replacePaoItems(existing, detection.items, source);
      }
      onImported(bundle);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The import could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const visibleIssues = detection?.issues.filter((issue, index) => !hiddenIssues.has(issueId(issue, index))) ?? [];

  return (
    <View style={[s.importPanel, isMobile && s.importPanelMobile]}>
      <View style={s.panelHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.panelKicker}>{detection ? "Review import" : "Add a memory system"}</Text>
          <Text style={s.panelTitle}>{detection ? source?.name ?? "Pasted table" : "Import your flashcards"}</Text>
          <Text style={s.panelSubtitle}>
            {detection ? "Check the mapping and any gaps before saving." : "Upload Excel or CSV, paste a spreadsheet table, or begin with a blank 00–99 PAO."}
          </Text>
        </View>
        <TouchableOpacity style={s.closeButton} onPress={onClose} accessibilityLabel="Close import">
          <Feather name="x" size={18} color="#526672" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={s.errorBanner}>
          <Feather name="alert-circle" size={17} color="#B34036" />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {!detection ? (
        <>
          <TouchableOpacity
            disabled={loadingFile}
            style={s.dropZone}
            onPress={openFilePicker}
            {...(Platform.OS === "web" ? {
              onDragOver: (event: any) => event.preventDefault(),
              onDrop: handleDroppedFile,
            } : {})}
          >
            {loadingFile ? <ActivityIndicator color={FLASHCARD_ACCENT} /> : <Feather name="upload-cloud" size={30} color={FLASHCARD_ACCENT} />}
            <Text style={s.dropTitle}>{loadingFile ? "Reading workbook…" : "Choose or drop a file"}</Text>
            <Text style={s.dropText}>.xlsx, .xls or .csv · up to 5 MB</Text>
          </TouchableOpacity>

          <View style={s.orRow}><View style={s.orLine} /><Text style={s.orText}>or paste from Excel / Sheets</Text><View style={s.orLine} /></View>
          <TextInput
            style={s.textarea}
            value={pasteText}
            onChangeText={setPasteText}
            multiline
            placeholder={"Number\tPerson\tAction\tObject\n00\tOzzy Osbourne\tBiting\tBat"}
            placeholderTextColor="#A1ABB2"
          />
          <View style={s.toolbar}>
            <View style={{ flex: 1, minWidth: 190 }}>
              <Text style={s.fieldLabel}>System name</Text>
              <TextInput style={s.input} value={systemName} onChangeText={setSystemName} placeholder="My PAO" />
            </View>
            <View style={[s.toolbarGroup, { alignSelf: "flex-end" }]}>
              <TouchableOpacity
                style={[s.secondaryButton, (!pasteText.trim() || saving) && s.disabled]}
                disabled={!pasteText.trim() || saving}
                onPress={() => {
                  try { applyGrid(parseTsv(pasteText)); } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "The table could not be read."); }
                }}
              >
                <Feather name="clipboard" size={14} color="#536873" /><Text style={s.secondaryButtonText}>Preview pasted table</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryButton, saving && s.disabled]} disabled={saving} onPress={startBlank}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="plus" size={15} color="#FFFFFF" />}
                <Text style={s.primaryButtonText}>Start blank 00–99</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={s.previewSummary}>
            <Feather name="check-circle" size={18} color={FLASHCARD_ACCENT} />
            <Text style={s.previewSummaryText}>
              {detection.detectedKind[0].toUpperCase() + detection.detectedKind.slice(1)} system · {detection.items.length} of {detection.expectedSize} pegs
              {detection.shiftedOneToHundred ? " · interpreted 1–100 as 00–99" : ""}
            </Text>
          </View>

          <View>
            <Text style={s.fieldLabel}>Column mapping · tap a role to change it</Text>
            <View style={s.mappingRow}>
              {detection.columns.map((column) => (
                <View key={column.index} style={s.mappingCard}>
                  <Text style={s.mappingHeader}>{column.header}</Text>
                  <Text style={s.mappingSample} numberOfLines={1}>{column.sample.join(" · ") || "Empty"}</Text>
                  <TouchableOpacity style={s.roleButton} onPress={() => cycleRole(column.index)}>
                    <Text style={s.roleButtonText}>{column.role}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {visibleIssues.length ? (
            <View>
              <Text style={s.fieldLabel}>{visibleIssues.length} import note{visibleIssues.length === 1 ? "" : "s"}</Text>
              <View style={s.issueList}>
                {visibleIssues.slice(0, 30).map((issue) => {
                  const originalIndex = detection.issues.indexOf(issue);
                  const id = issueId(issue, originalIndex);
                  return (
                    <View key={id} style={s.issueRow}>
                      <Feather name="alert-triangle" size={14} color="#9A7B25" />
                      <Text style={s.issueText}>{issueLabel(issue)}</Text>
                      <TouchableOpacity onPress={() => setHiddenIssues((current) => new Set([...current, id]))}>
                        <Feather name="x" size={14} color="#9A7B25" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <ScrollView horizontal style={s.previewTable}>
            <View>
              <View style={s.tableRow}>
                <Text style={[s.tableCell, s.tableHeaderCell]}>Key</Text>
                {detection.fields.map((field) => <Text key={field.id} style={[s.tableCell, s.tableHeaderCell]}>{field.label}</Text>)}
              </View>
              {detection.items.slice(0, 8).map((item) => (
                <View key={item.key} style={s.tableRow}>
                  <Text style={s.tableCell}>{item.displayLabel}</Text>
                  {detection.fields.map((field) => <Text key={field.id} style={s.tableCell} numberOfLines={1}>{item.values[field.id] || "—"}</Text>)}
                </View>
              ))}
            </View>
          </ScrollView>

          <View>
            <Text style={s.fieldLabel}>Save as</Text>
            <View style={s.optionRow}>
              {compatibleSystems.map((system) => (
                <TouchableOpacity key={system.id} style={[s.optionButton, targetSystemId === system.id && s.optionButtonActive]} onPress={() => { setTargetSystemId(system.id); setSystemName(system.name); }}>
                  <Text style={[s.optionText, targetSystemId === system.id && s.optionTextActive]}>Replace {system.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[s.optionButton, targetSystemId === "new" && s.optionButtonActive]} onPress={() => setTargetSystemId("new")}>
                <Text style={[s.optionText, targetSystemId === "new" && s.optionTextActive]}>Create a new system</Text>
              </TouchableOpacity>
            </View>
          </View>

          {targetSystemId === "new" ? (
            <View>
              <Text style={s.fieldLabel}>System name</Text>
              <TextInput style={s.input} value={systemName} onChangeText={setSystemName} placeholder="My PAO" />
            </View>
          ) : (
            <DiffPreview userId={userId} systemId={targetSystemId} items={detection.items} />
          )}

          <View style={s.toolbar}>
            <TouchableOpacity style={s.secondaryButton} onPress={() => { setDetection(null); setGrid(null); setSource(undefined); }}>
              <Feather name="arrow-left" size={14} color="#526672" /><Text style={s.secondaryButtonText}>Choose another</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={saving || !detection.fields.length || !detection.items.length} style={[s.primaryButton, (saving || !detection.fields.length || !detection.items.length) && s.disabled]} onPress={confirmImport}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="check" size={15} color="#FFFFFF" />}
              <Text style={s.primaryButtonText}>{saving ? "Saving…" : targetSystemId === "new" ? "Create system" : "Replace safely"}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function DiffPreview({ userId, systemId, items }: { userId: string; systemId: string; items: PaoItem[] }) {
  const [label, setLabel] = useState("Checking changes…");
  useEffect(() => {
    let alive = true;
    loadPaoSystem(userId, systemId)
      .then((bundle) => {
        if (!alive) return;
        const diff = diffPaoItems(bundle.items, items);
        setLabel(`${diff.changed} changed, ${diff.added} added, ${diff.removed} removed — progress kept on ${diff.kept}.`);
      })
      .catch(() => { if (alive) setLabel("The current version will be rechecked before saving."); });
    return () => { alive = false; };
  }, [items, systemId, userId]);
  return <View style={s.successBanner}><Feather name="shield" size={16} color="#23845B" /><Text style={s.successText}>{label}</Text></View>;
}
