export default function GalleryLoading() {
  return (
    <main className="min-h-screen bg-brand-50" role="status" aria-label="Memuat galeri">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <section className="mx-auto max-w-7xl px-6 pb-8 pt-28 md:px-12 md:pb-12 md:pt-36">
          <div className="flex flex-col gap-6 border-b border-brand-200/70 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-2xl">
              <div className="h-20 w-3/4 max-w-xl rounded-md bg-muted md:h-[60px]" />
              <div className="mt-3 h-[72px] w-full rounded-md bg-muted md:h-[48px]" />
            </div>
            <div className="h-8 w-32 shrink-0 rounded-md bg-muted" />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[80, 112, 128, 128, 144, 128, 128, 192].map((width, index) => (
                <div key={index} style={{ width }} className="h-7 rounded-md bg-muted" />
              ))}
            </div>
            <div className="h-4 w-14 rounded-md bg-muted" />
          </div>
        </section>
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 items-start gap-4 px-4 md:grid-cols-3 md:gap-6 md:px-8">
          <div className="aspect-[3/4] bg-muted" />
          <div className="aspect-[4/3] bg-muted" />
          <div className="hidden aspect-square bg-muted md:block" />
          <div className="aspect-[4/5] bg-muted" />
          <div className="aspect-[3/4] bg-muted" />
          <div className="hidden aspect-[16/10] bg-muted md:block" />
        </div>
      </div>
    </main>
  );
}
