import { Button } from "@json-explore/ui/components/button";
import type { JsonDeepestNode } from "@json-explore/core/types/statistics";

export function DeepestNodeCard({
  node,
  onReveal,
}: {
  node: JsonDeepestNode;
  onReveal: (nodeId: string) => void;
}) {
  return (
    <section aria-labelledby="stats-depth-heading">
      <h3 id="stats-depth-heading" className="mb-2 text-xs font-semibold">
        Deepest structure
      </h3>
      <p className="text-muted mb-1 text-xs">
        Depth {node.depth.toLocaleString()} · {node.type}
      </p>
      <p
        className="text-foreground mb-2 truncate font-mono text-xs"
        title={node.path}
      >
        {node.path}
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onReveal(node.nodeId)}
      >
        View in Explorer
      </Button>
    </section>
  );
}
