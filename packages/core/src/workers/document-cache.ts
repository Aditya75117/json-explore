import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";

/**
 * Worker-side cache of the last parsed document.
 *
 * Search / query / analyze / serialize can reuse this graph instead of
 * structured-cloning it from the main thread on every keystroke.
 * One document at a time — the workspace is single-document.
 */
export interface WorkerSessionCache {
  revision: string | null;
  document: JsonDocument | null;
  value: JsonValue | null;
}

export function createWorkerSessionCache(): WorkerSessionCache {
  return {
    revision: null,
    document: null,
    value: null,
  };
}

export function clearWorkerSessionCache(cache: WorkerSessionCache): void {
  cache.revision = null;
  cache.document = null;
  cache.value = null;
}

export function rememberWorkerParse(
  cache: WorkerSessionCache,
  value: JsonValue,
  document: JsonDocument,
): void {
  cache.value = value;
  cache.document = document;
  cache.revision = document.metadata.revision;
}

export function rememberWorkerDocument(
  cache: WorkerSessionCache,
  document: JsonDocument,
): void {
  if (cache.revision !== document.metadata.revision) {
    cache.value = null;
  }
  cache.document = document;
  cache.revision = document.metadata.revision;
}

export function isUsableJsonDocument(value: unknown): value is JsonDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as JsonDocument;
  return (
    typeof candidate.rootId === "string" &&
    candidate.rootId.length > 0 &&
    typeof candidate.nodes === "object" &&
    candidate.nodes !== null
  );
}

export function resolveCachedDocument(
  cache: WorkerSessionCache,
  payload: { document?: JsonDocument; revision?: string },
): JsonDocument | null {
  if (isUsableJsonDocument(payload.document)) {
    rememberWorkerDocument(cache, payload.document);
    return payload.document;
  }

  if (
    payload.revision &&
    cache.revision === payload.revision &&
    cache.document
  ) {
    return cache.document;
  }

  return null;
}

export function resolveCachedValue(
  cache: WorkerSessionCache,
  payload: { value?: JsonValue; revision?: string },
): JsonValue | undefined {
  if (payload.value !== undefined) {
    cache.value = payload.value;
    if (payload.revision) {
      cache.revision = payload.revision;
    }
    return payload.value;
  }

  if (payload.revision && cache.revision === payload.revision) {
    return cache.value ?? undefined;
  }

  return cache.value ?? undefined;
}
