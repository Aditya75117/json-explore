import { JSON_ROOT_PATH } from "@json-explore/core/constants/json";
import {
  createMetadataAccumulator,
  recordNodeMetadata,
  toJsonDocumentMetadata,
} from "@json-explore/core/json/metadata";
import {
  createJsonNodeId,
  getJsonNodeType,
  isJsonArray,
  isJsonObject,
  primitiveValueOf,
} from "@json-explore/core/json/node";
import { appendJsonPath } from "@json-explore/core/json/path";
import type { JsonDocument, JsonNode, JsonValue } from "@json-explore/core/types/json";

export interface BuildJsonDocumentOptions {
  /** Byte length of the original source; avoids re-serializing to measure size. */
  sizeInBytes?: number;
}

interface BuildFrame {
  value: JsonValue;
  key: string | null;
  index: number | null;
  parentId: string | null;
  depth: number;
  path: string;
}

/**
 * Build the navigable document in a single iterative walk.
 * Iterative (not recursive) so deeply nested JSON cannot overflow the stack.
 */
export function buildJsonDocument(
  value: JsonValue,
  options: BuildJsonDocumentOptions = {},
): JsonDocument {
  const nodes: Record<string, JsonNode> = {};
  const metadata = createMetadataAccumulator(options.sizeInBytes ?? 0);
  const rootPath = JSON_ROOT_PATH;
  const rootId = createJsonNodeId(rootPath);

  const stack: BuildFrame[] = [
    {
      value,
      key: null,
      index: null,
      parentId: null,
      depth: 0,
      path: rootPath,
    },
  ];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) {
      break;
    }

    const id = createJsonNodeId(frame.path);
    const type = getJsonNodeType(frame.value);
    const childIds: string[] = [];
    const primitiveValue = primitiveValueOf(frame.value);

    const node: JsonNode = {
      id,
      type,
      key: frame.key,
      index: frame.index,
      path: frame.path,
      depth: frame.depth,
      parentId: frame.parentId,
      childIds,
      ...(primitiveValue !== undefined ? { primitiveValue } : {}),
    };

    nodes[id] = node;
    recordNodeMetadata(metadata, type, frame.depth);

    if (frame.parentId) {
      const parent = nodes[frame.parentId];
      parent?.childIds.push(id);
    }

    if (isJsonArray(frame.value)) {
      for (let index = frame.value.length - 1; index >= 0; index -= 1) {
        const childValue = frame.value[index];
        if (childValue === undefined) {
          continue;
        }

        const path = appendJsonPath(frame.path, { type: "index", index });
        stack.push({
          value: childValue,
          key: null,
          index,
          parentId: id,
          depth: frame.depth + 1,
          path,
        });
      }
    } else if (isJsonObject(frame.value)) {
      const keys = Object.keys(frame.value);
      for (let offset = keys.length - 1; offset >= 0; offset -= 1) {
        const key = keys[offset];
        if (key === undefined) {
          continue;
        }

        const childValue = frame.value[key];
        if (childValue === undefined) {
          continue;
        }

        const path = appendJsonPath(frame.path, { type: "key", key });
        stack.push({
          value: childValue,
          key,
          index: null,
          parentId: id,
          depth: frame.depth + 1,
          path,
        });
      }
    }
  }

  return {
    rootId,
    nodes,
    metadata: toJsonDocumentMetadata(metadata),
  };
}

export function getJsonNode(
  document: JsonDocument,
  id: string,
): JsonNode | undefined {
  return document.nodes[id];
}

export function listJsonNodePaths(
  document: JsonDocument,
  options: { limit?: number } = {},
): string[] {
  const limit = options.limit;
  const paths: string[] = [];
  const stack = [document.rootId];

  while (stack.length > 0) {
    if (limit !== undefined && paths.length >= limit) {
      break;
    }

    const id = stack.pop();
    if (!id) {
      break;
    }
    const node = document.nodes[id];
    if (!node) {
      continue;
    }
    paths.push(node.path);
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const childId = node.childIds[index];
      if (childId) {
        stack.push(childId);
      }
    }
  }

  return paths;
}
