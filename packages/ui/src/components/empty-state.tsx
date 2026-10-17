import { type ReactNode } from "react";
import { cn } from "@json-explore/ui/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[var(--panel-min-height)] flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted max-w-sm text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
