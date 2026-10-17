import { WORKSPACE_TOOL_IDS } from "@json-explore/workspace/constants/workspace-tools";
import {
  createExtensionPopupAdapters,
  createWebHostAdapters,
} from "@json-explore/workspace/host/adapters";
import type { HostProfile } from "@json-explore/workspace/host/types";

export function createWebHostProfile(): HostProfile {
  return {
    id: "web",
    density: "full",
    tools: WORKSPACE_TOOL_IDS,
    showSearch: true,
    showFileImport: true,
    adapters: createWebHostAdapters(),
  };
}

/** Popup MVP: format (pretty or compact) + find. */
export function createExtensionPopupHostProfile(): HostProfile {
  return {
    id: "extension-popup",
    density: "compact",
    tools: ["format"],
    showSearch: true,
    showFileImport: false,
    adapters: createExtensionPopupAdapters(),
  };
}

/** Side panel later: same tools as web, compact chrome. */
export function createExtensionSidePanelHostProfile(): HostProfile {
  return {
    id: "extension-sidepanel",
    density: "full",
    tools: WORKSPACE_TOOL_IDS,
    showSearch: true,
    showFileImport: true,
    adapters: createExtensionPopupAdapters(),
  };
}
