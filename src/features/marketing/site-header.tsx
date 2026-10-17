import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { BrandMark } from "@/components/ui/brand-mark";
import { hasPublicGithubRepo, OPEN_EXPLORER_LABEL, SITE } from "@/config/site";
import { cn } from "@/lib/utils";

const navLinkClass = "text-muted hover:text-foreground text-sm no-underline";

export function SiteHeader({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-[var(--header-height)] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground flex items-center gap-2 text-sm font-semibold tracking-tight no-underline"
        >
          <BrandMark />
          {SITE.name}
        </Link>
        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-3 sm:gap-5"
        >
          <Link
            href="/#how-it-works"
            className={cn(navLinkClass, "hidden sm:inline")}
          >
            How it works
          </Link>
          <Link
            href="/#privacy"
            className={cn(navLinkClass, "hidden sm:inline")}
          >
            Privacy
          </Link>
          <Link href="/#faq" className={cn(navLinkClass, "hidden sm:inline")}>
            FAQ
          </Link>
          {hasPublicGithubRepo(SITE.githubUrl) ? (
            <a
              href={SITE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClass}
            >
              GitHub
            </a>
          ) : null}
          <ThemeToggle />
          {showCta ? (
            <Link
              href="/json"
              className="bg-primary text-primary-foreground inline-flex h-8 items-center rounded-[var(--radius-md)] px-3 text-xs font-medium no-underline hover:opacity-90"
            >
              {OPEN_EXPLORER_LABEL}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
