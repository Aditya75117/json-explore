import type { JsonNode } from "@json-explore/core/types/json";

/**
 * Matching semantics (Phase 4 MVP)
 *
 * Default: case-insensitive, partial (`includes`).
 * `exactMatch` / `caseSensitive` are supported by the engine for later UI.
 *
 * Keys: object property names only. Array indexes and the root are not keys.
 *
 * Values: primitive leaves only — never `JSON.stringify` of objects/arrays.
 * - string → substring / exact against the raw string
 * - number → canonical `String(number)` (e.g. 101 → "101")
 * - boolean → "true" / "false"
 * - null → "null"
 */

export function normalizeSearchText(
  value: string,
  caseSensitive: boolean,
): string {
  return caseSensitive ? value : value.toLowerCase();
}

export function matchesSearchText(
  haystack: string,
  needle: string,
  exactMatch: boolean,
): boolean {
  if (needle.length === 0) {
    return false;
  }
  return exactMatch ? haystack === needle : haystack.includes(needle);
}

/**
 * Text a value-mode search compares against. `null` means "not a value
 * candidate" (objects / arrays are skipped).
 */
export function valueSearchHaystack(node: JsonNode): string | null {
  switch (node.type) {
    case "string":
      return typeof node.primitiveValue === "string" ? node.primitiveValue : "";
    case "number":
      return typeof node.primitiveValue === "number"
        ? String(node.primitiveValue)
        : null;
    case "boolean":
      return node.primitiveValue === true ? "true" : "false";
    case "null":
      return "null";
    default:
      return null;
  }
}

export function keyMatches(
  node: JsonNode,
  needle: string,
  caseSensitive: boolean,
  exactMatch: boolean,
): boolean {
  if (node.key === null) {
    return false;
  }
  return matchesSearchText(
    normalizeSearchText(node.key, caseSensitive),
    needle,
    exactMatch,
  );
}

export function valueMatches(
  node: JsonNode,
  needle: string,
  caseSensitive: boolean,
  exactMatch: boolean,
): boolean {
  const haystack = valueSearchHaystack(node);
  if (haystack === null) {
    return false;
  }
  return matchesSearchText(
    normalizeSearchText(haystack, caseSensitive),
    needle,
    exactMatch,
  );
}
