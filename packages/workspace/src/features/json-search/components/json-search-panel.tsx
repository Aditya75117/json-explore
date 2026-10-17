"use client";

import { memo } from "react";
import { Button } from "@json-explore/ui/components/button";
import { Panel } from "@json-explore/ui/components/panel";
import { JsonSearchResults } from "@json-explore/workspace/features/json-search/components/json-search-results";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonSearchResult } from "@json-explore/core/types/search";
import { cn } from "@json-explore/ui/cn";

export interface JsonSearchPanelProps {
  query: string;
  document: JsonDocument | null;
  results: readonly JsonSearchResult[];
  matchCount: number;
  truncated: boolean;
  selectedResultIndex: number;
  isSearching: boolean;
  error: AppError | null;
  announcement: string;
  onSelectIndex: (index: number) => void;
  onActivate: (result: JsonSearchResult) => void;
  onSelectNext: () => void;
  onSelectPrevious: () => void;
  onCopyPath?: (nodeId: string) => void;
  onCopyValue?: (nodeId: string) => void;
  className?: string;
}

function countLabel(matchCount: number, truncated: boolean): string {
  if (matchCount === 0) {
    return "0 matches";
  }
  const noun = matchCount === 1 ? "match" : "matches";
  const base = `${matchCount.toLocaleString()} ${noun}`;
  return truncated ? `${base} (truncated)` : base;
}

export const JsonSearchPanel = memo(function JsonSearchPanel({
  query,
  document,
  results,
  matchCount,
  truncated,
  selectedResultIndex,
  isSearching,
  error,
  announcement,
  onSelectIndex,
  onActivate,
  onSelectNext,
  onSelectPrevious,
  onCopyPath,
  onCopyValue,
  className,
}: JsonSearchPanelProps) {
  const hasResults = results.length > 0;
  const position =
    hasResults && selectedResultIndex >= 0
      ? `${String(selectedResultIndex + 1)} / ${String(results.length)}`
      : null;

  return (
    <Panel
      title="Search results"
      description={
        query.trim()
          ? countLabel(matchCount, truncated)
          : "Occurrences by key or value"
      }
      as="aside"
      className={cn("h-full min-h-0 overflow-hidden", className)}
      bodyClassName="overflow-hidden"
      actions={
        hasResults ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Previous match"
              disabled={!hasResults}
              onClick={onSelectPrevious}
            >
              ‹
            </Button>
            <span className="text-muted text-caption min-w-12 text-center font-mono">
              {position}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Next match"
              disabled={!hasResults}
              onClick={onSelectNext}
            >
              ›
            </Button>
          </div>
        ) : null
      }
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <JsonSearchResults
        query={query}
        document={document}
        results={results}
        matchCount={matchCount}
        truncated={truncated}
        selectedResultIndex={selectedResultIndex}
        isSearching={isSearching}
        error={error}
        onSelectIndex={onSelectIndex}
        onActivate={onActivate}
        {...(onCopyPath ? { onCopyPath } : {})}
        {...(onCopyValue ? { onCopyValue } : {})}
        className="h-full min-h-0"
      />
    </Panel>
  );
});
