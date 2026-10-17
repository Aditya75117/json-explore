import { copyTextToClipboard } from "@json-explore/core/utils/clipboard";
import { downloadTextFile } from "@json-explore/core/utils/download";
import {
  readWorkspaceSourceSession,
  writeWorkspaceSourceSession,
} from "@json-explore/workspace/lib/workspace/session-source";
import type { HostAdapters } from "@json-explore/workspace/host/types";

/** Default web adapters: sessionStorage + clipboard + download. */
export function createWebHostAdapters(): HostAdapters {
  return {
    persistSource: writeWorkspaceSourceSession,
    restoreSource: readWorkspaceSourceSession,
    copyText: copyTextToClipboard,
    downloadText: (filename, text, mimeType) => {
      downloadTextFile(text, filename, mimeType);
    },
  };
}

/** Extension popup: clipboard only; no session restore in MVP. */
export function createExtensionPopupAdapters(): HostAdapters {
  return {
    copyText: copyTextToClipboard,
  };
}
