import type { JsonPrimitive } from "@json-explore/core/types/json";
import type { JsonValueFrequency } from "@json-explore/core/types/statistics";

export type PrimitiveNodeType = JsonValueFrequency["type"];

/**
 * Distinguishes `"1"` from `1` and `true` from `"true"`.
 */
export function primitiveValueIdentity(
  type: PrimitiveNodeType,
  value: JsonPrimitive,
): string {
  return `${type}:${JSON.stringify(value)}`;
}

export function formatPrimitivePreview(
  type: PrimitiveNodeType,
  value: JsonPrimitive,
): string {
  if (type === "string") {
    return JSON.stringify(value);
  }
  if (type === "null") {
    return "null";
  }
  return String(value);
}

export function searchQueryForPrimitive(
  type: PrimitiveNodeType,
  value: JsonPrimitive,
): string {
  if (type === "string" && typeof value === "string") {
    return value;
  }
  if (type === "null") {
    return "null";
  }
  return String(value);
}
