import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { OPEN_EXPLORER_LABEL, SITE } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <BrandMark className="h-6" />
          <span>
            <span className="text-foreground font-medium">{SITE.name}</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            JSON processing stays in your browser.
          </span>
        </p>
        <nav aria-label="Footer">
          <Link
            href="/json"
            className="text-foreground hover:text-primary no-underline"
          >
            {OPEN_EXPLORER_LABEL}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
