import {
  DEFAULT_JSON_INDENTATION,
  type JsonIndentation,
} from "@json-explore/core/constants/json";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { stringifyMinified } from "@json-explore/core/json/minifier";
import type { JsonValue } from "@json-explore/core/types/json";

export type JsonSerializeStyle = "formatted" | "minified";

/**
 * Serialize an already-parsed value. Does not parse or rebuild a document.
 */
export function serializeJsonValue(
  value: JsonValue,
  style: JsonSerializeStyle,
  indentation: JsonIndentation = DEFAULT_JSON_INDENTATION,
): string {
  return style === "minified"
    ? stringifyMinified(value)
    : stringifyFormatted(value, indentation);
}
