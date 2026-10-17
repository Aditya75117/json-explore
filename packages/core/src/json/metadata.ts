import type { JsonDocumentMetadata, JsonNodeType } from "@json-explore/core/types/json";

export interface MetadataAccumulator {
  nodeCount: number;
  objectCount: number;
  arrayCount: number;
  maxDepth: number;
  sizeInBytes: number;
}

export function createMetadataAccumulator(
  sizeInBytes: number,
): MetadataAccumulator {
  return {
    nodeCount: 0,
    objectCount: 0,
    arrayCount: 0,
    maxDepth: 0,
    sizeInBytes,
  };
}

export function recordNodeMetadata(
  acc: MetadataAccumulator,
  type: JsonNodeType,
  depth: number,
): void {
  acc.nodeCount += 1;
  if (type === "object") {
    acc.objectCount += 1;
  } else if (type === "array") {
    acc.arrayCount += 1;
  }
  if (depth > acc.maxDepth) {
    acc.maxDepth = depth;
  }
}

let revisionCounter = 0;

export function nextDocumentRevision(): string {
  revisionCounter += 1;
  return `doc-${String(revisionCounter)}`;
}

export function toJsonDocumentMetadata(
  acc: MetadataAccumulator,
): JsonDocumentMetadata {
  return {
    nodeCount: acc.nodeCount,
    objectCount: acc.objectCount,
    arrayCount: acc.arrayCount,
    maxDepth: acc.maxDepth,
    sizeInBytes: acc.sizeInBytes,
    revision: nextDocumentRevision(),
  };
}
