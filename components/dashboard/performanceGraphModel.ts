import type { StoredGameResult } from "../games/resultsStore";

export const GRAPH_WIDTH = 1120;
export const GRAPH_HEIGHT = 340;
export const GRAPH_PADDING = { top: 42, right: 92, bottom: 52, left: 44 };
export const GRAPH_SCALES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

export type GraphScale = (typeof GRAPH_SCALES)[number]["id"];
export type GraphMetric = "pointsPerSecond" | "reactionMs";

export const GRAPH_SCALE_ORDER: GraphScale[] = ["day", "week", "month", "year"];

export function localDayKey(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function pointsForResult(result: StoredGameResult) {
  return result.digitsCorrect + result.numbersCorrect * 2;
}

export function pointsPerSecondForResult(result: StoredGameResult) {
  return pointsForResult(result) / Math.max(1, result.timeTakenSeconds);
}

export function reactionTimeMsForResult(result: StoredGameResult) {
  const value = Number(result.settings.averageMs ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function sameLocalDay(a: Date, b: Date) {
  return localDayKey(a) === localDayKey(b);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
}

function attemptLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function aggregateResults(
  id: string,
  label: string,
  results: StoredGameResult[],
) {
  const numbersCorrect = results.reduce(
    (sum, result) => sum + result.numbersCorrect,
    0,
  );
  const numbersShown = results.reduce(
    (sum, result) => sum + result.numbersShown,
    0,
  );
  const digitsCorrect = results.reduce(
    (sum, result) => sum + result.digitsCorrect,
    0,
  );
  const digitsShown = results.reduce(
    (sum, result) => sum + result.digitsShown,
    0,
  );
  const timeTakenSeconds = results.reduce(
    (sum, result) => sum + result.timeTakenSeconds,
    0,
  );
  const points = results.reduce(
    (sum, result) => sum + pointsForResult(result),
    0,
  );
  const accuracy = results.length
    ? Math.round(
        results.reduce((sum, result) => sum + result.accuracy, 0) /
          results.length,
      )
    : 0;
  const reactionTimes = results
    .map(reactionTimeMsForResult)
    .filter((value) => value > 0);
  const reactionMs = reactionTimes.length
    ? reactionTimes.reduce((sum, value) => sum + value, 0) /
      reactionTimes.length
    : 0;

  return {
    id,
    label,
    attempts: results.length,
    points,
    pointsPerSecond: points / Math.max(1, timeTakenSeconds),
    reactionMs,
    numbersCorrect,
    numbersShown,
    digitsCorrect,
    digitsShown,
    timeTakenSeconds,
    accuracy,
    hasData: results.length > 0,
  };
}

export function buildPerformanceTimeline(
  results: StoredGameResult[],
  scale: GraphScale,
) {
  const now = new Date();

  if (scale === "day") {
    return results
      .filter((result) => sameLocalDay(new Date(result.createdAt), now))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map((result, index) => ({
        id: result.id,
        label: attemptLabel(new Date(result.createdAt)),
        attempts: 1,
        points: pointsForResult(result),
        pointsPerSecond: pointsPerSecondForResult(result),
        reactionMs: reactionTimeMsForResult(result),
        numbersCorrect: result.numbersCorrect,
        numbersShown: result.numbersShown,
        digitsCorrect: result.digitsCorrect,
        digitsShown: result.digitsShown,
        timeTakenSeconds: result.timeTakenSeconds,
        accuracy: result.accuracy,
        hasData: true,
        index,
      }));
  }

  if (scale === "year") {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - index),
        1,
      );
      const key = monthKey(date);
      const bucketResults = results.filter(
        (result) => monthKey(new Date(result.createdAt)) === key,
      );
      const label = index === 11 ? "This month" : monthLabel(date);
      return { ...aggregateResults(key, label, bucketResults), index };
    });
  }

  const length = scale === "week" ? 7 : 30;
  return Array.from({ length }, (_, index) => {
    const date = startOfLocalDay(now);
    date.setDate(date.getDate() - (length - 1 - index));
    const key = localDayKey(date);
    const bucketResults = results.filter(
      (result) => localDayKey(result.createdAt) === key,
    );
    const label =
      index === length - 1
        ? "Today"
        : scale === "week"
          ? new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)
          : new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
            }).format(date);
    return { ...aggregateResults(key, label, bucketResults), index };
  });
}

export function buildGraphGeometry(
  graphTimeline: ReturnType<typeof buildPerformanceTimeline>,
  metric: GraphMetric = "pointsPerSecond",
) {
  const graphDataPoints = graphTimeline.filter(
    (point) =>
      point.hasData && (metric !== "reactionMs" || point.reactionMs > 0),
  );
  const metricValues = graphDataPoints.map((item) => item[metric]);
  const graphPeak = Math.max(1, ...metricValues);
  const graphFloor = metricValues.length ? Math.min(...metricValues) : 0;
  const graphRange = Math.max(1, graphPeak - graphFloor);
  const plotWidth = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;
  const graphLinePoints = graphDataPoints.map((item) => {
    const denominator = Math.max(1, graphTimeline.length - 1);
    const x = GRAPH_PADDING.left + (item.index / denominator) * plotWidth;
    const y =
      metric === "reactionMs"
        ? GRAPH_PADDING.top +
          (metricValues.length === 1
            ? 0.5
            : (item.reactionMs - graphFloor) / graphRange) *
            plotHeight
        : GRAPH_PADDING.top +
          (1 - item.pointsPerSecond / graphPeak) * plotHeight;
    return { ...item, x, y };
  });
  const graphLineSegments = graphLinePoints.slice(1).map((point, index) => {
    const previous = graphLinePoints[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    return {
      key: `${previous.id}-${point.id}`,
      left: previous.x,
      top: previous.y,
      width: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  });

  return {
    graphDataPoints,
    graphLinePoints,
    graphLineSegments,
    plotWidth,
    plotHeight,
  };
}

export function buildGraphAxisLabels(
  graphTimeline: ReturnType<typeof buildPerformanceTimeline>,
  graphScale: GraphScale,
) {
  const plotWidth = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;

  return graphTimeline
    .filter(
      (point) =>
        graphScale === "week" ||
        point.index === 0 ||
        point.index === graphTimeline.length - 1 ||
        point.index === Math.floor((graphTimeline.length - 1) / 2),
    )
    .map((point) => {
      const denominator = Math.max(1, graphTimeline.length - 1);
      return {
        id: point.id,
        label: point.label,
        left: GRAPH_PADDING.left + (point.index / denominator) * plotWidth,
      };
    });
}
