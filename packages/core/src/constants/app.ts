export {
  LARGE_JSON_BYTE_THRESHOLD,
  MAX_JSON_BYTE_LIMIT,
  PERFORMANCE_LIMITS,
} from "@json-explore/core/constants/performance";

export const ACCEPTED_JSON_FILE_TYPES = [
  "application/json",
  "text/json",
  "text/plain",
] as const;

export const ACCEPTED_JSON_EXTENSIONS = [".json", ".txt"] as const;

export const THEME_STORAGE_KEY = "json-explore-theme";
