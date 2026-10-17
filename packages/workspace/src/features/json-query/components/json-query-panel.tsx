"use client";

import { memo } from "react";
import { Panel } from "@json-explore/ui/components/panel";
import { JsonQueryResults } from "@json-explore/workspace/features/json-query/components/json-query-results";
import { getQueryResultValueType } from "@json-explore/workspace/features/json-query/utils/query-result-payload";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonQueryResult, QueryError } from "@json-explore/core/types/query";
import { cn } from "@json-explore/ui/cn";

export interface JsonQueryPanelProps {
  document: JsonDocument | null;
  results: readonly JsonQueryResult[];
  matchCount: number;
  truncated: boolean;
  isExecuting: boolean;
  hasRun: boolean;
  error: QueryError | AppError | null;
  announcement: string;
  className?: string;
}

function countLabel(hasRun: boolean, matchCount: number) {
  if (!hasRun) {
    return "Matched values as a JSON array";
  }
  if (matchCount === 0) {
    return "0 values";
  }
  return null;
}

export const JsonQueryPanel = memo(function JsonQueryPanel({
  document,
  results,
  matchCount,
  truncated,
  isExecuting,
  hasRun,
  error,
  announcement,
  className,
}: JsonQueryPanelProps) {
  const showStats =
    hasRun && !error && !isExecuting && matchCount > 0 && results.length > 0;

  return (
    <Panel
      title="Query results"
      description={countLabel(hasRun, matchCount) ?? undefined}
      actions={
        showStats ? (
          <dl className="flex items-center gap-4">
            <div className="text-right">
              <dt className="text-muted text-caption tracking-wide uppercase">
                Count
              </dt>
              <dd className="text-foreground font-mono text-sm tabular-nums">
                {matchCount.toLocaleString()}
                {truncated ? " (truncated)" : ""}
              </dd>
            </div>
            <div className="text-right">
              <dt className="text-muted text-caption tracking-wide uppercase">
                Type
              </dt>
              <dd className="text-foreground font-mono text-sm">
                {getQueryResultValueType(results)}
              </dd>
            </div>
          </dl>
        ) : null
      }
      as="aside"
      className={cn("h-full min-h-0 overflow-hidden", className)}
      bodyClassName="overflow-hidden"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <JsonQueryResults
        document={document}
        results={results}
        matchCount={matchCount}
        truncated={truncated}
        isExecuting={isExecuting}
        hasRun={hasRun}
        error={error}
        className="h-full min-h-0"
      />
    </Panel>
  );
});
