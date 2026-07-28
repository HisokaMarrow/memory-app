export type Mode = "auto" | "manual";
export type Phase = "setup" | "countdown" | "memorise" | "recall" | "result";
export type VoiceOverMode = "digits" | "number";

export type Settings = {
  mode: Mode;
  intervalSeconds: number;
  customIntervalSeconds: string;
  useCustomInterval: boolean;
  exerciseSeconds: number;
  customExerciseSeconds: string;
  useCustomTime: boolean;
  recallSeconds: number;
  customRecallSeconds: string;
  useCustomRecallTime: boolean;
  voiceOverEnabled: boolean;
  voiceOverMode: VoiceOverMode;
  digits: number;
  min: string;
  max: string;
};

export type CheckedAnswer = {
  index: number;
  expected: string;
  actual: string;
  correct: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mode: "auto",
  intervalSeconds: 2,
  customIntervalSeconds: "1.5",
  useCustomInterval: false,
  exerciseSeconds: 60,
  customExerciseSeconds: "90",
  useCustomTime: false,
  recallSeconds: 120,
  customRecallSeconds: "300",
  useCustomRecallTime: false,
  voiceOverEnabled: false,
  voiceOverMode: "digits",
  digits: 2,
  min: "0",
  max: "99",
};

export const TIME_PRESETS = [30, 60, 120, 180];
export const RECALL_TIME_PRESETS = [120, 300, 600, 900];
export const INTERVAL_PRESETS = [1, 2, 3, 5];
export const MIN_INTERVAL_SECONDS = 0.4;
export const MAX_INTERVAL_SECONDS = 30;

export function clampNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(999, Math.max(0, Math.round(value)));
}

export function clampSeconds(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(3600, Math.max(5, Math.round(value)));
}

export function clampIntervalSeconds(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  const clamped = Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, value));
  return Math.round(clamped * 10) / 10;
}

export function cleanDecimalInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [head, ...tail] = normalized.split(".");
  return tail.length ? `${head}.${tail.join("")}` : head;
}

export function formatNumber(value: number, digits: number) {
  return String(value).padStart(digits, "0");
}

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function digitsCorrectFor(expected: string, actual: string) {
  return expected.split("").reduce((sum, char, index) => sum + (actual[index] === char ? 1 : 0), 0);
}
