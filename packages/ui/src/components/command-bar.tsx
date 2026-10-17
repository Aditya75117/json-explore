import { type ReactNode } from "react";
import { cn } from "@json-explore/ui/cn";

export interface CommandBarProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Single-line control row. Height stays 36px whether or not it has children,
 * so swapping search, query, and output controls does not resize the toolbar.
 */
export function CommandBar({ children, className }: CommandBarProps) {
  return (
    <div
      className={cn(
        "flex h-9 max-h-9 min-h-0 min-w-0 items-center gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
