import { jsonToYaml } from "@json-explore/core/json/yaml";
import { describe, expect, it } from "vitest";

describe("jsonToYaml", () => {
  it("writes scalars without tags or aliases", () => {
    expect(jsonToYaml("Ada")).toBe("Ada");
    expect(jsonToYaml(true)).toBe("true");
    expect(jsonToYaml(false)).toBe("false");
    expect(jsonToYaml(null)).toBe("null");
    expect(jsonToYaml(2)).toBe("2");
    expect(jsonToYaml("true")).toBe('"true"');
    expect(jsonToYaml("01")).toBe('"01"');
    expect(jsonToYaml("")).toBe('""');
    expect(jsonToYaml("Ada")).not.toContain("!");
    expect(jsonToYaml("&anchor")).toBe('"&anchor"');
  });

  it("writes nested objects and arrays", () => {
    expect(
      jsonToYaml({
        user: { name: "Ada", active: true },
        tags: ["a", "b"],
        empty: {},
        none: [],
      }),
    ).toBe(
      [
        "user:",
        "  name: Ada",
        "  active: true",
        "tags:",
        "  - a",
        "  - b",
        "empty: {}",
        "none: []",
      ].join("\n"),
    );
    expect(
      jsonToYaml([
        { id: 1, name: "Ada" },
        { id: 2, name: "Grace" },
      ]),
    ).toBe(["- id: 1", "  name: Ada", "- id: 2", "  name: Grace"].join("\n"));
  });

  it("writes multiline strings as literal blocks", () => {
    expect(jsonToYaml({ bio: "line one\nline two" })).toBe(
      ["bio: |-", "  line one", "  line two"].join("\n"),
    );
  });
});
