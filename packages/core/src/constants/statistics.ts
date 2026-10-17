import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";

/** Top frequencies shown in the UI. */
export const STATISTICS_TOP_N = 20;

/**
 * Max distinct keys stored for ranking. Unique-key count still increases
 * for additional first-seen keys (treated as unique).
 */
export const MAX_TRACKED_KEYS = 10_000;

/**
 * Max distinct primitive values stored for ranking. Extra first-seen
 * values increment the unique estimate without growing the map.
 */
export const MAX_TRACKED_VALUES = 8_000;

export const STATISTICS_WORKER_NODE_THRESHOLD =
  PERFORMANCE_LIMITS.workerNodeThreshold;
