import { validateJsonSchema } from "@json-explore/core/json/schema";
import { describe, expect, it } from "vitest";

const personSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["name", "age"],
};

describe("validateJsonSchema", () => {
  it("accepts a document that matches the schema", () => {
    const report = validateJsonSchema(
      { name: "Ada", age: 1, tags: ["engineer"] },
      personSchema,
    );
    expect(report.ok).toBe(true);
    if (report.ok) {
      expect(report.value.violations).toEqual([]);
    }
  });

  it("reports each violation path", () => {
    const report = validateJsonSchema(
      { name: 1, tags: ["ok", 2] },
      personSchema,
    );
    expect(report.ok).toBe(true);
    if (!report.ok) {
      return;
    }
    const paths = report.value.violations.map((item) => item.path);
    expect(paths).toContain("$.name");
    expect(paths).toContain("$.age");
    expect(paths).toContain("$.tags[1]");
    expect(
      report.value.violations.find((item) => item.path === "$.name")?.message,
    ).toContain("string");
    expect(
      report.value.violations.find((item) => item.path === "$.age")?.keyword,
    ).toBe("required");
  });

  it("rejects a schema that is not draft 2020-12", () => {
    const report = validateJsonSchema({}, { type: "nope" });
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error.message).toContain("draft 2020-12");
      expect(report.error.message).not.toContain("nope");
    }
    const arraySchema = validateJsonSchema({}, []);
    expect(arraySchema.ok).toBe(false);
    if (!arraySchema.ok) {
      expect(arraySchema.error.message).toContain("object or a boolean");
    }
  });
});
