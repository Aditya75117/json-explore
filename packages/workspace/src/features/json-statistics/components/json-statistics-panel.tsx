"use client";

import { memo, type ReactNode } from "react";
import { Button } from "@json-explore/ui/components/button";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { LoadingState } from "@json-explore/ui/components/loading-state";
import { Panel } from "@json-explore/ui/components/panel";
import { DeepestNodeCard } from "@json-explore/workspace/features/json-statistics/components/deepest-node";
import { FrequencyList } from "@json-explore/workspace/features/json-statistics/components/frequency-list";
import { StatisticsOverview } from "@json-explore/workspace/features/json-statistics/components/statistics-overview";
import { TopLevelStructure } from "@json-explore/workspace/features/json-statistics/components/top-level-structure";
import { TypeDistribution } from "@json-explore/workspace/features/json-statistics/components/type-distribution";
import { jsonErrorTitle } from "@json-explore/core/json/error-copy";
import {
  formatPrimitivePreview,
  primitiveValueIdentity,
  searchQueryForPrimitive,
} from "@json-explore/core/statistics/value-identity";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonStatistics } from "@json-explore/core/types/statistics";
import { cn } from "@json-explore/ui/cn";

export interface JsonStatisticsPanelProps {
  document: JsonDocument | null;
  jsonError: AppError | null;
  statistics: JsonStatistics | null;
  isAnalyzing: boolean;
  error: AppError | null;
  announcement: string;
  onRetry: () => void;
  onSearchKey: (key: string) => void;
  onSearchValue: (query: string) => void;
  onRevealNode: (nodeId: string) => void;
  onQueryKey?: (key: string) => void;
  className?: string;
}

export const JsonStatisticsPanel = memo(function JsonStatisticsPanel({
  document,
  jsonError,
  statistics,
  isAnalyzing,
  error,
  announcement,
  onRetry,
  onSearchKey,
  onSearchValue,
  onRevealNode,
  onQueryKey,
  className,
}: JsonStatisticsPanelProps) {
  const repeatedKeys = statistics
    ? statistics.keyFrequency.filter((item) => item.count > 1)
    : [];

  return (
    <Panel
      title="Statistics"
      description="Structural insights from the loaded document"
      className={cn("h-full min-h-0 overflow-hidden", className)}
      bodyClassName="overflow-hidden"
    >
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {!document && jsonError ? (
        <ErrorState
          title="Statistics unavailable"
          message="Fix the JSON syntax to analyze this document."
          className="min-h-0"
        />
      ) : !document ? (
        <EmptyState
          title="No JSON to analyze"
          description="Paste or drop JSON in Source to see statistics."
          className="min-h-0"
        />
      ) : isAnalyzing && !statistics ? (
        <LoadingState label="Analyzing JSON…" className="min-h-0" />
      ) : error ? (
        <ErrorState
          title={jsonErrorTitle(error)}
          error={error}
          action={
            <Button size="sm" variant="secondary" onClick={() => onRetry()}>
              Retry
            </Button>
          }
          className="min-h-0"
        />
      ) : statistics ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
          <StatisticsOverview statistics={statistics} />
          <CollapsibleStat title="Type distribution">
            <TypeDistribution statistics={statistics} />
          </CollapsibleStat>
          <CollapsibleStat title="Top-level structure">
            <TopLevelStructure
              entries={statistics.topLevelEntries}
              onReveal={onRevealNode}
              {...(onQueryKey ? { onQuery: onQueryKey } : {})}
            />
          </CollapsibleStat>
          <CollapsibleStat title="Deepest node">
            <DeepestNodeCard
              node={statistics.deepestNode}
              onReveal={onRevealNode}
            />
          </CollapsibleStat>
          <CollapsibleStat title="Most common keys">
            <FrequencyList
              title="Most common keys"
              headingId="stats-keys-heading"
              empty="No object keys in this document."
              actionLabel="occurrences. Search this key."
              rows={statistics.keyFrequency.map((item) => ({
                id: item.key,
                label: item.key,
                count: item.count,
              }))}
              onSelect={onSearchKey}
            />
          </CollapsibleStat>
          <CollapsibleStat title="Repeated keys">
          <section aria-labelledby="stats-repeated-heading">
            <h3
              id="stats-repeated-heading"
              className="mb-1 text-xs font-semibold"
            >
              Repeated keys
            </h3>
            <p className="text-muted mb-2 text-xs">
              {statistics.repeatedKeys.toLocaleString()} keys appear more than
              once
              {statistics.keysTruncated ? " (ranking capped)" : ""}.
            </p>
            {repeatedKeys.length > 0 ? (
              <FrequencyList
                title="Highest frequency"
                headingId="stats-repeated-list-heading"
                empty=""
                actionLabel="occurrences. Search this key."
                rows={repeatedKeys.map((item) => ({
                  id: item.key,
                  label: item.key,
                  count: item.count,
                }))}
                onSelect={onSearchKey}
              />
            ) : null}
          </section>
          </CollapsibleStat>
          <CollapsibleStat title="Value analysis">
          <section aria-labelledby="stats-values-heading">
            <h3
              id="stats-values-heading"
              className="mb-2 text-xs font-semibold"
            >
              Value analysis
            </h3>
            <p className="text-muted mb-2 text-xs">
              {statistics.primitiveValues.toLocaleString()} primitives ·{" "}
              {statistics.uniquePrimitiveValues.toLocaleString()} unique ·{" "}
              {statistics.repeatedPrimitiveValues.toLocaleString()} repeated
              {statistics.valuesTruncated ? " (ranking capped)" : ""}.
            </p>
            <ul className="text-muted mb-3 space-y-0.5 text-xs">
              {(
                [
                  ["Strings", statistics.valueTypes.string],
                  ["Numbers", statistics.valueTypes.number],
                  ["Booleans", statistics.valueTypes.boolean],
                  ["Nulls", statistics.valueTypes.null],
                ] as const
              ).map(([label, stats]) => (
                <li key={label}>
                  {label}: {stats.unique.toLocaleString()} unique,{" "}
                  {stats.repeated.toLocaleString()} repeated
                </li>
              ))}
            </ul>
            <FrequencyList
              title="Most common values"
              headingId="stats-common-values-heading"
              empty="No primitive values."
              actionLabel="occurrences. Search this value."
              rows={statistics.valueFrequency.map((item) => {
                const label = formatPrimitivePreview(item.type, item.value);
                return {
                  id: primitiveValueIdentity(item.type, item.value),
                  label,
                  count: item.count,
                  title: label,
                };
              })}
              onSelect={(id) => {
                const match = statistics.valueFrequency.find(
                  (item) =>
                    primitiveValueIdentity(item.type, item.value) === id,
                );
                if (!match) {
                  return;
                }
                onSearchValue(searchQueryForPrimitive(match.type, match.value));
              }}
            />
          </section>
          </CollapsibleStat>
        </div>
      ) : (
        <EmptyState
          title="No JSON to analyze"
          description="Paste or drop JSON in Source to see statistics."
          className="min-h-0"
        />
      )}
    </Panel>
  );
});

function CollapsibleStat({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="border-border rounded-[var(--radius-md)] border">
      <summary className="hover:bg-surface-muted cursor-pointer px-3 py-2 text-xs font-semibold">
        {title}
      </summary>
      <div className="border-border border-t px-3 py-3">{children}</div>
    </details>
  );
}
