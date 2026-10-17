import type { JsonStatistics } from "@json-explore/core/types/statistics";

const TYPE_ROWS = [
  ["object", "Object"],
  ["array", "Array"],
  ["string", "String"],
  ["number", "Number"],
  ["boolean", "Boolean"],
  ["null", "Null"],
] as const;

export function TypeDistribution({
  statistics,
}: {
  statistics: JsonStatistics;
}) {
  const max = Math.max(
    1,
    ...TYPE_ROWS.map(([key]) => statistics.types[key]),
  );

  return (
    <section aria-labelledby="stats-types-heading">
      <h3 id="stats-types-heading" className="mb-2 text-xs font-semibold">
        Value types
      </h3>
      <ul className="space-y-1.5">
        {TYPE_ROWS.map(([key, label]) => {
          const count = statistics.types[key];
          const width = `${String(Math.round((count / max) * 100))}%`;
          return (
            <li key={key} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2">
              <span className="text-muted text-xs">{label}</span>
              <div
                className="bg-surface-muted h-2 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width }}
                />
              </div>
              <span className="text-foreground text-right font-mono text-xs tabular-nums">
                {count.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
