import { JSON_PATH_IDENTIFIER, JSON_ROOT_PATH } from "@json-explore/core/constants/json";

export type JsonPathSegment =
  { type: "key"; key: string } | { type: "index"; index: number };

export function createRootJsonPath(): string {
  return JSON_ROOT_PATH;
}

export function isSafeJsonPathKey(key: string): boolean {
  return JSON_PATH_IDENTIFIER.test(key);
}

function bracketKey(key: string): string {
  return `[${JSON.stringify(key)}]`;
}

export function formatJsonPathKey(key: string): string {
  if (isSafeJsonPathKey(key)) {
    return `.${key}`;
  }

  return bracketKey(key);
}

export function formatJsonPathIndex(index: number): string {
  return `[${String(index)}]`;
}

/**
 * Append a property or array index to a parent path.
 * Special keys (hyphens, dots, spaces, quotes) use unambiguous bracket notation.
 */
export function appendJsonPath(
  parentPath: string,
  segment: JsonPathSegment,
): string {
  if (segment.type === "index") {
    return `${parentPath}${formatJsonPathIndex(segment.index)}`;
  }

  return `${parentPath}${formatJsonPathKey(segment.key)}`;
}

export function getJsonPath(segments: JsonPathSegment[]): string {
  return segments.reduce(
    (path, segment) => appendJsonPath(path, segment),
    createRootJsonPath(),
  );
}
