import type { JsonDocument } from "@json-explore/core/types/json";
import type { WorkerDocumentRef } from "@json-explore/core/types/worker";
import { workerHasDocumentRevision } from "@json-explore/core/workers/json-worker-client";

/**
 * Prefer a revision token when the Worker already holds this document.
 * Sending the full graph again would structured-clone it on the main thread.
 */
export function toWorkerDocumentRef(document: JsonDocument): WorkerDocumentRef {
  const revision = document.metadata.revision;
  if (workerHasDocumentRevision(revision)) {
    return { revision };
  }
  return { document, revision };
}
