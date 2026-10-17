import {
  LARGE_JSON_BYTE_THRESHOLD,
  MAX_JSON_BYTE_LIMIT,
  PERFORMANCE_LIMITS,
  type JsonDocumentScale,
} from "@json-explore/core/constants/performance";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";

export function getJsonDocumentScale(byteLength: number): JsonDocumentScale {
  if (byteLength > MAX_JSON_BYTE_LIMIT) {
    return "too-large";
  }
  if (byteLength >= PERFORMANCE_LIMITS.veryLargeDocumentWarningBytes) {
    return "very-large";
  }
  if (byteLength >= PERFORMANCE_LIMITS.largeDocumentWarningBytes) {
    return "large";
  }
  if (byteLength >= LARGE_JSON_BYTE_THRESHOLD) {
    return "medium";
  }
  return "small";
}

export function getJsonDocumentScaleMessage(
  scale: JsonDocumentScale,
): string | null {
  if (scale === "large") {
    return JSON_ERROR_MESSAGES.largeDocument;
  }
  if (scale === "very-large") {
    return JSON_ERROR_MESSAGES.veryLargeDocument;
  }
  if (scale === "too-large") {
    return JSON_ERROR_MESSAGES.largeFile;
  }
  return null;
}

export function shouldWarnForDocumentScale(scale: JsonDocumentScale): boolean {
  return scale === "large" || scale === "very-large";
}
