import { JsonWorkspaceShell } from "@json-explore/workspace/features/json-explorer/components/json-workspace-shell";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

function toolTab(name: string) {
  return within(
    screen.getByRole("tablist", { name: "Workspace tools" }),
  ).getByRole("tab", { name });
}

function validatePanel() {
  return screen.getByRole("tabpanel", { name: "Validate" });
}

describe("Validate tab", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/json");
  });

  it("shows an empty result, then valid and invalid JSON", async () => {
    const user = userEvent.setup();
    render(<JsonWorkspaceShell />);

    await user.click(toolTab("Validate"));
    expect(validatePanel().textContent).toContain("No JSON to validate");
    expect(within(validatePanel()).getByText("No JSON")).toBeTruthy();

    const input = screen.getByRole("textbox", { name: "JSON input" });
    await user.clear(input);
    await user.click(input);
    await user.paste('{"ok":true}');

    await waitFor(() => {
      expect(validatePanel().textContent).toContain("Valid JSON");
    });
    expect(validatePanel().textContent).toContain(
      "This document parses successfully.",
    );
    expect(within(validatePanel()).getByText("Valid")).toBeTruthy();

    await user.clear(input);
    await user.click(input);
    await user.paste("{");

    await waitFor(() => {
      expect(within(validatePanel()).getByRole("alert").textContent).toContain(
        "Invalid JSON",
      );
    });
    expect(within(validatePanel()).getByRole("alert").textContent).toContain(
      "line 1, column 2",
    );
    expect(within(validatePanel()).getByRole("alert").textContent).toContain(
      "Edit the source to fix this.",
    );
    expect(
      within(validatePanel()).queryByRole("button", { name: "Fix JSON" }),
    ).toBeNull();
    expect(within(validatePanel()).getByText("Invalid")).toBeTruthy();
  });

  it("explains a fixable error and applies Fix JSON", async () => {
    const user = userEvent.setup();
    render(<JsonWorkspaceShell />);
    await user.click(toolTab("Validate"));

    const input = screen.getByRole("textbox", { name: "JSON input" });
    await user.click(input);
    await user.paste('{"a":1,}');

    await waitFor(() => {
      expect(within(validatePanel()).getByRole("alert").textContent).toContain(
        "Trailing comma, near line 1, column 8.",
      );
    });
    await user.click(
      within(validatePanel()).getByRole("button", { name: "Fix JSON" }),
    );
    await waitFor(() => {
      expect(validatePanel().textContent).toContain("Valid JSON");
    });
    expect(JSON.parse((input as HTMLTextAreaElement).value)).toEqual({ a: 1 });
  });

  it("pretty-prints and compacts on Format", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:format",
      revokeObjectURL: () => {},
    });

    window.history.replaceState(null, "", "/json?tool=format");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("Format").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=format");

    const input = screen.getByRole("textbox", { name: "JSON input" });
    await user.click(input);
    await user.paste('{"a":1}');

    const panel = () => screen.getByRole("tabpanel", { name: "Format" });
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON formatted");
    });
    const pretty = within(panel()).getByRole("textbox", {
      name: "Pretty JSON",
    }) as HTMLTextAreaElement;
    expect(JSON.parse(pretty.value)).toEqual({ a: 1 });
    expect(pretty.value).toContain("\n");

    await user.click(within(panel()).getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls.at(-1)?.[0])).toContain("\n");
    expect(panel().textContent).toContain("JSON copied");

    await user.click(within(panel()).getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON downloaded");
    });

    await user.click(screen.getByRole("radio", { name: "Compact" }));
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON minified");
    });

    await user.click(screen.getByRole("radio", { name: "Pretty" }));
    await user.clear(input);
    await user.click(input);
    await user.paste("{");
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Format" }).textContent,
      ).toContain("Cannot format invalid JSON");
    });
    vi.unstubAllGlobals();
  });

  it("compacts JSON from ?tool=minify on Format", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:minify",
      revokeObjectURL: () => {},
    });

    window.history.replaceState(null, "", "/json?tool=minify");
    render(<JsonWorkspaceShell initialOutputStyle="compact" />);
    await waitFor(() => {
      expect(toolTab("Format").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=format");
    expect(
      screen
        .getByRole("radio", { name: "Compact" })
        .getAttribute("aria-checked"),
    ).toBe("true");

    const input = screen.getByRole("textbox", { name: "JSON input" });
    const source = '{\n  "a": 1\n}';
    await user.click(input);
    await user.paste(source);

    const panel = () => screen.getByRole("tabpanel", { name: "Format" });
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON minified");
    });
    const compact = within(panel()).getByRole("textbox", {
      name: "Compact JSON",
    }) as HTMLTextAreaElement;
    expect(compact.value).toBe('{"a":1}');
    expect(input).toHaveProperty("value", source);

    await user.click(within(panel()).getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(writeText.mock.calls.at(-1)?.[0]).toBe('{"a":1}');
    expect(panel().textContent).toContain("JSON copied");

    await user.click(within(panel()).getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON downloaded");
    });

    await user.clear(input);
    await user.click(input);
    await user.paste("{");
    await waitFor(() => {
      expect(panel().textContent).toContain("Cannot minify invalid JSON");
    });

    await user.clear(input);
    await user.click(input);
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("radio", { name: "Pretty" }));
    await waitFor(() => {
      expect(panel().textContent).toContain("JSON formatted");
    });
    vi.unstubAllGlobals();
  });

  it("compares two documents and reports invalid comparison JSON", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/json?tool=compare");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("Compare").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=compare");
    expect(
      screen.getByRole("tabpanel", { name: "Compare" }).textContent,
    ).toContain("Nothing to compare");

    const source = screen.getByRole("textbox", { name: "JSON input" });
    const comparison = screen.getByRole("textbox", {
      name: "Comparison JSON",
    });
    const sourceText = '{"a":1,"b":[1,2]}';
    await user.click(source);
    await user.paste(sourceText);
    await user.click(comparison);
    await user.paste('{"a":"1","c":true,"b":[1,3]}');

    const panel = () => screen.getByRole("tabpanel", { name: "Compare" });
    await waitFor(() => {
      expect(panel().textContent).toContain("$.a");
    });
    expect(within(panel()).getAllByText("Changed").length).toBeGreaterThan(0);
    expect(within(panel()).getByText("Added")).toBeTruthy();
    expect(panel().textContent).toContain("$.b[1]");
    expect(panel().textContent).toContain("$.c");
    expect(panel().textContent).toContain('1 → "1"');
    expect(source).toHaveProperty("value", sourceText);

    await user.clear(comparison);
    await user.click(comparison);
    await user.paste("{");
    await waitFor(() => {
      expect(panel().textContent).toContain(
        "A property name is missing or is not in double quotes",
      );
    });
    expect(source).toHaveProperty("value", sourceText);

    await user.clear(source);
    await user.click(source);
    await user.paste('{"ok":true}');
    await user.clear(comparison);
    await user.click(comparison);
    await user.paste('{"ok":true}');
    await waitFor(() => {
      expect(panel().textContent).toContain("Documents match");
    });

    await user.click(toolTab("Validate"));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Validate" }).textContent,
      ).toContain("Valid JSON");
    });
  });

  it("converts flat objects to CSV and rejects nested values", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:csv",
      revokeObjectURL: () => {},
    });

    window.history.replaceState(null, "", "/json?tool=csv");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("CSV").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=csv");
    expect(screen.getByRole("tabpanel", { name: "CSV" }).textContent).toContain(
      "No JSON to convert",
    );

    const input = screen.getByRole("textbox", { name: "JSON input" });
    await user.click(input);
    await user.paste("{");
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "CSV" }).textContent,
      ).toContain("near line 1, column 2");
    });

    const source = '[{"name":"Ada, Lovelace","note":"Say \\"hi\\""}]';
    await user.clear(input);
    await user.click(input);
    await user.paste(source);

    const csvField = () =>
      screen.getByRole("textbox", { name: "CSV" }) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(csvField().value).toContain("name,note");
    });
    expect(csvField().value).toContain('"Ada, Lovelace"');
    expect(csvField().value).toContain('Say ""hi""');
    expect(input).toHaveProperty("value", source);

    await user.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls.at(-1)?.[0])).toContain("name,note");

    await user.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "CSV" }).textContent,
      ).toContain("JSON downloaded");
    });

    await user.click(screen.getByRole("radio", { name: "Semicolon" }));
    await waitFor(() => {
      expect(csvField().value).toContain("name;note");
    });
    expect(csvField().value).toContain("Ada, Lovelace");

    await user.clear(input);
    await user.click(input);
    await user.paste("[]");
    await waitFor(() => {
      expect(csvField().value).toBe("");
    });

    await user.clear(input);
    await user.click(input);
    await user.paste('[{"user":{"name":"Ada"}}]');
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "CSV" }).textContent,
      ).toContain("Nested values are not supported at $[0].user");
    });

    await user.clear(input);
    await user.click(input);
    await user.paste('{"ok":true}');
    await user.click(toolTab("Validate"));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Validate" }).textContent,
      ).toContain("Valid JSON");
    });
    vi.unstubAllGlobals();
  });

  it("converts JSON to YAML and reports invalid JSON", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:yaml",
      revokeObjectURL: () => {},
    });

    window.history.replaceState(null, "", "/json?tool=yaml");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("YAML").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=yaml");
    expect(
      screen.getByRole("tabpanel", { name: "YAML" }).textContent,
    ).toContain("No JSON to convert");

    const input = screen.getByRole("textbox", { name: "JSON input" });
    await user.click(input);
    await user.paste("{");
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "YAML" }).textContent,
      ).toContain("near line 1, column 2");
    });

    const source =
      '{"name":"Ada","active":true,"count":1,"note":null,"flag":"true","bio":"line one\\nline two","tags":["a","b"],"user":{"city":"London"}}';
    await user.clear(input);
    await user.click(input);
    await user.paste(source);

    const yamlField = () =>
      screen.getByRole("textbox", { name: "YAML" }) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(yamlField().value).toContain("name: Ada");
    });
    expect(yamlField().value).toContain("active: true");
    expect(yamlField().value).toContain("count: 1");
    expect(yamlField().value).toContain("note: null");
    expect(yamlField().value).toContain('flag: "true"');
    expect(yamlField().value).toContain("bio: |-");
    expect(yamlField().value).toContain("line one");
    expect(yamlField().value).toContain("line two");
    expect(yamlField().value).toContain("tags:");
    expect(yamlField().value).toContain("- a");
    expect(yamlField().value).toContain("city: London");
    expect(yamlField().value).not.toContain("!");
    expect(input).toHaveProperty("value", source);

    await user.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls.at(-1)?.[0])).toContain("name: Ada");

    await user.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "YAML" }).textContent,
      ).toContain("JSON downloaded");
    });

    await user.clear(input);
    await user.click(input);
    await user.paste('{"ok":true}');
    await user.click(toolTab("Validate"));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Validate" }).textContent,
      ).toContain("Valid JSON");
    });
    vi.unstubAllGlobals();
  });

  it("validates JSON against a schema and reports malformed schemas", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/json?tool=schema");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("Schema").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=schema");
    expect(
      screen.getByRole("tabpanel", { name: "Schema" }).textContent,
    ).toContain("Nothing to validate");

    const source = screen.getByRole("textbox", { name: "JSON input" });
    const schema = screen.getByRole("textbox", { name: "JSON Schema" });
    const schemaText =
      '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}},"required":["name","age"]}';
    await user.click(schema);
    await user.paste(schemaText);
    await user.click(source);
    await user.paste('{"name":"Ada","age":1}');

    const panel = () => screen.getByRole("tabpanel", { name: "Schema" });
    await waitFor(() => {
      expect(panel().textContent).toContain("Schema valid");
    });
    expect(within(panel()).getByText("Valid")).toBeTruthy();

    await user.clear(source);
    await user.click(source);
    await user.paste('{"name":1}');
    await waitFor(() => {
      expect(panel().textContent).toContain("$.name");
    });
    expect(panel().textContent).toContain("$.age");
    expect(within(panel()).getByText("type")).toBeTruthy();
    expect(within(panel()).getByText("required")).toBeTruthy();
    expect(within(panel()).getByText("Invalid")).toBeTruthy();
    expect(source).toHaveProperty("value", '{"name":1}');

    await user.clear(schema);
    await user.click(schema);
    await user.paste("{");
    await waitFor(() => {
      expect(panel().textContent).toContain("near line 1, column 2");
    });

    await user.clear(schema);
    await user.click(schema);
    await user.paste('{"type":"nope"}');
    await waitFor(() => {
      expect(panel().textContent).toContain("draft 2020-12");
    });
    expect(source).toHaveProperty("value", '{"name":1}');

    await user.clear(source);
    await user.click(source);
    await user.paste('{"ok":true}');
    await user.click(toolTab("Validate"));
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Validate" }).textContent,
      ).toContain("Valid JSON");
    });
  });

  it("repairs common JSON issues and reports an unrecoverable document", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/json?tool=repair");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("Repair").getAttribute("aria-selected")).toBe("true");
    });
    expect(window.location.search).toBe("?tool=repair");
    expect(
      screen.getByRole("tabpanel", { name: "Repair" }).textContent,
    ).toContain("No JSON to repair");

    const input = screen.getByRole("textbox", { name: "JSON input" });
    const cases = [
      ['{"a":1,}', "Trailing comma"],
      ["{'a':'b'}", "Single quotes"],
      ["{a:1}", "Unquoted property name"],
      ['{"a":1 "b":2}', "Missing comma"],
    ] as const;

    for (const [source, badge] of cases) {
      await user.clear(input);
      await user.click(input);
      await user.paste(source);
      const panel = screen.getByRole("tabpanel", { name: "Repair" });
      await waitFor(() => {
        expect(within(panel).getByText(badge)).toBeTruthy();
      });
      const repaired = within(panel).getByRole("textbox", {
        name: "Repaired JSON",
      }) as HTMLTextAreaElement;
      expect(JSON.parse(repaired.value)).toBeTruthy();
      expect(input).toHaveProperty("value", source);
    }

    await user.clear(input);
    await user.click(input);
    await user.paste("{");
    await waitFor(() => {
      expect(
        within(screen.getByRole("tabpanel", { name: "Repair" })).getByRole(
          "alert",
        ).textContent,
      ).toContain("The JSON ended before it was complete");
    });
    expect(input).toHaveProperty("value", "{");

    await user.clear(input);
    await user.click(input);
    await user.paste('{"ok":true}');
    await waitFor(() => {
      expect(
        screen.getByRole("tabpanel", { name: "Repair" }).textContent,
      ).toContain("Nothing to repair");
    });
  });

  it("reaches Validate from the keyboard and from the URL", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<JsonWorkspaceShell />);

    toolTab("Explore").focus();
    await user.keyboard("{End}");
    expect(toolTab("Validate").getAttribute("aria-selected")).toBe("true");
    expect(window.location.search).toBe("?tool=validate");
    unmount();

    window.history.replaceState(null, "", "/json?tool=validate");
    render(<JsonWorkspaceShell />);
    await waitFor(() => {
      expect(toolTab("Validate").getAttribute("aria-selected")).toBe("true");
    });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Validate",
    );
    expect(validatePanel().textContent).toContain("No JSON to validate");
  });
});
