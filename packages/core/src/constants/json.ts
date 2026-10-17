export const JSON_ROOT_PATH = "$";

export const JSON_INDENTATION = [2, 4, "\t"] as const;

export type JsonIndentation = (typeof JSON_INDENTATION)[number];

export const DEFAULT_JSON_INDENTATION: JsonIndentation = 2;

export const JSON_INDENTATION_LABELS: Record<JsonIndentation, string> = {
  2: "2 spaces",
  4: "4 spaces",
  "\t": "Tabs",
};

/** ASCII identifiers may use dot notation in JSON paths. */
export const JSON_PATH_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
