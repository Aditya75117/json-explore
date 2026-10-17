/**
 * Application-facing error taxonomy.
 * UI should render `message`; never expose stack traces to end users.
 * Never attach raw JSON document content to errors.
 */

export type AppErrorCode =
  | "INVALID_JSON"
  | "FILE_READ_ERROR"
  | "UNSUPPORTED_FILE"
  | "QUERY_SYNTAX_ERROR"
  | "SEARCH_ERROR"
  | "WORKER_ERROR"
  | "LARGE_FILE_LIMIT"
  | "STATISTICS_ERROR"
  | "UNKNOWN";

export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: string;
}

export interface JsonParseError extends AppError {
  code: "INVALID_JSON";
  /** 1-based line when it can be derived from the parser error. */
  line?: number;
  /** 1-based column when it can be derived from the parser error. */
  column?: number;
  /** 0-based offset into the source string when reported by the engine. */
  position?: number;
  /** Original engine message; UI may show a sanitized form, never the document. */
  rawMessage?: string;
}

export function createAppError(
  code: AppErrorCode,
  message: string,
  details?: string,
): AppError {
  return details === undefined ? { code, message } : { code, message, details };
}

export function createJsonParseError(
  error: Omit<JsonParseError, "code"> & { code?: "INVALID_JSON" },
): JsonParseError {
  const result: JsonParseError = {
    code: "INVALID_JSON",
    message: error.message,
  };

  if (error.details !== undefined) {
    result.details = error.details;
  }
  if (error.line !== undefined) {
    result.line = error.line;
  }
  if (error.column !== undefined) {
    result.column = error.column;
  }
  if (error.position !== undefined) {
    result.position = error.position;
  }
  if (error.rawMessage !== undefined) {
    result.rawMessage = error.rawMessage;
  }

  return result;
}
