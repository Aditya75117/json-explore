/**
 * Extensible worker protocol.
 * React talks only through this message contract — never imports worker internals.
 *
 * Requests are correlated by `requestId`. The client must never resolve a
 * promise using a response with a different id.
 */

import type { JsonIndentation } from "@json-explore/core/constants/json";
import type { AppErrorCode, JsonParseError } from "@json-explore/core/types/errors";
import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";
import type { JsonSearchResponse, SearchMode } from "@json-explore/core/types/search";
import type { JsonQueryResponse, QueryMode } from "@json-explore/core/types/query";
import type { JsonStatistics } from "@json-explore/core/types/statistics";

export type WorkerRequestType =
  | "parse"
  | "format"
  | "minify"
  | "serialize"
  | "analyze"
  | "search"
  | "query"
  | "ping";

export interface WorkerRequestBase {
  requestId: string;
  type: WorkerRequestType;
}

export interface ParseWorkerRequest extends WorkerRequestBase {
  type: "parse";
  payload: string;
}

export interface FormatWorkerRequest extends WorkerRequestBase {
  type: "format";
  payload: string;
  indentation?: JsonIndentation;
}

export interface MinifyWorkerRequest extends WorkerRequestBase {
  type: "minify";
  payload: string;
}

export interface WorkerDocumentRef {
  /**
   * Optional full graph. Omit when the Worker already cached this
   * `revision` from a previous parse — avoids another structured clone.
   */
  document?: JsonDocument;
  revision?: string;
}

export type AnalyzeWorkerPayload = WorkerDocumentRef;

export interface AnalyzeWorkerRequest extends WorkerRequestBase {
  type: "analyze";
  payload: AnalyzeWorkerPayload;
}

export interface SearchWorkerPayload extends WorkerDocumentRef {
  query: string;
  mode: SearchMode;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  maxResults?: number;
}

export interface SearchWorkerRequest extends WorkerRequestBase {
  type: "search";
  payload: SearchWorkerPayload;
}

export interface QueryWorkerPayload extends WorkerDocumentRef {
  query: string;
  mode: QueryMode;
  maxResults?: number;
}

export interface SerializeWorkerPayload {
  style: "formatted" | "minified";
  indentation?: JsonIndentation;
  revision?: string;
  /** Fallback when the Worker cache does not hold this document. */
  value?: JsonValue;
}

export interface SerializeWorkerRequest extends WorkerRequestBase {
  type: "serialize";
  payload: SerializeWorkerPayload;
}

export interface QueryWorkerRequest extends WorkerRequestBase {
  type: "query";
  payload: QueryWorkerPayload;
}

export interface PingWorkerRequest extends WorkerRequestBase {
  type: "ping";
  payload?: undefined;
}

export type WorkerRequest =
  | ParseWorkerRequest
  | FormatWorkerRequest
  | MinifyWorkerRequest
  | SerializeWorkerRequest
  | AnalyzeWorkerRequest
  | SearchWorkerRequest
  | QueryWorkerRequest
  | PingWorkerRequest;

export interface WorkerErrorPayload {
  code: AppErrorCode;
  message: string;
  details?: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface ParseWorkerSuccessPayload {
  value: JsonValue;
  document: JsonDocument;
}

export interface FormatWorkerSuccessPayload {
  formatted: string;
  value: JsonValue;
  document: JsonDocument;
}

export interface MinifyWorkerSuccessPayload {
  minified: string;
  value: JsonValue;
  document: JsonDocument;
}

export type SearchWorkerSuccessPayload = JsonSearchResponse;

export type QueryWorkerSuccessPayload = JsonQueryResponse;

export type AnalyzeWorkerSuccessPayload = JsonStatistics;

export interface SerializeWorkerSuccessPayload {
  output: string;
  style: "formatted" | "minified";
}

export type WorkerResponse =
  | {
      type: "success";
      requestId: string;
      requestType: WorkerRequestType;
      payload: unknown;
    }
  | {
      type: "error";
      requestId: string;
      requestType: WorkerRequestType;
      error: WorkerErrorPayload;
    }
  | {
      type: "progress";
      requestId: string;
      requestType: WorkerRequestType;
      message: string;
      progress?: number;
    };

export function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    type?: unknown;
    requestId?: unknown;
    requestType?: unknown;
  };

  if (typeof candidate.requestId !== "string") {
    return false;
  }

  if (
    candidate.type !== "success" &&
    candidate.type !== "error" &&
    candidate.type !== "progress"
  ) {
    return false;
  }

  if (typeof candidate.requestType !== "string") {
    return false;
  }

  return true;
}

const WORKER_REQUEST_TYPES: ReadonlySet<WorkerRequestType> = new Set([
  "parse",
  "format",
  "minify",
  "serialize",
  "analyze",
  "search",
  "query",
  "ping",
]);

export function isWorkerRequest(value: unknown): value is WorkerRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { requestId?: unknown; type?: unknown };
  return (
    typeof candidate.requestId === "string" &&
    typeof candidate.type === "string" &&
    WORKER_REQUEST_TYPES.has(candidate.type as WorkerRequestType)
  );
}

export function jsonParseErrorToWorkerError(
  error: JsonParseError,
): WorkerErrorPayload {
  const payload: WorkerErrorPayload = {
    code: error.code,
    message: error.message,
  };
  if (error.details !== undefined) {
    payload.details = error.details;
  }
  if (error.line !== undefined) {
    payload.line = error.line;
  }
  if (error.column !== undefined) {
    payload.column = error.column;
  }
  if (error.position !== undefined) {
    payload.position = error.position;
  }
  return payload;
}

export function workerErrorToJsonParseError(
  error: WorkerErrorPayload,
): JsonParseError {
  return {
    code: "INVALID_JSON",
    message: error.message,
    ...(error.details !== undefined ? { details: error.details } : {}),
    ...(error.line !== undefined ? { line: error.line } : {}),
    ...(error.column !== undefined ? { column: error.column } : {}),
    ...(error.position !== undefined ? { position: error.position } : {}),
  };
}
