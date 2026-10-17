"use client";

import { useRef } from "react";
import { Button } from "@json-explore/ui/components/button";
import { CommandBar } from "@json-explore/ui/components/command-bar";
import { IconButton } from "@json-explore/ui/components/icon-button";
import { Input } from "@json-explore/ui/components/input";
import { QueryModeSelector } from "@json-explore/workspace/features/json-query/components/query-mode-selector";
import { Badge } from "@json-explore/ui/components/badge";
import { SHORTCUTS } from "@json-explore/workspace/constants/shortcuts";
import { useKeyboardShortcut } from "@json-explore/workspace/hooks/use-keyboard-shortcut";
import { useApplePlatform } from "@json-explore/workspace/hooks/use-apple-platform";
import { formatShortcutLabel } from "@json-explore/workspace/lib/a11y/keyboard";
import type { QueryMode } from "@json-explore/core/types/query";
import { cn } from "@json-explore/ui/cn";

export interface JsonQueryBarProps {
  value: string;
  onChange: (value: string) => void;
  mode: QueryMode;
  onModeChange: (mode: QueryMode) => void;
  onRun: () => void;
  matchCount?: number | null;
  truncated?: boolean;
  isExecuting?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onShortcutFocus?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function JsonQueryBar({
  value,
  onChange,
  mode,
  onModeChange,
  onRun,
  matchCount = null,
  truncated = false,
  isExecuting = false,
  disabled = false,
  invalid = false,
  onShortcutFocus,
  autoFocus = false,
  className,
}: JsonQueryBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const apple = useApplePlatform();
  const hasQuery = value.length > 0;

  useKeyboardShortcut(SHORTCUTS.focusQuery, () => {
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
              onRun();
            } else if (event.key === "Escape" && hasQuery) {
              event.preventDefault();
              onChange("");
            }
          }}
          autoFocus={autoFocus}
          placeholder={
            mode === "path"
              ? "Path query, e.g. users[].profile.email"
              : "JSONPath subset, e.g. $.users[*].id"
          }
          aria-label="JSON query"
          aria-invalid={invalid || undefined}
          aria-keyshortcuts="Control+Shift+P Meta+Shift+P"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
        {hasQuery ? (
          <IconButton
            label="Clear query"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            ×
          </IconButton>
        ) : (
          <kbd className="border-border text-muted text-caption pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-[var(--radius-sm)] border px-1.5 py-0.5 lg:inline">
            {formatShortcutLabel(SHORTCUTS.focusQuery, apple)}
          </kbd>
        )}
      </div>
      <QueryModeSelector
        value={mode}
        onChange={onModeChange}
        disabled={disabled}
      />
      <Button
        size="sm"
        variant="primary"
        className="shrink-0"
        disabled={disabled || !hasQuery || isExecuting}
        onClick={onRun}
      >
        Run
      </Button>
      {isExecuting ? (
        <Badge tone="neutral" className="shrink-0">
          Running…
        </Badge>
      ) : countText !== null ? (
        <Badge
          tone={matchCount && matchCount > 0 ? "primary" : "neutral"}
          className="shrink-0"
        >
          {countText} {matchCount === 1 ? "result" : "results"}
        </Badge>
      ) : null}
    </CommandBar>
  );
}
