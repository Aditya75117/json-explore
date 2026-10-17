"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWorkspaceTool,
  parseWorkspaceToolParam,
  WORKSPACE_TOOL_QUERY,
  type WorkspaceToolId,
} from "@json-explore/workspace/constants/workspace-tools";

const DEFAULT_TOOL: WorkspaceToolId = "explore";

function readToolFromLocation(): WorkspaceToolId | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return parseWorkspaceToolParam(params.get(WORKSPACE_TOOL_QUERY));
}

/** Old bookmarks: ?tool=search → Explore, ?tool=output|minify → Format. */
function normalizeLegacyToolParam() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(WORKSPACE_TOOL_QUERY);
  if (raw === "search") {
    params.delete(WORKSPACE_TOOL_QUERY);
  } else if (raw === "output" || raw === "minify") {
    params.set(WORKSPACE_TOOL_QUERY, "format");
  } else {
    return;
  }
  const query = params.toString();
  const href = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  if (`${window.location.pathname}${window.location.search}` !== href) {
    window.history.replaceState(null, "", href);
  }
}

function hrefForTool(pathname: string, tool: WorkspaceToolId): string {
  if (tool === DEFAULT_TOOL) {
    return pathname;
  }
  return `${pathname}?${WORKSPACE_TOOL_QUERY}=${tool}`;
}

export function useWorkspaceTool() {
  const [tool, setToolState] = useState<WorkspaceToolId>(DEFAULT_TOOL);

  useEffect(() => {
    normalizeLegacyToolParam();
    const fromUrl = readToolFromLocation();
    if (fromUrl && fromUrl !== DEFAULT_TOOL) {
      // URL is the source of truth for the first paint after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from ?tool=
      setToolState(fromUrl);
    }
    const onPopState = () => {
      setToolState(readToolFromLocation() ?? DEFAULT_TOOL);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setTool = useCallback((next: WorkspaceToolId) => {
    setToolState(next);
    const href = hrefForTool(window.location.pathname, next);
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.replaceState(null, "", href);
    }
  }, []);

  const definition = useMemo(() => getWorkspaceTool(tool), [tool]);

  return { tool, setTool, definition };
}
