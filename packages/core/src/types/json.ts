/**
 * Core JSON value model.
 * Domain types stay React-free so workers and lib modules can share them.
 */

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export type JsonNodeType =
  "object" | "array" | "string" | "number" | "boolean" | "null";

/**
 * Navigable tree node for a single parsed document.
 *
 * `id` is the JSON path (see `createJsonNodeId`). Unique within a document
 * and stable for that document's lifetime — no random IDs.
 *
 * Nested object/array payloads are not stored on the node. That would
 * duplicate the tree. Primitive leaves keep `primitiveValue` only.
 */
export interface JsonNode {
  id: string;
  type: JsonNodeType;
  key: string | null;
  index: number | null;
  path: string;
  depth: number;
  parentId: string | null;
  childIds: string[];
  primitiveValue?: string | number | boolean | null;
}

export interface JsonDocumentMetadata {
  nodeCount: number;
  objectCount: number;
  arrayCount: number;
  maxDepth: number;
  sizeInBytes: number;
  /**
   * Stable id for this in-memory document instance. Used so the Worker
   * can reuse a cached graph instead of structured-cloning it again.
   */
  revision: string;
}

/**
 * Internal document model for explorer/search (later phases).
 * `nodes` is a path-id lookup; child order is `childIds` on each node.
 */
export interface JsonDocument {
  rootId: string;
  nodes: Record<string, JsonNode>;
  metadata: JsonDocumentMetadata;
}
