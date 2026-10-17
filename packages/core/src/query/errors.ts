import type { QueryError } from "@json-explore/core/types/query";

export function createQueryError(
  message: string,
  position?: number,
): QueryError {
  const error: QueryError = {
    code: "QUERY_SYNTAX_ERROR",
    message,
  };
  if (position !== undefined) {
    error.position = position;
    error.column = position + 1;
  }
  return error;
}
