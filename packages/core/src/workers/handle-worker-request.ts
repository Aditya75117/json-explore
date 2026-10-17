import { DEFAULT_JSON_INDENTATION } from "@json-explore/core/constants/json";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { buildJsonDocument } from "@json-explore/core/json/document";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { stringifyMinified } from "@json-explore/core/json/minifier";
import { parseJson } from "@json-explore/core/json/parser";
import { serializeJsonValue } from "@json-explore/core/json/serialize";
import { byteLengthOfString } from "@json-explore/core/performance";
import { executeJsonQuery } from "@json-explore/core/query/execute-query";
import { searchJson } from "@json-explore/core/search/search-json";
import { analyzeJsonDocument } from "@json-explore/core/statistics/analyze-json";
import type {
  AnalyzeWorkerSuccessPayload,
  FormatWorkerSuccessPayload,
  MinifyWorkerSuccessPayload,
  ParseWorkerSuccessPayload,
  QueryWorkerSuccessPayload,
  SearchWorkerSuccessPayload,
  SerializeWorkerSuccessPayload,
  WorkerErrorPayload,
  WorkerRequest,
  WorkerResponse,
} from "@json-explore/core/types/worker";
import { jsonParseErrorToWorkerError } from "@json-explore/core/types/worker";
import {
  createWorkerSessionCache,
  rememberWorkerParse,
  resolveCachedDocument,
  resolveCachedValue,
  type WorkerSessionCache,
} from "@json-explore/core/workers/document-cache";

function success(request: WorkerRequest, payload: unknown): WorkerResponse {
  return {
    type: "success",
    requestId: request.requestId,
    requestType: request.type,
    payload,
  };
}

function failure(
  request: WorkerRequest,
  error: WorkerErrorPayload,
): WorkerResponse {
  return {
    type: "error",
    requestId: request.requestId,
    requestType: request.type,
    error,
  };
}

function unexpectedFailure(request: WorkerRequest): WorkerResponse {
  return failure(request, {
    code: "WORKER_ERROR",
    message: JSON_ERROR_MESSAGES.worker,
  });
}

function missingDocumentError(
  request: WorkerRequest,
  code: WorkerErrorPayload["code"],
  message: string,
): WorkerResponse {
  return failure(request, { code, message });
}

function parseAndBuild(raw: string) {
  const parsed = parseJson(raw);
  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true as const,
    value: parsed.value,
    document: buildJsonDocument(parsed.value, {
      sizeInBytes: byteLengthOfString(raw),
    }),
  };
}

/**
 * Pure request handler used by the worker runtime and by unit tests.
 * Does not log request payloads (privacy: raw JSON stays off logs).
 *
 * Pass a persistent `cache` from the Worker runtime so search / query /
 * analyze can skip recloning the document after parse.
 */
export function handleWorkerRequest(
  request: WorkerRequest,
  cache: WorkerSessionCache = createWorkerSessionCache(),
): WorkerResponse {
  try {
    switch (request.type) {
      case "ping": {
        return success(request, { ok: true });
      }
      case "parse": {
        const parsed = parseAndBuild(request.payload);
        if (!parsed.ok) {
          return failure(request, jsonParseErrorToWorkerError(parsed.error));
        }

        rememberWorkerParse(cache, parsed.value, parsed.document);
        const payload: ParseWorkerSuccessPayload = {
          value: parsed.value,
          document: parsed.document,
        };
        return success(request, payload);
      }
      case "format": {
        const parsed = parseAndBuild(request.payload);
        if (!parsed.ok) {
          return failure(request, jsonParseErrorToWorkerError(parsed.error));
        }

        rememberWorkerParse(cache, parsed.value, parsed.document);
        const indentation = request.indentation ?? DEFAULT_JSON_INDENTATION;
        const payload: FormatWorkerSuccessPayload = {
          formatted: stringifyFormatted(parsed.value, indentation),
          value: parsed.value,
          document: parsed.document,
        };
        return success(request, payload);
      }
      case "minify": {
        const parsed = parseAndBuild(request.payload);
        if (!parsed.ok) {
          return failure(request, jsonParseErrorToWorkerError(parsed.error));
        }

        rememberWorkerParse(cache, parsed.value, parsed.document);
        const payload: MinifyWorkerSuccessPayload = {
          minified: stringifyMinified(parsed.value),
          value: parsed.value,
          document: parsed.document,
        };
        return success(request, payload);
      }
      case "serialize": {
        const value = resolveCachedValue(cache, request.payload);
        if (value === undefined) {
          return failure(request, {
            code: "WORKER_ERROR",
            message: JSON_ERROR_MESSAGES.worker,
          });
        }

        const output = serializeJsonValue(
          value,
          request.payload.style,
          request.payload.indentation,
        );
        const payload: SerializeWorkerSuccessPayload = {
          output,
          style: request.payload.style,
        };
        return success(request, payload);
      }
      case "analyze": {
        const document = resolveCachedDocument(cache, request.payload);
        if (!document) {
          return missingDocumentError(
            request,
            "STATISTICS_ERROR",
            JSON_ERROR_MESSAGES.statistics,
          );
        }

        const payload: AnalyzeWorkerSuccessPayload =
          analyzeJsonDocument(document);
        return success(request, payload);
      }
      case "search": {
        const document = resolveCachedDocument(cache, request.payload);
        if (!document) {
          return missingDocumentError(
            request,
            "SEARCH_ERROR",
            JSON_ERROR_MESSAGES.search,
          );
        }

        const { query, mode, caseSensitive, exactMatch, maxResults } =
          request.payload;
        const payload: SearchWorkerSuccessPayload = searchJson(document, {
          query,
          mode,
          ...(caseSensitive !== undefined ? { caseSensitive } : {}),
          ...(exactMatch !== undefined ? { exactMatch } : {}),
          ...(maxResults !== undefined ? { maxResults } : {}),
        });
        return success(request, payload);
      }
      case "query": {
        const document = resolveCachedDocument(cache, request.payload);
        if (!document) {
          return missingDocumentError(
            request,
            "QUERY_SYNTAX_ERROR",
            JSON_ERROR_MESSAGES.queryFailed,
          );
        }

        const { query, mode, maxResults } = request.payload;
        const executed = executeJsonQuery(document, {
          query,
          mode,
          ...(maxResults !== undefined ? { maxResults } : {}),
        });
        if (!executed.ok) {
          return failure(request, {
            code: executed.error.code,
            message: executed.error.message,
            ...(executed.error.details !== undefined
              ? { details: executed.error.details }
              : {}),
            ...(executed.error.position !== undefined
              ? { position: executed.error.position }
              : {}),
            ...(executed.error.column !== undefined
              ? { column: executed.error.column }
              : {}),
          });
        }

        const payload: QueryWorkerSuccessPayload = executed.value;
        return success(request, payload);
      }
      default: {
        const exhaustive: never = request;
        return {
          type: "error",
          requestId: (exhaustive as WorkerRequest).requestId,
          requestType: (exhaustive as WorkerRequest).type,
          error: {
            code: "WORKER_ERROR",
            message: JSON_ERROR_MESSAGES.worker,
          },
        };
      }
    }
  } catch {
    return unexpectedFailure(request);
  }
}
