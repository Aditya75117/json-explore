"use client";

import { type ReactNode, useId, useState } from "react";
import { cn } from "@json-explore/ui/cn";

export interface TabOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  value?: string;
  className?: string;
  onChange?: (tabId: string) => void;
}

export interface TabListProps {
  items: readonly TabOption[];
  value: string;
  onChange: (tabId: string) => void;
  label: string;
  controlsId?: string;
  className?: string;
}

export function TabList({
  items,
  value,
  onChange,
  label,
  controlsId,
  className,
}: TabListProps) {
  const baseId = useId();
  const enabled = items.filter((item) => !item.disabled);
  const selectedIndex = enabled.findIndex((item) => item.id === value);

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const current = selectedIndex < 0 ? 0 : selectedIndex;
    const next = enabled[(current + delta + enabled.length) % enabled.length];
    if (!next) return;
    onChange(next.id);
    queueMicrotask(() => {
      document.getElementById(`${baseId}-${next.id}-tab`)?.focus();
    });
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex min-w-0 gap-1 overflow-x-auto", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "Home" && enabled[0]) {
          event.preventDefault();
          onChange(enabled[0].id);
        } else if (event.key === "End" && enabled.at(-1)) {
          event.preventDefault();
          onChange(enabled.at(-1)!.id);
        }
      }}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            id={`${baseId}-${item.id}-tab`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controlsId}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={cn(
              "h-8 shrink-0 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors",
              selected
                ? "bg-primary/15 text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
              "disabled:opacity-50",
            )}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({
  items,
  defaultTabId,
  value,
  className,
  onChange,
}: TabsProps) {
  const baseId = useId();
  const [uncontrolledId, setUncontrolledId] = useState(
    defaultTabId ?? items[0]?.id ?? "",
  );
  const activeId = value ?? uncontrolledId;

  const active = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <TabList
        items={items}
        value={active?.id ?? ""}
        label="Panel tabs"
        controlsId={active ? `${baseId}-${active.id}-panel` : undefined}
        className="border-border border-b p-2"
        onChange={(tabId) => {
          if (value === undefined) setUncontrolledId(tabId);
          onChange?.(tabId);
        }}
      />
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-${active.id}-panel`}
          aria-labelledby={`${baseId}-${active.id}-tab`}
          className="min-h-0 flex-1"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
