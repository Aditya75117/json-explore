import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import {
  createJsonParseError,
  type JsonParseError,
} from "@json-explore/core/types/errors";

const POSITION_PATTERN = /position\s+(\d+)/i;
const LINE_COLUMN_PATTERN = /line\s+(\d+)\s+column\s+(\d+)/i;

export interface SourceLocation {
  line: number;
  column: number;
}

/**
 * Convert a 0-based source offset to 1-based line/column.
 * Returns undefined when the offset is not a valid index into `source`.
 */
export function locationFromPosition(
  source: string,
  position: number,
): SourceLocation | undefined {
  if (!Number.isInteger(position) || position < 0 || position > source.length) {
    return undefined;
  }

  let line = 1;
  let column = 1;

  for (let index = 0; index < position; index += 1) {
    const char = source[index];
    if (char === "\r") {
      const next = source[index + 1];
      if (next === "\n" && index + 1 < position) {
        index += 1;
      }
      line += 1;
      column = 1;
    } else if (char === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
}

/**
 * Convert a 1-based line/column to a 0-based source offset, clamped to the
 * end of that line. Line breaks are counted the same way as
 * `locationFromPosition`.
 */
export function positionFromLocation(
  source: string,
  line: number,
  column = 1,
): number {
  let currentLine = 1;
  let index = 0;

  while (currentLine < line && index < source.length) {
    const char = source[index];
    if (char === "\r") {
      index += source[index + 1] === "\n" ? 2 : 1;
      currentLine += 1;
    } else if (char === "\n") {
      index += 1;
      currentLine += 1;
    } else {
      index += 1;
    }
  }

  let lineEnd = index;
  while (
    lineEnd < source.length &&
    source[lineEnd] !== "\n" &&
    source[lineEnd] !== "\r"
  ) {
    lineEnd += 1;
  }

  return Math.min(index + Math.max(column - 1, 0), lineEnd);
}

export function extractPositionFromMessage(
  message: string,
): number | undefined {
  const match = POSITION_PATTERN.exec(message);
  if (!match) {
    return undefined;
  }

  const raw = match[1];
  if (raw === undefined) {
    return undefined;
  }

  const position = Number.parseInt(raw, 10);
  return Number.isFinite(position) ? position : undefined;
}

export function extractLineColumnFromMessage(
  message: string,
): SourceLocation | undefined {
  const match = LINE_COLUMN_PATTERN.exec(message);
  if (!match) {
    return undefined;
  }

  const lineRaw = match[1];
  const columnRaw = match[2];
  if (lineRaw === undefined || columnRaw === undefined) {
    return undefined;
  }

  const line = Number.parseInt(lineRaw, 10);
  const column = Number.parseInt(columnRaw, 10);

  if (
    !Number.isFinite(line) ||
    !Number.isFinite(column) ||
    line < 1 ||
    column < 1
  ) {
    return undefined;
  }

  return { line, column };
}

function locationDetails(line?: number, column?: number): string | undefined {
  if (line !== undefined && column !== undefined) {
    return `Unexpected token near line ${line}, column ${column}`;
  }
  if (line !== undefined) {
    return `Unexpected token near line ${line}`;
  }
  return undefined;
}

/**
 * Normalize native `JSON.parse` failures into a structured, user-facing error.
 * Line/column are included only when they can be derived — never invented.
 */
export function normalizeJsonParseError(
  source: string,
  caught: unknown,
): JsonParseError {
  const rawMessage =
    caught instanceof Error
      ? caught.message
      : typeof caught === "string"
        ? caught
        : "Unknown parse error";

  const position = extractPositionFromMessage(rawMessage);
  const messageLocation = extractLineColumnFromMessage(rawMessage);
  const derived =
    position !== undefined ? locationFromPosition(source, position) : undefined;

  const line = derived?.line ?? messageLocation?.line;
  const column = derived?.column ?? messageLocation?.column;
  const details = locationDetails(line, column);

  return createJsonParseError({
    message: JSON_ERROR_MESSAGES.invalid,
    rawMessage,
    ...(details !== undefined ? { details } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(line !== undefined ? { line } : {}),
    ...(column !== undefined ? { column } : {}),
  });
}

export function emptyJsonError(): JsonParseError {
  return createJsonParseError({
    message: JSON_ERROR_MESSAGES.empty,
  });
}
