import { Validator } from "@cfworker/json-schema";
import type { OutputUnit } from "@cfworker/json-schema";
import { isJsonArray, isJsonObject } from "@json-explore/core/json/node";
import {
  appendJsonPath,
  createRootJsonPath,
} from "@json-explore/core/json/path";
import { createAppError } from "@json-explore/core/types/errors";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export const MAX_SCHEMA_VIOLATIONS = 100;

const SCHEMA_TYPES = new Set([
  "array",
  "boolean",
  "integer",
  "null",
  "number",
  "object",
  "string",
]);

const WRAPPER_KEYWORDS = new Set([
  "properties",
  "items",
  "prefixItems",
  "allOf",
  "anyOf",
  "oneOf",
  "if",
  "then",
  "else",
  "not",
  "contains",
  "dependentSchemas",
]);

export interface SchemaViolation {
  path: string;
  keyword: string;
  message: string;
}

export interface JsonSchemaReport {
  violations: SchemaViolation[];
  total: number;
  truncated: boolean;
}

export type ValidateJsonSchemaResult = Result<JsonSchemaReport, AppError>;

function schemaError(message: string): AppError {
  return createAppError("UNKNOWN", message);
}

function unescapeJsonPointer(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pointerToJsonPath(data: JsonValue, pointer: string): string {
  const body = pointer.startsWith("#") ? pointer.slice(1) : pointer;
  if (!body) {
    return createRootJsonPath();
  }
  const segments = body.split("/").slice(1).map(unescapeJsonPointer);
  let path = createRootJsonPath();
  let current: JsonValue | undefined = data;
  for (const segment of segments) {
    if (current !== undefined && isJsonArray(current) && /^\d+$/.test(segment)) {
      const index = Number(segment);
      path = appendJsonPath(path, { type: "index", index });
      current = current[index];
      continue;
    }
    path = appendJsonPath(path, { type: "key", key: segment });
    current =
      current !== undefined && isJsonObject(current)
        ? current[segment]
        : undefined;
  }
  return path;
}

function requiredProperty(message: string): string | null {
  const match = /required property "((?:\\.|[^"\\])*)"/.exec(message);
  return match?.[1] ?? null;
}

function violationFromError(
  data: JsonValue,
  error: OutputUnit,
): SchemaViolation {
  let path = pointerToJsonPath(data, error.instanceLocation);
  if (error.keyword === "required") {
    const property = requiredProperty(error.error);
    if (property) {
      path = appendJsonPath(path, { type: "key", key: property });
    }
  }
  return {
    path,
    keyword: error.keyword,
    message: error.error,
  };
}

function checkSchemaNode(schema: JsonValue, path: string): string | null {
  if (typeof schema === "boolean") {
    return null;
  }
  if (!isJsonObject(schema)) {
    return `The schema at ${path} must be an object or a boolean.`;
  }

  if ("type" in schema) {
    const typeValue = schema.type;
    const types = isJsonArray(typeValue) ? typeValue : [typeValue];
    if (!isJsonArray(typeValue) && typeof typeValue !== "string") {
      return `The schema type at ${path} must be a string or an array of strings.`;
    }
    for (const typeName of types) {
      if (typeof typeName !== "string" || !SCHEMA_TYPES.has(typeName)) {
        return `The schema type at ${path} is not a draft 2020-12 type.`;
      }
    }
  }

  if ("required" in schema) {
    const required = schema.required;
    if (
      !isJsonArray(required) ||
      required.some((item) => typeof item !== "string")
    ) {
      return `The schema required list at ${path} must be an array of strings.`;
    }
  }

  for (const key of [
    "properties",
    "$defs",
    "patternProperties",
    "dependentSchemas",
  ] as const) {
    if (!(key in schema)) {
      continue;
    }
    const group = schema[key];
    const groupPath = appendJsonPath(path, { type: "key", key });
    if (group === undefined || !isJsonObject(group)) {
      return `The schema ${key} at ${path} must be an object.`;
    }
    for (const [childKey, child] of Object.entries(group)) {
      const nested = checkSchemaNode(
        child!,
        appendJsonPath(groupPath, { type: "key", key: childKey }),
      );
      if (nested) {
        return nested;
      }
    }
  }

  for (const key of [
    "items",
    "additionalProperties",
    "unevaluatedProperties",
    "propertyNames",
    "not",
    "if",
    "then",
    "else",
    "contains",
  ] as const) {
    if (!(key in schema) || schema[key] === undefined) {
      continue;
    }
    const child = schema[key]!;
    const childPath = appendJsonPath(path, { type: "key", key });
    if (key === "items" && isJsonArray(child)) {
      for (let index = 0; index < child.length; index += 1) {
        const nested = checkSchemaNode(
          child[index]!,
          appendJsonPath(childPath, { type: "index", index }),
        );
        if (nested) {
          return nested;
        }
      }
      continue;
    }
    const nested = checkSchemaNode(child, childPath);
    if (nested) {
      return nested;
    }
  }

  if ("prefixItems" in schema && schema.prefixItems !== undefined) {
    const prefixPath = appendJsonPath(path, {
      type: "key",
      key: "prefixItems",
    });
    if (!isJsonArray(schema.prefixItems)) {
      return `The schema prefixItems at ${path} must be an array.`;
    }
    for (let index = 0; index < schema.prefixItems.length; index += 1) {
      const nested = checkSchemaNode(
        schema.prefixItems[index]!,
        appendJsonPath(prefixPath, { type: "index", index }),
      );
      if (nested) {
        return nested;
      }
    }
  }

  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    if (!(key in schema) || schema[key] === undefined) {
      continue;
    }
    const groupPath = appendJsonPath(path, { type: "key", key });
    if (!isJsonArray(schema[key])) {
      return `The schema ${key} at ${path} must be an array.`;
    }
    for (let index = 0; index < schema[key].length; index += 1) {
      const nested = checkSchemaNode(
        schema[key][index]!,
        appendJsonPath(groupPath, { type: "index", index }),
      );
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

/**
 * Validate instance data against a draft 2020-12 schema.
 * The schema is interpreted. It is not compiled into executable code.
 */
export function validateJsonSchema(
  data: JsonValue,
  schema: JsonValue,
): ValidateJsonSchemaResult {
  const shapeError = checkSchemaNode(schema, createRootJsonPath());
  if (shapeError) {
    return { ok: false, error: schemaError(shapeError) };
  }

  try {
    const validator = new Validator(
      schema as boolean | Record<string, JsonValue>,
      "2020-12",
      false,
    );
    const result = validator.validate(data);
    if (result.valid) {
      return {
        ok: true,
        value: { violations: [], total: 0, truncated: false },
      };
    }
    const specific = result.errors.filter(
      (error) => !WRAPPER_KEYWORDS.has(error.keyword),
    );
    const errors = specific.length > 0 ? specific : result.errors;
    const violations = errors
      .slice(0, MAX_SCHEMA_VIOLATIONS)
      .map((error) => violationFromError(data, error));
    return {
      ok: true,
      value: {
        violations,
        total: errors.length,
        truncated: errors.length > violations.length,
      },
    };
  } catch {
    return {
      ok: false,
      error: schemaError("This JSON is not a valid draft 2020-12 schema."),
    };
  }
}
