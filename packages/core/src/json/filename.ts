import { DEFAULT_JSON_DOWNLOAD_BASENAME } from "@json-explore/core/constants/tools";

export type JsonDownloadVariant = "current" | "formatted" | "minified";

function stripJsonExtension(name: string): string {
  return name.replace(/\.json$/i, "");
}

function sanitizeBasename(name: string): string {
  const trimmed = name.trim();
  const leaf = trimmed.split(/[/\\]/).pop() ?? trimmed;
  const withoutExt = stripJsonExtension(leaf);
  const safe = withoutExt.replace(/[^A-Za-z0-9._-]+/g, "-").replace(
    /^-+|-+$/g,
    "",
  );
  return safe.length > 0 ? safe : DEFAULT_JSON_DOWNLOAD_BASENAME;
}

/**
 * Client-only download name. Preserves an uploaded basename when present.
 */
export function resolveJsonDownloadFilename(
  sourceFileName: string | null | undefined,
  variant: JsonDownloadVariant = "current",
): string {
  const base = sourceFileName
    ? sanitizeBasename(sourceFileName)
    : DEFAULT_JSON_DOWNLOAD_BASENAME;

  if (variant === "formatted") {
    return `${base}.formatted.json`;
  }
  if (variant === "minified") {
    return `${base}.minified.json`;
  }
  return `${base}.json`;
}
