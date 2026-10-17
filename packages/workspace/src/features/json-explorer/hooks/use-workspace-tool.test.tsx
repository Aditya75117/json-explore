import { useWorkspaceTool } from "@json-explore/workspace/features/json-explorer/hooks/use-workspace-tool";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("useWorkspaceTool", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/json");
  });

  it("selects Validate from ?tool=validate and keeps that URL", async () => {
    window.history.replaceState(null, "", "/json?tool=validate");
    const { result } = renderHook(() => useWorkspaceTool());

    await waitFor(() => {
      expect(result.current.tool).toBe("validate");
    });
    expect(result.current.definition.label).toBe("Validate");
    expect(window.location.search).toBe("?tool=validate");
  });

  it("opens Format and Repair from the URL and rewrites legacy tools", async () => {
    window.history.replaceState(null, "", "/json?tool=format");
    const format = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(format.result.current.tool).toBe("format");
    });
    expect(format.result.current.definition.label).toBe("Format");
    expect(window.location.search).toBe("?tool=format");
    format.unmount();

    window.history.replaceState(null, "", "/json?tool=repair");
    const repair = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(repair.result.current.tool).toBe("repair");
    });
    expect(repair.result.current.definition.label).toBe("Repair");
    expect(window.location.search).toBe("?tool=repair");
    repair.unmount();

    window.history.replaceState(null, "", "/json?tool=minify");
    const minify = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(minify.result.current.tool).toBe("format");
    });
    expect(minify.result.current.definition.label).toBe("Format");
    expect(window.location.search).toBe("?tool=format");
    minify.unmount();

    window.history.replaceState(null, "", "/json?tool=output");
    const output = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(output.result.current.tool).toBe("format");
    });
    expect(output.result.current.definition.label).toBe("Format");
    expect(window.location.search).toBe("?tool=format");
    output.unmount();

    window.history.replaceState(null, "", "/json?tool=compare");
    const compare = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(compare.result.current.tool).toBe("compare");
    });
    expect(compare.result.current.definition.label).toBe("Compare");
    expect(window.location.search).toBe("?tool=compare");
    compare.unmount();

    window.history.replaceState(null, "", "/json?tool=csv");
    const csv = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(csv.result.current.tool).toBe("csv");
    });
    expect(csv.result.current.definition.label).toBe("CSV");
    expect(window.location.search).toBe("?tool=csv");
    csv.unmount();

    window.history.replaceState(null, "", "/json?tool=yaml");
    const yaml = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(yaml.result.current.tool).toBe("yaml");
    });
    expect(yaml.result.current.definition.label).toBe("YAML");
    expect(window.location.search).toBe("?tool=yaml");
    yaml.unmount();

    window.history.replaceState(null, "", "/json?tool=schema");
    const schema = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(schema.result.current.tool).toBe("schema");
    });
    expect(schema.result.current.definition.label).toBe("Schema");
    expect(window.location.search).toBe("?tool=schema");
    schema.unmount();

    window.history.replaceState(null, "", "/json?tool=search");
    const search = renderHook(() => useWorkspaceTool());
    await waitFor(() => {
      expect(search.result.current.tool).toBe("explore");
    });
    expect(window.location.search).toBe("");
  });
});
