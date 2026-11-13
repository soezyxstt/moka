import NewsListLoading from './news-list-loading';

export default function NewsLoading() {
  return (
    <main className="min-h-screen bg-background" role="status" aria-label="Memuat berita">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <section className="border-b border-neutral-200/70 bg-neutral-50 px-8 pb-12 pt-28 md:px-20 md:pb-16 md:pt-36">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6 h-5 w-40 rounded-md bg-muted" />
            <div className="h-10 w-3/4 max-w-3xl rounded-md bg-muted md:h-[60px]" />
            <div className="mt-3 h-[78px] w-full max-w-2xl rounded-md bg-muted md:h-[52px]" />
          </div>
        </section>
        <NewsListLoading />
      </div>
    </main>
  );
}
