"use client";

import { SEARCH_MODE_LABELS, SEARCH_MODES } from "@json-explore/core/constants/search";
import { cn } from "@json-explore/ui/cn";
import type { SearchMode } from "@json-explore/core/types/search";

export interface SearchModeSelectorProps {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
  disabled?: boolean;
  className?: string;
}

export function SearchModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: SearchModeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Search in"
      className={cn(
        "border-border flex h-9 shrink-0 items-stretch rounded-[var(--radius-md)] border",
        className,
      )}
    >
      {SEARCH_MODES.map((mode) => {
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
              mode === "all" && "rounded-l-[calc(var(--radius-md)-1px)]",
              mode === "value" && "rounded-r-[calc(var(--radius-md)-1px)]",
            )}
            onClick={() => onChange(mode)}
          >
            {SEARCH_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
