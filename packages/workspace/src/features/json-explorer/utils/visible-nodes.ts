import { getJsonNode } from "@json-explore/core/json";
import { isContainerNode } from "@json-explore/core/json/node";
import type { JsonDocument } from "@json-explore/core/types/json";

/**
 * Visible rows in expansion order. Collapsed containers contribute only
 * their own row — children are not visited (lazy rendering).
 */
export function listVisibleNodeIds(
  document: JsonDocument,
  expandedNodeIds: ReadonlySet<string>,
): string[] {
  const visible: string[] = [];
  const stack = [document.rootId];

  while (stack.length > 0) {
    const id = stack.pop();
    if (!id) {
      break;
    }

    const node = getJsonNode(document, id);
    if (!node) {
      continue;
    }

    visible.push(id);

    if (isContainerNode(node) && expandedNodeIds.has(id)) {
      for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
        const childId = node.childIds[index];
        if (childId) {
          stack.push(childId);
        }
      }
    }
  }

  return visible;
}

export function initialExpandedNodeIds(document: JsonDocument): Set<string> {
  const root = getJsonNode(document, document.rootId);
  if (root && isContainerNode(root)) {
    return new Set([document.rootId]);
  }
  return new Set();
}
