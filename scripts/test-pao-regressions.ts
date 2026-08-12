import assert from "node:assert/strict";
import * as XLSX from "xlsx";

import { gradeAnswer } from "../components/flashcards/drillEngine";
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
import type { PaoSystemBundle } from "../components/flashcards/paoTypes";

const grid: RawGrid = [
  ["Number", "Person", "Action", "Object"],
  [0, "Ozzy Osbourne", "Biting", "Bat"],
  [1, "Neo", "Dodging", "Bullets"],
];
const detected = detectImport(grid);
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
