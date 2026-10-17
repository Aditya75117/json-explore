"use client";

import { Button } from "@json-explore/ui/components/button";
import { QUERY_EXAMPLES, QUERY_MODE_LABELS } from "@json-explore/core/constants/query";
import type { QueryMode } from "@json-explore/core/types/query";

export interface JsonQueryExamplesProps {
  onPick: (expression: string, mode: QueryMode) => void;
  disabled?: boolean;
  variant?: "panel" | "inline";
}

export function JsonQueryExamples({
  onPick,
  disabled = false,
  variant = "panel",
}: JsonQueryExamplesProps) {
  if (variant === "inline") {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-muted text-caption shrink-0">Examples</span>
        {QUERY_EXAMPLES.map((example) => (
          <Button
            key={`${example.mode}:${example.expression}`}
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            title={`${QUERY_MODE_LABELS[example.mode]}: ${example.expression}`}
            aria-label={`Run example query ${example.expression}`}
            className="text-caption h-8 px-2 font-mono font-normal"
            onClick={() => onPick(example.expression, example.mode)}
          >
            {example.expression}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3 py-3">
      <p className="text-foreground text-sm font-medium">Examples</p>
      <p className="text-muted text-xs leading-relaxed">
        Path finds a location. JSONPath is a documented subset — not the full
        specification.
      </p>
      <ul className="flex flex-col gap-1">
        {QUERY_EXAMPLES.map((example) => (
          <li key={`${example.mode}:${example.expression}`}>
            <button
              type="button"
              disabled={disabled}
              className="text-primary hover:text-foreground font-mono text-xs underline-offset-2 hover:underline disabled:opacity-50"
              onClick={() => onPick(example.expression, example.mode)}
            >
              {example.expression}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
