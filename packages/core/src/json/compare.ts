import { stringifyMinified } from "@json-explore/core/json/minifier";
import { isJsonArray, isJsonObject } from "@json-explore/core/json/node";
import {
  appendJsonPath,
  createRootJsonPath,
} from "@json-explore/core/json/path";
import type { JsonValue } from "@json-explore/core/types/json";

export const MAX_JSON_DIFFS = 10_000;

export type JsonDiffKind = "added" | "removed" | "changed";

export interface JsonDiff {
  path: string;
  kind: JsonDiffKind;
  before?: JsonValue;
  after?: JsonValue;
}

export interface JsonCompareResult {
  diffs: JsonDiff[];
  truncated: boolean;
}

function sameJson(left: JsonValue, right: JsonValue): boolean {
  if (left === right) {
    return true;
  }
  if (isJsonArray(left) && isJsonArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => sameJson(item, right[index]!))
    );
  }
  if (isJsonObject(left) && isJsonObject(right)) {
    const leftKeys = Object.keys(left);
    if (leftKeys.length !== Object.keys(right).length) {
      return false;
    }
    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        sameJson(left[key]!, right[key]!),
    );
  }
  return false;
}

function pushDiff(
  diffs: JsonDiff[],
  diff: JsonDiff,
  maxDiffs: number,
): boolean {
  if (diffs.length >= maxDiffs) {
    return false;
  }
  diffs.push(diff);
  return true;
}

function collectDiffs(
  left: JsonValue,
  right: JsonValue,
  path: string,
  diffs: JsonDiff[],
  maxDiffs: number,
): boolean {
  if (sameJson(left, right)) {
    return true;
  }

  if (isJsonObject(left) && isJsonObject(right)) {
    const keys = Object.keys(left);
    for (const key of Object.keys(right)) {
      if (!Object.prototype.hasOwnProperty.call(left, key)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      const childPath = appendJsonPath(path, { type: "key", key });
      const inLeft = Object.prototype.hasOwnProperty.call(left, key);
      const inRight = Object.prototype.hasOwnProperty.call(right, key);
      if (inLeft && !inRight) {
        if (
          !pushDiff(
            diffs,
            { path: childPath, kind: "removed", before: left[key] },
            maxDiffs,
          )
        ) {
          return false;
        }
        continue;
      }
      if (!inLeft && inRight) {
        if (
          !pushDiff(
            diffs,
            { path: childPath, kind: "added", after: right[key] },
            maxDiffs,
          )
        ) {
          return false;
        }
        continue;
      }
      if (!collectDiffs(left[key]!, right[key]!, childPath, diffs, maxDiffs)) {
        return false;
      }
    }
    return true;
  }

  if (isJsonArray(left) && isJsonArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const childPath = appendJsonPath(path, { type: "index", index });
      if (index >= left.length) {
        if (
          !pushDiff(
            diffs,
            { path: childPath, kind: "added", after: right[index] },
            maxDiffs,
          )
        ) {
          return false;
        }
        continue;
      }
      if (index >= right.length) {
        if (
          !pushDiff(
            diffs,
            { path: childPath, kind: "removed", before: left[index] },
            maxDiffs,
          )
        ) {
          return false;
        }
        continue;
      }
      if (
        !collectDiffs(left[index]!, right[index]!, childPath, diffs, maxDiffs)
      ) {
        return false;
      }
    }
    return true;
  }

  return pushDiff(
    diffs,
    { path, kind: "changed", before: left, after: right },
    maxDiffs,
  );
}

/**
 * Structural comparison. Object keys match by name. Array items match by index.
 * A container that changes type is one change at that path.
 */
export function compareJsonValues(
  left: JsonValue,
  right: JsonValue,
  maxDiffs = MAX_JSON_DIFFS,
): JsonCompareResult {
  const diffs: JsonDiff[] = [];
  const completed = collectDiffs(
    left,
    right,
    createRootJsonPath(),
    diffs,
    maxDiffs,
  );
  return { diffs, truncated: !completed };
}

export function describeJsonDiff(diff: JsonDiff): string {
  if (diff.kind === "added") {
    return stringifyMinified(diff.after as JsonValue);
  }
  if (diff.kind === "removed") {
    return stringifyMinified(diff.before as JsonValue);
  }
  return `${stringifyMinified(diff.before as JsonValue)} → ${stringifyMinified(diff.after as JsonValue)}`;
}
