import { MAX_QUERY_RESULTS } from "@json-explore/core/constants/query";
import { getJsonNode } from "@json-explore/core/json/document";
import { isContainerNode } from "@json-explore/core/json/node";
import type { JsonDocument, JsonNode } from "@json-explore/core/types/json";
import type {
  JsonQueryResponse,
  JsonQueryResult,
  QueryAst,
  QueryStep,
} from "@json-explore/core/types/query";

function toQueryResult(node: JsonNode): JsonQueryResult {
  return {
    nodeId: node.id,
    path: node.path,
    key: node.key,
    index: node.index,
    type: node.type,
    ...(node.primitiveValue !== undefined
      ? { primitiveValue: node.primitiveValue }
      : {}),
  };
}

function childIdsMatchingKey(
  document: JsonDocument,
  node: JsonNode,
  key: string,
): string[] {
  const matches: string[] = [];
  for (const childId of node.childIds) {
    const child = getJsonNode(document, childId);
    if (child?.key === key) {
      matches.push(childId);
    }
  }
  return matches;
}

/**
 * Document-order descendants (and self) whose key matches.
 * Iterative so depth > 100 cannot overflow the stack.
 */
function collectRecursiveKey(
  document: JsonDocument,
  startId: string,
  key: string,
): string[] {
  const matches: string[] = [];
  const stack = [startId];

  while (stack.length > 0) {
    const id = stack.pop();
    if (!id) {
      break;
    }
    const node = getJsonNode(document, id);
    if (!node) {
      continue;
    }
    if (node.key === key) {
      matches.push(node.id);
    }
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const childId = node.childIds[index];
      if (childId) {
        stack.push(childId);
      }
    }
  }

  return matches;
}

function applyStep(
  document: JsonDocument,
  currentIds: readonly string[],
  step: QueryStep,
): string[] {
  if (step.type === "root") {
    return [...currentIds];
  }

  const next: string[] = [];

  for (const id of currentIds) {
    const node = getJsonNode(document, id);
    if (!node) {
      continue;
    }

    if (step.type === "property") {
      next.push(...childIdsMatchingKey(document, node, step.key));
      continue;
    }

    if (step.type === "index") {
      if (node.type !== "array") {
        continue;
      }
      const childId = node.childIds[step.index];
      if (childId) {
        next.push(childId);
      }
      continue;
    }

    if (step.type === "wildcard") {
      if (isContainerNode(node)) {
        next.push(...node.childIds);
      }
      continue;
    }

    next.push(...collectRecursiveKey(document, node.id, step.key));
  }

  return next;
}

/**
 * Evaluate a parsed query against the Phase 2 document graph.
 * Preserves document order. Does not rebuild or stringify JSON.
 */
export function evaluateQuery(
  document: JsonDocument,
  ast: QueryAst,
  options: { maxResults?: number } = {},
): JsonQueryResponse {
  const maxResults = options.maxResults ?? MAX_QUERY_RESULTS;
  let currentIds = [document.rootId];

  for (const step of ast.steps) {
    currentIds = applyStep(document, currentIds, step);
  }

  const results: JsonQueryResult[] = [];
  let matchCount = 0;

  for (const id of currentIds) {
    const node = getJsonNode(document, id);
    if (!node) {
      continue;
    }
    matchCount += 1;
    if (results.length < maxResults) {
      results.push(toQueryResult(node));
    }
  }

  return {
    query: ast.source,
    mode: ast.mode,
    matchCount,
    results,
    truncated: matchCount > results.length,
  };
}
