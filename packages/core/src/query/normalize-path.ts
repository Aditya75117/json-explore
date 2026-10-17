import { createQueryError } from "@json-explore/core/query/errors";
import type { Result } from "@json-explore/core/types/result";
import type { QueryError } from "@json-explore/core/types/query";

/**
 * Compile a simple path into the JSONPath subset the parser understands.
 *
 * users              → $.users
 * users[].id         → $.users[*].id
 * users[0].profile   → $.users[0].profile
 * ["user.profile"]   → $["user.profile"]
 */
export function normalizeSimplePath(
  input: string,
): Result<string, QueryError> {
  const source = input.trim();
  if (source.length === 0) {
    return {
      ok: false,
      error: createQueryError("Enter a path query"),
    };
  }

  if (source.includes("..")) {
    return {
      ok: false,
      error: createQueryError(
        "Recursive descent (..) is available in JSONPath mode",
        source.indexOf(".."),
      ),
    };
  }

  const withWildcards = source.replaceAll("[]", "[*]");
  if (withWildcards.startsWith("$")) {
    return { ok: true, value: withWildcards };
  }
  if (withWildcards.startsWith("[")) {
    return { ok: true, value: `$${withWildcards}` };
  }
  if (withWildcards.startsWith(".")) {
    return {
      ok: false,
      error: createQueryError(
        "Path queries should start with a property name, e.g. users[].id",
        0,
      ),
    };
  }

  return { ok: true, value: `$.${withWildcards}` };
}
