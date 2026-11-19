export default function NewsListLoading() {
  return (
        <section role="status" aria-label="Memuat daftar berita" className="motion-safe:animate-pulse px-8 py-16 md:px-20 md:py-24">
          <div aria-hidden="true" className="mx-auto w-full max-w-7xl space-y-14">
            <div className="grid overflow-hidden rounded-2xl border border-border md:grid-cols-12">
              <div className="min-h-64 bg-muted md:col-span-5" />
              <div className="space-y-4 p-6 md:col-span-7 md:p-8">
                <div className="h-3 w-24 rounded-md bg-muted" />
                <div className="h-7 w-4/5 rounded-md bg-muted" />
                <div className="h-7 w-full rounded-md bg-muted md:hidden" />
                <div className="h-7 w-3/4 rounded-md bg-muted md:hidden" />
                <div className="h-5 w-full rounded-md bg-muted" />
                <div className="h-5 w-full rounded-md bg-muted" />
                <div className="h-5 w-full rounded-md bg-muted md:hidden" />
                <div className="h-5 w-3/4 rounded-md bg-muted md:hidden" />
                <div className="mt-8 h-9 w-36 rounded-md bg-muted" />
              </div>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {[0, 1, 2].map((item) => (
                <div key={item} className="grid gap-4 py-6 md:grid-cols-12 md:gap-8">
                  <div className="h-4 w-24 rounded-md bg-muted md:col-span-3" />
                  <div className="space-y-3 md:col-span-7">
                    <div className="h-6 w-4/5 rounded-md bg-muted" />
                    <div className="h-4 w-full rounded-md bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
  );
}
