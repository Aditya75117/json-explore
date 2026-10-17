"use client";

import { QUERY_MODE_LABELS, QUERY_MODES } from "@json-explore/core/constants/query";
import { cn } from "@json-explore/ui/cn";
import type { QueryMode } from "@json-explore/core/types/query";

export interface QueryModeSelectorProps {
  value: QueryMode;
  onChange: (mode: QueryMode) => void;
  disabled?: boolean;
  className?: string;
}

export function QueryModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: QueryModeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Query mode"
      className={cn(
        "border-border flex h-9 shrink-0 items-stretch rounded-[var(--radius-md)] border",
        className,
      )}
    >
      {QUERY_MODES.map((mode) => {
        const selected = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={cn(
              "inline-flex items-center px-2 text-xs font-medium transition-colors",
              selected
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground hover:bg-surface-muted",
              "disabled:pointer-events-none disabled:opacity-50",
              mode === "path" && "rounded-l-[calc(var(--radius-md)-1px)]",
              mode === "jsonpath" && "rounded-r-[calc(var(--radius-md)-1px)]",
            )}
            onClick={() => onChange(mode)}
          >
            {QUERY_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
