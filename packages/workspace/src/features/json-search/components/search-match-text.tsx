"use client";

import { splitSearchHighlight } from "@json-explore/core/search/highlight";
import { cn } from "@json-explore/ui/cn";

export interface SearchMatchTextProps {
  text: string;
  query: string;
  caseSensitive?: boolean;
  className?: string;
}

export function SearchMatchText({
  text,
  query,
  caseSensitive = false,
  className,
}: SearchMatchTextProps) {
  const segments = splitSearchHighlight(text, query, caseSensitive);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={`${segment.text}-${String(index)}`}
            className={cn(
              "bg-warning-muted text-foreground rounded-[var(--radius-sm)] px-0.5 font-semibold",
            )}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${String(index)}`}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
