"use client";

import { memo, type ReactNode } from "react";
import { Button } from "@json-explore/ui/components/button";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { LoadingState } from "@json-explore/ui/components/loading-state";
import { Panel } from "@json-explore/ui/components/panel";
import { jsonErrorTitle } from "@json-explore/core/json/error-copy";
import { JsonTree } from "@json-explore/workspace/features/json-explorer/components/json-tree";
import type { useJsonExplorer } from "@json-explore/workspace/features/json-explorer/hooks/use-json-explorer";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import { cn } from "@json-explore/ui/cn";

export interface JsonExplorerProps {
  document: JsonDocument | null;
  selectedNodeId: string | null;
  explorer: ReturnType<typeof useJsonExplorer>;
  isProcessing?: boolean;
  isLargeDocument?: boolean;
  processingLabel?: string;
  error?: AppError | null;
  emptyAction?: ReactNode;
  className?: string;
}

export const JsonExplorer = memo(function JsonExplorer({
  document,
  selectedNodeId,
  explorer,
  isProcessing = false,
  isLargeDocument = false,
  processingLabel,
  error = null,
  emptyAction,
  className,
}: JsonExplorerProps) {
  return (
    <Panel
      title="JSON Tree"
      description="Explore structure, types, and paths"
      as="aside"
      className={cn("h-full min-h-0 overflow-hidden", className)}
      bodyClassName="overflow-hidden"
      actions={
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={!document || isProcessing}
            onClick={explorer.expandAll}
          >
            Expand all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!document || isProcessing}
            onClick={explorer.collapseAll}
          >
            Collapse all
          </Button>
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <p className="sr-only" aria-live="polite">
          {explorer.copyFeedback === "path"
            ? "Copied path"
            : explorer.copyFeedback === "value"
              ? "Copied value"
              : isProcessing
                ? (processingLabel ??
                  (isLargeDocument
                    ? "Processing large JSON…"
                    : "Processing JSON…"))
                : ""}
        </p>

        {isProcessing ? (
          <LoadingState
            label={
              processingLabel ??
              (isLargeDocument ? "Processing large JSON…" : "Processing JSON…")
            }
            className="min-h-0"
          />
        ) : error ? (
          <ErrorState
            title={jsonErrorTitle(error)}
            error={error}
            className="min-h-0"
          />
        ) : !document ? (
          <EmptyState
            title="No JSON loaded"
            description="Paste or drop JSON in Source, or load a sample to start."
            action={emptyAction}
          />
        ) : (
          <JsonTree
            document={document}
            visibleNodeIds={explorer.visibleNodeIds}
            expandedNodeIds={explorer.expandedNodeIds}
            selectedNodeId={selectedNodeId}
            highlightedNodeId={explorer.highlightedNodeId}
            scrollRequest={explorer.scrollRequest}
            onSelect={explorer.selectNode}
            onToggle={explorer.toggleNode}
            onExpand={explorer.expandNode}
            onCollapse={explorer.collapseNode}
            onCopyPath={(nodeId) => {
              void explorer.copyPath(nodeId);
            }}
            onCopyValue={(nodeId) => {
              void explorer.copyValue(nodeId);
            }}
            className="h-full min-h-0"
          />
        )}
      </div>
    </Panel>
  );
});
