export default function SponsorLoading() {
  return (
    <div role="status" aria-label="Memuat sponsor">
      <div aria-hidden="true" className="flex w-full flex-wrap justify-center gap-6 motion-safe:animate-pulse md:gap-12">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 w-40 rounded-lg bg-canvas/20 md:h-44 md:w-64" />
        ))}
      </div>
    </div>
  );
}
