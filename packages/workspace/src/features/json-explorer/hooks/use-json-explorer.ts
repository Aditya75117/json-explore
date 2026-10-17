"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COPY_FEEDBACK_MS,
  HIGHLIGHT_DURATION_MS,
} from "@json-explore/workspace/features/json-explorer/constants";
import type { CopyFeedback } from "@json-explore/workspace/features/json-explorer/types";
import { getCopyValueText } from "@json-explore/workspace/features/json-explorer/utils/copy-value";
import {
  initialExpandedNodeIds,
  listVisibleNodeIds,
} from "@json-explore/workspace/features/json-explorer/utils/visible-nodes";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";
import { getAncestorIds, getJsonNode, listExpandAllNodeIds } from "@json-explore/core/json";
import { isContainerNode } from "@json-explore/core/json/node";
import { copyTextToClipboard } from "@json-explore/core/utils/clipboard";
import type { JsonDocument } from "@json-explore/core/types/json";

export interface UseJsonExplorerOptions {
  document: JsonDocument | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  indentation?: JsonIndentation;
}

export function useJsonExplorer({
  document,
  selectedNodeId,
  onSelectNode,
  indentation = 2,
}: UseJsonExplorerOptions) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() =>
    document ? initialExpandedNodeIds(document) : new Set(),
  );
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
    null,
  );
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [scrollRequest, setScrollRequest] = useState<{
    nodeId: string;
    nonce: number;
  } | null>(null);

  const highlightTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const documentRef = useRef(document);
  const [trackedDocument, setTrackedDocument] = useState(document);

  if (document !== trackedDocument) {
    setTrackedDocument(document);
    setExpandedNodeIds(document ? initialExpandedNodeIds(document) : new Set());
    setHighlightedNodeId(null);
    setScrollRequest(null);
  }

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const visibleNodeIds = useMemo(() => {
    if (!document) {
      return [];
    }
    return listVisibleNodeIds(document, expandedNodeIds);
  }, [document, expandedNodeIds]);

  const highlightNode = useCallback((nodeId: string | null) => {
    setHighlightedNodeId(nodeId);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    if (nodeId && typeof window !== "undefined") {
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedNodeId((current) =>
          current === nodeId ? null : current,
        );
      }, HIGHLIGHT_DURATION_MS);
    }
  }, []);

  const scrollToNode = useCallback((nodeId: string) => {
    setScrollRequest({ nodeId, nonce: Date.now() });
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    const current = documentRef.current;
    const node = current ? getJsonNode(current, nodeId) : undefined;
    if (!node || !isContainerNode(node)) {
      return;
    }
    setExpandedNodeIds((prev) => {
      if (prev.has(nodeId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      if (!prev.has(nodeId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const toggleNode = useCallback((nodeId: string) => {
    const current = documentRef.current;
    const node = current ? getJsonNode(current, nodeId) : undefined;
    if (!node || !isContainerNode(node)) {
      return;
    }
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const current = documentRef.current;
    if (!current) {
      return;
    }
    const large =
      current.metadata.nodeCount > PERFORMANCE_LIMITS.expandAllSafeNodeCount;
    setExpandedNodeIds(
      new Set(
        listExpandAllNodeIds(
          current,
          large ? { maxDepth: PERFORMANCE_LIMITS.expandAllLargeMaxDepth } : {},
        ),
      ),
    );
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodeIds(new Set());
  }, []);

  const selectNode = useCallback(
    (nodeId: string | null) => {
      onSelectNode(nodeId);
    },
    [onSelectNode],
  );

  const revealNode = useCallback(
    (nodeId: string) => {
      const current = documentRef.current;
      if (!current || !getJsonNode(current, nodeId)) {
        return false;
      }

      const ancestors = getAncestorIds(current, nodeId);
      setExpandedNodeIds((prev) => {
        const next = new Set(prev);
        for (const ancestorId of ancestors) {
          next.add(ancestorId);
        }
        return next;
      });
      onSelectNode(nodeId);
      highlightNode(nodeId);
      scrollToNode(nodeId);
      return true;
    },
    [highlightNode, onSelectNode, scrollToNode],
  );

  const focusNode = useCallback(
    (nodeId: string) => {
      return revealNode(nodeId);
    },
    [revealNode],
  );

  const announceCopy = useCallback((kind: Exclude<CopyFeedback, null>) => {
    setCopyFeedback(kind);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
    }, COPY_FEEDBACK_MS);
  }, []);

  const copyPath = useCallback(
    async (nodeId: string = selectedNodeId ?? "") => {
      const current = documentRef.current;
      const node = current ? getJsonNode(current, nodeId) : undefined;
      if (!node) {
        return false;
      }
      const ok = await copyTextToClipboard(node.path);
      if (ok) {
        announceCopy("path");
      }
      return ok;
    },
    [announceCopy, selectedNodeId],
  );

  const copyValue = useCallback(
    async (nodeId: string = selectedNodeId ?? "") => {
      const current = documentRef.current;
      if (!current) {
        return false;
      }
      const text = getCopyValueText(current, nodeId, indentation);
      if (text === undefined) {
        return false;
      }
      const ok = await copyTextToClipboard(text);
      if (ok) {
        announceCopy("value");
      }
      return ok;
    },
    [announceCopy, indentation, selectedNodeId],
  );

  return useMemo(
    () => ({
      expandedNodeIds,
      highlightedNodeId,
      visibleNodeIds,
      copyFeedback,
      scrollRequest,
      expandNode,
      collapseNode,
      toggleNode,
      expandAll,
      collapseAll,
      selectNode,
      highlightNode,
      revealNode,
      focusNode,
      scrollToNode,
      copyPath,
      copyValue,
    }),
    [
      collapseAll,
      collapseNode,
      copyFeedback,
      copyPath,
      copyValue,
      expandAll,
      expandNode,
      expandedNodeIds,
      focusNode,
      highlightNode,
      highlightedNodeId,
      revealNode,
      scrollRequest,
      scrollToNode,
      selectNode,
      toggleNode,
      visibleNodeIds,
    ],
  );
}
