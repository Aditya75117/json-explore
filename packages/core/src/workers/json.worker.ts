/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from "@json-explore/core/types/worker";
import { isWorkerRequest } from "@json-explore/core/types/worker";
import { createWorkerSessionCache } from "@json-explore/core/workers/document-cache";
import { handleWorkerRequest } from "@json-explore/core/workers/handle-worker-request";

/**
 * JSON processing worker.
 * Keep this file as a thin message adapter — logic lives in handleWorkerRequest.
 * The session cache lives here so parse → search/query/analyze reuse one graph.
 */

const workerScope = self as DedicatedWorkerGlobalScope;
const cache = createWorkerSessionCache();

function respond(message: WorkerResponse): void {
  workerScope.postMessage(message);
}

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (!isWorkerRequest(request)) {
    return;
  }

  respond(handleWorkerRequest(request, cache));
};

export {};
