import { formatPrimitiveDisplay } from "@json-explore/workspace/features/json-explorer/utils/node-presentation";
import { getJsonNode } from "@json-explore/core/json";
import type { JsonDocument, JsonNodeType, JsonPrimitive } from "@json-explore/core/types/json";

export interface HitPreviewSource {
  nodeId: string;
  type: JsonNodeType;
  primitiveValue?: JsonPrimitive;
}

export function getSearchResultPreview(
  result: HitPreviewSource,
  document: JsonDocument | null,
): string {
  if (result.primitiveValue !== undefined) {
    return formatPrimitiveDisplay(result.primitiveValue);
  }

  const node = document ? getJsonNode(document, result.nodeId) : undefined;
  const childCount = node?.childIds.length ?? 0;

  if (result.type === "array") {
    return childCount === 0 ? "[]" : `array[${String(childCount)}]`;
  }
  if (result.type === "object") {
    return childCount === 0 ? "{}" : `object{${String(childCount)}}`;
  }

  return result.type;
}
