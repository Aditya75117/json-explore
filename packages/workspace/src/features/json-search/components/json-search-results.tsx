"use client";

import { useId } from "react";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { LoadingState } from "@json-explore/ui/components/loading-state";
import { JsonVirtualList } from "@json-explore/workspace/features/json-explorer/components/json-virtual-list";
import { JsonSearchResultItem } from "@json-explore/workspace/features/json-search/components/json-search-result-item";
import {
  SEARCH_RESULT_OVERSCAN,
  SEARCH_RESULT_ROW_HEIGHT_PX,
} from "@json-explore/core/constants/search";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonSearchResult } from "@json-explore/core/types/search";
import { cn } from "@json-explore/ui/cn";

export interface JsonSearchResultsProps {
  query: string;
  document: JsonDocument | null;
  results: readonly JsonSearchResult[];
  matchCount: number;
  truncated: boolean;
  selectedResultIndex: number;
  isSearching: boolean;
  error: AppError | null;
  onSelectIndex: (index: number) => void;
  onActivate: (result: JsonSearchResult) => void;
  onCopyPath?: (nodeId: string) => void;
  onCopyValue?: (nodeId: string) => void;
  className?: string;
}

export function JsonSearchResults({
  query,
  document,
  results,
  matchCount,
  truncated,
  selectedResultIndex,
  isSearching,
  error,
  onSelectIndex,
  onActivate,
  onCopyPath,
  onCopyValue,
  className,
}: JsonSearchResultsProps) {
  const listId = useId();
  const trimmed = query.trim();
  const activeId =
    selectedResultIndex >= 0
      ? `${listId}-option-${String(selectedResultIndex)}`
      : undefined;

  if (!document) {
    return (
      <EmptyState
        title="Load JSON to search"
        description="Paste or drop JSON in Source, then search keys and values."
        className={className}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title={JSON_ERROR_MESSAGES.search}
        error={error}
        className={className}
      />
    );
  }

  if (!trimmed) {
    return (
      <EmptyState
        title="Search keys and values"
        description="Type a query to find every matching node, then click a result to jump to it in the explorer."
        className={className}
      />
    );
  }

  if (isSearching && results.length === 0) {
    return <LoadingState label="Searching…" className={className} />;
  }

  if (!isSearching && matchCount === 0) {
    return (
      <EmptyState
        title="No matches found"
        description="Try a different key or value."
        className={className}
      />
    );
  }

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onSelectIndex(
            selectedResultIndex < 0
              ? 0
              : Math.min(results.length - 1, selectedResultIndex + 1),
          );
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          onSelectIndex(selectedResultIndex <= 0 ? 0 : selectedResultIndex - 1);
        } else if (event.key === "Enter" && selectedResultIndex >= 0) {
          const result = results[selectedResultIndex];
          if (result) {
            event.preventDefault();
            onActivate(result);
          }
        } else if (event.key === "Home") {
          event.preventDefault();
          onSelectIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          onSelectIndex(results.length - 1);
        }
      }}
    >
      <div
        role="listbox"
        aria-label="Search results"
        aria-activedescendant={activeId}
        tabIndex={0}
        className="min-h-0 flex-1"
      >
        <JsonVirtualList
          items={results}
          itemHeight={SEARCH_RESULT_ROW_HEIGHT_PX}
          overscan={SEARCH_RESULT_OVERSCAN}
          scrollToIndex={selectedResultIndex >= 0 ? selectedResultIndex : null}
          scrollRequestId={selectedResultIndex}
          getItemKey={(item) => `${item.nodeId}:${item.matchType}`}
          renderItem={(item, index) => (
            <JsonSearchResultItem
              result={item}
              query={trimmed}
              document={document}
              selected={index === selectedResultIndex}
              index={index}
              optionId={`${listId}-option-${String(index)}`}
              onSelect={onSelectIndex}
              onActivate={onActivate}
              {...(onCopyPath ? { onCopyPath } : {})}
              {...(onCopyValue ? { onCopyValue } : {})}
            />
          )}
          className="h-full"
        />
      </div>
      {truncated ? (
        <p className="text-muted text-caption border-border border-t px-3 py-2">
          Showing the first {results.length.toLocaleString()} of{" "}
          {matchCount.toLocaleString()} matches.
        </p>
      ) : null}
    </div>
  );
}
