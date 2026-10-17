import {
  MAX_TRACKED_KEYS,
  MAX_TRACKED_VALUES,
  STATISTICS_TOP_N,
} from "@json-explore/core/constants/statistics";
import { getJsonNode } from "@json-explore/core/json/document";
import {
  primitiveValueIdentity,
  type PrimitiveNodeType,
} from "@json-explore/core/statistics/value-identity";
import type { JsonDocument, JsonNode, JsonPrimitive } from "@json-explore/core/types/json";
import type {
  JsonDeepestNode,
  JsonKeyFrequency,
  JsonStatistics,
  JsonTopLevelEntry,
  JsonValueFrequency,
  JsonValueTypeStats,
} from "@json-explore/core/types/statistics";

interface TrackedValue {
  value: JsonPrimitive;
  type: PrimitiveNodeType;
  count: number;
}

function isPrimitiveType(type: JsonNode["type"]): type is PrimitiveNodeType {
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "null"
  );
}

function topLevelLabel(node: JsonNode): string {
  if (node.key !== null) {
    return node.key;
  }
  if (node.index !== null) {
    return `[${String(node.index)}]`;
  }
  return node.path;
}

function compareFrequency<T extends { count: number }>(
  left: T,
  right: T,
  label: (item: T) => string,
): number {
  if (right.count !== left.count) {
    return right.count - left.count;
  }
  return label(left).localeCompare(label(right));
}

function finalizeTypeStats(
  total: number,
  unique: number,
): JsonValueTypeStats {
  return {
    total,
    unique,
    repeated: Math.max(0, total - unique),
  };
}

/**
 * Single DFS pass over the Phase 2 document. Does not walk raw JSON
 * and does not store every path for every key/value.
 */
export function analyzeJsonDocument(document: JsonDocument): JsonStatistics {
  const root = getJsonNode(document, document.rootId);
  if (!root) {
    throw new Error("JSON document is missing a root node.");
  }

  const types = {
    object: 0,
    array: 0,
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
  };
  const keyCounts = new Map<string, number>();
  const valueCounts = new Map<string, TrackedValue>();
  let overflowUniqueKeys = 0;
  let overflowUniqueValues = 0;
  const uniqueByType = {
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
  };
  let deepest: JsonDeepestNode = {
    nodeId: root.id,
    path: root.path,
    depth: root.depth,
    type: root.type,
  };

  const stack = [root.id];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id) {
      break;
    }
    const node = getJsonNode(document, id);
    if (!node) {
      continue;
    }

    types[node.type] += 1;

    if (node.depth > deepest.depth) {
      deepest = {
        nodeId: node.id,
        path: node.path,
        depth: node.depth,
        type: node.type,
      };
    }

    if (node.key !== null) {
      const seen = keyCounts.get(node.key);
      if (seen !== undefined) {
        keyCounts.set(node.key, seen + 1);
      } else if (keyCounts.size < MAX_TRACKED_KEYS) {
        keyCounts.set(node.key, 1);
      } else {
        overflowUniqueKeys += 1;
      }
    }

    if (isPrimitiveType(node.type) && node.primitiveValue !== undefined) {
      const identity = primitiveValueIdentity(node.type, node.primitiveValue);
      const seen = valueCounts.get(identity);
      if (seen) {
        seen.count += 1;
      } else if (valueCounts.size < MAX_TRACKED_VALUES) {
        valueCounts.set(identity, {
          value: node.primitiveValue,
          type: node.type,
          count: 1,
        });
        uniqueByType[node.type] += 1;
      } else {
        overflowUniqueValues += 1;
        uniqueByType[node.type] += 1;
      }
    }

    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const childId = node.childIds[index];
      if (childId) {
        stack.push(childId);
      }
    }
  }

  const totalNodes =
    types.object +
    types.array +
    types.string +
    types.number +
    types.boolean +
    types.null;
  const primitiveValues =
    types.string + types.number + types.boolean + types.null;
  const uniqueKeys = keyCounts.size + overflowUniqueKeys;
  let repeatedKeys = 0;
  const keyFrequency: JsonKeyFrequency[] = [];
  for (const [key, count] of keyCounts) {
    keyFrequency.push({ key, count });
    if (count > 1) {
      repeatedKeys += 1;
    }
  }
  keyFrequency.sort((left, right) =>
    compareFrequency(left, right, (item) => item.key),
  );

  const uniquePrimitiveValues = valueCounts.size + overflowUniqueValues;
  const valueFrequency: JsonValueFrequency[] = [];
  for (const tracked of valueCounts.values()) {
    valueFrequency.push({
      value: tracked.value,
      type: tracked.type,
      count: tracked.count,
    });
  }
  valueFrequency.sort((left, right) =>
    compareFrequency(
      left,
      right,
      (item) => `${item.type}:${JSON.stringify(item.value)}`,
    ),
  );

  const topLevelEntries: JsonTopLevelEntry[] = [];
  for (const childId of root.childIds) {
    const child = getJsonNode(document, childId);
    if (!child) {
      continue;
    }
    topLevelEntries.push({
      nodeId: child.id,
      key: topLevelLabel(child),
      type: child.type,
      childCount: child.childIds.length,
    });
  }

  return {
    sizeInBytes: document.metadata.sizeInBytes,
    totalNodes,
    types,
    primitiveValues,
    uniquePrimitiveValues,
    repeatedPrimitiveValues: Math.max(
      0,
      primitiveValues - uniquePrimitiveValues,
    ),
    maxDepth: deepest.depth,
    topLevelKeyCount: topLevelEntries.length,
    uniqueKeys,
    repeatedKeys,
    keyFrequency: keyFrequency.slice(0, STATISTICS_TOP_N),
    valueFrequency: valueFrequency.slice(0, STATISTICS_TOP_N),
    valueTypes: {
      string: finalizeTypeStats(types.string, uniqueByType.string),
      number: finalizeTypeStats(types.number, uniqueByType.number),
      boolean: finalizeTypeStats(types.boolean, uniqueByType.boolean),
      null: finalizeTypeStats(types.null, uniqueByType.null),
    },
    topLevelEntries,
    deepestNode: deepest,
    keysTruncated: overflowUniqueKeys > 0,
    valuesTruncated: overflowUniqueValues > 0,
  };
}
