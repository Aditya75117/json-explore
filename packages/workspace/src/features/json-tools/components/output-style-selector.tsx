"use client";

import {
  OUTPUT_STYLE_LABELS,
  OUTPUT_STYLES,
  type OutputStyle,
} from "@json-explore/workspace/constants/workspace-tools";
import { cn } from "@json-explore/ui/cn";

export interface OutputStyleSelectorProps<T extends string = OutputStyle> {
  value: T;
  onChange: (style: T) => void;
  disabled?: boolean;
  className?: string;
  options?: readonly T[];
  labels?: Record<T, string>;
  label?: string;
}

export function OutputStyleSelector<T extends string = OutputStyle>({
  value,
  onChange,
  disabled = false,
  className,
  options,
  labels,
  label = "Output style",
}: OutputStyleSelectorProps<T>) {
  const choices = (options ?? OUTPUT_STYLES) as readonly T[];
  const choiceLabels = (labels ?? OUTPUT_STYLE_LABELS) as Record<T, string>;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "border-border flex h-9 shrink-0 items-stretch rounded-[var(--radius-md)] border",
        className,
      )}
    >
      {choices.map((style, index) => {
        const selected = style === value;
        return (
          <button
            key={style}
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
              index === 0 && "rounded-l-[calc(var(--radius-md)-1px)]",
              index === choices.length - 1 &&
                "rounded-r-[calc(var(--radius-md)-1px)]",
            )}
            onClick={() => onChange(style)}
          >
            {choiceLabels[style]}
          </button>
        );
      })}
    </div>
  );
}
