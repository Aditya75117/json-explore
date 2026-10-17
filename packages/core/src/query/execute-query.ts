import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { createQueryError } from "@json-explore/core/query/errors";
import { evaluateQuery } from "@json-explore/core/query/evaluator";
import { parseQuery } from "@json-explore/core/query/parser";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  ExecuteQueryOptions,
  JsonQueryResponse,
  QueryError,
} from "@json-explore/core/types/query";
import type { Result } from "@json-explore/core/types/result";

/**
 * Parse then evaluate. Safe: never eval()s the query string.
 */
export function executeJsonQuery(
  document: JsonDocument,
  options: ExecuteQueryOptions,
): Result<JsonQueryResponse, QueryError> {
  const parsed = parseQuery(options.query, options.mode);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    return {
      ok: true,
      value: evaluateQuery(document, parsed.value, {
        ...(options.maxResults !== undefined
          ? { maxResults: options.maxResults }
          : {}),
      }),
    };
  } catch {
    return {
      ok: false,
      error: createQueryError(JSON_ERROR_MESSAGES.queryFailed),
    };
  }
}
