import type { AppError } from "@json-explore/core/types/errors";
import type { JsonNodeType, JsonPrimitive } from "@json-explore/core/types/json";

export type QueryMode = "path" | "jsonpath";

export interface QueryError extends AppError {
  code: "QUERY_SYNTAX_ERROR";
  position?: number;
  column?: number;
}

export type QueryStep =
  | { type: "root" }
  | { type: "property"; key: string }
  | { type: "index"; index: number }
  | { type: "wildcard" }
  | { type: "recursive"; key: string };

export interface QueryAst {
  source: string;
  mode: QueryMode;
  steps: QueryStep[];
}

/**
 * One matching node. `nodeId` is the Phase 2 path id used by `revealNode`.
 * Container values are not copied — use the document + nodeId.
 */
export interface JsonQueryResult {
  nodeId: string;
  path: string;
  key: string | null;
  index: number | null;
  type: JsonNodeType;
  primitiveValue?: JsonPrimitive;
}

export interface JsonQueryResponse {
  query: string;
  mode: QueryMode;
  matchCount: number;
  results: JsonQueryResult[];
  truncated: boolean;
}

export interface ExecuteQueryOptions {
  query: string;
  mode: QueryMode;
  maxResults?: number;
}
