import {
  LARGE_JSON_BYTE_THRESHOLD,
  MAX_JSON_BYTE_LIMIT,
} from "@json-explore/core/constants/performance";

export function byteLengthOfString(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }

  return value.length;
}

export function shouldOffloadToWorker(byteLength: number): boolean {
  return byteLength >= LARGE_JSON_BYTE_THRESHOLD;
}

export function exceedsHardLimit(byteLength: number): boolean {
  return byteLength > MAX_JSON_BYTE_LIMIT;
}
