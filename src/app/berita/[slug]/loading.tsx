export default function ArticleLoading() {
  return (
    <main className="min-h-screen bg-background px-6 pb-16 pt-28 md:px-10 md:pt-36" role="status" aria-label="Memuat artikel">
      <div aria-hidden="true" className="mx-auto max-w-3xl motion-safe:animate-pulse">
        <div className="mb-6 h-5 w-44 rounded-md bg-muted" />
        <div className="h-5 w-28 rounded-md bg-muted" />
        <div className="mt-2 space-y-1 md:space-y-2">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className={`h-8 rounded-md bg-muted md:h-10 ${line > 2 ? 'md:hidden' : ''} ${line === 4 ? 'w-1/2' : 'w-full'}`} />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className={`h-5 rounded-md bg-muted ${line > 1 ? 'md:hidden' : ''} ${line === 4 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
        <div className="mt-8 aspect-video rounded-lg bg-muted" />
        <div className="mt-8 space-y-3">
          <div className="h-5 w-full rounded-md bg-muted" />
          <div className="h-5 w-full rounded-md bg-muted" />
          <div className="h-5 w-3/4 rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}
