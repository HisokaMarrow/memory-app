export type SystemKind = "numbers" | "cards" | "names" | "custom";

export type FieldId = string;

export type PaoField = {
  id: FieldId;
  label: string;
  shortLabel: string;
};

export type PaoSystem = {
  id: string;
  name: string;
  kind: SystemKind;
  fields: PaoField[];
  keyFormat: "pad2" | "pad3" | "card" | "text";
  expectedSize: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  pendingUpload?: boolean;
};

export type PaoItem = {
  id: string;
  systemId: string;
  key: string;
  displayLabel: string;
  cardAssetId?: string;
  values: Record<FieldId, string>;
  starred?: boolean;
  notes?: string;
  position?: number;
};

export type PegProgress = {
  itemId: string;
  field: FieldId;
  strength: number;
  dueAt: string;
  correctCount: number;
  wrongCount: number;
  streak: number;
  avgMs: number;
  lastSeenAt: string;
};

export type PaoImportRecord = {
  id: string;
  systemId: string;
  revision: number;
  fileName: string;
  fileSize: number;
  storagePath?: string;
  itemCount: number;
  createdAt: string;
};

export type PaoSystemBundle = {
  system: PaoSystem;
  items: PaoItem[];
  progress: PegProgress[];
  imports: PaoImportRecord[];
};

export const DEFAULT_PAO_FIELDS: PaoField[] = [
  { id: "person", label: "Person", shortLabel: "P" },
  { id: "action", label: "Action", shortLabel: "A" },
  { id: "object", label: "Object", shortLabel: "O" },
];

export function blankProgress(itemId: string, field: FieldId): PegProgress {
  const now = new Date().toISOString();
  return {
    itemId,
    field,
    strength: 0,
    dueAt: now,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    avgMs: 0,
    lastSeenAt: now,
  };
}
