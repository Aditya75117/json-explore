import { type ReactNode } from "react";
import { cn } from "@json-explore/ui/cn";
import type { AppError, JsonParseError } from "@json-explore/core/types/errors";

export interface ErrorStateProps {
  title?: string;
  error?: AppError | null;
  message?: string;
  action?: ReactNode;
  className?: string;
}

function isJsonParseError(error: AppError): error is JsonParseError {
  return error.code === "INVALID_JSON";
}

function locationText(error: AppError): string | undefined {
  if (!isJsonParseError(error)) {
    return error.details;
  }

  if (error.details) {
    return error.details;
  }

  if (error.line !== undefined && error.column !== undefined) {
    return `Unexpected token near line ${error.line}, column ${error.column}`;
  }

  return undefined;
}

export function ErrorState({
  title = "Something went wrong",
  error,
  message,
  action,
  className,
}: ErrorStateProps) {
  const body = message ?? error?.message ?? "An unexpected error occurred.";
  const extra = error ? locationText(error) : undefined;
  // Never render engine rawMessage — it can echo source fragments.
  const showBody = body !== title;

  return (
    <div
      role="alert"
      className={cn(
        "flex h-full min-h-[var(--panel-min-height)] flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-danger text-sm font-medium">{title}</p>
      {showBody ? (
        <p className="text-muted max-w-md text-xs leading-relaxed">{body}</p>
      ) : null}
      {extra && extra !== body ? (
        <p className="text-muted max-w-md font-mono text-xs leading-relaxed">
          {extra}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
