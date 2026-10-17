"use client";

import { Button } from "@json-explore/ui/components/button";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { Panel } from "@json-explore/ui/components/panel";
import { DETAILS_PREVIEW_CHILD_LIMIT } from "@json-explore/workspace/features/json-explorer/constants";
import { formatPrimitiveDisplay } from "@json-explore/workspace/features/json-explorer/utils/node-presentation";
import { getJsonNode, materializeJsonValue } from "@json-explore/core/json";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { isContainerNode } from "@json-explore/core/json/node";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import type { JsonDocument, JsonNode } from "@json-explore/core/types/json";
import { cn } from "@json-explore/ui/cn";

export interface JsonDetailsPanelProps {
  document: JsonDocument | null;
  selectedNodeId: string | null;
  indentation?: JsonIndentation;
  onCopyPath?: () => void;
  onCopyValue?: () => void;
  copyFeedback?: "path" | "value" | null;
  className?: string;
}

function DetailCell({ label, children }: { label: string; children: string }) {
  return (
    <div className="bg-surface-muted min-w-0 rounded-[var(--radius-sm)] px-2 py-2">
      <dt className="text-muted text-xs tracking-wide uppercase">{label}</dt>
      <dd
        className="text-foreground mt-0.5 max-w-full truncate font-mono text-xs"
        title={children}
      >
        {children}
      </dd>
    </div>
  );
}

function identityField(node: JsonNode): { label: string; value: string } {
  if (node.key !== null) {
    return { label: "Key", value: node.key };
  }
  if (node.index !== null) {
    return { label: "Index", value: String(node.index) };
  }
  return { label: "Key", value: "—" };
}

function selectedValuePreview(
  document: JsonDocument,
  node: JsonNode,
  indentation: JsonIndentation,
): string {
  if (!isContainerNode(node)) {
    return formatPrimitiveDisplay(node.primitiveValue ?? null);
  }

  if (node.childIds.length > DETAILS_PREVIEW_CHILD_LIMIT) {
    const kind = node.type === "array" ? "items" : "properties";
    return `${node.type} with ${String(node.childIds.length)} ${kind} — copy value to export JSON`;
  }

  const value = materializeJsonValue(document, node.id);
  if (value === undefined) {
    return "";
  }
  return stringifyFormatted(value, indentation);
}

export function JsonDetailsPanel({
  document,
  selectedNodeId,
  indentation = 2,
  onCopyPath,
  onCopyValue,
  copyFeedback = null,
  className,
}: JsonDetailsPanelProps) {
  const node =
    document && selectedNodeId
      ? getJsonNode(document, selectedNodeId)
      : undefined;
  const hasSelection = Boolean(node && document);
  const identity = node ? identityField(node) : null;

  return (
    <Panel
      title="Details"
      description="Selected node path, type, and value"
      className={cn("h-full min-h-0 overflow-hidden", className)}
      actions={
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyPath}
            disabled={!hasSelection || !onCopyPath}
          >
            {copyFeedback === "path" ? "Copied" : "Copy path"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyValue}
            disabled={!hasSelection || !onCopyValue}
          >
            {copyFeedback === "value" ? "Copied" : "Copy value"}
          </Button>
        </div>
      }
    >
      {node && document && identity ? (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
          <dl className="grid grid-cols-2 gap-2">
            <DetailCell label="Path">{node.path}</DetailCell>
            <DetailCell label="Type">{node.type}</DetailCell>
            <DetailCell label={identity.label}>{identity.value}</DetailCell>
            <DetailCell label="Depth">{String(node.depth)}</DetailCell>
            <DetailCell label="Children">
              {isContainerNode(node) ? String(node.childIds.length) : "—"}
            </DetailCell>
            <DetailCell label="Parent">{node.parentId ?? "root"}</DetailCell>
          </dl>
          <div className="min-h-0 flex-1 space-y-0.5">
            <p className="text-muted text-xs tracking-wide uppercase">Value</p>
            <pre className="border-border bg-surface-muted max-h-full min-h-24 overflow-auto rounded-[var(--radius-sm)] border p-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
              {selectedValuePreview(document, node, indentation)}
            </pre>
          </div>
        </div>
      ) : (
        <EmptyState
          title={document ? "Nothing selected" : "No JSON loaded"}
          description={
            document
              ? "Select a node in the tree, or jump here from Search."
              : "Paste or drop JSON in Source, or load a sample to start."
          }
        />
      )}
    </Panel>
  );
}
