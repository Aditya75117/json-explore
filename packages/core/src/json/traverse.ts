import { getJsonNode } from "@json-explore/core/json/document";
import { isContainerNode } from "@json-explore/core/json/node";
import type { JsonDocument, JsonNode, JsonValue } from "@json-explore/core/types/json";

/**
 * Ancestor IDs from the root down to the parent of `nodeId` (self excluded).
 * Used by the explorer to reveal a node without walking raw JSON.
 */
export function getAncestorIds(
  document: JsonDocument,
  nodeId: string,
): string[] {
  const chain: string[] = [];
  let current = getJsonNode(document, nodeId);

  while (current?.parentId) {
    chain.unshift(current.parentId);
    current = getJsonNode(document, current.parentId);
  }

  return chain;
}

export function listContainerNodeIds(document: JsonDocument): string[] {
  return listExpandAllNodeIds(document);
}

/**
 * Container ids for Expand all. Large documents cap depth so the
 * visible list does not flatten hundreds of thousands of rows at once.
 */
export function listExpandAllNodeIds(
  document: JsonDocument,
  options: { maxDepth?: number } = {},
): string[] {
  const maxDepth = options.maxDepth;
  const ids: string[] = [];

  for (const node of Object.values(document.nodes)) {
    if (!isContainerNode(node)) {
      continue;
    }
    if (maxDepth !== undefined && node.depth > maxDepth) {
      continue;
    }
    ids.push(node.id);
  }

  return ids;
}

/**
 * Rebuild a JsonValue from the document graph.
 * Needed for "Copy value" because container nodes do not store nested copies.
 */
export function materializeJsonValue(
  document: JsonDocument,
  nodeId: string,
): JsonValue | undefined {
  const root = getJsonNode(document, nodeId);
  if (!root) {
    return undefined;
  }

  const values = new Map<string, JsonValue>();
  const stack: Array<{ node: JsonNode; visiting: boolean }> = [
    { node: root, visiting: false },
  ];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) {
      break;
    }

    if (!isContainerNode(frame.node)) {
      values.set(frame.node.id, frame.node.primitiveValue ?? null);
      continue;
    }

    if (!frame.visiting) {
      stack.push({ node: frame.node, visiting: true });
      for (let index = frame.node.childIds.length - 1; index >= 0; index -= 1) {
        const childId = frame.node.childIds[index];
        if (!childId) {
          continue;
        }
        const child = getJsonNode(document, childId);
        if (child) {
          stack.push({ node: child, visiting: false });
        }
      }
      continue;
    }

    if (frame.node.type === "array") {
      const items: JsonValue[] = [];
      for (const childId of frame.node.childIds) {
        const childValue = values.get(childId);
        if (childValue !== undefined) {
          items.push(childValue);
        }
      }
      values.set(frame.node.id, items);
      continue;
    }

    const object: { [key: string]: JsonValue } = {};
    for (const childId of frame.node.childIds) {
      const child = getJsonNode(document, childId);
      const childValue = values.get(childId);
      if (child && child.key !== null && childValue !== undefined) {
        object[child.key] = childValue;
      }
    }
    values.set(frame.node.id, object);
  }

  return values.get(nodeId);
}
