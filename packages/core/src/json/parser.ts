import { emptyJsonError, normalizeJsonParseError } from "@json-explore/core/json/errors";
import type { JsonParseError } from "@json-explore/core/types/errors";
import type { JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export type ParseJsonResult = Result<JsonValue, JsonParseError>;

/**
 * Parse a JSON document without throwing.
 * Passes the original source to `JSON.parse` so error offsets stay aligned.
 */
export function parseJson(input: string): ParseJsonResult {
  if (input.trim().length === 0) {
    return { ok: false, error: emptyJsonError() };
  }

  try {
    const value = JSON.parse(input) as JsonValue;
    return { ok: true, value };
  } catch (caught) {
    return {
      ok: false,
      error: normalizeJsonParseError(input, caught),
    };
  }
}
