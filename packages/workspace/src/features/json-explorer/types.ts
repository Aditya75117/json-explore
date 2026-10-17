export interface JsonExplorerState {
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
  highlightedNodeId: string | null;
}

export type CopyFeedback = "path" | "value" | null;
