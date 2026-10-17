import { formatByteSize } from "@json-explore/core/statistics/format-bytes";
import type { JsonStatistics } from "@json-explore/core/types/statistics";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-surface-muted/40 rounded-[var(--radius-md)] border px-3 py-2">
      <p className="text-muted text-caption tracking-wide uppercase">{label}</p>
      <p className="text-foreground font-mono text-sm font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function StatisticsOverview({
  statistics,
}: {
  statistics: JsonStatistics;
}) {
  const items = [
    ["Size", formatByteSize(statistics.sizeInBytes)],
    ["Total nodes", statistics.totalNodes.toLocaleString()],
    ["Objects", statistics.types.object.toLocaleString()],
    ["Arrays", statistics.types.array.toLocaleString()],
    ["Strings", statistics.types.string.toLocaleString()],
    ["Numbers", statistics.types.number.toLocaleString()],
    ["Booleans", statistics.types.boolean.toLocaleString()],
    ["Nulls", statistics.types.null.toLocaleString()],
    ["Primitives", statistics.primitiveValues.toLocaleString()],
    ["Max depth", statistics.maxDepth.toLocaleString()],
    ["Top-level keys", statistics.topLevelKeyCount.toLocaleString()],
    ["Unique keys", statistics.uniqueKeys.toLocaleString()],
  ] as const;

  return (
    <section aria-labelledby="stats-overview-heading">
      <h3 id="stats-overview-heading" className="mb-2 text-xs font-semibold">
        Overview
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}
