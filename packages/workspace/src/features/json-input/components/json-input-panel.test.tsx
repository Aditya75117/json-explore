import { parseJson } from "@json-explore/core/json/parser";
import { JsonInputPanel } from "@json-explore/workspace/features/json-input/components/json-input-panel";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function parseErrorFor(source: string) {
  const parsed = parseJson(source);
  if (parsed.ok) {
    throw new Error("expected invalid JSON");
  }
  return parsed.error;
}

function renderPanel(source: string) {
  const error = parseErrorFor(source);
  render(
    <JsonInputPanel
      value={source}
      onChange={() => {}}
      onLoadContent={() => {}}
      isValid={false}
      error={error}
    />,
  );
  return error;
}

describe("Go to input", () => {
  it("moves the caret to the reported error location", async () => {
    const user = userEvent.setup();
    const source = [
      "{",
      '  "one": 1,',
      '  "two": 2,',
      '  "three": 3,',
      '  "four": 4,',
      '  "five": 5,',
      '  "six": 6,',
      '  "seven": 7,',
      '  "eight": 8,',
      '  "nine": 9 "ten": 10',
      "}",
    ].join("\n");
    const error = renderPanel(source);
    expect(error.line).toBe(10);
    expect(error.column).toBe(13);

    await user.click(screen.getByRole("button", { name: "Go to input" }));

    const textarea = screen.getByRole("textbox", {
      name: "JSON input",
    }) as HTMLTextAreaElement;
    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe(error.position);
    expect(textarea.selectionEnd).toBe(error.position);
    expect(source.slice(textarea.selectionStart)).toMatch(/^"ten"/);
  });

  it("uses line and column when the parser gives no offset", async () => {
    const user = userEvent.setup();
    const source = '{\n  "a": 1,\n  "b" 2\n}';
    const parsed = parseErrorFor(source);
    const { position: _position, ...error } = parsed;
    render(
      <JsonInputPanel
        value={source}
        onChange={() => {}}
        onLoadContent={() => {}}
        isValid={false}
        error={error}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Go to input" }));

    const textarea = screen.getByRole("textbox", {
      name: "JSON input",
    }) as HTMLTextAreaElement;
    expect(textarea.selectionStart).toBe(parsed.position);
  });
});
