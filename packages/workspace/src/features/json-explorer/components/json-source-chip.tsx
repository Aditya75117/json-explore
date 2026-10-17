"use client";

import { Badge } from "@json-explore/ui/components/badge";
import { formatByteSize } from "@json-explore/core/statistics/format-bytes";
import { cn } from "@json-explore/ui/cn";

export interface JsonSourceChipProps {
  hasValue: boolean;
  isValid: boolean;
  isProcessing: boolean;
  hasError: boolean;
  byteLength: number;
  className?: string;
}

export function JsonSourceChip({
  hasValue,
  isValid,
  isProcessing,
  hasError,
  byteLength,
  className,
}: JsonSourceChipProps) {
  const tone = isProcessing
    ? "neutral"
    : isValid
      ? "success"
      : hasError
        ? "danger"
        : "neutral";
  const label = isProcessing
    ? "Processing"
    : isValid
      ? "Valid"
      : hasError
        ? "Invalid"
        : hasValue
          ? "Unparsed"
          : "No JSON";

  return (
    <div
      className={cn(
        "flex h-9 flex-nowrap items-center gap-2 text-xs",
        className,
      )}
    >
      <Badge tone={tone}>{label}</Badge>
      {hasValue ? (
        <span className="text-muted">{formatByteSize(byteLength)}</span>
      ) : null}
    </div>
  );
}
