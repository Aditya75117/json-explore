import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { STATISTICS_WORKER_NODE_THRESHOLD } from "@json-explore/core/constants/statistics";
import {
  endMeasure,
  shouldOffloadToWorker,
  startMeasure,
} from "@json-explore/core/performance";
import { toWorkerDocumentRef } from "@json-explore/core/processing/worker-document-ref";
import { analyzeJsonDocument } from "@json-explore/core/statistics/analyze-json";
import { createAppError, type AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";
import type { JsonStatistics } from "@json-explore/core/types/statistics";
import type {
  AnalyzeWorkerSuccessPayload,
  WorkerResponse,
} from "@json-explore/core/types/worker";
import {
  getJsonWorkerClient,
  rememberWorkerDocumentRevision,
} from "@json-explore/core/workers/json-worker-client";

export type JsonStatisticsEngineResult = Result<JsonStatistics, AppError>;

export interface JsonStatisticsEngineOptions {
  forceWorker?: boolean;
}

function statisticsFailureError(): AppError {
  return createAppError("STATISTICS_ERROR", JSON_ERROR_MESSAGES.statistics);
}

function workerFailureError(): AppError {
  return createAppError("WORKER_ERROR", JSON_ERROR_MESSAGES.worker);
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

function isStatisticsPayload(
  value: unknown,
): value is AnalyzeWorkerSuccessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as AnalyzeWorkerSuccessPayload;
  return (
    typeof candidate.totalNodes === "number" &&
    typeof candidate.maxDepth === "number" &&
    Array.isArray(candidate.keyFrequency) &&
    Array.isArray(candidate.valueFrequency) &&
    Array.isArray(candidate.topLevelEntries) &&
    candidate.deepestNode !== undefined
  );
}

export function shouldOffloadStatistics(document: JsonDocument): boolean {
  return (
    shouldOffloadToWorker(document.metadata.sizeInBytes) ||
    document.metadata.nodeCount >= STATISTICS_WORKER_NODE_THRESHOLD
  );
}

function shouldUseWorker(
  document: JsonDocument,
  forceWorker?: boolean,
): boolean {
  if (forceWorker) {
    return canUseWorker();
  }
  return canUseWorker() && shouldOffloadStatistics(document);
}

export async function runJsonAnalyze(
  document: JsonDocument,
  engineOptions: JsonStatisticsEngineOptions = {},
): Promise<JsonStatisticsEngineResult> {
  startMeasure("json-statistics");
  try {
    if (shouldUseWorker(document, engineOptions.forceWorker)) {
      try {
        const response: WorkerResponse = await getJsonWorkerClient().analyze(
          toWorkerDocumentRef(document),
        );

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

        if (
          response.type !== "success" ||
          !isStatisticsPayload(response.payload)
        ) {
          return { ok: false, error: workerFailureError() };
        }

        rememberWorkerDocumentRevision(document.metadata.revision);
        return { ok: true, value: response.payload };
      } catch {
        return { ok: false, error: statisticsFailureError() };
      }
    }

    try {
      return { ok: true, value: analyzeJsonDocument(document) };
    } catch {
      return { ok: false, error: statisticsFailureError() };
    }
  } finally {
    endMeasure("json-statistics");
  }
}
