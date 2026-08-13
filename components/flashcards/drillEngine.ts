import { blankProgress, type FieldId, type PaoField, type PaoItem, type PegProgress } from "./paoTypes";

export type DrillDirection =
  | { from: "key"; to: FieldId[] }
  | { from: "fields"; to: "key" }
  | { from: FieldId; to: FieldId[] };

export type DrillMode = "flip" | "type" | "choice";

export type DrillConfig = {
  systemId: string;
  direction: DrillDirection;
  mode: DrillMode;
  length: number;
};

export type LeitnerBox = 0 | 1 | 2 | 3;
export type BoxAssignment = LeitnerBox | "unseen";
export type BoxCounts = { unseen: number; box0: number; box1: number; box2: number; box3: number };

export type DrillTarget = {
  field: FieldId | "key";
  label: string;
  expected: string;
};

export type DrillCard = {
  id: string;
  item: PaoItem;
  promptLabel: string;
  prompt: string;
  targets: DrillTarget[];
  direction: DrillDirection;
};

export type GradeResult = {
  verdict: "correct" | "close" | "wrong";
  expectedDisplay: string;
};

export type SwipeGrade = "poor" | "good";

const INTERVALS_MS = [10 * 60_000, 24 * 60 * 60_000, 7 * 24 * 60 * 60_000, 30 * 24 * 60 * 60_000];
const BOX_WEIGHTS: Record<LeitnerBox, number> = { 0: 8, 1: 4, 2: 2, 3: 1 };

export function classifySwipe(distanceX: number, threshold = 72): SwipeGrade | null {
  if (Math.abs(distanceX) < threshold) return null;
  return distanceX < 0 ? "poor" : "good";
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function damerauLevenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
      if (row > 1 && column > 1 && a[row - 1] === b[column - 2] && a[row - 2] === b[column - 1]) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + cost);
      }
    }
  }
  return matrix[a.length][b.length];
}

function acceptedAnswers(expected: string) {
  const completeAnswer = normalizeAnswer(expected);
  const alternatives = expected.split(/[\/,;]/).map(normalizeAnswer).filter(Boolean);
  return Array.from(new Set([completeAnswer, ...alternatives].filter(Boolean)));
}

export function gradeAnswer(input: string, expected: string): GradeResult {
  const normalizedInput = normalizeAnswer(input);
  const alternatives = acceptedAnswers(expected);
  const expectedDisplay = expected;
  if (!normalizedInput || !alternatives.length) return { verdict: "wrong", expectedDisplay };

  if (alternatives.some((answer) => answer === normalizedInput)) {
    return { verdict: "correct", expectedDisplay };
  }

  if (/^\d+$/.test(normalizedInput) && alternatives.some((answer) => /^\d+$/.test(answer) && Number(answer) === Number(normalizedInput))) {
    return { verdict: "correct", expectedDisplay };
  }

  const correctByRecognisableName = alternatives.some((answer) => {
    const firstToken = answer.split(" ")[0];
    return normalizedInput.length >= 4 && (answer.startsWith(`${normalizedInput} `) || firstToken === normalizedInput);
  });
  if (correctByRecognisableName) return { verdict: "correct", expectedDisplay };

  const close = alternatives.some((answer) => {
    const candidates = [answer, ...answer.split(" ").filter((token) => token.length >= 4)];
    return candidates.some((candidate) => candidate.length >= 4 && damerauLevenshtein(normalizedInput, candidate) <= 1);
  });
  return { verdict: close ? "close" : "wrong", expectedDisplay };
}

function clampBox(value: number): LeitnerBox {
  return Math.max(0, Math.min(3, Math.round(value))) as LeitnerBox;
}

function targetFields(direction: DrillDirection, fields: PaoField[]) {
  if (direction.to === "key") return ["key"];
  if (direction.from === "key") return direction.to as FieldId[];
  return direction.to as FieldId[];
}

function makeCard(item: PaoItem, direction: DrillDirection, fields: PaoField[]): DrillCard {
  if (direction.to === "key") {
    const prompt = fields
      .map((field) => item.values[field.id])
      .filter(Boolean)
      .join(" · ");
    return {
      id: item.id,
      item,
      promptLabel: fields.map((field) => field.shortLabel).join(" / "),
      prompt,
      targets: [{ field: "key", label: "Key", expected: item.displayLabel }],
      direction,
    };
  }

  if (direction.from === "key") {
    const targets = (direction.to as FieldId[]).map((fieldId) => {
      const field = fields.find((entry) => entry.id === fieldId);
      return { field: fieldId, label: field?.label ?? fieldId, expected: item.values[fieldId] ?? "" };
    });
    return { id: item.id, item, promptLabel: "Key", prompt: item.displayLabel, targets, direction };
  }

  const promptField = fields.find((entry) => entry.id === direction.from);
  const targets = (direction.to as FieldId[]).map((fieldId) => {
    const field = fields.find((entry) => entry.id === fieldId);
    return { field: fieldId, label: field?.label ?? fieldId, expected: item.values[fieldId] ?? "" };
  });
  return {
    id: item.id,
    item,
    promptLabel: promptField?.label ?? direction.from,
    prompt: item.values[direction.from] ?? "",
    targets,
    direction,
  };
}

function shuffled<T>(values: T[], random: () => number = Math.random) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [next[index], next[other]] = [next[other], next[index]];
  }
  return next;
}

export function boxForItem(item: PaoItem, progress: PegProgress[], targetFieldIds: FieldId[]): BoxAssignment {
  if (!targetFieldIds.length) return "unseen";
  const rows = targetFieldIds.map((fieldId) => progress.find((entry) => entry.itemId === item.id && entry.field === fieldId));
  if (rows.some((entry) => !entry)) return "unseen";
  return clampBox(Math.min(...rows.map((entry) => entry?.strength ?? 0)));
}

export function getBoxCounts(items: PaoItem[], progress: PegProgress[], targetFieldIds: FieldId[]): BoxCounts {
  const counts: BoxCounts = { unseen: 0, box0: 0, box1: 0, box2: 0, box3: 0 };
  items.forEach((item) => {
    const assignment = boxForItem(item, progress, targetFieldIds);
    if (assignment === "unseen") counts.unseen += 1;
    else counts[`box${assignment}` as keyof Omit<BoxCounts, "unseen">] += 1;
  });
  return counts;
}

export function defaultSessionLength(totalCards: number) {
  return totalCards > 0 ? Math.max(1, Math.ceil(totalCards * 0.25)) : 0;
}

function weightedBoxItems(items: PaoItem[], progress: PegProgress[], targetFieldIds: FieldId[], length: number, random: () => number) {
  const unseen: PaoItem[] = [];
  const boxes: Record<LeitnerBox, PaoItem[]> = { 0: [], 1: [], 2: [], 3: [] };
  items.forEach((item) => {
    const assignment = boxForItem(item, progress, targetFieldIds);
    if (assignment === "unseen") unseen.push(item);
    else boxes[assignment].push(item);
  });

  const wanted = Math.max(0, Math.min(items.length, Math.floor(length)));
  const selected = shuffled(unseen, random).slice(0, wanted);
  if (selected.length >= wanted) return selected;

  const remainingBoxes: Record<LeitnerBox, PaoItem[]> = {
    0: shuffled(boxes[0], random),
    1: shuffled(boxes[1], random),
    2: shuffled(boxes[2], random),
    3: shuffled(boxes[3], random),
  };
  const boxOrder: LeitnerBox[] = [0, 1, 2, 3];

  while (selected.length < wanted) {
    const available = boxOrder.filter((box) => remainingBoxes[box].length > 0);
    if (!available.length) break;
    const totalWeight = available.reduce<number>((sum, box) => sum + BOX_WEIGHTS[box], 0);
    let roll = random() * totalWeight;
    const chosen = available.find((box) => {
      roll -= BOX_WEIGHTS[box];
      return roll < 0;
    }) ?? available[available.length - 1];
    const item = remainingBoxes[chosen].pop();
    if (item) selected.push(item);
  }
  return selected;
}

export function buildQueue(items: PaoItem[], progress: PegProgress[], config: DrillConfig, fields: PaoField[] = [], random: () => number = Math.random): DrillCard[] {
  const configuredTargets = targetFields(config.direction, fields);
  const selected = weightedBoxItems(items, progress, configuredTargets, config.length, random);
  return selected.map((item) => makeCard(item, config.direction, fields));
}

function choiceValueForItem(card: DrillCard, item: PaoItem) {
  if (card.direction.from === "fields") return item.displayLabel;
  return card.targets.map((target) => item.values[target.field] ?? "").join(" · ");
}

export function buildChoices(card: DrillCard, pool: PaoItem[], count = 4): string[] {
  const correct = card.targets.map((target) => target.expected).join(" · ");
  const distractors = shuffled(
    pool
      .filter((item) => item.id !== card.item.id)
      .map((item) => choiceValueForItem(card, item))
      .filter((value) => value && value !== correct),
  );
  return shuffled([correct, ...Array.from(new Set(distractors)).slice(0, Math.max(0, count - 1))]);
}

export function nextProgress(previous: PegProgress | undefined, result: GradeResult, elapsedMs: number, itemId?: string, field?: FieldId): PegProgress {
  const prev = previous ?? blankProgress(itemId ?? "", field ?? "");
  const correct = result.verdict !== "wrong";
  const previousBox = previous ? clampBox(prev.strength) : null;
  const strength: LeitnerBox = correct ? clampBox(previousBox === null ? 1 : previousBox + 1) : 0;
  const attemptsBefore = prev.correctCount + prev.wrongCount;
  const avgMs = Math.round((prev.avgMs * attemptsBefore + elapsedMs) / Math.max(1, attemptsBefore + 1));
  const now = Date.now();
  return {
    ...prev,
    itemId: itemId ?? prev.itemId,
    field: field ?? prev.field,
    strength,
    dueAt: new Date(now + INTERVALS_MS[strength]).toISOString(),
    correctCount: prev.correctCount + (correct ? 1 : 0),
    wrongCount: prev.wrongCount + (correct ? 0 : 1),
    streak: correct ? Math.max(1, prev.streak + 1) : Math.min(-1, prev.streak > 0 ? -1 : prev.streak - 1),
    avgMs,
    lastSeenAt: new Date(now).toISOString(),
  };
}
