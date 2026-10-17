import { createQueryError } from "@json-explore/core/query/errors";
import { normalizeSimplePath } from "@json-explore/core/query/normalize-path";
import {
  tokenizeQuery,
  type QueryToken,
} from "@json-explore/core/query/tokenizer";
import type { Result } from "@json-explore/core/types/result";
import type { QueryAst, QueryError, QueryMode, QueryStep } from "@json-explore/core/types/query";

class TokenCursor {
  private index = 0;

  constructor(private readonly tokens: QueryToken[]) {}

  peek(): QueryToken {
    return this.tokens[this.index] ?? { type: "eof", position: 0 };
  }

  consume(): QueryToken {
    const token = this.peek();
    if (token.type !== "eof") {
      this.index += 1;
    }
    return token;
  }

  expect(
    type: QueryToken["type"],
    message: string,
  ): Result<QueryToken, QueryError> {
    const token = this.peek();
    if (token.type !== type) {
      return {
        ok: false,
        error: createQueryError(message, token.position),
      };
    }
    return { ok: true, value: this.consume() };
  }
}

function parseBracketStep(
  cursor: TokenCursor,
  recursive: boolean,
): Result<QueryStep, QueryError> {
  const open = cursor.consume();
  const inner = cursor.peek();

  if (inner.type === "eof") {
    return {
      ok: false,
      error: createQueryError("Missing closing “]”", open.position),
    };
  }

  if (inner.type === "star") {
    if (recursive) {
      return {
        ok: false,
        error: createQueryError(
          "Recursive descent requires a property name, e.g. $..id",
          inner.position,
        ),
      };
    }
    cursor.consume();
    const close = cursor.expect("rbracket", "Missing closing “]”");
    if (!close.ok) {
      return close;
    }
    return { ok: true, value: { type: "wildcard" } };
  }

  if (inner.type === "number") {
    if (recursive) {
      return {
        ok: false,
        error: createQueryError(
          "Recursive descent requires a property name, e.g. $..id",
          inner.position,
        ),
      };
    }
    const index = inner.value;
    if (typeof index !== "number" || !Number.isInteger(index)) {
      return {
        ok: false,
        error: createQueryError("Array index must be an integer", inner.position),
      };
    }
    cursor.consume();
    const close = cursor.expect("rbracket", "Missing closing “]”");
    if (!close.ok) {
      return close;
    }
    return { ok: true, value: { type: "index", index } };
  }

  if (inner.type === "string") {
    const key = String(inner.value ?? "");
    cursor.consume();
    const close = cursor.expect("rbracket", "Missing closing “]”");
    if (!close.ok) {
      return close;
    }
    return {
      ok: true,
      value: recursive
        ? { type: "recursive", key }
        : { type: "property", key },
    };
  }

  if (inner.type === "rbracket") {
    return {
      ok: false,
      error: createQueryError(
        "Expected an index, “*”, or quoted property name inside “[]”",
        inner.position,
      ),
    };
  }

  if (inner.type === "ident") {
    return {
      ok: false,
      error: createQueryError(
        "Use quoted bracket notation for property names, e.g. [\"key\"]",
        inner.position,
      ),
    };
  }

  return {
    ok: false,
    error: createQueryError(
      "Expected an index, “*”, or quoted property name inside “[]”",
      inner.position,
    ),
  };
}

function parseJsonPathAst(
  source: string,
  mode: QueryMode,
): Result<QueryAst, QueryError> {
  const tokenized = tokenizeQuery(source);
  if (!tokenized.ok) {
    return tokenized;
  }

  const cursor = new TokenCursor(tokenized.value);
  const dollar = cursor.expect(
    "dollar",
    "JSONPath queries must start with $",
  );
  if (!dollar.ok) {
    return dollar;
  }

  const steps: QueryStep[] = [{ type: "root" }];

  while (cursor.peek().type !== "eof") {
    const token = cursor.peek();

    if (token.type === "dot") {
      cursor.consume();
      const next = cursor.peek();
      if (next.type === "ident") {
        cursor.consume();
        steps.push({ type: "property", key: String(next.value ?? "") });
        continue;
      }
      if (next.type === "lbracket") {
        const step = parseBracketStep(cursor, false);
        if (!step.ok) {
          return step;
        }
        steps.push(step.value);
        continue;
      }
      return {
        ok: false,
        error: createQueryError(
          "Expected property name after “.”",
          next.position,
        ),
      };
    }

    if (token.type === "dotdot") {
      cursor.consume();
      const next = cursor.peek();
      if (next.type === "ident") {
        cursor.consume();
        steps.push({ type: "recursive", key: String(next.value ?? "") });
        continue;
      }
      if (next.type === "lbracket") {
        const step = parseBracketStep(cursor, true);
        if (!step.ok) {
          return step;
        }
        steps.push(step.value);
        continue;
      }
      return {
        ok: false,
        error: createQueryError(
          "Expected property name after “..”",
          next.position,
        ),
      };
    }

    if (token.type === "lbracket") {
      const step = parseBracketStep(cursor, false);
      if (!step.ok) {
        return step;
      }
      steps.push(step.value);
      continue;
    }

    return {
      ok: false,
      error: createQueryError("Unexpected token in query", token.position),
    };
  }

  return {
    ok: true,
    value: {
      source,
      mode,
      steps,
    },
  };
}

/**
 * Parse a simple path or JSONPath subset into a shared AST.
 * Query strings are never executed as JavaScript.
 */
export function parseQuery(
  query: string,
  mode: QueryMode,
): Result<QueryAst, QueryError> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: createQueryError("Enter a query"),
    };
  }

  if (mode === "path") {
    const normalized = normalizeSimplePath(trimmed);
    if (!normalized.ok) {
      return normalized;
    }
    return parseJsonPathAst(normalized.value, "path");
  }

  return parseJsonPathAst(trimmed, "jsonpath");
}
