import {
  locationFromPosition,
  positionFromLocation,
} from "@json-explore/core/json/errors";
import { describe, expect, it } from "vitest";

describe("positionFromLocation", () => {
  it("round-trips with locationFromPosition across line endings", () => {
    const source = '{\n  "a": 1,\r\n  "b": 2\r  "c"\n}';
    for (let position = 0; position <= source.length; position += 1) {
      const location = locationFromPosition(source, position);
      if (!location || source[position - 1] === "\r") {
        continue;
      }
      expect(positionFromLocation(source, location.line, location.column)).toBe(
        position,
      );
    }
  });

  it("finds line 10, column 11", () => {
    const lines = Array.from(
      { length: 12 },
      (_, index) => `line-${index + 1}xxxxxxxx`,
    );
    const source = lines.join("\n");
    const offset = positionFromLocation(source, 10, 11);
    expect(source.slice(offset - 10, offset)).toBe("line-10xxx");
    expect(locationFromPosition(source, offset)).toEqual({
      line: 10,
      column: 11,
    });
  });

  it("clamps past the end of a line or the document", () => {
    expect(positionFromLocation("ab\ncd", 1, 99)).toBe(2);
    expect(positionFromLocation("ab\ncd", 9, 1)).toBe(5);
  });
});
