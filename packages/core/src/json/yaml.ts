import { isJsonArray, isJsonObject } from "@json-explore/core/json/node";
import type { JsonValue } from "@json-explore/core/types/json";

const RESERVED = /^(?:true|false|yes|no|on|off|y|n|null|~)$/i;
const NUMERIC =
  /^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$|^(?:\.inf|-\.inf|\.nan)$/i;
const INDICATOR = /^[-?:,[\]{}#&*!|>'"%@`]/;

/**
 * A plain YAML scalar is only used when a later parser cannot treat it as
 * a tag, alias, boolean, number, or structure.
 */
function isPlainSafe(value: string): boolean {
  if (value.length === 0 || value !== value.trim()) {
    return false;
  }
  if (INDICATOR.test(value) || value.includes(":") || value.includes("#")) {
    return false;
  }
  if (/[\n\r\t\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }
  if (RESERVED.test(value) || NUMERIC.test(value) || /^0\d+$/.test(value)) {
    return false;
  }
  if (/^0x/i.test(value) || /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return false;
  }
  return true;
}

function quote(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function emitBlockString(value: string, level: number): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const strip = !normalized.endsWith("\n");
  const body = strip ? normalized : normalized.slice(0, -1);
  const pad = indent(level + 1);
  const lines = body
    .split("\n")
    .map((line) => (line.length === 0 ? "" : pad + line));
  return `${strip ? "|-" : "|"}\n${lines.join("\n")}`;
}

function emitScalar(value: JsonValue, level: number): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    if (value.includes("\n") || value.includes("\r")) {
      return emitBlockString(value, level);
    }
    return isPlainSafe(value) ? value : quote(value);
  }
  return "";
}

function isBlockContainer(value: JsonValue): boolean {
  if (isJsonArray(value)) {
    return value.length > 0;
  }
  if (isJsonObject(value)) {
    return Object.keys(value).length > 0;
  }
  return false;
}

function emitKey(key: string): string {
  return isPlainSafe(key) ? key : quote(key);
}

function emitObject(
  value: { [key: string]: JsonValue },
  level: number,
): string {
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return "{}";
  }
  return keys
    .map((key) => {
      const child = value[key]!;
      const prefix = `${indent(level)}${emitKey(key)}:`;
      if (isJsonObject(child) && Object.keys(child).length === 0) {
        return `${prefix} {}`;
      }
      if (isJsonArray(child) && child.length === 0) {
        return `${prefix} []`;
      }
      if (isBlockContainer(child)) {
        return `${prefix}\n${emitNode(child, level + 1)}`;
      }
      return `${prefix} ${emitScalar(child, level)}`;
    })
    .join("\n");
}

function emitArray(value: JsonValue[], level: number): string {
  if (value.length === 0) {
    return "[]";
  }
  return value
    .map((item) => {
      const dash = `${indent(level)}-`;
      if (isJsonObject(item) && Object.keys(item).length === 0) {
        return `${dash} {}`;
      }
      if (isJsonArray(item) && item.length === 0) {
        return `${dash} []`;
      }
      if (isJsonObject(item) && Object.keys(item).length > 0) {
        const lines = emitObject(item, level + 1).split("\n");
        const pad = indent(level + 1);
        const first = lines[0]?.startsWith(pad)
          ? lines[0].slice(pad.length)
          : lines[0];
        return [`${dash} ${first ?? ""}`, ...lines.slice(1)].join("\n");
      }
      if (isBlockContainer(item)) {
        return `${dash}\n${emitNode(item, level + 1)}`;
      }
      return `${dash} ${emitScalar(item, level)}`;
    })
    .join("\n");
}

function emitNode(value: JsonValue, level: number): string {
  if (isJsonArray(value)) {
    return emitArray(value, level);
  }
  if (isJsonObject(value)) {
    return emitObject(value, level);
  }
  return emitScalar(value, level);
}

/**
 * Serialize parsed JSON as YAML. This never parses YAML and never emits
 * tags, anchors, or aliases.
 */
export function jsonToYaml(value: JsonValue): string {
  return emitNode(value, 0);
}
