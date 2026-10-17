import { WORKSPACE_SOURCE_SESSION_KEY } from "@json-explore/workspace/constants/workspace-tools";

export function readWorkspaceSourceSession(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const value = sessionStorage.getItem(WORKSPACE_SOURCE_SESSION_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

export function writeWorkspaceSourceSession(rawJson: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    if (!rawJson.trim()) {
      sessionStorage.removeItem(WORKSPACE_SOURCE_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(WORKSPACE_SOURCE_SESSION_KEY, rawJson);
  } catch {
    // Quota or private-mode — ignore; the document stays in memory.
  }
}
