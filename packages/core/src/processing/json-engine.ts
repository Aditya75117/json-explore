import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import { buildJsonDocument } from "@json-explore/core/json/document";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { stringifyMinified } from "@json-explore/core/json/minifier";
import { parseJson } from "@json-explore/core/json/parser";
import {
  byteLengthOfString,
  endMeasure,
  exceedsHardLimit,
  shouldOffloadToWorker,
  startMeasure,
} from "@json-explore/core/performance";
import { createAppError, type AppError } from "@json-explore/core/types/errors";
import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";
import type {
  FormatWorkerSuccessPayload,
  MinifyWorkerSuccessPayload,
  ParseWorkerSuccessPayload,
  SerializeWorkerSuccessPayload,
  WorkerResponse,
} from "@json-explore/core/types/worker";
import { workerErrorToJsonParseError } from "@json-explore/core/types/worker";
import {
  getJsonWorkerClient,
  getJsonWorkerClientIfExists,
  rememberWorkerDocumentRevision,
  terminateJsonWorkerClient,
  workerHasDocumentRevision,
} from "@json-explore/core/workers/json-worker-client";

export interface JsonEngineSuccess {
  value: JsonValue;
  document: JsonDocument;
  output?: string;
}

export type JsonEngineResult = Result<JsonEngineSuccess, AppError>;

function largeFileError(): AppError {
  return createAppError("LARGE_FILE_LIMIT", JSON_ERROR_MESSAGES.largeFile);
}

function workerFailureError(): AppError {
  return createAppError("WORKER_ERROR", JSON_ERROR_MESSAGES.worker);
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

function shouldUseWorker(byteLength: number, forceWorker?: boolean): boolean {
  if (forceWorker) {
    return canUseWorker();
  }
  return canUseWorker() && shouldOffloadToWorker(byteLength);
}

function buildLocalSuccess(
  raw: string,
  value: JsonValue,
  output?: string,
): JsonEngineSuccess {
  const document = buildJsonDocument(value, {
    sizeInBytes: byteLengthOfString(raw),
  });
  return output === undefined
    ? { value, document }
    : { value, document, output };
}

function fromWorkerError(response: WorkerResponse): AppError {
  if (response.type !== "error") {
    return workerFailureError();
  }

  if (response.error.code === "INVALID_JSON") {
    return workerErrorToJsonParseError(response.error);
  }

  return createAppError(
    response.error.code,
    response.error.message,
    response.error.details,
  );
}

function isSuccessResponse(
  response: WorkerResponse,
): response is Extract<WorkerResponse, { type: "success" }> {
  return response.type === "success";
}

function isParsePayload(value: unknown): value is ParseWorkerSuccessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as ParseWorkerSuccessPayload;
  return "value" in candidate && "document" in candidate;
}

function isFormatPayload(value: unknown): value is FormatWorkerSuccessPayload {
  return isParsePayload(value) && "formatted" in value;
}

function isMinifyPayload(value: unknown): value is MinifyWorkerSuccessPayload {
  return isParsePayload(value) && "minified" in value;
}

function isSerializePayload(
  value: unknown,
): value is SerializeWorkerSuccessPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as SerializeWorkerSuccessPayload;
  return (
    typeof candidate.output === "string" &&
    (candidate.style === "formatted" || candidate.style === "minified")
  );
}

export function abortInflightWorkerWork(): void {
  const existing = getJsonWorkerClientIfExists();
  if (existing && existing.pendingCount > 0) {
    terminateJsonWorkerClient();
  }
}

function rememberParsedDocument(document: JsonDocument): void {
  rememberWorkerDocumentRevision(document.metadata.revision);
}

export interface JsonEngineOptions {
  forceWorker?: boolean;
  indentation?: JsonIndentation;
}

function guardSize(raw: string): AppError | null {
  if (exceedsHardLimit(byteLengthOfString(raw))) {
    return largeFileError();
  }
  return null;
}

async function viaWorker(
  run: () => Promise<WorkerResponse>,
): Promise<WorkerResponse | AppError> {
  try {
    return await run();
  } catch {
    return workerFailureError();
  }
}

export async function runJsonParse(
  raw: string,
  options: JsonEngineOptions = {},
): Promise<JsonEngineResult> {
  const sizeError = guardSize(raw);
  if (sizeError) {
    return { ok: false, error: sizeError };
  }

  const bytes = byteLengthOfString(raw);

  startMeasure("json-parse");
  try {
    if (shouldUseWorker(bytes, options.forceWorker)) {
      const response = await viaWorker(() => getJsonWorkerClient().parse(raw));
      if (!("type" in response)) {
        return { ok: false, error: response };
      }
      if (response.type === "error") {
        return { ok: false, error: fromWorkerError(response) };
      }
      if (!isSuccessResponse(response) || !isParsePayload(response.payload)) {
        return { ok: false, error: workerFailureError() };
      }
      rememberParsedDocument(response.payload.document);
      return {
        ok: true,
        value: {
          value: response.payload.value,
          document: response.payload.document,
        },
      };
    }

    const parsed = parseJson(raw);
    if (!parsed.ok) {
      return parsed;
    }

    startMeasure("document-build");
    const success = buildLocalSuccess(raw, parsed.value);
    endMeasure("document-build");
    return { ok: true, value: success };
  } finally {
    endMeasure("json-parse");
  }
}

export async function runJsonFormat(
  raw: string,
  options: JsonEngineOptions = {},
): Promise<JsonEngineResult> {
  const sizeError = guardSize(raw);
  if (sizeError) {
    return { ok: false, error: sizeError };
  }

  const bytes = byteLengthOfString(raw);

  if (shouldUseWorker(bytes, options.forceWorker)) {
    const response = await viaWorker(() =>
      getJsonWorkerClient().format(raw, options.indentation),
    );
    if (!("type" in response)) {
      return { ok: false, error: response };
    }
    if (response.type === "error") {
      return { ok: false, error: fromWorkerError(response) };
    }
    if (!isSuccessResponse(response) || !isFormatPayload(response.payload)) {
      return { ok: false, error: workerFailureError() };
    }
    rememberParsedDocument(response.payload.document);
    return {
      ok: true,
      value: {
        value: response.payload.value,
        document: response.payload.document,
        output: response.payload.formatted,
      },
    };
  }

  const parsed = parseJson(raw);
  if (!parsed.ok) {
    return parsed;
  }

  const output = stringifyFormatted(parsed.value, options.indentation);
  return {
    ok: true,
    value: buildLocalSuccess(raw, parsed.value, output),
  };
}

export async function runJsonMinify(
  raw: string,
  options: JsonEngineOptions = {},
): Promise<JsonEngineResult> {
  const sizeError = guardSize(raw);
  if (sizeError) {
    return { ok: false, error: sizeError };
  }

  const bytes = byteLengthOfString(raw);

  if (shouldUseWorker(bytes, options.forceWorker)) {
    const response = await viaWorker(() => getJsonWorkerClient().minify(raw));
    if (!("type" in response)) {
      return { ok: false, error: response };
    }
    if (response.type === "error") {
      return { ok: false, error: fromWorkerError(response) };
    }
    if (!isSuccessResponse(response) || !isMinifyPayload(response.payload)) {
      return { ok: false, error: workerFailureError() };
    }
    rememberParsedDocument(response.payload.document);
    return {
      ok: true,
      value: {
        value: response.payload.value,
        document: response.payload.document,
        output: response.payload.minified,
      },
    };
  }

  const parsed = parseJson(raw);
  if (!parsed.ok) {
    return parsed;
  }

  const output = stringifyMinified(parsed.value);
  return {
    ok: true,
    value: buildLocalSuccess(raw, parsed.value, output),
  };
}

export interface JsonSerializeOptions {
  style: "formatted" | "minified";
  indentation?: JsonIndentation;
  forceWorker?: boolean;
  revision?: string;
  sizeInBytes?: number;
}

export async function runJsonSerialize(
  value: JsonValue,
  options: JsonSerializeOptions,
): Promise<Result<string, AppError>> {
  const bytes = options.sizeInBytes ?? 0;
  const canReuseWorker =
    workerHasDocumentRevision(options.revision) && canUseWorker();

  startMeasure("json-serialize");
  try {
    if (canReuseWorker || shouldUseWorker(bytes, options.forceWorker)) {
      const response = await viaWorker(() =>
        getJsonWorkerClient().serialize({
          style: options.style,
          ...(options.indentation !== undefined
            ? { indentation: options.indentation }
            : {}),
          ...(options.revision !== undefined
            ? { revision: options.revision }
            : {}),
          ...(workerHasDocumentRevision(options.revision) ? {} : { value }),
        }),
      );
      if (!("type" in response)) {
        return { ok: false, error: response };
      }
      if (response.type === "error") {
        return { ok: false, error: fromWorkerError(response) };
      }
      if (
        !isSuccessResponse(response) ||
        !isSerializePayload(response.payload)
      ) {
        return { ok: false, error: workerFailureError() };
      }
      return { ok: true, value: response.payload.output };
    }

    const output =
      options.style === "minified"
        ? stringifyMinified(value)
        : stringifyFormatted(value, options.indentation);
    return { ok: true, value: output };
  } catch {
    return { ok: false, error: workerFailureError() };
  } finally {
    endMeasure("json-serialize");
  }
}
