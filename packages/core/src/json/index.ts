/**
 * JSON domain layer — React-free parsing, formatting, and document modeling.
 *
 * Heavy work for large payloads is invoked through `lib/processing` + workers.
 * Never log raw JSON from these functions.
 */

export {
  parseJson,
  type ParseJsonResult,
} from "@json-explore/core/json/parser";
export {
  formatJson,
  stringifyFormatted,
  type FormatJsonOptions,
  type FormatJsonResult,
} from "@json-explore/core/json/formatter";
export {
  minifyJson,
  stringifyMinified,
  type MinifyJsonResult,
} from "@json-explore/core/json/minifier";
export {
  validateJson,
  type ValidateJsonResult,
} from "@json-explore/core/json/validate";
export {
  describeJsonRepair,
  repairJson,
  type JsonRepair,
  type RepairJsonResult,
} from "@json-explore/core/json/repair";
export {
  compareJsonValues,
  describeJsonDiff,
  MAX_JSON_DIFFS,
  type JsonCompareResult,
  type JsonDiff,
  type JsonDiffKind,
} from "@json-explore/core/json/compare";
export {
  CSV_DELIMITER_LABELS,
  CSV_DELIMITERS,
  jsonToCsv,
  type CsvDelimiter,
  type JsonToCsvOptions,
  type JsonToCsvResult,
} from "@json-explore/core/json/csv";
export { jsonToYaml } from "@json-explore/core/json/yaml";
export {
  validateJsonSchema,
  MAX_SCHEMA_VIOLATIONS,
  type JsonSchemaReport,
  type SchemaViolation,
  type ValidateJsonSchemaResult,
} from "@json-explore/core/json/schema";
export {
  serializeJsonValue,
  type JsonSerializeStyle,
} from "@json-explore/core/json/serialize";
export {
  resolveJsonDownloadFilename,
  type JsonDownloadVariant,
} from "@json-explore/core/json/filename";
export {
  buildJsonDocument,
  getJsonNode,
  listJsonNodePaths,
  type BuildJsonDocumentOptions,
} from "@json-explore/core/json/document";
export {
  createJsonNodeId,
  getJsonNodeType,
  isContainerNode,
  isJsonArray,
  isJsonObject,
  isJsonPrimitive,
} from "@json-explore/core/json/node";
export {
  getAncestorIds,
  listContainerNodeIds,
  listExpandAllNodeIds,
  materializeJsonValue,
} from "@json-explore/core/json/traverse";
export {
  appendJsonPath,
  createRootJsonPath,
  formatJsonPathIndex,
  formatJsonPathKey,
  getJsonPath,
  isSafeJsonPathKey,
  type JsonPathSegment,
} from "@json-explore/core/json/path";
export { toJsonDocumentMetadata } from "@json-explore/core/json/metadata";
export {
  emptyJsonError,
  normalizeJsonParseError,
  positionFromLocation,
} from "@json-explore/core/json/errors";
export {
  isAcceptedJsonFile,
  readJsonFile,
  type ReadJsonFileResult,
} from "@json-explore/core/json/file";
