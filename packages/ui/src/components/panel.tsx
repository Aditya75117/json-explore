import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@json-explore/ui/cn";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  as?: "section" | "div" | "aside";
  bodyClassName?: string;
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  as: Component = "section",
  ...props
}: PanelProps) {
  return (
    <Component
      className={cn(
        "border-border bg-surface border-hairline flex min-h-0 flex-col rounded-[var(--radius-md)]",
        className,
      )}
      {...props}
    >
      {(title || actions) && (
        <header className="border-border flex items-center justify-between gap-3 border-b px-3 py-2">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-sm font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted truncate text-xs">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      )}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-auto",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
}
