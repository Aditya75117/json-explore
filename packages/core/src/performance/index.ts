/**
 * Performance helpers and thresholds for large-JSON paths.
 */

export {
  byteLengthOfString,
  exceedsHardLimit,
  shouldOffloadToWorker,
} from "@json-explore/core/performance/bytes";
export {
  getJsonDocumentScale,
  getJsonDocumentScaleMessage,
  shouldWarnForDocumentScale,
} from "@json-explore/core/performance/document-scale";
export {
  clearPerformanceMeasures,
  endMeasure,
  getLastMeasure,
  getLastMeasures,
  startMeasure,
  type PerformanceMeasureName,
} from "@json-explore/core/performance/measure";
export {
  getVirtualWindow,
  type VirtualWindow,
  type VirtualWindowOptions,
} from "@json-explore/core/performance/virtual-window";
export {
  LARGE_JSON_BYTE_THRESHOLD,
  MAX_JSON_BYTE_LIMIT,
  PERFORMANCE_LIMITS,
} from "@json-explore/core/constants/performance";
