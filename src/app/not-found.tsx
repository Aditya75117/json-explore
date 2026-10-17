import type { Metadata } from "next";
import Link from "next/link";
import { OPEN_EXPLORER_LABEL } from "@/config/site";
import { SiteHeader } from "@/features/marketing/site-header";
import { SiteFooter } from "@/features/marketing/site-footer";
import { SkipLink } from "@/components/common/skip-link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-1 flex-col">
      <SkipLink />
      <SiteHeader showCta={false} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6"
      >
        <p className="text-primary font-mono text-xs tracking-[0.16em] uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found.
        </h1>
        <p className="text-muted mt-3 max-w-md text-sm leading-relaxed">
          That URL does not exist. The JSON explorer is still one click away.
        </p>
        <Link
          href="/json"
          className="bg-primary text-primary-foreground mt-8 inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-medium no-underline hover:opacity-90"
        >
          {OPEN_EXPLORER_LABEL}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
