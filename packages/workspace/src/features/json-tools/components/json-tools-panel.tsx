"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "@json-explore/ui/components/icon-button";
import { Panel } from "@json-explore/ui/components/panel";
import { Textarea } from "@json-explore/ui/components/textarea";
import { Tooltip } from "@json-explore/ui/components/tooltip";
import type { useJsonTools } from "@json-explore/workspace/features/json-tools/hooks/use-json-tools";
import {
  DocumentScaleNotice,
  jsonEditorPreview,
  shouldUseCompactJsonEditor,
} from "@json-explore/workspace/components/common/document-scale-notice";
import type { JsonDocumentScale } from "@json-explore/core/constants/performance";
import { getJsonDocumentScale } from "@json-explore/core/performance";
import { TOOLS_MESSAGES } from "@json-explore/core/constants/tools";
import { COPY_FEEDBACK_MS } from "@json-explore/workspace/features/json-explorer/constants";
import type { OutputStyle } from "@json-explore/workspace/constants/workspace-tools";
import type { JsonDocument } from "@json-explore/core/types/json";
import { cn } from "@json-explore/ui/cn";

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4v11M7 11l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface JsonToolsPanelProps {
  style: OutputStyle;
  outputJson: string;
  disabled?: boolean;
  isValid: boolean;
  document: JsonDocument | null;
  tools: ReturnType<typeof useJsonTools>;
  className?: string;
  /** Replaces the pretty/compact title, description, empty hint, and output label. */
  copy?: Partial<{
    title: string;
    description: string;
    empty: string;
    outputLabel: string;
  }>;
  /** Shown above the output instead of the document summary. */
  leading?: ReactNode;
  /** When set, copy and download use this text instead of the shared document. */
  actionsEnabled?: boolean;
  onCopy?: () => Promise<boolean> | boolean;
  onDownload?: () => boolean;
}

const PANEL_COPY: Record<
  OutputStyle,
  { title: string; description: string; empty: string; outputLabel: string }
> = {
  pretty: {
    title: "Pretty JSON",
    description: "Raw JSON stays in Source. Pretty writes here.",
    empty:
      "Paste JSON in Source, then choose Pretty. Copy or download when ready.",
    outputLabel: "Pretty JSON",
  },
  compact: {
    title: "Compact JSON",
    description: "Raw JSON stays in Source. Compact writes here.",
    empty:
      "Paste JSON in Source, then choose Compact. Copy or download when ready.",
    outputLabel: "Compact JSON",
  },
};

export function JsonToolsPanel({
  style,
  outputJson,
  disabled = false,
  isValid,
  document,
  tools,
  className,
  copy: copyOverride,
  leading,
  actionsEnabled,
  onCopy,
  onDownload,
}: JsonToolsPanelProps) {
  const metadata = document?.metadata;
  const jsonActionsDisabled =
    disabled || tools.busy || !(actionsEnabled ?? tools.hasDocument);
  const compactOutput = shouldUseCompactJsonEditor(outputJson.length);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const [actionNote, setActionNote] = useState("");
  const outputScale: JsonDocumentScale = getJsonDocumentScale(
    metadata?.sizeInBytes ?? outputJson.length,
  );
  const copy = { ...PANEL_COPY[style], ...copyOverride };

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

  const copyOutput = async () => {
    const ok = onCopy
      ? await onCopy()
      : style === "pretty"
        ? await tools.copyFormatted()
        : await tools.copyMinified();
    if (!ok) {
      if (onCopy) setActionNote(TOOLS_MESSAGES.copyFailed);
      return;
    }
    if (onCopy) setActionNote(TOOLS_MESSAGES.copiedJson);
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPY_FEEDBACK_MS,
    );
  };

  return (
    <Panel
      title={copy.title}
      description={copy.description}
      actions={
        <div className="flex items-center gap-1">
          <Tooltip content="Copy">
            <IconButton
              label={copied ? "Copied" : "Copy"}
              title=""
              disabled={jsonActionsDisabled}
              onClick={() => {
                void copyOutput();
              }}
            >
              {copied ? <span aria-hidden="true">✓</span> : <CopyIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip content="Download">
            <IconButton
              label="Download"
              title=""
              disabled={jsonActionsDisabled}
              onClick={() => {
                if (onDownload) {
                  setActionNote(
                    onDownload()
                      ? TOOLS_MESSAGES.downloaded
                      : TOOLS_MESSAGES.downloadFailed,
                  );
                  return;
                }
                if (style === "pretty") {
                  tools.downloadFormatted();
                  return;
                }
                tools.downloadMinified();
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </div>
      }
      className={cn("min-h-0 flex-1", className)}
      bodyClassName="overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {leading !== undefined ? (
          leading
        ) : metadata && isValid ? (
          <div className="flex flex-col gap-1" aria-live="polite">
            <p className="text-muted text-xs">
              {metadata.nodeCount.toLocaleString()}{" "}
              {metadata.nodeCount === 1 ? "node" : "nodes"} ·{" "}
              {metadata.objectCount.toLocaleString()}{" "}
              {metadata.objectCount === 1 ? "object" : "objects"} ·{" "}
              {metadata.arrayCount.toLocaleString()}{" "}
              {metadata.arrayCount === 1 ? "array" : "arrays"} · max depth{" "}
              {metadata.maxDepth}
            </p>
            <DocumentScaleNotice
              byteLength={metadata.sizeInBytes}
              scale={outputScale}
              nodeCount={metadata.nodeCount}
            />
          </div>
        ) : (
          <p className="text-muted text-xs">{copy.empty}</p>
        )}

        <p className="text-muted min-h-4 text-xs" aria-live="polite">
          {actionNote || tools.announcement}
        </p>

        <label htmlFor="json-tools-output" className="sr-only">
          {copy.outputLabel}
        </label>
        <Textarea
          id="json-tools-output"
          value={compactOutput ? jsonEditorPreview(outputJson) : outputJson}
          readOnly
          placeholder={copy.empty}
          aria-label={copy.outputLabel}
          spellCheck={false}
          className="min-h-32 flex-1"
        />
        {compactOutput ? (
          <p className="text-muted text-xs">
            Showing a preview. Copy or download for the full document.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
