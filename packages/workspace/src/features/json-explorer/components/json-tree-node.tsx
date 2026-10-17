"use client";

import { memo } from "react";
import {
  TREE_BASE_PAD_PX,
  TREE_INDENT_PX,
  TREE_MAX_INDENT_DEPTH,
} from "@json-explore/workspace/features/json-explorer/constants";
import { JsonNodeActions } from "@json-explore/workspace/features/json-explorer/components/json-node-actions";
import {
  formatPrimitiveDisplay,
  getContainerBadge,
  getEmptyContainerHint,
  getNodeDisplayName,
  getTreeItemAriaLabel,
  primitiveToneClass,
  truncateDisplay,
} from "@json-explore/workspace/features/json-explorer/utils/node-presentation";
import { treeItemDomId } from "@json-explore/workspace/lib/a11y/keyboard";
import { isContainerNode } from "@json-explore/core/json/node";
import { cn } from "@json-explore/ui/cn";
import type { JsonNode } from "@json-explore/core/types/json";

export interface JsonTreeNodeProps {
  node: JsonNode;
  isRoot: boolean;
  expanded: boolean;
  selected: boolean;
  highlighted: boolean;
  setSize: number;
  posInSet: number;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
  onCopyPath: (nodeId: string) => void;
  onCopyValue: (nodeId: string) => void;
}

export const JsonTreeNode = memo(function JsonTreeNode({
  node,
  isRoot,
  expanded,
  selected,
  highlighted,
  setSize,
  posInSet,
  onSelect,
  onToggle,
  onCopyPath,
  onCopyValue,
}: JsonTreeNodeProps) {
  const container = isContainerNode(node);
  const indentDepth = Math.min(node.depth, TREE_MAX_INDENT_DEPTH);
  const name = getNodeDisplayName(node, isRoot);
  const badge = getContainerBadge(node);
  const emptyHint = getEmptyContainerHint(node);
  const primitive =
    !container && node.primitiveValue !== undefined
      ? truncateDisplay(formatPrimitiveDisplay(node.primitiveValue))
      : null;

  return (
    <div
      id={treeItemDomId(node.id)}
      role="treeitem"
      aria-level={node.depth + 1}
      aria-selected={selected}
      aria-expanded={container ? expanded : undefined}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-label={getTreeItemAriaLabel(node, isRoot)}
      data-node-id={node.id}
      tabIndex={-1}
      className={cn(
        "group flex h-full items-center gap-1 pr-1 font-mono text-xs",
        selected && "bg-primary/12 text-foreground",
        highlighted && !selected && "bg-warning-muted",
        highlighted && selected && "ring-warning ring-1 ring-inset",
        !selected && "hover:bg-surface-muted",
      )}
      style={{ paddingLeft: TREE_BASE_PAD_PX + indentDepth * TREE_INDENT_PX }}
      onClick={() => onSelect(node.id)}
    >
      {container ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
          className="text-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center sm:h-5 sm:w-5"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(node.id);
          }}
        >
          <span aria-hidden="true">{expanded ? "▼" : "▶"}</span>
        </button>
      ) : (
        <span className="w-8 shrink-0 sm:w-5" aria-hidden="true" />
      )}

      <span
        className={cn(
          "min-w-0 truncate",
          isRoot ? "text-foreground font-semibold" : "text-foreground",
        )}
      >
        {name}
      </span>

      {isRoot ? (
        <span className="text-muted shrink-0 text-xs tracking-wide uppercase">
          root
        </span>
      ) : null}

      {badge ? <span className="text-muted shrink-0">{badge}</span> : null}

      {emptyHint ? (
        <span className="text-muted shrink-0 italic">{emptyHint}</span>
      ) : null}

      {primitive ? (
        <>
          <span className="text-muted shrink-0">:</span>
          <span
            className={cn("min-w-0 truncate", primitiveToneClass(node.type))}
            title={primitive.truncated ? primitive.text : undefined}
          >
            {primitive.text}
          </span>
        </>
      ) : null}

      <JsonNodeActions
        className="ml-auto hidden opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 sm:flex"
        onCopyPath={() => onCopyPath(node.id)}
        onCopyValue={() => onCopyValue(node.id)}
      />
    </div>
  );
});
