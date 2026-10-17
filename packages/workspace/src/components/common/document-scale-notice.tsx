import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";
import type { JsonDocumentScale } from "@json-explore/core/constants/performance";
import { getJsonDocumentScaleMessage } from "@json-explore/core/performance";
import { formatByteSize } from "@json-explore/core/statistics/format-bytes";
import { cn } from "@json-explore/ui/cn";

export interface DocumentScaleNoticeProps {
  byteLength: number;
  scale: JsonDocumentScale;
  nodeCount?: number;
  className?: string;
}

export function shouldUseCompactJsonEditor(charLength: number): boolean {
  return charLength > PERFORMANCE_LIMITS.editorCharLimit;
}

export function jsonEditorPreview(value: string): string {
  if (value.length <= PERFORMANCE_LIMITS.editorPreviewChars) {
    return value;
  }
  return `${value.slice(0, PERFORMANCE_LIMITS.editorPreviewChars)}\n…`;
}

export function DocumentScaleNotice({
  byteLength,
  scale,
  nodeCount,
  className,
}: DocumentScaleNoticeProps) {
  const warning = getJsonDocumentScaleMessage(scale);
  const sizeLabel = formatByteSize(byteLength);
  const nodes =
    nodeCount !== undefined ? ` · ${nodeCount.toLocaleString()} nodes` : "";

  return (
    <p className={cn("text-muted text-xs", className)} role="status">
      <span className="text-foreground font-medium">
        {sizeLabel}
        {nodes}
      </span>
      {warning ? ` · ${warning}` : null}
    </p>
  );
}
