import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import type { AppError, JsonParseError } from "@json-explore/core/types/errors";

export function jsonErrorTitle(error: AppError | null): string {
  if (!error) {
    return "Could not use this JSON";
  }

  switch (error.code) {
    case "INVALID_JSON":
      return error.message === JSON_ERROR_MESSAGES.empty
        ? JSON_ERROR_MESSAGES.empty
        : JSON_ERROR_MESSAGES.invalid;
    case "FILE_READ_ERROR":
    case "UNSUPPORTED_FILE":
      return JSON_ERROR_MESSAGES.fileRead;
    case "WORKER_ERROR":
      return JSON_ERROR_MESSAGES.worker;
    case "SEARCH_ERROR":
      return JSON_ERROR_MESSAGES.search;
    case "QUERY_SYNTAX_ERROR":
      return JSON_ERROR_MESSAGES.query;
    case "LARGE_FILE_LIMIT":
      return JSON_ERROR_MESSAGES.largeFile;
    case "STATISTICS_ERROR":
      return JSON_ERROR_MESSAGES.statistics;
    default:
      return "Could not use this JSON";
  }
}

/**
 * User-facing explanation of a parse failure.
 * Never includes the engine message, which can echo source text.
 */
export function describeJsonError(error: AppError): string {
  if (error.code !== "INVALID_JSON") {
    return error.details && error.details !== error.message
      ? `${error.message}. ${error.details}`
      : error.message;
  }

  const parseError = error as JsonParseError;
  const reason = reasonFromRaw(parseError.rawMessage);
  const location = locationPhrase(parseError);
  const explanation = location ? `${reason}, ${location}.` : `${reason}.`;
  return `${explanation} Edit the source to fix this.`;
}

function reasonFromRaw(raw: string | undefined): string {
  if (!raw) {
    return "This JSON has a syntax error";
  }
  if (/unterminated string/i.test(raw)) {
    return "A string is missing its closing quote";
  }
  if (/unexpected end of json/i.test(raw)) {
    return "The JSON ended before it was complete";
  }
  if (/non-whitespace character after json/i.test(raw)) {
    return "There is extra text after the JSON value";
  }
  if (/expected ',' or '}'/i.test(raw)) {
    return "A comma is missing between properties";
  }
  if (/expected ',' or ']'/i.test(raw)) {
    return "A comma is missing between array items";
  }
  if (/unexpected token ']'|unexpected token '\]'/i.test(raw)) {
    return "There is a trailing comma in an array";
  }
  if (/expected double-quoted property name/i.test(raw)) {
    return "A property name must be in double quotes";
  }
  if (/expected property name/i.test(raw)) {
    return "A property name is missing or is not in double quotes";
  }
  if (/is not valid json/i.test(raw)) {
    return "This value is not valid JSON";
  }
  return "This JSON has a syntax error";
}

function locationPhrase(error: JsonParseError): string | undefined {
  if (error.line !== undefined && error.column !== undefined) {
    return `near line ${error.line}, column ${error.column}`;
  }
  if (error.line !== undefined) {
    return `near line ${error.line}`;
  }
  return undefined;
}
