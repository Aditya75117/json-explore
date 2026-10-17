"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@json-explore/ui/cn";
import { Button } from "@json-explore/ui/components/button";

export interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  label: string;
  items: DropdownItem[];
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  menuLabel?: string;
}

export function Dropdown({
  label,
  items,
  className,
  variant = "secondary",
  disabled = false,
  menuLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const enabledIndexes = items.flatMap((item, index) =>
    item.disabled ? [] : [index],
  );

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const openMenu = () => {
    const firstEnabled = items.findIndex((item) => !item.disabled);
    const first = firstEnabled >= 0 ? firstEnabled : 0;
    setActiveIndex(first);
    setOpen(true);
    queueMicrotask(() => {
      itemRefs.current[first]?.focus();
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const move = (delta: number) => {
    if (enabledIndexes.length === 0) {
      return;
    }
    const currentPos = enabledIndexes.indexOf(activeIndex);
    const nextPos =
      currentPos < 0
        ? 0
        : (currentPos + delta + enabledIndexes.length) % enabledIndexes.length;
    const next = enabledIndexes[nextPos] ?? enabledIndexes[0] ?? 0;
    setActiveIndex(next);
    itemRefs.current[next]?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant={variant}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={menuLabel}
        onClick={() => {
          if (disabled) {
            return;
          }
          if (open) {
            close(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open && !disabled) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        {label}
        <span aria-hidden="true" className="text-muted">
          ▾
        </span>
      </Button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="border-border bg-surface border-hairline absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-[var(--radius-md)] py-1 shadow-md"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            } else if (event.key === "Home") {
              event.preventDefault();
              const first = enabledIndexes[0] ?? 0;
              setActiveIndex(first);
              itemRefs.current[first]?.focus();
            } else if (event.key === "End") {
              event.preventDefault();
              const last = enabledIndexes[enabledIndexes.length - 1] ?? 0;
              setActiveIndex(last);
              itemRefs.current[last]?.focus();
            }
          }}
        >
          {items.map((item, index) => (
            <li key={item.id} role="none">
              <button
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                className="hover:bg-surface-muted focus-visible:bg-surface-muted flex w-full px-3 py-1.5 text-left text-sm disabled:opacity-50"
                onClick={() => {
                  item.onSelect();
                  close();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
