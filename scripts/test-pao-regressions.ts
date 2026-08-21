import assert from "node:assert/strict";
import * as XLSX from "xlsx";

import { boxForItem, buildQueue, classifySwipe, defaultSessionLength, getBoxCounts, gradeAnswer, nextProgress } from "../components/flashcards/drillEngine";
import { applyMapping, detectImport, type RawGrid } from "../components/flashcards/paoImport";
import {
  enqueuePendingDelete,
  enqueuePendingWrite,
  expectedRevisionForMutation,
  newestPendingSystems,
  rebasePendingWrite,
  shouldUsePendingBundle,
  type PendingDeleteMutation,
  type PendingWriteMutation,
} from "../components/flashcards/paoMutationQueue";
import type { PaoItem, PaoSystemBundle, PegProgress } from "../components/flashcards/paoTypes";

const grid: RawGrid = [
  ["Number", "Person", "Action", "Object", "Starred", "Notes"],
  [0, "Ozzy Osbourne", "Biting", "Bat", "Yes", "  Reference link  "],
  [1, "Neo", "Dodging", "Bullets", "", ""],
];
const detected = detectImport(grid);
assert.deepEqual(
  detected.fields.map((field) => field.id),
  ["person", "action", "object"],
  "item metadata columns must not become drillable fields",
);
assert.equal(detected.items[0].starred, true, "the exported Yes marker must restore a star");
assert.equal(detected.items[0].notes, "Reference link", "notes must round-trip as trimmed free text");
assert.equal(detected.items[1].starred, false, "an empty star marker must remain false");
const truthyStars = ["Yes", "yes", "true", "1", "x"];
truthyStars.forEach((value) => {
  const result = detectImport([
    ["Key", "Person", "Action", "Object", "Starred"],
    [0, "Person", "Action", "Object", value],
  ]);
  assert.equal(result.items[0].starred, true, `${value} must be recognised as starred`);
});
const withoutKey = applyMapping(
  grid,
  detected.columns.map((column) => column.role === "key" ? "ignore" : column.role),
  detected.firstDataRowIndex,
);
assert.equal(withoutKey.items.length, 0, "removing the key role must not fall back to column A");
assert.ok(withoutKey.issues.some((issue) => issue.type === "missing-key-column"), "a missing key role must block saving with a clear issue");

assert.equal(
  gradeAnswer("Bond, James / 007", "Bond, James / 007").verdict,
  "correct",
  "an exact punctuated choice must be accepted before alternative splitting",
);
assert.equal(classifySwipe(-90), "poor", "a left swipe must grade the card as poor");
assert.equal(classifySwipe(90), "good", "a right swipe must grade the card as good");
assert.equal(classifySwipe(40), null, "a short drag must return the card without grading it");

const testFields = [{ id: "person", label: "Person", shortLabel: "P" }, { id: "action", label: "Action", shortLabel: "A" }];
const testItems: PaoItem[] = ["unseen", "box0", "box3"].map((key, position) => ({
  id: `test:${key}`,
  systemId: "test",
  key,
  displayLabel: key,
  values: { person: `${key} person`, action: `${key} action` },
  position,
}));
function progressRow(itemId: string, field: string, strength: number): PegProgress {
  return {
    itemId,
    field,
    strength,
    dueAt: "2026-08-13T00:00:00.000Z",
    correctCount: 1,
    wrongCount: 0,
    streak: 1,
    avgMs: 1000,
    lastSeenAt: "2026-08-13T00:00:00.000Z",
  };
}
const boxProgress = [progressRow("test:box0", "person", 0), progressRow("test:box3", "person", 5)];
assert.equal(boxForItem(testItems[0], boxProgress, ["person"]), "unseen", "cards without progress must remain unallocated");
assert.equal(boxForItem(testItems[2], boxProgress, ["person"]), 3, "legacy strengths above Box 3 must be clamped");
assert.equal(boxForItem(testItems[1], boxProgress, ["person", "action"]), "unseen", "a card is unallocated while any selected field is unseen");
assert.deepEqual(getBoxCounts(testItems, boxProgress, ["person"]), { unseen: 1, box0: 1, box1: 0, box2: 0, box3: 1 });
assert.equal(defaultSessionLength(100), 25, "the default session must use 25% of the system");
assert.equal(defaultSessionLength(3), 1, "small systems must still recommend at least one card");

const deterministicQueue = buildQueue(testItems, boxProgress, {
  systemId: "test",
  direction: { from: "key", to: ["person"] },
  mode: "flip",
  length: 2,
}, testFields, () => 0);
assert.equal(deterministicQueue[0].item.key, "unseen", "unallocated cards must always be selected first");
assert.equal(deterministicQueue[1].item.key, "box0", "Box 0 must win the highest weighted selection");

const correct = { verdict: "correct" as const, expectedDisplay: "answer" };
const wrong = { verdict: "wrong" as const, expectedDisplay: "answer" };
assert.equal(nextProgress(undefined, correct, 1000, "test:new", "person").strength, 1, "a first correct answer must enter Box 1");
assert.equal(nextProgress(undefined, wrong, 1000, "test:new", "person").strength, 0, "a first wrong answer must enter Box 0");
assert.equal(nextProgress(progressRow("test:box0", "person", 0), correct, 1000).strength, 1, "correct answers must promote one box");
assert.equal(nextProgress(progressRow("test:box1", "person", 1), correct, 1000).strength, 2);
assert.equal(nextProgress(progressRow("test:box2", "person", 2), correct, 1000).strength, 3);
assert.equal(nextProgress(progressRow("test:box3", "person", 3), correct, 1000).strength, 3, "Box 3 is the mastery ceiling");
assert.equal(nextProgress(progressRow("test:box3", "person", 3), wrong, 1000).strength, 0, "a wrong answer from any box must reset to Box 0");

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(grid), "PAO");
const workbookBytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
const parsedWorkbook = XLSX.read(workbookBytes, { type: "array" });
assert.equal(parsedWorkbook.SheetNames[0], "PAO", "the patched SheetJS distribution must still parse uploaded workbooks");

function bundle(systemId: string, revision: number, person: string): PaoSystemBundle {
  const timestamp = "2026-08-12T00:00:00.000Z";
  return {
    system: {
      id: systemId,
      name: "Test PAO",
      kind: "numbers",
      fields: [{ id: "person", label: "Person", shortLabel: "P" }],
      keyFormat: "pad2",
      expectedSize: 100,
      revision,
      createdAt: timestamp,
      updatedAt: timestamp,
      pendingUpload: true,
    },
    items: [{
      id: `${systemId}:00`,
      systemId,
      key: "00",
      displayLabel: "00",
      values: { person },
      starred: false,
      notes: "",
      position: 0,
    }],
    progress: [],
    imports: [],
  };
}

const create: PendingWriteMutation = {
  id: "create:pao-a",
  type: "create",
  userId: "user-a",
  bundle: bundle("pao-a", 0, "Original"),
  expectedRevision: 0,
};
const replace: PendingWriteMutation = {
  id: "replace:pao-a",
  type: "replace",
  userId: "user-a",
  bundle: bundle("pao-a", 0, "Re-imported"),
  expectedRevision: 0,
};
let pending = enqueuePendingWrite([], create);
pending = enqueuePendingWrite(pending, replace);
const ordered = [...pending].reverse() as PendingWriteMutation[];
const syncedRevisions = new Map<string, number>();
assert.equal(expectedRevisionForMutation(ordered[0], syncedRevisions), 0);
syncedRevisions.set("pao-a", 1);
assert.equal(expectedRevisionForMutation(ordered[1], syncedRevisions), 1, "an offline re-import must follow the revision created earlier in the same flush");

const rebased = rebasePendingWrite(replace, 4);
assert.equal(rebased.expectedRevision, 4);
assert.equal(rebased.bundle.items[0].values.person, "Re-imported", "rebasing a conflict must retain the queued user data");
assert.equal(rebased.bundle.system.pendingUpload, true);
assert.equal(shouldUsePendingBundle(rebased.bundle), true, "a pending offline re-import must win over a normal remote refresh");
assert.equal(shouldUsePendingBundle(rebased.bundle, true), false, "a successful queue flush must be able to force a remote refresh");

const otherCreate: PendingWriteMutation = {
  ...create,
  id: "create:pao-b",
  bundle: bundle("pao-b", 0, "Other"),
};
pending = enqueuePendingWrite(pending, otherCreate);
const deletion: PendingDeleteMutation = { id: "delete:pao-a", type: "delete", userId: "user-a", systemId: "pao-a" };
const afterDelete = enqueuePendingDelete(pending, deletion);
assert.deepEqual(afterDelete.filter((mutation) => mutation.type !== "delete").map((mutation) => mutation.bundle.system.id), ["pao-b"], "deleting a system must purge its queued create and replace mutations");
assert.deepEqual(newestPendingSystems(pending).map((system) => system.id), ["pao-b", "pao-a"], "the library must expose only the newest pending bundle per system");

console.log("PAO regression checks passed.");
