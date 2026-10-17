import { LONG_STRING_LIMIT } from "@json-explore/workspace/features/json-explorer/constants";
import { isContainerNode } from "@json-explore/core/json/node";
import type { JsonNode, JsonNodeType } from "@json-explore/core/types/json";

export function getNodeDisplayName(node: JsonNode, isRoot: boolean): string {
  if (isRoot) {
    return "$";
  }
  if (node.index !== null) {
    return `[${String(node.index)}]`;
  }
  if (node.key !== null) {
    return node.key;
  }
  return node.path;
}

export function getContainerBadge(node: JsonNode): string | null {
  if (node.type === "array") {
    return node.childIds.length === 0
      ? "[]"
      : `[${String(node.childIds.length)}]`;
  }
  if (node.type === "object") {
    return node.childIds.length === 0
      ? "{}"
      : `{${String(node.childIds.length)}}`;
  }
  return null;
}

export function formatPrimitiveDisplay(
  value: string | number | boolean | null,
): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (value === null) {
    return "null";
  }
  return String(value);
}

export function truncateDisplay(
  text: string,
  max = LONG_STRING_LIMIT,
): { text: string; truncated: boolean } {
  if (text.length <= max) {
    return { text, truncated: false };
  }
  return { text: `${text.slice(0, max)}…`, truncated: true };
}

export function getTreeItemAriaLabel(node: JsonNode, isRoot: boolean): string {
  const name = isRoot ? "root" : getNodeDisplayName(node, false);

  if (node.type === "array") {
    const count = node.childIds.length;
    return `${name}, array, ${count} ${count === 1 ? "item" : "items"}`;
  }

  if (node.type === "object") {
    const count = node.childIds.length;
    return `${name}, object, ${count} ${count === 1 ? "property" : "properties"}`;
  }

  return `${name}, ${node.type}, ${formatPrimitiveDisplay(node.primitiveValue ?? null)}`;
}

export function getEmptyContainerHint(node: JsonNode): string | null {
  if (!isContainerNode(node) || node.childIds.length > 0) {
    return null;
  }
  return node.type === "array" ? "Empty array" : "Empty object";
}

export function primitiveToneClass(type: JsonNodeType): string {
  switch (type) {
    case "string":
      return "text-success";
    case "number":
      return "text-primary";
    case "boolean":
      return "text-warning";
    case "null":
      return "text-muted";
    default:
      return "text-foreground";
  }
}
