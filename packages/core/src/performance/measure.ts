/**
 * Lightweight performance marks. Never records JSON content — only
 * operation names and durations. Production logging stays off.
 */

export type PerformanceMeasureName =
  | "json-parse"
  | "document-build"
  | "json-serialize"
  | "json-search"
  | "json-query"
  | "json-statistics"
  | "explorer-visible-list";

const lastDurations = new Map<PerformanceMeasureName, number>();
const openMarks = new Map<PerformanceMeasureName, number>();

function now(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

export function startMeasure(name: PerformanceMeasureName): void {
  openMarks.set(name, now());

  if (
    process.env.NODE_ENV !== "production" &&
    typeof performance !== "undefined" &&
    typeof performance.mark === "function"
  ) {
    performance.mark(`json-explore:${name}:start`);
  }
}

export function endMeasure(name: PerformanceMeasureName): number {
  const started = openMarks.get(name);
  openMarks.delete(name);
  const duration = started === undefined ? 0 : now() - started;
  lastDurations.set(name, duration);

  if (
    process.env.NODE_ENV !== "production" &&
    typeof performance !== "undefined" &&
    typeof performance.mark === "function" &&
    typeof performance.measure === "function"
  ) {
    const startMark = `json-explore:${name}:start`;
    const endMark = `json-explore:${name}:end`;
    performance.mark(endMark);
    try {
      performance.measure(`json-explore:${name}`, startMark, endMark);
    } catch {
      // Marks may be missing if startMeasure was not called.
    }
  }

  return duration;
}

export function getLastMeasure(
  name: PerformanceMeasureName,
): number | undefined {
  return lastDurations.get(name);
}

export function getLastMeasures(): Record<string, number> {
  return Object.fromEntries(lastDurations);
}

export function clearPerformanceMeasures(): void {
  lastDurations.clear();
  openMarks.clear();
}
