"use client";

import { useMemo, useState } from "react";

const previewNodes = [
  { path: "$.users[0].id", label: "id", value: "1", type: "number" },
  { path: "$.users[0].name", label: "name", value: '"Ada"', type: "string" },
  { path: "$.users[1].id", label: "id", value: "2", type: "number" },
  {
    path: "$.users[1].name",
    label: "name",
    value: '"Grace"',
    type: "string",
  },
] as const;

export function ProductPreview() {
  const [query, setQuery] = useState("id");
  const [selectedPath, setSelectedPath] = useState<string>(
    previewNodes[0].path,
  );
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return previewNodes.filter(
      (node) =>
        node.path.toLowerCase().includes(normalized) ||
        node.value.toLowerCase().includes(normalized),
    );
  }, [query]);
  const selected =
    previewNodes.find((node) => node.path === selectedPath) ?? previewNodes[0];

  return (
    <figure className="border-border bg-surface border-hairline overflow-hidden rounded-[var(--radius-lg)] shadow-sm">
      <figcaption className="sr-only">
        Interactive mini workspace. Search the sample and select a result to
        update its details.
      </figcaption>
      <div className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="text-muted flex gap-2 text-xs">
          <span className="bg-primary/15 text-primary rounded-[var(--radius-sm)] px-1.5 py-0.5 font-medium">
            Explore
          </span>
          <span>Query</span>
          <span>Statistics</span>
          <span>Format</span>
        </div>
        <label className="sr-only" htmlFor="preview-search">
          Search sample JSON
        </label>
        <input
          id="preview-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border-border bg-background text-foreground border-hairline h-8 min-w-32 flex-1 rounded-[var(--radius-md)] px-2 font-mono text-xs"
          placeholder="Search sample JSON"
          spellCheck={false}
        />
        <span className="bg-primary/15 text-primary text-caption shrink-0 rounded-[var(--radius-sm)] px-1.5 py-0.5 font-medium">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </span>
      </div>
      <div className="grid lg:grid-cols-3">
        <div className="border-border text-caption hidden min-w-0 border-r p-3 font-mono leading-relaxed lg:block">
          <p className="text-muted text-caption mb-2 tracking-wide uppercase">
            Source
          </p>
          <pre className="text-foreground overflow-x-auto whitespace-pre">{`{
  "users": [
    {
      "id": 1,
      "name": "Ada"
    },
    {
      "id": 2,
      "name": "Grace"
    }
  ],
  "meta": {
    "active": true
  }
}`}</pre>
        </div>
        <div className="border-border border-b p-3 font-mono text-xs leading-relaxed lg:border-r lg:border-b-0">
          <p className="text-muted text-caption mb-2 tracking-wide uppercase">
            {query.trim() ? "Search results" : "Tree"}
          </p>
          <div className="space-y-1">
            {(query.trim() ? matches : previewNodes).map((node) => (
              <button
                key={node.path}
                type="button"
                onClick={() => setSelectedPath(node.path)}
                className={
                  node.path === selected.path
                    ? "bg-primary/15 text-primary flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left"
                    : "text-muted hover:bg-surface-muted hover:text-foreground flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left"
                }
              >
                <span className="truncate">{node.path}</span>
                <span className="ml-2 shrink-0">{node.value}</span>
              </button>
            ))}
            {query.trim() && matches.length === 0 ? (
              <p className="text-muted px-2 py-3">No matches</p>
            ) : null}
          </div>
        </div>
        <div className="text-caption space-y-2 p-3 font-mono">
          <p className="text-muted text-caption tracking-wide uppercase">
            Details
          </p>
          <p>
            <span className="text-muted">Path</span>{" "}
            <span className="text-foreground">{selected.path}</span>
          </p>
          <p>
            <span className="text-muted">Type</span>{" "}
            <span className="text-foreground">{selected.type}</span>
          </p>
          <p>
            <span className="text-muted">Value</span>{" "}
            <span className="text-foreground">{selected.value}</span>
          </p>
        </div>
      </div>
    </figure>
  );
}
