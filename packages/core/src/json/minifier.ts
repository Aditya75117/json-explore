import { parseJson } from "@json-explore/core/json/parser";
import type { JsonParseError } from "@json-explore/core/types/errors";
import type { JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export type MinifyJsonResult = Result<string, JsonParseError>;

export function stringifyMinified(value: JsonValue): string {
  return JSON.stringify(value);
}

/**
 * Validate then compact. Invalid input is never stringified.
 */
export function minifyJson(input: string): MinifyJsonResult {
  const parsed = parseJson(input);
  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    value: stringifyMinified(parsed.value),
  };
}
