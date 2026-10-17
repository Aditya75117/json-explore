import Link from "next/link";
import { hasPublicGithubRepo, SITE } from "@/config/site";
import { ShortcutHelp } from "@/components/common/shortcut-help";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { BrandMark } from "@/components/ui/brand-mark";
import { Tooltip } from "@/components/ui/tooltip";

export function AppHeader() {
  return (
    <header className="border-border bg-background/90 sticky top-0 z-40 flex h-[var(--header-height)] max-h-[var(--header-height)] min-h-[var(--header-height)] shrink-0 items-center justify-between overflow-hidden border-b px-4 backdrop-blur-sm">
      <Link
        href="/"
        className="text-foreground flex items-center gap-2 text-sm font-semibold tracking-tight no-underline"
      >
        <BrandMark />
        {SITE.name}
      </Link>
      <div className="flex items-center gap-1">
        <ShortcutHelp />
        <Tooltip content="Toggle color theme">
          <ThemeToggle />
        </Tooltip>
        {hasPublicGithubRepo(SITE.githubUrl) ? (
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:bg-surface-muted hover:text-foreground inline-flex h-8 items-center rounded-[var(--radius-md)] px-2 text-xs no-underline"
          >
            GitHub
          </a>
        ) : null}
      </div>
    </header>
  );
}
