import { type ReactNode } from "react";
import { SkipLink } from "@/components/common/skip-link";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** Full-height workspace layout (e.g. /json). */
  dense?: boolean;
}

export function AppShell({
  children,
  className,
  dense = false,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground flex min-h-full flex-1 flex-col",
        dense && "h-dvh max-h-dvh min-h-0 overflow-hidden",
      )}
    >
      <SkipLink />
      <AppHeader />
      <main
        id="main-content"
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          dense ? "overflow-hidden" : "overflow-auto",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
