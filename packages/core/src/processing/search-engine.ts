import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { SEARCH_WORKER_NODE_THRESHOLD } from "@json-explore/core/constants/search";
import {
  endMeasure,
  shouldOffloadToWorker,
  startMeasure,
} from "@json-explore/core/performance";
import { toWorkerDocumentRef } from "@json-explore/core/processing/worker-document-ref";
import { searchJson } from "@json-explore/core/search/search-json";
import { createAppError, type AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";
import type { JsonSearchResponse, SearchOptions } from "@json-explore/core/types/search";
import type {
  SearchWorkerSuccessPayload,
  WorkerResponse,
} from "@json-explore/core/types/worker";
import {
  getJsonWorkerClient,
  rememberWorkerDocumentRevision,
} from "@json-explore/core/workers/json-worker-client";

export type JsonSearchEngineResult = Result<JsonSearchResponse, AppError>;

export interface JsonSearchEngineOptions {
  forceWorker?: boolean;
}

function searchFailureError(): AppError {
  return createAppError("SEARCH_ERROR", JSON_ERROR_MESSAGES.search);
}

function workerFailureError(): AppError {
  return createAppError("WORKER_ERROR", JSON_ERROR_MESSAGES.worker);
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

function isSearchPayload(value: unknown): value is SearchWorkerSuccessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as SearchWorkerSuccessPayload;
  return (
    typeof candidate.query === "string" &&
    typeof candidate.matchCount === "number" &&
    Array.isArray(candidate.results) &&
    typeof candidate.truncated === "boolean"
  );
}

export function shouldOffloadSearch(document: JsonDocument): boolean {
  return (
    shouldOffloadToWorker(document.metadata.sizeInBytes) ||
    document.metadata.nodeCount >= SEARCH_WORKER_NODE_THRESHOLD
  );
}

function shouldUseWorker(
  document: JsonDocument,
  forceWorker?: boolean,
): boolean {
  if (forceWorker) {
    return canUseWorker();
  }
  return canUseWorker() && shouldOffloadSearch(document);
}

/**
 * Search the Phase 2 document. Small graphs run on the main thread;
 * large graphs use the existing JSON worker and the same requestId map.
 */
export async function runJsonSearch(
  document: JsonDocument,
  options: SearchOptions,
  engineOptions: JsonSearchEngineOptions = {},
): Promise<JsonSearchEngineResult> {
  startMeasure("json-search");
  try {
    if (shouldUseWorker(document, engineOptions.forceWorker)) {
      try {
        const response: WorkerResponse = await getJsonWorkerClient().search({
          ...toWorkerDocumentRef(document),
          query: options.query,
          mode: options.mode,
          ...(options.caseSensitive !== undefined
            ? { caseSensitive: options.caseSensitive }
            : {}),
          ...(options.exactMatch !== undefined
            ? { exactMatch: options.exactMatch }
            : {}),
          ...(options.maxResults !== undefined
            ? { maxResults: options.maxResults }
            : {}),
        });

        if (response.type === "error") {
          return {
            ok: false,
            error: createAppError(
              response.error.code,
              response.error.message,
              response.error.details,
            ),
          };
        }

        if (response.type !== "success" || !isSearchPayload(response.payload)) {
          return { ok: false, error: workerFailureError() };
        }

        rememberWorkerDocumentRevision(document.metadata.revision);
        return { ok: true, value: response.payload };
      } catch {
        return { ok: false, error: searchFailureError() };
      }
    }

    try {
      return { ok: true, value: searchJson(document, options) };
    } catch {
      return { ok: false, error: searchFailureError() };
    }
  } finally {
    endMeasure("json-search");
  }
}
