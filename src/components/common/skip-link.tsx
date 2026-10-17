export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="bg-primary text-primary-foreground sr-only z-50 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
    >
      Skip to main content
    </a>
  );
}
