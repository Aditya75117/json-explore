const FALLBACK_SITE_URL = "https://jsonexplore.dev";

export const SITE = {
  name: "JSON Explore",
  tagline: "Find anything inside any JSON.",
  description:
    "Explore, search, query, format, validate, and analyze JSON online. Find deeply nested keys and values instantly and jump directly to matching nodes.",
  githubUrl: "https://github.com",
} as const;

export const SITE_TITLE = "JSON Explore — Search, Query & Explore JSON Online";

/** Single marketing/workspace CTA label. */
export const OPEN_EXPLORER_LABEL = "Open explorer";

export const SITE_KEYWORDS = [
  "JSON explorer",
  "JSON viewer",
  "JSON search",
  "JSON query tool",
  "JSON tree viewer",
  "search nested JSON",
  "find key in JSON",
  "JSON validator",
  "JSON formatter",
] as const;

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function hasPublicGithubRepo(url: string): boolean {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parsed.hostname === "github.com" && parts.length >= 2;
  } catch {
    return false;
  }
}
