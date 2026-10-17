"use client";

import { Button } from "@json-explore/ui/components/button";
import { SearchMatchText } from "@json-explore/workspace/features/json-search/components/search-match-text";
import { getSearchResultPreview } from "@json-explore/workspace/features/json-search/utils/result-preview";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonSearchResult } from "@json-explore/core/types/search";
import { cn } from "@json-explore/ui/cn";

export interface JsonSearchResultItemProps {
  result: JsonSearchResult;
  query: string;
  document: JsonDocument | null;
  selected: boolean;
  index: number;
  optionId: string;
  onSelect: (index: number) => void;
  onActivate: (result: JsonSearchResult) => void;
  onCopyPath?: (nodeId: string) => void;
  onCopyValue?: (nodeId: string) => void;
}

export function JsonSearchResultItem({
  result,
  query,
  document,
  selected,
  index,
  optionId,
  onSelect,
  onActivate,
  onCopyPath,
  onCopyValue,
}: JsonSearchResultItemProps) {
  const preview = getSearchResultPreview(result, document);
  const matchLabel =
    result.matchType === "both"
      ? "key and value"
      : result.matchType === "key"
        ? "key"
        : "value";

  return (
    <div
      id={optionId}
      role="option"
      aria-label={`${result.path}, ${preview}, ${result.type}`}
      aria-selected={selected}
      className={cn(
        "flex h-full cursor-pointer items-stretch gap-2 px-2",
        selected ? "bg-primary/10" : "hover:bg-surface-muted",
      )}
      onClick={() => {
        onSelect(index);
        onActivate(result);
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1 text-left"
        onClick={() => {
          onSelect(index);
          onActivate(result);
        }}
        onFocus={() => onSelect(index)}
      >
        <span className="text-foreground truncate font-mono text-xs">
          <SearchMatchText text={result.path} query={query} />
        </span>
        <span className="text-muted text-caption flex items-center gap-2 truncate font-mono">
          <SearchMatchText
            text={preview}
            query={result.matchType === "key" ? "" : query}
          />
          <span className="text-muted/80 shrink-0 normal-case">
            {result.type} · {matchLabel}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5">
        {onCopyPath ? (
          <Button
            size="sm"
            variant="ghost"
            tabIndex={-1}
            className="text-caption h-8 px-2"
            onClick={(event) => {
              event.stopPropagation();
              onCopyPath(result.nodeId);
            }}
          >
            Path
          </Button>
        ) : null}
        {onCopyValue ? (
          <Button
            size="sm"
            variant="ghost"
            tabIndex={-1}
            className="text-caption h-8 px-2"
            onClick={(event) => {
              event.stopPropagation();
              onCopyValue(result.nodeId);
            }}
          >
            Value
          </Button>
        ) : null}
      </div>
    </div>
  );
}
