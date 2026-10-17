import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { validateJson } from "@json-explore/core/json/validate";
import { describe, expect, it } from "vitest";

describe("validateJson", () => {
  it("accepts a JSON document", () => {
    expect(validateJson('{"ok":true}')).toEqual({ ok: true, value: true });
  });

  it("rejects empty input", () => {
    const result = validateJson("  \n");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(JSON_ERROR_MESSAGES.empty);
      expect(result.error.line).toBeUndefined();
    }
  });

  it("reports the line and column of a syntax error", () => {
    const result = validateJson("{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(JSON_ERROR_MESSAGES.invalid);
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(2);
      expect(result.error.details).toBe(
        "Unexpected token near line 1, column 2",
      );
    }
  });
});
