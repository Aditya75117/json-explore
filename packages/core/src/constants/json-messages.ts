export const JSON_ERROR_MESSAGES = {
  empty: "No JSON provided",
  invalid: "Invalid JSON",
  fileRead: "Unable to read this file",
  unsupportedFile: "Unsupported file type. Use a .json file.",
  largeFile: "This JSON is larger than the current 100 MB processing limit.",
  largeDocument: "Large JSON detected — extra processing time is expected.",
  veryLargeDocument:
    "Very large JSON — performance may vary depending on your browser and device.",
  worker: "Something went wrong while processing the JSON. Please try again.",
  search: "Unable to search this JSON. Please try again.",
  query: "Invalid query syntax",
  queryFailed: "Unable to run this query. Please try again.",
  cannotFormat: "Cannot format invalid JSON",
  cannotMinify: "Cannot minify invalid JSON",
  statistics: "Unable to analyze this JSON. Please try again.",
} as const;
