"use client";

import { useMemo, type ReactNode } from "react";
import {
  jsonEditorPreview,
  shouldUseCompactJsonEditor,
} from "@json-explore/workspace/components/common/document-scale-notice";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { LoadingState } from "@json-explore/ui/components/loading-state";
import {
  collectQueryResultValues,
  formatQueryResultValues,
} from "@json-explore/workspace/features/json-query/utils/query-result-payload";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  JsonQueryResult,
  QueryError,
} from "@json-explore/core/types/query";
import { cn } from "@json-explore/ui/cn";

export interface JsonQueryResultsProps {
  document: JsonDocument | null;
  results: readonly JsonQueryResult[];
  matchCount: number;
  truncated: boolean;
  isExecuting: boolean;
  hasRun: boolean;
  error: QueryError | AppError | null;
  className?: string;
  /** Path and value rows. Query keeps the combined value preview when this is omitted. */
  showPaths?: boolean;
  badges?: readonly ReactNode[];
  valuesLabel?: string;
  errorTitle?: string;
  emptyCopy?: {
    noDocument?: { title: string; description: string };
    pending?: { title: string; description: string };
    noResults?: { title: string; description: string };
  };
}

function queryErrorDetails(error: QueryError | AppError): string | undefined {
  if ("column" in error && typeof error.column === "number") {
    return `Column ${String(error.column)}`;
  }
  return error.details;
}

export function JsonQueryResults({
  document,
  results,
  matchCount,
  truncated,
  isExecuting,
  hasRun,
  error,
  className,
  showPaths = false,
  badges,
  valuesLabel = "Query result values",
  errorTitle = JSON_ERROR_MESSAGES.query,
  emptyCopy,
}: JsonQueryResultsProps) {
  const payload = useMemo(() => {
    if (!document || results.length === 0) {
      return null;
    }

    const values = collectQueryResultValues(document, results);
    const formatted = formatQueryResultValues(values);
    const compact = shouldUseCompactJsonEditor(formatted.length);
    return {
      preview: compact ? jsonEditorPreview(formatted) : formatted,
      compact,
    };
  }, [document, results]);

  if (!document) {
    return (
      <EmptyState
        title={emptyCopy?.noDocument?.title ?? "Load valid JSON to run a query"}
        description={
          emptyCopy?.noDocument?.description ??
          "Paste JSON in Source first. Queries run against the parsed tree, not raw text."
        }
        className={className}
      />
    );
  }

  if (error) {
    const location = queryErrorDetails(error);
    return (
      <ErrorState
        title={errorTitle}
        error={error}
        message={error.message}
        className={className}
        {...(location
          ? {
              action: (
                <p className="text-muted font-mono text-xs">{location}</p>
              ),
            }
          : {})}
      />
    );
  }

  if (!hasRun) {
    return (
      <EmptyState
        title={emptyCopy?.pending?.title ?? "Run a query"}
        description={
          emptyCopy?.pending?.description ??
          "Use a path such as users[].id or JSONPath such as $..id, or pick an example above."
        }
        className={className}
      />
    );
  }

  if (isExecuting && results.length === 0) {
    return <LoadingState label="Running query…" className={className} />;
  }

  if (!isExecuting && matchCount === 0) {
    return (
      <EmptyState
        title={emptyCopy?.noResults?.title ?? "No results"}
        description={
          emptyCopy?.noResults?.description ??
          "The query is valid but returned no nodes."
        }
        className={className}
      />
    );
  }

  if (!payload) {
    return <LoadingState label="Preparing results…" className={className} />;
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-muted text-caption px-3 pt-3 tracking-wide uppercase">
          {showPaths ? "Paths" : "Values"}
        </p>
        {showPaths ? (
          <ul
            aria-label={valuesLabel}
            className="flex min-h-0 flex-1 flex-col overflow-auto"
          >
            {results.map((result, index) => (
              <li
                key={`${result.nodeId}:${String(index)}`}
                className="border-border flex items-start gap-2 border-b px-3 py-2"
              >
                {badges?.[index] ?? null}
                <span className="text-foreground shrink-0 font-mono text-xs">
                  {result.path}
                </span>
                <span className="text-muted min-w-0 font-mono text-xs break-all">
                  {result.primitiveValue === undefined
                    ? result.type
                    : String(result.primitiveValue)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <pre
            tabIndex={0}
            aria-label={valuesLabel}
            className="text-foreground min-h-0 flex-1 overflow-auto p-3 font-mono text-sm leading-relaxed"
          >
            {payload.preview}
          </pre>
        )}
      </div>
      {truncated ? (
        <p className="text-muted text-caption border-border border-t px-3 py-2">
          Showing the first {results.length.toLocaleString()} of{" "}
          {matchCount.toLocaleString()} values.
        </p>
      ) : null}
      {payload.compact && !showPaths ? (
        <p className="text-muted text-caption border-border border-t px-3 py-2">
          Showing a preview of the result array.
        </p>
      ) : null}
    </div>
  );
}
