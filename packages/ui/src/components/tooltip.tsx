"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@json-explore/ui/cn";

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  content: string;
  children: ReactNode;
}

export function Tooltip({
  content,
  children,
  className,
  ...props
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const update = () => {
      const el = triggerRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <span
      ref={triggerRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className="bg-foreground text-background text-caption pointer-events-none fixed z-[100] -translate-x-1/2 rounded-[var(--radius-sm)] px-2 py-1 whitespace-nowrap shadow-sm"
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
