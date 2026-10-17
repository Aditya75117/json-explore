import { getJsonNode, materializeJsonValue } from "@json-explore/core/json";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import type { JsonDocument } from "@json-explore/core/types/json";

/**
 * Text placed on the clipboard for "Copy value".
 * Strings are copied raw; containers become formatted JSON.
 */
export function getCopyValueText(
  document: JsonDocument,
  nodeId: string,
  indentation: JsonIndentation = 2,
): string | undefined {
  const node = getJsonNode(document, nodeId);
  if (!node) {
    return undefined;
  }

  if (node.type === "string") {
    return typeof node.primitiveValue === "string" ? node.primitiveValue : "";
  }

  const value = materializeJsonValue(document, nodeId);
  if (value === undefined) {
    return undefined;
  }

  if (node.type === "object" || node.type === "array") {
    return stringifyFormatted(value, indentation);
  }

  return JSON.stringify(value);
}
