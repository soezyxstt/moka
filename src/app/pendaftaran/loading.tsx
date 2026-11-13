export default function Loading() {
  return <main role="status" aria-label="Memuat halaman pendaftaran" className="min-h-screen bg-background">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <section className="bg-highlight-50 px-8 pb-12 pt-32 md:px-20 md:pb-20 md:pt-40"><div className="mx-auto max-w-6xl"><div className="h-22 w-full max-w-3xl rounded-md bg-muted md:h-47" /><div className="mt-6 h-24 w-full max-w-xl rounded-md bg-muted md:h-16" /><div className="mt-8 flex flex-wrap gap-3"><div className="h-10 w-37.5 rounded-md bg-muted" /><div className="h-10 w-38.5 rounded-md bg-muted" /></div><div className="mt-10 md:mt-14"><div className="mb-5 h-7 w-64 rounded-md bg-muted" /><div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-23 border-t border-border bg-muted" />)}</div></div></div></section>
      <section className="px-8 py-12 md:px-20 md:py-20"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20">{[0, 1].map((item) => <div key={item} className="space-y-5"><div className="h-9 w-48 rounded-md bg-muted" /><div className="h-28 rounded-md bg-muted" /></div>)}</div></section>
    </div>
  </main>;
}
