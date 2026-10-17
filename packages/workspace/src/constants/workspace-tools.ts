export const WORKSPACE_TOOL_QUERY = "tool";

export const WORKSPACE_SOURCE_SESSION_KEY = "json-explore-workspace-raw";

/** Delay after the last edit before the shared document is reparsed. */
export const WORKSPACE_PARSE_DEBOUNCE_MS = 300;

export const SAMPLE_WORKSPACE_JSON = `{
  "users": [
    {
      "id": 1,
      "name": "Ada",
      "profile": { "email": "ada@example.com" }
    },
    {
      "id": 2,
      "name": "Grace",
      "role": "engineer",
      "profile": { "email": "grace@example.com" }
    }
  ],
  "user.profile": {
    "first-name": "Ada"
  },
  "meta": { "version": 1, "active": true }
}
`;

export const WORKSPACE_TOOL_IDS = [
  "explore",
  "query",
  "statistics",
  "format",
  "repair",
  "compare",
  "csv",
  "yaml",
  "schema",
  "validate",
] as const;

export const OUTPUT_STYLES = ["pretty", "compact"] as const;

export type OutputStyle = (typeof OUTPUT_STYLES)[number];

export const OUTPUT_STYLE_LABELS: Record<OutputStyle, string> = {
  pretty: "Pretty",
  compact: "Compact",
};

export type WorkspaceToolId = (typeof WORKSPACE_TOOL_IDS)[number];

export interface WorkspaceToolDefinition {
  id: WorkspaceToolId;
  label: string;
  description: string;
  primaryAction: string | null;
  requiresDocument: boolean;
}

export const WORKSPACE_TOOLS: readonly WorkspaceToolDefinition[] = [
  {
    id: "explore",
    label: "Explore",
    description: "Inspect structure and search keys or values.",
    primaryAction: null,
    requiresDocument: true,
  },
  {
    id: "query",
    label: "Query",
    description: "Run a path or JSONPath subset.",
    primaryAction: "Run",
    requiresDocument: true,
  },
  {
    id: "statistics",
    label: "Statistics",
    description: "Counts, types, common keys, and depth.",
    primaryAction: null,
    requiresDocument: true,
  },
  {
    id: "format",
    label: "Format",
    description: "Pretty-print or compact the shared JSON.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "repair",
    label: "Repair",
    description: "Fix common JSON syntax without changing the source.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "compare",
    label: "Compare",
    description: "Compare the shared JSON with a second document.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "csv",
    label: "CSV",
    description: "Convert an array of flat objects to CSV.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "yaml",
    label: "YAML",
    description: "Convert the shared JSON to YAML.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "schema",
    label: "Schema",
    description: "Validate the shared JSON against a JSON Schema.",
    primaryAction: null,
    requiresDocument: false,
  },
  {
    id: "validate",
    label: "Validate",
    description: "Check that the source parses as JSON.",
    primaryAction: null,
    requiresDocument: false,
  },
] as const;

export function isWorkspaceToolId(value: string): value is WorkspaceToolId {
  return (WORKSPACE_TOOL_IDS as readonly string[]).includes(value);
}

export function getWorkspaceTool(id: WorkspaceToolId): WorkspaceToolDefinition {
  const tool = WORKSPACE_TOOLS.find((item) => item.id === id);
  return tool ?? WORKSPACE_TOOLS[0]!;
}

export function parseWorkspaceToolParam(
  value: string | null | undefined,
): WorkspaceToolId | null {
  if (!value || value === "source") {
    return null;
  }
  if (value === "search") {
    return "explore";
  }
  if (value === "output" || value === "minify") {
    return "format";
  }
  if (!isWorkspaceToolId(value)) {
    return null;
  }
  return value;
}

export function parseWorkspaceOutputStyle(
  value: string | null | undefined,
): OutputStyle {
  return value === "minify" ? "compact" : "pretty";
}
