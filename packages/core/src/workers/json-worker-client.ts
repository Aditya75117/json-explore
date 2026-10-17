import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import type {
  SerializeWorkerPayload,
  WorkerRequest,
  WorkerResponse,
} from "@json-explore/core/types/worker";
import { isWorkerResponse } from "@json-explore/core/types/worker";

let lastWorkerRevision: string | null = null;

export function rememberWorkerDocumentRevision(revision: string): void {
  lastWorkerRevision = revision;
}

export function forgetWorkerDocumentRevision(): void {
  lastWorkerRevision = null;
}

export function workerHasDocumentRevision(
  revision: string | undefined,
): boolean {
  return Boolean(revision && revision === lastWorkerRevision);
}

type PendingResolver = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
};

export type WorkerFactory = () => Worker;

function defaultWorkerFactory(): Worker {
  return new Worker(new URL("./json.worker.ts", import.meta.url), {
    type: "module",
  });
}

/**
 * Browser-side client for the JSON worker.
 *
 * - One pending promise per `requestId`
 * - Responses that do not match a pending id are ignored
 * - Worker errors / message errors reject inflight work and drop the Worker
 *   so the next request recreates it
 * - `terminate()` rejects inflight work and drops the Worker
 * - UI code should use typed methods, not `postMessage`
 */
export class JsonWorkerClient {
  private worker: Worker | null = null;
  private readonly pending = new Map<string, PendingResolver>();
  private requestCounter = 0;
  private readonly createWorker: WorkerFactory;
  lastRequestId: string | null = null;

  constructor(createWorker: WorkerFactory = defaultWorkerFactory) {
    this.createWorker = createWorker;
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  get isTerminated(): boolean {
    return this.worker === null && this.pending.size === 0;
  }

  private attachWorker(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isWorkerResponse(event.data)) {
        return;
      }

      if (event.data.type === "progress") {
        return;
      }

      const pending = this.pending.get(event.data.requestId);
      if (!pending) {
        return;
      }

      this.pending.delete(event.data.requestId);
      pending.resolve(event.data);
    };

    worker.onerror = () => {
      this.failWorker(new Error(JSON_ERROR_MESSAGES.worker));
    };

    worker.onmessageerror = () => {
      this.failWorker(new Error(JSON_ERROR_MESSAGES.worker));
    };
  }

  private failWorker(error: Error): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    forgetWorkerDocumentRevision();
    this.rejectAll(error);
  }

  private ensureWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    this.worker = this.createWorker();
    this.attachWorker(this.worker);
    return this.worker;
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `req-${this.requestCounter}-${Date.now()}`;
  }

  private rejectAll(error: Error): void {
    for (const [id, pending] of this.pending) {
      pending.reject(error);
      this.pending.delete(id);
    }
  }

  request(message: Omit<WorkerRequest, "requestId">): Promise<WorkerResponse> {
    const requestId = this.nextRequestId();
    this.lastRequestId = requestId;
    const worker = this.ensureWorker();
    const request = { ...message, requestId } as WorkerRequest;

    return new Promise<WorkerResponse>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      worker.postMessage(request);
    });
  }

  /**
   * Drop a pending promise so a stale response cannot settle UI state.
   * The Worker may still finish the CPU work; the result is ignored.
   */
  cancel(requestId: string): boolean {
    const pending = this.pending.get(requestId);
    if (!pending) {
      return false;
    }
    this.pending.delete(requestId);
    pending.reject(new Error("Worker request cancelled."));
    return true;
  }

  parse(input: string): Promise<WorkerResponse> {
    return this.request({ type: "parse", payload: input });
  }

  format(
    input: string,
    indentation?: JsonIndentation,
  ): Promise<WorkerResponse> {
    return this.request({
      type: "format",
      payload: input,
      ...(indentation !== undefined ? { indentation } : {}),
    });
  }

  minify(input: string): Promise<WorkerResponse> {
    return this.request({ type: "minify", payload: input });
  }

  serialize(payload: SerializeWorkerPayload): Promise<WorkerResponse> {
    return this.request({ type: "serialize", payload });
  }

  search(
    payload: Extract<WorkerRequest, { type: "search" }>["payload"],
  ): Promise<WorkerResponse> {
    return this.request({ type: "search", payload });
  }

  query(
    payload: Extract<WorkerRequest, { type: "query" }>["payload"],
  ): Promise<WorkerResponse> {
    return this.request({ type: "query", payload });
  }

  analyze(
    payload: Extract<WorkerRequest, { type: "analyze" }>["payload"],
  ): Promise<WorkerResponse> {
    return this.request({ type: "analyze", payload });
  }

  ping(): Promise<WorkerResponse> {
    return this.request({ type: "ping" });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    forgetWorkerDocumentRevision();
    this.rejectAll(new Error("Worker terminated."));
  }
}

let sharedClient: JsonWorkerClient | null = null;

export function getJsonWorkerClient(): JsonWorkerClient {
  if (!sharedClient) {
    sharedClient = new JsonWorkerClient();
  }
  return sharedClient;
}

export function getJsonWorkerClientIfExists(): JsonWorkerClient | null {
  return sharedClient;
}

export function terminateJsonWorkerClient(): void {
  if (sharedClient) {
    sharedClient.terminate();
    sharedClient = null;
  }
  forgetWorkerDocumentRevision();
}
