import { Button } from "@json-explore/ui/components/button";
import { cn } from "@json-explore/ui/cn";

export interface FrequencyRow {
  id: string;
  label: string;
  count: number;
  title?: string;
}

export function FrequencyList({
  title,
  headingId,
  rows,
  empty,
  onSelect,
  actionLabel,
}: {
  title: string;
  headingId: string;
  rows: FrequencyRow[];
  empty: string;
  onSelect: (id: string) => void;
  actionLabel: string;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="mb-2 text-xs font-semibold">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-muted text-xs">{empty}</p>
      ) : (
        <ol className="space-y-1">
          {rows.map((row, index) => (
            <li key={row.id}>
              <Button
                size="sm"
                variant="ghost"
                className="h-auto w-full justify-between gap-2 px-2 py-1.5 text-left"
                title={row.title ?? row.label}
                onClick={() => onSelect(row.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-muted text-caption w-5 shrink-0 font-mono">
                    {index + 1}.
                  </span>
                  <span
                    className={cn(
                      "text-foreground min-w-0 truncate font-mono text-xs",
                    )}
                  >
                    {row.label}
                  </span>
                </span>
                <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                  {row.count.toLocaleString()}
                  <span className="sr-only"> {actionLabel}</span>
                </span>
              </Button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
