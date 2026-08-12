import { blankProgress, type FieldId, type PaoField, type PaoItem, type PegProgress } from "./paoTypes";

export type DrillDirection =
  | { from: "key"; to: FieldId[] }
  | { from: "fields"; to: "key" }
  | { from: FieldId; to: FieldId[] };

export type DrillMode = "flip" | "type" | "choice";
export type DrillOrder = "random" | "sequential" | "smart";

export type DrillConfig = {
  systemId: string;
  direction: DrillDirection;
  mode: DrillMode;
  order: DrillOrder;
  scope:
    | { kind: "all" }
    | { kind: "range"; from: string; to: string }
    | { kind: "weak" }
    | { kind: "starred" };
  length: number | "all";
  timerSeconds?: number;
};

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

const INTERVALS_MS = [10 * 60_000, 24 * 60 * 60_000, 3 * 24 * 60 * 60_000, 7 * 24 * 60 * 60_000, 21 * 24 * 60 * 60_000, 60 * 24 * 60 * 60_000];

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

function progressFor(item: PaoItem, progress: PegProgress[], targetFields: FieldId[]) {
  const matches = progress.filter((entry) => entry.itemId === item.id && targetFields.includes(entry.field));
  if (!matches.length) return { strength: 0, dueAt: 0, lastSeenAt: 0, leech: false };
  return {
    strength: Math.min(...matches.map((entry) => entry.strength)),
    dueAt: Math.min(...matches.map((entry) => Date.parse(entry.dueAt) || 0)),
    lastSeenAt: Math.min(...matches.map((entry) => Date.parse(entry.lastSeenAt) || 0)),
    leech: matches.some((entry) => entry.streak <= -3),
  };
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

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [next[index], next[other]] = [next[other], next[index]];
  }
  return next;
}

export function buildQueue(items: PaoItem[], progress: PegProgress[], config: DrillConfig, fields: PaoField[] = []): DrillCard[] {
  const configuredTargets = targetFields(config.direction, fields);
  let pool = items.filter((item) => {
    if (config.scope.kind === "starred") return Boolean(item.starred);
    if (config.scope.kind === "range") return item.key >= config.scope.from && item.key <= config.scope.to;
    if (config.scope.kind === "weak") return progressFor(item, progress, configuredTargets).strength <= 2;
    return true;
  });

  if (config.order === "sequential") {
    pool = [...pool].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.key.localeCompare(b.key, undefined, { numeric: true }));
  } else if (config.order === "random") {
    pool = shuffled(pool);
  } else {
    const now = Date.now();
    pool = [...pool].sort((a, b) => {
      const pa = progressFor(a, progress, configuredTargets);
      const pb = progressFor(b, progress, configuredTargets);
      if (pa.leech !== pb.leech) return pa.leech ? -1 : 1;
      const aDue = pa.dueAt <= now;
      const bDue = pb.dueAt <= now;
      if (aDue !== bDue) return aDue ? -1 : 1;
      return pa.strength - pb.strength || pa.lastSeenAt - pb.lastSeenAt || Math.random() - 0.5;
    });
  }

  const selected = config.length === "all" ? pool : pool.slice(0, config.length);
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
  const strength = correct ? Math.min(5, prev.strength + 1) : Math.max(0, prev.strength - 2);
  const attemptsBefore = prev.correctCount + prev.wrongCount;
  const avgMs = Math.round((prev.avgMs * attemptsBefore + elapsedMs) / Math.max(1, attemptsBefore + 1));
  const now = Date.now();
  return {
    ...prev,
    itemId: itemId ?? prev.itemId,
    field: field ?? prev.field,
    strength,
    dueAt: new Date(correct ? now + INTERVALS_MS[strength] : now + 60_000).toISOString(),
    correctCount: prev.correctCount + (correct ? 1 : 0),
    wrongCount: prev.wrongCount + (correct ? 0 : 1),
    streak: correct ? Math.max(1, prev.streak + 1) : Math.min(-1, prev.streak > 0 ? -1 : prev.streak - 1),
    avgMs,
    lastSeenAt: new Date(now).toISOString(),
  };
}
