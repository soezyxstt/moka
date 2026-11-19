export default function EventLoading() {
  return (
    <main className="min-h-screen bg-brand-800" role="status" aria-label="Memuat kegiatan">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="relative flex h-[90vh] items-center bg-brand-900 px-8 md:px-20">
          <div className="w-full max-w-sm space-y-4">
            <div className="h-10 w-4/5 rounded-md bg-canvas/20 md:h-14" />
            <div className="h-5 w-full rounded-md bg-canvas/20" />
            <div className="h-5 w-3/4 rounded-md bg-canvas/20" />
          </div>
        </div>
        <section className="px-6 py-8 md:px-20 md:py-20">
          <div className="mb-8 h-9 w-56 rounded-md bg-canvas/20 md:mx-auto md:mb-16 md:h-16" />
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 w-40 rounded-lg bg-canvas/20 md:h-44 md:w-64" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
