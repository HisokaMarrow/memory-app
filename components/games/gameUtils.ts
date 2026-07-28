import { useWindowDimensions } from "react-native";

import type { StoredGameResult } from "./resultsStore";

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(values: readonly T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function createResultId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function buildGameResult(
  result: Omit<StoredGameResult, "id" | "createdAt">,
): StoredGameResult {
  return {
    ...result,
    id: createResultId(),
    createdAt: new Date().toISOString(),
  };
}

export function useIsMobile() {
  return useWindowDimensions().width < 640;
}
