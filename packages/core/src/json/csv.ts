import { createAppError } from "@json-explore/core/types/errors";
import { isJsonArray, isJsonObject } from "@json-explore/core/json/node";
import {
  appendJsonPath,
  createRootJsonPath,
} from "@json-explore/core/json/path";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonPrimitive, JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export const CSV_DELIMITERS = [",", ";", "\t"] as const;

export type CsvDelimiter = (typeof CSV_DELIMITERS)[number];

export const CSV_DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  ",": "Comma",
  ";": "Semicolon",
  "\t": "Tab",
};

export interface JsonToCsvOptions {
  delimiter?: CsvDelimiter;
}

export type JsonToCsvResult = Result<string, AppError>;

function csvError(message: string): AppError {
  return createAppError("UNKNOWN", message);
}

function escapeCell(value: string, delimiter: string): string {
  if (
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(delimiter)
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function primitiveCell(value: JsonPrimitive): string {
  if (value === null) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

/**
 * Convert an array of flat objects to CSV.
 * Nested objects and arrays are rejected. The source document is not changed.
 */
export function jsonToCsv(
  value: JsonValue,
  options: JsonToCsvOptions = {},
): JsonToCsvResult {
  const delimiter = options.delimiter ?? ",";
  if (!isJsonArray(value)) {
    return {
      ok: false,
      error: csvError("CSV conversion needs an array of flat objects."),
    };
  }

  const rows: Array<Record<string, JsonPrimitive>> = [];
  for (let index = 0; index < value.length; index += 1) {
    const row = value[index]!;
    const rowPath = appendJsonPath(createRootJsonPath(), {
      type: "index",
      index,
    });
    if (!isJsonObject(row)) {
      return {
        ok: false,
        error: csvError(
          `Row ${String(index + 1)} is not an object (${rowPath}).`,
        ),
      };
    }

    const flat: Record<string, JsonPrimitive> = {};
    for (const key of Object.keys(row)) {
      const cell = row[key]!;
      if (isJsonObject(cell) || isJsonArray(cell)) {
        return {
          ok: false,
          error: csvError(
            `Nested values are not supported at ${appendJsonPath(rowPath, { type: "key", key })}.`,
          ),
        };
      }
      flat[key] = cell;
    }
    rows.push(flat);
  }

  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  if (headers.length === 0) {
    return { ok: true, value: "" };
  }

  const lines = [
    headers.map((header) => escapeCell(header, delimiter)).join(delimiter),
    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeCell(
            Object.prototype.hasOwnProperty.call(row, header)
              ? primitiveCell(row[header]!)
              : "",
            delimiter,
          ),
        )
        .join(delimiter),
    ),
  ];

  return { ok: true, value: lines.join("\n") };
}
