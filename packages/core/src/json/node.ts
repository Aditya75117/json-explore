import type {
  JsonNode,
  JsonNodeType,
  JsonPrimitive,
  JsonValue,
} from "@json-explore/core/types/json";

export function isJsonObject(
  value: JsonValue,
): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue): value is JsonValue[] {
  return Array.isArray(value);
}

export function isJsonPrimitive(value: JsonValue): value is JsonPrimitive {
  return !isJsonObject(value) && !isJsonArray(value);
}

export function getJsonNodeType(value: JsonValue): JsonNodeType {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (typeof value === "object") {
    return "object";
  }
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "number") {
    return "number";
  }
  return "boolean";
}

/**
 * Deterministic node IDs: the JSON path of the node.
 *
 * Why this strategy:
 * - Unique within a document (paths are unambiguous).
 * - Stable for the document lifetime (same path → same id).
 * - Search/explorer can jump result → node without a side map.
 * - No random IDs that would churn on every rebuild of the same document.
 *
 * IDs are not unique across different documents in memory; the workspace
 * holds one document at a time in Phase 2.
 */
export function createJsonNodeId(path: string): string {
  return path;
}

export function isContainerNode(
  node: JsonNode,
): node is JsonNode & { type: "object" | "array" } {
  return node.type === "object" || node.type === "array";
}

export function primitiveValueOf(
  value: JsonValue,
): string | number | boolean | null | undefined {
  if (isJsonPrimitive(value)) {
    return value;
  }
  return undefined;
}
