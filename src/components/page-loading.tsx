/** Skeleton placeholder shown while a page's request-time data streams in. */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
