"use client";

import { type ReactNode } from "react";
import { CommandBar } from "@json-explore/ui/components/command-bar";
import { TabList } from "@json-explore/ui/components/tabs";
import {
  WORKSPACE_TOOLS,
  type WorkspaceToolId,
} from "@json-explore/workspace/constants/workspace-tools";

export interface JsonWorkspaceToolbarProps {
  activeTool: WorkspaceToolId;
  onSelect: (id: WorkspaceToolId) => void;
  command?: ReactNode;
  status?: ReactNode;
}

export function JsonWorkspaceToolbar({
  activeTool,
  onSelect,
  command,
  status,
}: JsonWorkspaceToolbarProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 grid-rows-[2.25rem_2.25rem] gap-2 lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[2.25rem]">
      <CommandBar className="gap-1">
        <TabList
          items={WORKSPACE_TOOLS}
          value={activeTool}
          onChange={(id) => onSelect(id as WorkspaceToolId)}
          label="Workspace tools"
          controlsId="workspace-tool-panel"
          className="min-w-0 flex-1 lg:flex-none"
        />
        {status ? (
          <div className="flex h-9 shrink-0 items-center">{status}</div>
        ) : null}
      </CommandBar>
      <CommandBar className="w-full">{command}</CommandBar>
    </div>
  );
}
