import { jsonToCsv } from "@json-explore/core/json/csv";
import { describe, expect, it } from "vitest";

describe("jsonToCsv", () => {
  it("writes a header row and escapes commas, quotes, and newlines", () => {
    const converted = jsonToCsv([
      { name: "Ada, Lovelace", note: 'Say "hi"' },
      { name: "Grace", note: "line\nbreak", city: "London" },
    ]);

    expect(converted.ok).toBe(true);
    if (!converted.ok) {
      return;
    }
    expect(converted.value).toBe(
      [
        "name,note,city",
        '"Ada, Lovelace","Say ""hi""",',
        'Grace,"line\nbreak",London',
      ].join("\n"),
    );
  });

  it("uses the selected delimiter", () => {
    const converted = jsonToCsv([{ name: "Ada, Lovelace", id: 1 }], {
      delimiter: ";",
    });
    expect(converted.ok).toBe(true);
    if (converted.ok) {
      expect(converted.value).toBe("name;id\nAda, Lovelace;1");
    }
  });

  it("returns an empty document for an empty array", () => {
    expect(jsonToCsv([])).toEqual({ ok: true, value: "" });
  });

  it("rejects nested objects and arrays", () => {
    const nestedObject = jsonToCsv([{ user: { name: "Ada" } }]);
    const nestedArray = jsonToCsv([{ tags: ["a"] }]);
    expect(nestedObject.ok).toBe(false);
    expect(nestedArray.ok).toBe(false);
    if (!nestedObject.ok && !nestedArray.ok) {
      expect(nestedObject.error.message).toContain("$[0].user");
      expect(nestedObject.error.message).toContain("Nested values");
      expect(nestedArray.error.message).toContain("$[0].tags");
      expect(nestedObject.error.message).not.toContain("Ada");
    }
  });

  it("rejects values that are not an array of objects", () => {
    const object = jsonToCsv({ name: "Ada" });
    const row = jsonToCsv(["Ada"]);
    expect(object.ok).toBe(false);
    expect(row.ok).toBe(false);
    if (!object.ok && !row.ok) {
      expect(object.error.message).toContain("array of flat objects");
      expect(row.error.message).toContain("$[0]");
      expect(object.error.message).not.toContain("Ada");
    }
  });
});
