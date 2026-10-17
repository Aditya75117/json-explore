"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@json-explore/ui/components/badge";
import { CommandBar } from "@json-explore/ui/components/command-bar";
import { IconButton } from "@json-explore/ui/components/icon-button";
import { Input } from "@json-explore/ui/components/input";
import { SearchModeSelector } from "@json-explore/workspace/features/json-search/components/search-mode-selector";
import { SHORTCUTS } from "@json-explore/workspace/constants/shortcuts";
import { useKeyboardShortcut } from "@json-explore/workspace/hooks/use-keyboard-shortcut";
import { useApplePlatform } from "@json-explore/workspace/hooks/use-apple-platform";
import { formatShortcutLabel } from "@json-explore/workspace/lib/a11y/keyboard";
import type { SearchMode } from "@json-explore/core/types/search";
import { cn } from "@json-explore/ui/cn";

export interface JsonSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  matchCount?: number | null;
  truncated?: boolean;
  isSearching?: boolean;
  disabled?: boolean;
  onSubmit?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  onShortcutFocus?: () => void;
  autoFocus?: boolean;
  /** Increment to focus the field after switching back to Explore. */
  focusNonce?: number;
  className?: string;
}

export function JsonSearchBar({
  value,
  onChange,
  mode,
  onModeChange,
  matchCount = null,
  truncated = false,
  isSearching = false,
  disabled = false,
  onSubmit,
  onNavigateNext,
  onNavigatePrevious,
  onShortcutFocus,
  autoFocus = false,
  focusNonce = 0,
  className,
}: JsonSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const apple = useApplePlatform();
  const hasQuery = value.length > 0;

  useEffect(() => {
    if (!focusNonce) {
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusNonce]);

  useKeyboardShortcut(SHORTCUTS.search, () => {
    onShortcutFocus?.();
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  const countText =
    matchCount === null
      ? null
      : truncated
        ? `${matchCount.toLocaleString()}+`
        : String(matchCount);

  return (
    <CommandBar className={cn("w-full", className)}>
      <div className="relative h-9 min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit?.();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onNavigateNext?.();
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              onNavigatePrevious?.();
            } else if (event.key === "Escape" && hasQuery) {
              event.preventDefault();
              onChange("");
            }
          }}
          autoFocus={autoFocus}
          placeholder="Search keys or values…"
          aria-label="Search JSON"
          aria-keyshortcuts="Control+K Meta+K"
          aria-describedby={
            countText !== null ? "search-match-count" : undefined
          }
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
        {hasQuery ? (
          <IconButton
            label="Clear search"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            ×
          </IconButton>
        ) : (
          <kbd className="border-border text-muted text-caption pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-[var(--radius-sm)] border px-1.5 py-0.5 sm:inline">
            {formatShortcutLabel(SHORTCUTS.search, apple)}
          </kbd>
        )}
      </div>
      <SearchModeSelector
        value={mode}
        onChange={onModeChange}
        disabled={disabled}
      />
      {isSearching ? (
        <Badge tone="neutral" className="shrink-0">
          Searching…
        </Badge>
      ) : countText !== null ? (
        <Badge
          id="search-match-count"
          tone={matchCount && matchCount > 0 ? "primary" : "neutral"}
          className="shrink-0"
        >
          {countText} {matchCount === 1 ? "occurrence" : "occurrences"}
        </Badge>
      ) : null}
    </CommandBar>
  );
}
