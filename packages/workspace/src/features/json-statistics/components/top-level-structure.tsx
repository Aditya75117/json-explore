import { Button } from "@json-explore/ui/components/button";
import type { JsonTopLevelEntry } from "@json-explore/core/types/statistics";

function typeDetail(entry: JsonTopLevelEntry): string {
  if (entry.type === "array") {
    const noun = entry.childCount === 1 ? "item" : "items";
    return `Array · ${entry.childCount.toLocaleString()} ${noun}`;
  }
  if (entry.type === "object") {
    const noun = entry.childCount === 1 ? "property" : "properties";
    return `Object · ${entry.childCount.toLocaleString()} ${noun}`;
  }
  return entry.type;
}

export function TopLevelStructure({
  entries,
  onReveal,
  onQuery,
}: {
  entries: JsonTopLevelEntry[];
  onReveal: (nodeId: string) => void;
  onQuery?: (key: string) => void;
}) {
  return (
    <section aria-labelledby="stats-toplevel-heading">
      <h3 id="stats-toplevel-heading" className="mb-2 text-xs font-semibold">
        Top-level structure
      </h3>
      {entries.length === 0 ? (
        <p className="text-muted text-xs">
          Root is a primitive value — no child keys.
        </p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li
              key={entry.nodeId}
              className="flex items-center justify-between gap-2"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                onClick={() => onReveal(entry.nodeId)}
              >
                <span className="min-w-0">
                  <span className="text-foreground block truncate font-mono text-xs">
                    {entry.key}
                  </span>
                  <span className="text-muted text-caption block">
                    {typeDetail(entry)}
                  </span>
                </span>
              </Button>
              {onQuery && !entry.key.startsWith("[") ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-caption shrink-0 px-2"
                  onClick={() => onQuery(entry.key)}
                >
                  Query
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
