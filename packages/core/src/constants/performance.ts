/**
 * Central performance / scale limits for large JSON.
 * Feature modules should import from here instead of scattering magic numbers.
 */
export const PERFORMANCE_LIMITS = {
  /** Offload parse / search / query / analyze to the Worker. */
  workerByteThreshold: 512 * 1024,
  /** Additional node-count trigger for graph operations. */
  workerNodeThreshold: 8_000,
  /** Soft warning: extra processing time is expected. */
  largeDocumentWarningBytes: 10 * 1024 * 1024,
  /** Best-effort warning: device/browser dependent. */
  veryLargeDocumentWarningBytes: 50 * 1024 * 1024,
  /** Hard ceiling — reject before parse / file read. */
  maxJsonByteLimit: 100 * 1024 * 1024,
  /** Do not mount the full source/output string above this size. */
  editorCharLimit: 512 * 1024,
  /** Characters kept in a large-source preview. */
  editorPreviewChars: 8 * 1024,
  /** Keep syntax highlighting bounded so typing remains responsive. */
  syntaxHighlightCharLimit: 32 * 1024,
  /** Expand-all walks every container below this node count. */
  expandAllSafeNodeCount: 25_000,
  /** Depth cap for expand-all on very large documents. */
  expandAllLargeMaxDepth: 2,
  virtualOverscan: 8,
} as const;

export const LARGE_JSON_BYTE_THRESHOLD = PERFORMANCE_LIMITS.workerByteThreshold;

export const MAX_JSON_BYTE_LIMIT = PERFORMANCE_LIMITS.maxJsonByteLimit;

export type JsonDocumentScale =
  "small" | "medium" | "large" | "very-large" | "too-large";
