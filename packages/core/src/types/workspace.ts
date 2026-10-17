import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";
import type { JsonIndentation } from "@json-explore/core/constants/json";

/**
 * Workspace state is feature-scoped, not a global Redux store.
 * Keep raw text, parse result, and UI selection concerns explicit.
 */
export interface JsonWorkspaceState {
  rawJson: string;
  parsedJson: JsonValue | null;
  document: JsonDocument | null;
  outputJson: string;
  indentation: JsonIndentation;
  isValid: boolean;
  error: AppError | null;
  selectedNodeId: string | null;
  searchQuery: string;
  status: WorkspaceStatus;
  sourceFileName: string | null;
}

export type WorkspaceStatus =
  "idle" | "parsing" | "analyzing" | "indexing" | "ready" | "error";

export const INITIAL_WORKSPACE_STATE: JsonWorkspaceState = {
  rawJson: "",
  parsedJson: null,
  document: null,
  outputJson: "",
  indentation: 2,
  isValid: false,
  error: null,
  selectedNodeId: null,
  searchQuery: "",
  status: "idle",
  sourceFileName: null,
};
