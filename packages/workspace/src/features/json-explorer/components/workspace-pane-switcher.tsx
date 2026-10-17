"use client";

import { cn } from "@json-explore/ui/cn";

export type WorkspaceMobilePane = "source" | "tree" | "tool";

export interface WorkspacePaneOption {
  id: WorkspaceMobilePane;
  label: string;
}

export interface WorkspacePaneSwitcherProps {
  panes: readonly WorkspacePaneOption[];
  value: WorkspaceMobilePane;
  onChange: (pane: WorkspaceMobilePane) => void;
  className?: string;
}

export function WorkspacePaneSwitcher({
  panes,
  value,
  onChange,
  className,
}: WorkspacePaneSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Workspace panes"
      className={cn(
        "border-border bg-surface-muted flex min-w-0 rounded-[var(--radius-md)] border p-0.5 lg:hidden",
        className,
      )}
    >
      {panes.map((pane) => {
        const selected = pane.id === value;
        return (
          <button
            key={pane.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "min-w-0 flex-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium",
              selected
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => {
              onChange(pane.id);
            }}
          >
            {pane.label}
          </button>
        );
      })}
    </div>
  );
}
