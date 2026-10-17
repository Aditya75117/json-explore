import type { JsonNodeType, JsonPrimitive } from "@json-explore/core/types/json";

/**
 * Counting convention (Phase 2 JsonDocument):
 * every `JsonNode` is one node. Object keys are not separate nodes.
 * A primitive leaf is a single node; its key lives on that node.
 * Root `$` is always counted. `{ user: { name, age } }` is 4 nodes:
 * `$`, `$.user`, `$.user.name`, `$.user.age`.
 */
export interface JsonTypeCounts {
  object: number;
  array: number;
  string: number;
  number: number;
  boolean: number;
  null: number;
}

export interface JsonKeyFrequency {
  key: string;
  count: number;
}

export interface JsonValueFrequency {
  value: JsonPrimitive;
  type: "string" | "number" | "boolean" | "null";
  count: number;
}

export interface JsonValueTypeStats {
  total: number;
  unique: number;
  repeated: number;
}

export interface JsonTopLevelEntry {
  nodeId: string;
  key: string;
  type: JsonNodeType;
  childCount: number;
}

export interface JsonDeepestNode {
  nodeId: string;
  path: string;
  depth: number;
  type: JsonNodeType;
}

export interface JsonStatistics {
  sizeInBytes: number;
  totalNodes: number;
  types: JsonTypeCounts;
  primitiveValues: number;
  uniquePrimitiveValues: number;
  repeatedPrimitiveValues: number;
  maxDepth: number;
  topLevelKeyCount: number;
  uniqueKeys: number;
  repeatedKeys: number;
  keyFrequency: JsonKeyFrequency[];
  valueFrequency: JsonValueFrequency[];
  valueTypes: {
    string: JsonValueTypeStats;
    number: JsonValueTypeStats;
    boolean: JsonValueTypeStats;
    null: JsonValueTypeStats;
  };
  topLevelEntries: JsonTopLevelEntry[];
  deepestNode: JsonDeepestNode;
  keysTruncated: boolean;
  valuesTruncated: boolean;
}
