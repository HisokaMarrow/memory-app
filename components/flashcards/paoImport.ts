import type { FieldId, PaoField, PaoItem, PaoSystem, SystemKind } from "./paoTypes";

export type RawGrid = (string | number | null)[][];

export type ColumnRole = "key" | FieldId | "ignore";

export type ImportIssue =
  | { type: "missing-keys"; keys: string[] }
  | { type: "duplicate-key"; key: string; rows: number[] }
  | { type: "empty-field"; key: string; field: FieldId }
  | { type: "unparsed-row"; row: number; reason: string };

export type ImportDetection = {
  headerRowIndex: number | null;
  firstDataRowIndex: number;
  columns: { index: number; header: string; role: ColumnRole; sample: string[] }[];
  detectedKind: SystemKind;
  keyFormat: PaoSystem["keyFormat"];
  expectedSize: number;
  fields: PaoField[];
  items: PaoItem[];
  issues: ImportIssue[];
  shiftedOneToHundred: boolean;
};

const ROLE_ALIASES: Record<string, ColumnRole> = {
  number: "key",
  no: "key",
  key: "key",
  card: "key",
  name: "key",
  person: "person",
  who: "person",
  action: "action",
  verb: "action",
  doing: "action",
  object: "object",
  thing: "object",
  item: "object",
};

const FIELD_LABELS: Record<string, string> = {
  person: "Person",
  action: "Action",
  object: "Object",
  image: "Image",
  association: "Association",
};

const SUITS = {
  c: { name: "clubs", symbol: "♣" },
  d: { name: "diamonds", symbol: "♦" },
  h: { name: "hearts", symbol: "♥" },
  s: { name: "spades", symbol: "♠" },
} as const;

const RANKS: Record<string, string> = {
  a: "ace",
  ace: "ace",
  j: "jack",
  jack: "jack",
  q: "queen",
  queen: "queen",
  k: "king",
  king: "king",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
};

function cellText(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}

function slug(value: string, fallback: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function roleForHeader(header: string, index: number): ColumnRole {
  const clean = header.toLowerCase().replace(/[^a-z0-9#]+/g, " ").trim();
  if (clean === "#") return "key";
  const exact = ROLE_ALIASES[clean];
  if (exact) return exact;
  for (const [label, role] of Object.entries(ROLE_ALIASES)) {
    if (new RegExp(`(^| )${label}( |$)`).test(clean)) return role;
  }
  if (header.trim()) return slug(header, `field_${index + 1}`);
  return index === 0 ? "key" : index === 1 ? "person" : index === 2 ? "action" : index === 3 ? "object" : "ignore";
}

function looksLikeHeader(row: RawGrid[number]) {
  const populated = row.map(cellText).filter(Boolean);
  if (!populated.length) return false;
  const known = populated.filter((cell) => roleForHeader(cell, -1) !== slug(cell, "field")).length;
  const numeric = populated.filter((cell) => /^\d+$/.test(cell)).length;
  return known >= 2 || (known >= 1 && numeric === 0 && populated.length >= 2);
}

function findHeaderRow(grid: RawGrid) {
  const limit = Math.min(grid.length, 10);
  for (let index = 0; index < limit; index += 1) {
    if (looksLikeHeader(grid[index] ?? [])) return index;
  }
  return null;
}

function maxColumnCount(grid: RawGrid, startRow: number) {
  return grid.slice(startRow, startRow + 12).reduce((max, row) => Math.max(max, row.length), 0);
}

function detectKeyShape(values: string[]) {
  const cardKeys = values.map(matchCardKey);
  if (values.length > 0 && cardKeys.every(Boolean)) {
    return { keyFormat: "card" as const, kind: "cards" as const, expectedSize: 52, shifted: false };
  }

  const numeric = values.map((value) => Number(value));
  if (values.length > 0 && numeric.every((value) => Number.isInteger(value) && value >= 0)) {
    const max = Math.max(...numeric);
    const min = Math.min(...numeric);
    const shifted = min >= 1 && max === 100 && !numeric.includes(0);
    if (shifted || max <= 99) {
      return { keyFormat: "pad2" as const, kind: "numbers" as const, expectedSize: 100, shifted };
    }
    if (max <= 999) {
      return { keyFormat: "pad3" as const, kind: "numbers" as const, expectedSize: 1000, shifted: false };
    }
  }

  return { keyFormat: "text" as const, kind: "custom" as const, expectedSize: values.length, shifted: false };
}

function cardParts(cardId: string) {
  const [rank, , suit] = cardId.split("_");
  const suitEntry = Object.values(SUITS).find((entry) => entry.name === suit);
  const rankLabel = rank === "ace" ? "A" : rank === "jack" ? "J" : rank === "queen" ? "Q" : rank === "king" ? "K" : rank;
  return { rank, suit, display: `${rankLabel}${suitEntry?.symbol ?? ""}` };
}

export function matchCardKey(raw: string): string | null {
  let value = cellText(raw).toLowerCase();
  if (!value) return null;
  value = value
    .replace(/♣/g, " clubs ")
    .replace(/♦/g, " diamonds ")
    .replace(/♥/g, " hearts ")
    .replace(/♠/g, " spades ")
    .replace(/[_-]+/g, " ")
    .replace(/\bof\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const longMatch = value.match(/^(a|ace|[2-9]|10|j|jack|q|queen|k|king)\s*(clubs?|diamonds?|hearts?|spades?)$/);
  if (longMatch) {
    const rank = RANKS[longMatch[1]];
    const suit = longMatch[2].slice(0, 1) as keyof typeof SUITS;
    return rank && SUITS[suit] ? `${rank}_of_${SUITS[suit].name}` : null;
  }

  const shortMatch = value.replace(/\s+/g, "").match(/^(a|[2-9]|10|j|q|k)(c|d|h|s)$/);
  if (!shortMatch) return null;
  const rank = RANKS[shortMatch[1]];
  const suit = shortMatch[2] as keyof typeof SUITS;
  return rank && SUITS[suit] ? `${rank}_of_${SUITS[suit].name}` : null;
}

export function normalizeKey(raw: string | number, format: PaoSystem["keyFormat"]): string {
  const value = cellText(raw);
  if (format === "card") return matchCardKey(value) ?? value.toLowerCase().replace(/\s+/g, "_");
  if (format === "pad2" || format === "pad3") {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric < 0) return value;
    return String(numeric).padStart(format === "pad2" ? 2 : 3, "0");
  }
  return value;
}

function makeFields(columns: ImportDetection["columns"]) {
  const seen = new Set<string>();
  const fields: PaoField[] = [];
  columns.forEach((column) => {
    if (column.role === "key" || column.role === "ignore" || seen.has(column.role)) return;
    seen.add(column.role);
    const headerLabel = column.header.trim();
    const label = FIELD_LABELS[column.role] ?? (headerLabel || column.role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));
    fields.push({ id: column.role, label, shortLabel: label.slice(0, 1).toUpperCase() });
  });
  return fields;
}

export function applyMapping(grid: RawGrid, mapping: ColumnRole[], startRow: number): ImportDetection {
  const headerRowIndex = startRow > 0 ? startRow - 1 : null;
  const keyColumn = Math.max(0, mapping.findIndex((role) => role === "key"));
  const rawRows = grid.slice(startRow).map((row, offset) => ({ row, rowNumber: startRow + offset + 1 }));
  const populatedKeyValues = rawRows.map(({ row }) => cellText(row[keyColumn])).filter(Boolean);
  const shape = detectKeyShape(populatedKeyValues);
  const columnCount = Math.max(maxColumnCount(grid, Math.max(0, startRow - 1)), mapping.length);
  const columns = Array.from({ length: columnCount }, (_, index) => ({
    index,
    header: headerRowIndex == null ? `Column ${String.fromCharCode(65 + index)}` : cellText(grid[headerRowIndex]?.[index]) || `Column ${String.fromCharCode(65 + index)}`,
    role: mapping[index] ?? (index === 0 ? "key" : "ignore"),
    sample: rawRows.slice(0, 4).map(({ row }) => cellText(row[index])).filter(Boolean),
  }));
  const fields = makeFields(columns);
  const issues: ImportIssue[] = [];
  const duplicateRows = new Map<string, number[]>();
  const items: PaoItem[] = [];

  rawRows.forEach(({ row, rowNumber }, position) => {
    const rawKey = cellText(row[keyColumn]);
    const hasOtherValue = mapping.some((role, index) => role !== "key" && role !== "ignore" && cellText(row[index]));
    if (!rawKey && !hasOtherValue) return;
    if (!rawKey) {
      issues.push({ type: "unparsed-row", row: rowNumber, reason: "No key was found." });
      return;
    }

    let normalizedRaw: string | number = rawKey;
    if (shape.shifted) {
      const numeric = Number(rawKey);
      normalizedRaw = numeric === 100 ? 0 : numeric;
    }
    const key = normalizeKey(normalizedRaw, shape.keyFormat);
    if (!key) {
      issues.push({ type: "unparsed-row", row: rowNumber, reason: "The key could not be parsed." });
      return;
    }

    const values: Record<string, string> = {};
    fields.forEach((field) => {
      const column = columns.find((entry) => entry.role === field.id);
      const value = column ? cellText(row[column.index]) : "";
      values[field.id] = value;
      if (!value) issues.push({ type: "empty-field", key, field: field.id });
    });

    const cardAssetId = shape.keyFormat === "card" ? matchCardKey(rawKey) ?? undefined : undefined;
    const displayLabel = cardAssetId ? cardParts(cardAssetId).display : key;
    const existingRows = duplicateRows.get(key) ?? [];
    existingRows.push(rowNumber);
    duplicateRows.set(key, existingRows);
    items.push({
      id: `import:${encodeURIComponent(key)}`,
      systemId: "",
      key,
      displayLabel,
      cardAssetId,
      values,
      starred: false,
      notes: "",
      position,
    });
  });

  duplicateRows.forEach((rows, key) => {
    if (rows.length > 1) issues.push({ type: "duplicate-key", key, rows });
  });

  const uniqueItems = items.filter((item, index) => items.findIndex((candidate) => candidate.key === item.key) === index);
  if (shape.keyFormat === "pad2" || shape.keyFormat === "pad3") {
    const width = shape.keyFormat === "pad2" ? 2 : 3;
    const present = new Set(uniqueItems.map((item) => item.key));
    const missing = Array.from({ length: shape.expectedSize }, (_, index) => String(index).padStart(width, "0")).filter((key) => !present.has(key));
    if (missing.length) issues.unshift({ type: "missing-keys", keys: missing });
  }

  let detectedKind: SystemKind = shape.kind;
  if (shape.keyFormat === "text") {
    const keyHeader = columns[keyColumn]?.header.toLowerCase() ?? "";
    detectedKind = /name/.test(keyHeader) ? "names" : "custom";
  }

  return {
    headerRowIndex,
    firstDataRowIndex: startRow,
    columns,
    detectedKind,
    keyFormat: shape.keyFormat,
    expectedSize: shape.keyFormat === "text" ? uniqueItems.length : shape.expectedSize,
    fields,
    items: uniqueItems,
    issues,
    shiftedOneToHundred: shape.shifted,
  };
}

export function detectImport(grid: RawGrid): ImportDetection {
  const headerRowIndex = findHeaderRow(grid);
  const firstDataRowIndex = headerRowIndex == null ? grid.findIndex((row) => row.some((cell) => cellText(cell))) : headerRowIndex + 1;
  const startRow = Math.max(0, firstDataRowIndex);
  const columnCount = maxColumnCount(grid, headerRowIndex ?? startRow);
  const mapping = Array.from({ length: columnCount }, (_, index) => {
    if (headerRowIndex != null) return roleForHeader(cellText(grid[headerRowIndex]?.[index]), index);
    return index === 0 ? "key" : index === 1 ? "person" : index === 2 ? "action" : index === 3 ? "object" : "ignore";
  });
  const detection = applyMapping(grid, mapping, startRow);
  return { ...detection, headerRowIndex };
}

export function parseTsv(text: string): RawGrid {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((row) => row.trim().length > 0)
    .map((row) => row.split("\t").map((cell) => cell.trim()));
}

export function issueLabel(issue: ImportIssue) {
  if (issue.type === "missing-keys") {
    const preview = issue.keys.slice(0, 8).join(", ");
    return `${issue.keys.length} missing key${issue.keys.length === 1 ? "" : "s"}: ${preview}${issue.keys.length > 8 ? "…" : ""}`;
  }
  if (issue.type === "duplicate-key") return `Duplicate key ${issue.key} on rows ${issue.rows.join(", ")}. The first row will be used.`;
  if (issue.type === "empty-field") return `${issue.key} has no ${issue.field}.`;
  return `Row ${issue.row}: ${issue.reason}`;
}
