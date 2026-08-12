import { Platform } from "react-native";

import type { RawGrid } from "./paoImport";
import type { PaoSystemBundle } from "./paoTypes";

export type WorkbookSource = {
  name: string;
  size: number;
  bytes: ArrayBuffer;
};

export async function readWorkbookGrid(source: WorkbookSource): Promise<RawGrid> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(source.bytes, { type: "array", cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("The workbook does not contain a readable sheet.");
  return XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: true, defval: null }) as RawGrid;
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "memory-system";
}

export async function exportPaoWorkbook(bundle: PaoSystemBundle) {
  const XLSX = await import("xlsx");
  const headers = ["Key", ...bundle.system.fields.map((field) => field.label), "Starred", "Notes"];
  const rows = bundle.items.map((item) => [
    item.displayLabel,
    ...bundle.system.fields.map((field) => item.values[field.id] ?? ""),
    item.starred ? "Yes" : "",
    item.notes ?? "",
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Flashcards");
  const fileName = `${safeFileName(bundle.system.name)}.xlsx`;

  if (Platform.OS === "web") {
    XLSX.writeFile(workbook, fileName);
    return;
  }

  const [{ writeAsStringAsync, cacheDirectory, EncodingType }, Sharing] = await Promise.all([
    import("expo-file-system/legacy"),
    import("expo-sharing"),
  ]);
  if (!cacheDirectory) throw new Error("A temporary export folder is not available on this device.");
  const uri = `${cacheDirectory}${fileName}`;
  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  await writeAsStringAsync(uri, base64, { encoding: EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: `Export ${bundle.system.name}` });
}
