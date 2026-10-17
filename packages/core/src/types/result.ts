/**
 * Explicit result type for expected failures (invalid JSON, file errors).
 * Prefer this over throwing for domain validation.
 */
export type Result<T, E> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: E;
    };
