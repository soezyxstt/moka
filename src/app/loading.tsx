export default function Loading() {
  return (
    <main className="grid min-h-svh place-items-center bg-brand-900 px-8 pb-16 pt-28 md:min-h-screen md:px-20 md:py-28" role="status" aria-label="Memuat halaman">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 motion-safe:animate-pulse md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] md:gap-12" aria-hidden="true">
        <div>
          <div className="h-[6.75rem] rounded-md bg-canvas/20 md:h-44" />
          <div className="mt-4 h-6 w-4/5 rounded-md bg-canvas/15 md:h-8" />
          <div className="mt-5 h-24 rounded-md bg-canvas/15 md:h-14" />
          <div className="mt-8 flex flex-wrap gap-3.5"><div className="h-11 w-40 rounded-md bg-canvas/20" /><div className="h-11 w-52 rounded-md bg-canvas/15" /></div>
        </div>
        <div className="aspect-[3/2] w-full rounded-lg bg-canvas/15 md:translate-y-[10vh]" />
      </div>
    </main>
  );
}
