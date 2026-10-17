"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  TREE_OVERSCAN,
  TREE_ROW_HEIGHT_PX,
} from "@json-explore/workspace/features/json-explorer/constants";
import { JsonTreeNode } from "@json-explore/workspace/features/json-explorer/components/json-tree-node";
import { JsonVirtualList } from "@json-explore/workspace/features/json-explorer/components/json-virtual-list";
import { treeItemDomId } from "@json-explore/workspace/lib/a11y/keyboard";
import { getJsonNode } from "@json-explore/core/json";
import { isContainerNode } from "@json-explore/core/json/node";
import { cn } from "@json-explore/ui/cn";
import type { JsonDocument } from "@json-explore/core/types/json";

export interface JsonTreeProps {
  document: JsonDocument;
  visibleNodeIds: string[];
  expandedNodeIds: ReadonlySet<string>;
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  scrollRequest: { nodeId: string; nonce: number } | null;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  onCollapse: (nodeId: string) => void;
  onCopyPath: (nodeId: string) => void;
  onCopyValue: (nodeId: string) => void;
  className?: string;
}

export function JsonTree({
  document,
  visibleNodeIds,
  expandedNodeIds,
  selectedNodeId,
  highlightedNodeId,
  scrollRequest,
  onSelect,
  onToggle,
  onExpand,
  onCollapse,
  onCopyPath,
  onCopyValue,
  className,
}: JsonTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);

  const scrollToIndex = useMemo(() => {
    if (!scrollRequest) {
      return null;
    }
    const requested = visibleNodeIds.indexOf(scrollRequest.nodeId);
    return requested >= 0 ? requested : null;
  }, [scrollRequest, visibleNodeIds]);

  const moveSelection = useCallback(
    (delta: number) => {
      if (visibleNodeIds.length === 0) {
        return;
      }
      const current = selectedNodeId
        ? visibleNodeIds.indexOf(selectedNodeId)
        : -1;
      const nextIndex =
        current === -1
          ? delta > 0
            ? 0
            : visibleNodeIds.length - 1
          : Math.min(visibleNodeIds.length - 1, Math.max(0, current + delta));
      const nextId = visibleNodeIds[nextIndex];
      if (nextId) {
        onSelect(nextId);
        setKeyboardIndex(nextIndex);
      }
    },
    [onSelect, selectedNodeId, visibleNodeIds],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentId = selectedNodeId ?? visibleNodeIds[0];
      if (!currentId) {
        return;
      }
      const node = getJsonNode(document, currentId);
      if (!node) {
        return;
      }

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          if (!selectedNodeId) {
            onSelect(currentId);
            break;
          }
          moveSelection(1);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          moveSelection(-1);
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (isContainerNode(node) && !expandedNodeIds.has(node.id)) {
            onExpand(node.id);
            break;
          }
          if (isContainerNode(node) && node.childIds[0]) {
            onSelect(node.childIds[0]);
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (isContainerNode(node) && expandedNodeIds.has(node.id)) {
            onCollapse(node.id);
            break;
          }
          if (node.parentId) {
            onSelect(node.parentId);
          }
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (isContainerNode(node)) {
            onToggle(node.id);
          } else {
            onSelect(node.id);
          }
          break;
        }
        default:
          break;
      }
    },
    [
      document,
      expandedNodeIds,
      moveSelection,
      onCollapse,
      onExpand,
      onSelect,
      onToggle,
      selectedNodeId,
      visibleNodeIds,
    ],
  );

  const renderItem = useCallback(
    (nodeId: string, index: number) => {
      const node = getJsonNode(document, nodeId);
      if (!node) {
        return null;
      }

      return (
        <JsonTreeNode
          node={node}
          isRoot={node.id === document.rootId}
          expanded={expandedNodeIds.has(node.id)}
          selected={selectedNodeId === node.id}
          highlighted={highlightedNodeId === node.id}
          setSize={visibleNodeIds.length}
          posInSet={index + 1}
          onSelect={onSelect}
          onToggle={onToggle}
          onCopyPath={onCopyPath}
          onCopyValue={onCopyValue}
        />
      );
    },
    [
      document,
      expandedNodeIds,
      highlightedNodeId,
      onCopyPath,
      onCopyValue,
      onSelect,
      onToggle,
      selectedNodeId,
      visibleNodeIds.length,
    ],
  );

  const getItemKey = useCallback((nodeId: string) => nodeId, []);

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="JSON tree"
      aria-activedescendant={
        selectedNodeId ? treeItemDomId(selectedNodeId) : undefined
      }
      tabIndex={0}
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      onKeyDown={onKeyDown}
    >
      <JsonVirtualList
        items={visibleNodeIds}
        itemHeight={TREE_ROW_HEIGHT_PX}
        overscan={TREE_OVERSCAN}
        scrollToIndex={scrollToIndex ?? keyboardIndex}
        scrollRequestId={scrollRequest?.nonce ?? keyboardIndex ?? undefined}
        getItemKey={getItemKey}
        renderItem={renderItem}
        className="h-full min-h-0 flex-1"
      />
    </div>
  );
}
