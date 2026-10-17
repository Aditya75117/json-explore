import { createQueryError } from "@json-explore/core/query/errors";
import type { Result } from "@json-explore/core/types/result";
import type { QueryError } from "@json-explore/core/types/query";

export type QueryTokenType =
  | "dollar"
  | "dot"
  | "dotdot"
  | "ident"
  | "lbracket"
  | "rbracket"
  | "star"
  | "number"
  | "string"
  | "eof";

export interface QueryToken {
  type: QueryTokenType;
  value?: string | number;
  position: number;
}

function isIdentStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isIdentPart(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

function readString(
  source: string,
  start: number,
): Result<{ value: string; end: number }, QueryError> {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") {
    return {
      ok: false,
      error: createQueryError("Expected a quoted property name", start),
    };
  }

  let index = start + 1;
  let value = "";

  while (index < source.length) {
    const char = source[index];
    if (char === quote) {
      return { ok: true, value: { value, end: index + 1 } };
    }
    if (char === "\\") {
      const next = source[index + 1];
      if (next === undefined) {
        return {
          ok: false,
          error: createQueryError("Unterminated escape in quoted key", start),
        };
      }
      if (next === "n") {
        value += "\n";
      } else if (next === "t") {
        value += "\t";
      } else if (next === "r") {
        value += "\r";
      } else {
        value += next;
      }
      index += 2;
      continue;
    }
    value += char;
    index += 1;
  }

  return {
    ok: false,
    error: createQueryError("Unterminated quoted property name", start),
  };
}

/**
 * Tokenize a query string. Never uses eval / Function.
 */
export function tokenizeQuery(
  source: string,
): Result<QueryToken[], QueryError> {
  const tokens: QueryToken[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (char === undefined) {
      break;
    }

    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      index += 1;
      continue;
    }

    if (char === "$") {
      tokens.push({ type: "dollar", position: index });
      index += 1;
      continue;
    }

    if (char === ".") {
      if (source[index + 1] === ".") {
        tokens.push({ type: "dotdot", position: index });
        index += 2;
        continue;
      }
      tokens.push({ type: "dot", position: index });
      index += 1;
      continue;
    }

    if (char === "[") {
      tokens.push({ type: "lbracket", position: index });
      index += 1;
      continue;
    }

    if (char === "]") {
      tokens.push({ type: "rbracket", position: index });
      index += 1;
      continue;
    }

    if (char === "*") {
      tokens.push({ type: "star", position: index });
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const parsed = readString(source, index);
      if (!parsed.ok) {
        return parsed;
      }
      tokens.push({
        type: "string",
        value: parsed.value.value,
        position: index,
      });
      index = parsed.value.end;
      continue;
    }

    if (char >= "0" && char <= "9") {
      let end = index + 1;
      while (end < source.length) {
        const digit = source[end];
        if (!digit || digit < "0" || digit > "9") {
          break;
        }
        end += 1;
      }
      tokens.push({
        type: "number",
        value: Number(source.slice(index, end)),
        position: index,
      });
      index = end;
      continue;
    }

    if (isIdentStart(char)) {
      let end = index + 1;
      while (end < source.length) {
        const next = source[end];
        if (!next || !isIdentPart(next)) {
          break;
        }
        end += 1;
      }
      tokens.push({
        type: "ident",
        value: source.slice(index, end),
        position: index,
      });
      index = end;
      continue;
    }

    if (char === "?" || char === "(" || char === ")" || char === "@") {
      return {
        ok: false,
        error: createQueryError(
          "Unsupported JSONPath syntax. Filters and script expressions are not supported.",
          index,
        ),
      };
    }

    if (char === ":" || char === ",") {
      return {
        ok: false,
        error: createQueryError(
          "Unsupported JSONPath syntax. Slices and unions are not supported.",
          index,
        ),
      };
    }

    return {
      ok: false,
      error: createQueryError(`Unexpected character “${char}”`, index),
    };
  }

  tokens.push({ type: "eof", position: source.length });
  return { ok: true, value: tokens };
}
