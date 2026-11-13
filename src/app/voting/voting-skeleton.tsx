export function VotingHeaderSkeleton() {
  return <section role="status" aria-label="Memuat informasi voting" className="bg-brand-900 px-8 pb-12 pt-32 md:px-20 md:pb-16 md:pt-44">
    <div aria-hidden="true" className="mx-auto max-w-7xl space-y-4 motion-safe:animate-pulse">
      <div className="h-24 w-3/4 max-w-3xl rounded-md bg-canvas/20 md:h-18" />
      <div className="h-5 w-48 rounded-md bg-canvas/15" />
      <div className="h-98 w-full max-w-2xl rounded-md bg-canvas/15 md:h-42" />
    </div>
  </section>;
}

export function VotingResultsSkeleton({ showChart = false }: { showChart?: boolean }) {
  // shortcut: grafik mengikuti tinggi sampel produksi 600 px, sesuaikan jika jumlah peserta berubah.
  return <div role="status" aria-label="Memuat kategori dan hasil voting">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="flex gap-2 border-b border-brand-200 pb-4 sm:gap-3">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-10 flex-1 rounded-md bg-brand-200 sm:h-11 sm:max-w-20" />)}
      </div>
      <div className="mt-6 h-7 w-40 rounded-md bg-brand-200" />
      {showChart ? <><div className="h-5 w-48 rounded-md bg-brand-200" /><div className="mt-6 h-150 w-full rounded-md bg-brand-200" /></> : <div className="mt-4 h-12 w-full max-w-xl rounded-md bg-brand-200 md:h-6" />}
    </div>
  </div>;
}
