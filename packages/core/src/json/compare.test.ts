import {
  compareJsonValues,
  describeJsonDiff,
} from "@json-explore/core/json/compare";
import { describe, expect, it } from "vitest";

describe("compareJsonValues", () => {
  it("reports added, removed, and changed object paths", () => {
    const compared = compareJsonValues(
      { a: 1, b: { keep: true, drop: 2 }, same: "ok" },
      { a: 1, b: { keep: true, next: 3 }, same: "ok", extra: false },
    );

    expect(compared.truncated).toBe(false);
    expect(compared.diffs).toEqual([
      { path: "$.b.drop", kind: "removed", before: 2 },
      { path: "$.b.next", kind: "added", after: 3 },
      { path: "$.extra", kind: "added", after: false },
    ]);
    expect(describeJsonDiff(compared.diffs[0]!)).toBe("2");
    expect(describeJsonDiff(compared.diffs[1]!)).toBe("3");
  });

  it("treats object key order as the same document", () => {
    expect(compareJsonValues({ b: 1, a: 2 }, { a: 2, b: 1 }).diffs).toEqual([]);
  });

  it("compares arrays by index", () => {
    const compared = compareJsonValues([1, { id: 1 }, 3], [1, { id: 2 }, 4, 5]);

    expect(compared.diffs.map((diff) => [diff.path, diff.kind])).toEqual([
      ["$[1].id", "changed"],
      ["$[2]", "changed"],
      ["$[3]", "added"],
    ]);
    expect(describeJsonDiff(compared.diffs[0]!)).toBe("1 → 2");
  });

  it("reports a type change as one path", () => {
    const compared = compareJsonValues(
      { a: 1, list: [1] },
      { a: "1", list: { 0: 1 } },
    );

    expect(compared.diffs).toEqual([
      { path: "$.a", kind: "changed", before: 1, after: "1" },
      { path: "$.list", kind: "changed", before: [1], after: { 0: 1 } },
    ]);
    expect(describeJsonDiff(compared.diffs[0]!)).toBe('1 → "1"');
  });

  it("quotes keys that are not identifiers", () => {
    const compared = compareJsonValues({ "a.b": 1 }, { "a.b": 2 });
    expect(compared.diffs[0]?.path).toBe('$["a.b"]');
  });

  it("stops after the requested number of differences", () => {
    const compared = compareJsonValues({ a: 1, b: 2, c: 3 }, {}, 2);
    expect(compared.truncated).toBe(true);
    expect(compared.diffs).toHaveLength(2);
  });
});
