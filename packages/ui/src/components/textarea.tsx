import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@json-explore/ui/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "border-border bg-surface border-hairline min-h-32 w-full resize-y rounded-[var(--radius-md)] px-3 py-2",
          "text-foreground font-mono text-sm leading-relaxed",
          "placeholder:text-muted",
          "hover:border-border-strong",
          "focus-visible:border-focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
