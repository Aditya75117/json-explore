import type { JsonNodeType, JsonPrimitive } from "@json-explore/core/types/json";

/**
 * Search modes for the occurrence engine.
 *
 * `all` matches a node if its key, its primitive value, or both match.
 * Path / regex / JSONPath modes belong to later phases — keep this union
 * extensible without changing result identity (Phase 2 node IDs).
 */
export type SearchMode = "all" | "key" | "value";

export type SearchMatchType = "key" | "value" | "both";

export interface SearchOptions {
  query: string;
  mode: SearchMode;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  /** Cap on returned rows; `matchCount` is still the full occurrence total. */
  maxResults?: number;
}

/**
 * One matching node. `nodeId` is the Phase 2 path id — the same id the
 * explorer uses for `revealNode`. No nested JSON copies.
 */
export interface JsonSearchResult {
  nodeId: string;
  path: string;
  key: string | null;
  index: number | null;
  type: JsonNodeType;
  matchType: SearchMatchType;
  primitiveValue?: JsonPrimitive;
}

export interface JsonSearchResponse {
  query: string;
  mode: SearchMode;
  matchCount: number;
  results: JsonSearchResult[];
  truncated: boolean;
}
