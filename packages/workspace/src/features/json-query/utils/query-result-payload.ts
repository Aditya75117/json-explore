import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { materializeJsonValue } from "@json-explore/core/json/traverse";
import type { JsonDocument, JsonNodeType, JsonValue } from "@json-explore/core/types/json";
import type { JsonQueryResult } from "@json-explore/core/types/query";

export type QueryResultValueType = JsonNodeType | "mixed";

export function getQueryResultValueType(
  results: readonly JsonQueryResult[],
): QueryResultValueType {
  const first = results[0]?.type;
  if (!first) {
    return "mixed";
  }

  for (const result of results) {
    if (result.type !== first) {
      return "mixed";
    }
  }

  return first;
}

export function collectQueryResultValues(
  document: JsonDocument,
  results: readonly JsonQueryResult[],
): JsonValue[] {
  const values: JsonValue[] = [];

  for (const result of results) {
    if (result.primitiveValue !== undefined) {
      values.push(result.primitiveValue);
      continue;
    }

    const value = materializeJsonValue(document, result.nodeId);
    if (value !== undefined) {
      values.push(value);
    }
  }

  return values;
}

export function formatQueryResultValues(values: JsonValue[]): string {
  return stringifyFormatted(values);
}
