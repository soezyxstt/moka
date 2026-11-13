export function ParticipantGridSkeleton({ semifinal = false }: { semifinal?: boolean }) {
  return <main role="status" aria-label="Memuat kategori peserta" className="min-h-screen bg-brand-900">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="flex h-[90lvh] items-center px-8 md:px-20">
        <div className="h-12 w-full max-w-xl rounded-md bg-canvas/20 md:h-16" />
      </div>
      <div className={semifinal ? "px-8 py-12 md:px-20 md:py-16" : "px-8 py-8 md:px-20 md:py-20"}>
        <div className="mx-auto mb-8 h-[4.5rem] w-full max-w-xl rounded-md bg-canvas/20 md:mb-12 md:h-12" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className={`aspect-square bg-canvas/15 ${semifinal ? 'rounded-2xl' : 'rounded-md'}`} />)}
        </div>
      </div>
    </div>
  </main>;
}

export function ParticipantProfileSkeleton() {
  return <main role="status" aria-label="Memuat profil peserta" className="min-h-screen bg-brand-900 px-5 pt-20 pb-14 md:px-12 md:pt-24 md:pb-16">
    <div aria-hidden="true" className="mx-auto max-w-6xl motion-safe:animate-pulse">
      <div className="mb-3 h-7 w-40 rounded-md bg-canvas/20" />
      <div className="overflow-hidden rounded-2xl border border-canvas/15 bg-brand-800 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
        <div className="h-80 bg-canvas/15 sm:h-96 md:order-last md:h-auto md:min-h-[32rem]" />
        <div className="min-h-144 space-y-6 px-6 pt-4 pb-8 sm:px-8 md:min-h-0 md:px-10 md:py-9 lg:px-12">
          <div className="h-20 w-3/4 rounded-md bg-canvas/20 md:h-[60px]" />
          <div className="space-y-3 border-t border-canvas/15 pt-6">
            <div className="h-5 w-1/3 rounded-md bg-canvas/20" />
            <div className="h-36 w-full rounded-md bg-canvas/15 md:h-28" />
          </div>
          <div className="space-y-3 border-t border-canvas/15 pt-6">
            <div className="h-5 w-1/3 rounded-md bg-canvas/20" />
            <div className="h-28 w-5/6 rounded-md bg-canvas/15 md:h-24" />
          </div>
        </div>
      </div>
    </div>
  </main>;
}
