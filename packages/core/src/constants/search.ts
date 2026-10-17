import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";
import type { SearchMode } from "@json-explore/core/types/search";

/** Debounce while typing. Empty queries flush immediately. */
export const SEARCH_DEBOUNCE_MS = 160;

/**
 * Soft cap on result rows kept in memory / sent to the UI.
 * `matchCount` still reports every matching node.
 */
export const MAX_SEARCH_RESULTS = 10_000;

/**
 * Offload search to the JSON worker when the document has this many
 * nodes or more (in addition to the existing byte-size threshold).
 */
export const SEARCH_WORKER_NODE_THRESHOLD =
  PERFORMANCE_LIMITS.workerNodeThreshold;

export const SEARCH_RESULT_ROW_HEIGHT_PX = 56;
export const SEARCH_RESULT_OVERSCAN = 8;

export const SEARCH_MODES: readonly SearchMode[] = ["all", "key", "value"];

export const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  all: "All",
  key: "Keys",
  value: "Values",
};
