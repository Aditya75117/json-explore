import {
  getWorkspaceTool,
  parseWorkspaceOutputStyle,
  parseWorkspaceToolParam,
  WORKSPACE_TOOLS,
} from "@json-explore/workspace/constants/workspace-tools";
import { describe, expect, it } from "vitest";

describe("workspace tool routing", () => {
  it("adds Validate without removing the existing tools", () => {
    expect(WORKSPACE_TOOLS.map((tool) => tool.id)).toEqual([
      "explore",
      "query",
      "statistics",
      "format",
      "repair",
      "compare",
      "csv",
      "yaml",
      "schema",
      "validate",
    ]);
    expect(getWorkspaceTool("format")).toMatchObject({
      label: "Format",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("repair")).toMatchObject({
      label: "Repair",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("compare")).toMatchObject({
      label: "Compare",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("csv")).toMatchObject({
      label: "CSV",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("yaml")).toMatchObject({
      label: "YAML",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("schema")).toMatchObject({
      label: "Schema",
      requiresDocument: false,
    });
    expect(getWorkspaceTool("validate")).toMatchObject({
      label: "Validate",
      requiresDocument: false,
    });
  });

  it("opens ?tool=validate on the Validate tab", () => {
    expect(parseWorkspaceToolParam("validate")).toBe("validate");
  });

  it("opens Format directly and maps legacy output routes", () => {
    expect(parseWorkspaceToolParam("format")).toBe("format");
    expect(parseWorkspaceToolParam("repair")).toBe("repair");
    expect(parseWorkspaceToolParam("output")).toBe("format");
    expect(parseWorkspaceToolParam("minify")).toBe("format");
    expect(parseWorkspaceToolParam("compare")).toBe("compare");
    expect(parseWorkspaceToolParam("csv")).toBe("csv");
    expect(parseWorkspaceToolParam("yaml")).toBe("yaml");
    expect(parseWorkspaceToolParam("schema")).toBe("schema");
    expect(parseWorkspaceToolParam("search")).toBe("explore");
    expect(parseWorkspaceOutputStyle("minify")).toBe("compact");
    expect(parseWorkspaceOutputStyle("output")).toBe("pretty");
    expect(parseWorkspaceOutputStyle("format")).toBe("pretty");
  });
});
