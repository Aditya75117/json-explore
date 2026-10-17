import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { QUERY_WORKER_NODE_THRESHOLD } from "@json-explore/core/constants/query";
import {
  endMeasure,
  shouldOffloadToWorker,
  startMeasure,
} from "@json-explore/core/performance";
import { toWorkerDocumentRef } from "@json-explore/core/processing/worker-document-ref";
import { executeJsonQuery } from "@json-explore/core/query/execute-query";
import { createAppError, type AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  ExecuteQueryOptions,
  JsonQueryResponse,
  QueryError,
} from "@json-explore/core/types/query";
import type { Result } from "@json-explore/core/types/result";
import type { QueryWorkerSuccessPayload, WorkerResponse } from "@json-explore/core/types/worker";
import {
  getJsonWorkerClient,
  rememberWorkerDocumentRevision,
} from "@json-explore/core/workers/json-worker-client";

export type JsonQueryEngineResult = Result<
  JsonQueryResponse,
  QueryError | AppError
>;

export interface JsonQueryEngineOptions {
  forceWorker?: boolean;
}

function queryFailureError(): AppError {
  return createAppError("UNKNOWN", JSON_ERROR_MESSAGES.queryFailed);
}

function workerFailureError(): AppError {
  return createAppError("WORKER_ERROR", JSON_ERROR_MESSAGES.worker);
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

function isQueryPayload(value: unknown): value is QueryWorkerSuccessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as QueryWorkerSuccessPayload;
  return (
    typeof candidate.query === "string" &&
    typeof candidate.matchCount === "number" &&
    Array.isArray(candidate.results) &&
    typeof candidate.truncated === "boolean"
  );
}

function workerErrorToQueryError(
  response: WorkerResponse,
): QueryError | AppError {
  if (response.type !== "error") {
    return workerFailureError();
  }

  if (response.error.code === "QUERY_SYNTAX_ERROR") {
    const error: QueryError = {
      code: "QUERY_SYNTAX_ERROR",
      message: response.error.message,
    };
    if (response.error.position !== undefined) {
      error.position = response.error.position;
    }
    if (response.error.column !== undefined) {
      error.column = response.error.column;
    }
    if (response.error.details !== undefined) {
      error.details = response.error.details;
    }
    return error;
  }

  return createAppError(
    response.error.code,
    response.error.message,
    response.error.details,
  );
}

export function shouldOffloadQuery(document: JsonDocument): boolean {
  return (
    shouldOffloadToWorker(document.metadata.sizeInBytes) ||
    document.metadata.nodeCount >= QUERY_WORKER_NODE_THRESHOLD
  );
}

function shouldUseWorker(
  document: JsonDocument,
  forceWorker?: boolean,
): boolean {
  if (forceWorker) {
    return canUseWorker();
  }
  return canUseWorker() && shouldOffloadQuery(document);
}

export async function runJsonQuery(
  document: JsonDocument,
  options: ExecuteQueryOptions,
  engineOptions: JsonQueryEngineOptions = {},
): Promise<JsonQueryEngineResult> {
  startMeasure("json-query");
  try {
    if (shouldUseWorker(document, engineOptions.forceWorker)) {
      try {
        const response: WorkerResponse = await getJsonWorkerClient().query({
          ...toWorkerDocumentRef(document),
          query: options.query,
          mode: options.mode,
          ...(options.maxResults !== undefined
            ? { maxResults: options.maxResults }
            : {}),
        });

        if (response.type === "error") {
          return { ok: false, error: workerErrorToQueryError(response) };
        }

        if (response.type !== "success" || !isQueryPayload(response.payload)) {
          return { ok: false, error: workerFailureError() };
        }

        rememberWorkerDocumentRevision(document.metadata.revision);
        return { ok: true, value: response.payload };
      } catch {
        return { ok: false, error: queryFailureError() };
      }
    }

    return executeJsonQuery(document, options);
  } finally {
    endMeasure("json-query");
  }
}
