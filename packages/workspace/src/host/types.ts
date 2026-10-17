import type { WorkspaceToolId } from "@json-explore/workspace/constants/workspace-tools";

export type HostDensity = "compact" | "full";

/**
 * Host-specific side effects. Keep Chrome / Next / storage out of feature panels.
 */
export interface HostAdapters {
  persistSource?: (rawJson: string) => void;
  restoreSource?: () => string | null;
  copyText: (text: string) => Promise<boolean>;
  downloadText?: (filename: string, text: string, mimeType?: string) => void;
  /** Phase 2+: context menu / content script paste into the workspace. */
  ingestExternalJson?: (rawJson: string) => void;
}

export interface HostProfile {
  id: string;
  density: HostDensity;
  /** Tool ids enabled for this surface (subset of the registry). */
  tools: readonly WorkspaceToolId[];
  /** Whether Find / search chrome is shown (popup MVP includes find). */
  showSearch: boolean;
  /** Whether file upload / drag-drop is offered. */
  showFileImport: boolean;
  adapters: HostAdapters;
}
