import type { PaoSystem, PaoSystemBundle } from "./paoTypes";

export type PendingWriteMutation = {
  id: string;
  type: "create" | "replace";
  userId: string;
  bundle: PaoSystemBundle;
  expectedRevision: number;
  fileName?: string;
  fileSize?: number;
};

export type PendingDeleteMutation = {
  id: string;
  type: "delete";
  userId: string;
  systemId: string;
};

export type PendingMutation = PendingWriteMutation | PendingDeleteMutation;

export function pendingSystemId(mutation: PendingMutation) {
  return mutation.type === "delete" ? mutation.systemId : mutation.bundle.system.id;
}

export function enqueuePendingWrite(pending: PendingMutation[], mutation: PendingWriteMutation) {
  return [mutation, ...pending.filter((entry) => entry.id !== mutation.id)];
}

export function enqueuePendingDelete(pending: PendingMutation[], deletion: PendingDeleteMutation) {
  return [deletion, ...pending.filter((entry) => pendingSystemId(entry) !== deletion.systemId)];
}

export function newestPendingSystems(pending: PendingMutation[]) {
  const bySystem = new Map<string, PaoSystem>();
  pending
    .filter((entry): entry is PendingWriteMutation => entry.type !== "delete")
    .forEach((entry) => {
      if (!bySystem.has(entry.bundle.system.id)) bySystem.set(entry.bundle.system.id, entry.bundle.system);
    });
  return [...bySystem.values()];
}

export function expectedRevisionForMutation(mutation: PendingWriteMutation, syncedRevisions: Map<string, number>) {
  return syncedRevisions.get(mutation.bundle.system.id) ?? mutation.expectedRevision;
}

export function rebasePendingWrite(mutation: PendingWriteMutation, revision: number): PendingWriteMutation {
  return {
    ...mutation,
    expectedRevision: revision,
    bundle: {
      ...mutation.bundle,
      system: { ...mutation.bundle.system, revision, pendingUpload: true },
    },
  };
}

export function shouldUsePendingBundle(bundle: PaoSystemBundle | null, forceRemote = false) {
  return Boolean(bundle?.system.pendingUpload && !forceRemote);
}
