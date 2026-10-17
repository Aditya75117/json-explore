"use client";

import {
  forwardRef,
  useDeferredValue,
  useMemo,
  useRef,
  type ReactNode,
  type TextareaHTMLAttributes,
  type UIEvent,
} from "react";
import { Textarea } from "@json-explore/ui/components/textarea";
import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";
import { cn } from "@json-explore/ui/cn";

export interface JsonSourceEditorProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value"
> {
  value: string;
}

function stringEnd(source: string, start: number): number {
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      return index + 1;
    }
  }
  return source.length;
}

function highlightedJson(source: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    const character = source[index]!;

    if (character === '"') {
      const end = stringEnd(source, index);
      const token = source.slice(index, end);
      const next = source.slice(end).match(/^\s*:/);
      nodes.push(
        <span
          key={index}
          className={next ? "text-json-key" : "text-json-string"}
        >
          {token}
        </span>,
      );
      index = end;
      continue;
    }

    const number = rest.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) {
      nodes.push(
        <span key={index} className="text-json-number">
          {number[0]}
        </span>,
      );
      index += number[0].length;
      continue;
    }

    const keyword = rest.match(/^(?:true|false|null)\b/);
    if (keyword) {
      nodes.push(
        <span key={index} className="text-json-keyword">
          {keyword[0]}
        </span>,
      );
      index += keyword[0].length;
      continue;
    }

    const plain = rest.match(/^[^"\d-]+/)?.[0] ?? character;
    nodes.push(<span key={index}>{plain}</span>);
    index += plain.length;
  }

  return nodes;
}

export const JsonSourceEditor = forwardRef<
  HTMLTextAreaElement,
  JsonSourceEditorProps
>(function JsonSourceEditor({ value, className, onScroll, ...props }, ref) {
  const overlayRef = useRef<HTMLPreElement>(null);
  const deferredValue = useDeferredValue(value);
  const canHighlight =
    value.length > 0 &&
    value.length <= PERFORMANCE_LIMITS.syntaxHighlightCharLimit &&
    deferredValue === value;
  const tokens = useMemo(
    () => (canHighlight ? highlightedJson(deferredValue) : null),
    [canHighlight, deferredValue],
  );

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = event.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    onScroll?.(event);
  };

  return (
    <div className="relative h-full min-h-0">
      {tokens ? (
        <pre
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-px overflow-hidden px-3 py-2 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap"
        >
          {tokens}
        </pre>
      ) : null}
      <Textarea
        ref={ref}
        value={value}
        onScroll={syncScroll}
        className={cn(
          "absolute inset-0 h-full resize-none",
          tokens && "caret-foreground bg-transparent text-transparent",
          className,
        )}
        {...props}
      />
    </div>
  );
});
