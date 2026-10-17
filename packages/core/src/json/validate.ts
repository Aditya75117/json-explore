import { parseJson } from "@json-explore/core/json/parser";
import type { JsonParseError } from "@json-explore/core/types/errors";
import type { Result } from "@json-explore/core/types/result";

export type ValidateJsonResult = Result<true, JsonParseError>;

/**
 * Validate JSON using the Phase 2 parser. Does not build a document.
 */
export function validateJson(input: string): ValidateJsonResult {
  const parsed = parseJson(input);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, value: true };
}
