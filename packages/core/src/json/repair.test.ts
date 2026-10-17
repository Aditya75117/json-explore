import { describeJsonError } from "@json-explore/core/json/error-copy";
import { parseJson } from "@json-explore/core/json/parser";
import { describeJsonRepair, repairJson } from "@json-explore/core/json/repair";
import { describe, expect, it } from "vitest";

function errorFor(source: string) {
  const parsed = parseJson(source);
  if (parsed.ok) {
    throw new Error("expected invalid JSON");
  }
  return parsed.error;
}

describe("describeJsonError", () => {
  it("explains an incomplete object without echoing the source", () => {
    const message = describeJsonError(errorFor("{"));
    expect(message).toContain("double quotes");
    expect(message).toContain("near line 1, column 2");
    expect(message).toContain("Edit the source to fix this.");
    expect(message).not.toContain("{");
  });

  it("explains a missing comma and an unfinished value", () => {
    expect(describeJsonError(errorFor('{"a":1 "b":2}'))).toContain(
      "A comma is missing between properties",
    );
    expect(describeJsonError(errorFor('{"a":'))).toContain(
      "The JSON ended before it was complete",
    );
  });
});

describe("repairJson", () => {
  it("fixes a trailing comma, single quotes, an unquoted key, and a missing comma", () => {
    const trailing = repairJson('{"a":1,}');
    expect(trailing.ok).toBe(true);
    if (trailing.ok) {
      expect(JSON.parse(trailing.value.json)).toEqual({ a: 1 });
      expect(trailing.value.fixes).toEqual(["trailing comma"]);
      expect(
        describeJsonRepair(trailing.value.fixes, errorFor('{"a":1,}')),
      ).toBe("Trailing comma, near line 1, column 8.");
    }

    const quotes = repairJson("{'a':'b'}");
    expect(quotes.ok).toBe(true);
    if (quotes.ok) {
      expect(JSON.parse(quotes.value.json)).toEqual({ a: "b" });
      expect(quotes.value.fixes).toEqual(["single quotes"]);
    }

    const key = repairJson("{a:1}");
    expect(key.ok).toBe(true);
    if (key.ok) {
      expect(JSON.parse(key.value.json)).toEqual({ a: 1 });
      expect(key.value.fixes).toEqual(["unquoted property name"]);
    }

    const missing = repairJson('{"a":1 "b":2}');
    expect(missing.ok).toBe(true);
    if (missing.ok) {
      expect(JSON.parse(missing.value.json)).toEqual({ a: 1, b: 2 });
      expect(missing.value.fixes).toEqual(["missing comma"]);
    }

    const array = repairJson("[1,]");
    expect(array.ok).toBe(true);
    if (array.ok) {
      expect(JSON.parse(array.value.json)).toEqual([1]);
    }
  });

  it("reports an unrecoverable document instead of inventing a fix", () => {
    const result = repairJson("{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain(
        "The JSON ended before it was complete",
      );
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(2);
      expect(result.error.message).not.toContain("{");
    }
  });
});
