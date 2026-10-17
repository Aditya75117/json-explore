"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@json-explore/ui/components/icon-button";
import { COPY_FEEDBACK_MS } from "@json-explore/workspace/features/json-explorer/constants";
import { cn } from "@json-explore/ui/cn";

export interface JsonNodeActionsProps {
  onCopyPath: () => void;
  onCopyValue: () => void;
  className?: string;
}

export function JsonNodeActions({
  onCopyPath,
  onCopyValue,
  className,
}: JsonNodeActionsProps) {
  const [copied, setCopied] = useState<"path" | "value" | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const showCopied = (kind: "path" | "value") => {
    setCopied(kind);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setCopied(null),
      COPY_FEEDBACK_MS,
    );
  };

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
      <IconButton
        label={copied === "path" ? "Copied path" : "Copy path"}
        className="h-6 w-6"
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation();
          onCopyPath();
          showCopied("path");
        }}
      >
        <span aria-hidden="true" className="font-mono text-[10px]">
          {copied === "path" ? "✓" : "$"}
        </span>
      </IconButton>
      <IconButton
        label={copied === "value" ? "Copied value" : "Copy value"}
        className="h-6 w-6"
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation();
          onCopyValue();
          showCopied("value");
        }}
      >
        <span aria-hidden="true" className="text-[10px]">
          {copied === "value" ? "✓" : "⎘"}
        </span>
      </IconButton>
    </div>
  );
}
