import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@json-explore/ui/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "border-border bg-surface text-foreground border-hairline h-9 w-full rounded-[var(--radius-md)] px-3 text-sm",
        "placeholder:text-muted",
        "hover:border-border-strong",
        "focus-visible:border-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
