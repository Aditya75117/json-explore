export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <div className="bg-surface-muted h-8 w-48 rounded-[var(--radius-md)]" />
      <div className="bg-surface-muted mt-4 h-12 w-full max-w-xl rounded-[var(--radius-md)]" />
      <p className="sr-only">Loading JSON Explore</p>
    </div>
  );
}
