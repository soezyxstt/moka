export default function Loading() {
  return <main role="status" aria-label="Memuat halaman Tentang" className="min-h-screen bg-background">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <section className="bg-brand-50 px-8 pb-10 pt-28 md:px-20 md:pb-14 md:pt-40"><div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12"><div><div className="h-10 w-3/4 rounded-md bg-muted lg:h-16" /><div className="mt-4 h-70 w-full max-w-2xl rounded-md bg-muted lg:h-35" /><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3"><div className="h-11 w-48 rounded-md bg-muted" /><div className="h-11 w-36 rounded-md bg-muted" /></div></div><div className="aspect-[3/2] rounded-lg bg-muted" /></div></section>
      <section className="px-8 py-12 md:px-20 md:py-20"><div className="mx-auto max-w-7xl"><div className="h-10 w-56 rounded-md bg-muted" /><div className="mt-8 grid gap-8 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 border-t border-border bg-muted" />)}</div></div></section>
    </div>
  </main>;
}
