import { MAX_SEARCH_RESULTS } from "@json-explore/core/constants/search";
import {
  keyMatches,
  normalizeSearchText,
  valueMatches,
} from "@json-explore/core/search/match";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  JsonSearchResponse,
  JsonSearchResult,
  SearchMatchType,
  SearchOptions,
} from "@json-explore/core/types/search";

function toSearchResult(
  node: JsonDocument["nodes"][string],
  matchType: SearchMatchType,
): JsonSearchResult {
  return {
    nodeId: node.id,
    path: node.path,
    key: node.key,
    index: node.index,
    type: node.type,
    matchType,
    ...(node.primitiveValue !== undefined
      ? { primitiveValue: node.primitiveValue }
      : {}),
  };
}

/**
 * Search a Phase 2 `JsonDocument` in document traversal order.
 *
 * Walks the existing node graph (DFS via `childIds`). Does not stringify
 * JSON, walk the DOM, or invent node IDs.
 *
 * No inverted index in Phase 4: default matching is case-insensitive and
 * partial, so every key/value still has to be inspected. Large documents
 * are offloaded to the worker instead.
 */
export function searchJson(
  document: JsonDocument,
  options: SearchOptions,
): JsonSearchResponse {
  const query = options.query.trim();
  const mode = options.mode;
  const caseSensitive = options.caseSensitive ?? false;
  const exactMatch = options.exactMatch ?? false;
  const maxResults = options.maxResults ?? MAX_SEARCH_RESULTS;

  if (query.length === 0) {
    return {
      query,
      mode,
      matchCount: 0,
      results: [],
      truncated: false,
    };
  }

  const needle = normalizeSearchText(query, caseSensitive);
  const results: JsonSearchResult[] = [];
  let matchCount = 0;

  const stack = [document.rootId];

  while (stack.length > 0) {
    const id = stack.pop();
    if (!id) {
      break;
    }

    const node = document.nodes[id];
    if (!node) {
      continue;
    }

    const checkKey = mode === "key" || mode === "all";
    const checkValue = mode === "value" || mode === "all";
    const keyHit = checkKey
      ? keyMatches(node, needle, caseSensitive, exactMatch)
      : false;
    const valueHit = checkValue
      ? valueMatches(node, needle, caseSensitive, exactMatch)
      : false;

    if (keyHit || valueHit) {
      matchCount += 1;
      if (results.length < maxResults) {
        const matchType: SearchMatchType =
          keyHit && valueHit ? "both" : keyHit ? "key" : "value";
        results.push(toSearchResult(node, matchType));
      }
    }

    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const childId = node.childIds[index];
      if (childId) {
        stack.push(childId);
      }
    }
  }

  return {
    query,
    mode,
    matchCount,
    results,
    truncated: matchCount > results.length,
  };
}

export function createEmptySearchResponse(
  query = "",
  mode: SearchOptions["mode"] = "all",
): JsonSearchResponse {
  return {
    query,
    mode,
    matchCount: 0,
    results: [],
    truncated: false,
  };
}
