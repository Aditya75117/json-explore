import { cn } from "@json-explore/ui/cn";

export interface LoadingStateProps {
  label?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({
  label = "Working…",
  progress,
  className,
}: LoadingStateProps) {
  const bounded =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, progress))
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full min-h-[var(--panel-min-height)] flex-col items-center justify-center gap-3 px-6 py-10",
        className,
      )}
    >
      <div
        className="border-border border-t-primary border-emphasis h-5 w-5 animate-spin rounded-full motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-muted text-sm">{label}</p>
      {bounded !== undefined ? (
        <div
          className="bg-surface-muted h-1 w-40 overflow-hidden rounded-full"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={bounded}
          role="progressbar"
        >
          <div
            className="bg-primary h-full transition-[width]"
            style={{ width: `${bounded}%` }}
          />
        </div>
      ) : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}
