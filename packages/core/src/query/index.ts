/**
 * Query engine — React-free parser + evaluator for a JSONPath-compatible subset.
 *
 * Simple paths compile to the same AST as JSONPath. UI must call
 * `executeJsonQuery` / `runJsonQuery`, never evaluate strings as JavaScript.
 */

export { parseQuery } from "@json-explore/core/query/parser";
export { evaluateQuery } from "@json-explore/core/query/evaluator";
export { executeJsonQuery } from "@json-explore/core/query/execute-query";
export { tokenizeQuery } from "@json-explore/core/query/tokenizer";
export { normalizeSimplePath } from "@json-explore/core/query/normalize-path";
export { createQueryError } from "@json-explore/core/query/errors";
export type {
  ExecuteQueryOptions,
  JsonQueryResponse,
  JsonQueryResult,
  QueryAst,
  QueryError,
  QueryMode,
  QueryStep,
} from "@json-explore/core/types/query";
