import {
  DEFAULT_JSON_INDENTATION,
  type JsonIndentation,
} from "@json-explore/core/constants/json";
import { parseJson } from "@json-explore/core/json/parser";
import type { JsonParseError } from "@json-explore/core/types/errors";
import type { JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export interface FormatJsonOptions {
  indentation?: JsonIndentation;
}

export type FormatJsonResult = Result<string, JsonParseError>;

export function stringifyFormatted(
  value: JsonValue,
  indentation: JsonIndentation = DEFAULT_JSON_INDENTATION,
): string {
  return JSON.stringify(value, null, indentation);
}

/**
 * Validate then pretty-print. Invalid input is never stringified.
 */
export function formatJson(
  input: string,
  options: FormatJsonOptions = {},
): FormatJsonResult {
  const parsed = parseJson(input);
  if (!parsed.ok) {
    return parsed;
  }

  const indentation = options.indentation ?? DEFAULT_JSON_INDENTATION;
  return {
    ok: true,
    value: stringifyFormatted(parsed.value, indentation),
  };
}
