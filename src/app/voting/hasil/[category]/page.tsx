import { ChartNoAxesColumnIncreasing, Clock3, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { getPublicNavigation, getPublicVotingResults } from "@/server/cms/public-readers";

export default async function HasilPage({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: categorySlug } = await params;
  const [results, navigation] = await Promise.all([
    getPublicVotingResults(categorySlug),
    getPublicNavigation(),
  ]);
  if (!results) notFound();

  const rankedResults = [...results.candidates].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, "id"));
  const hasPublishedResults = results.visible && results.totalAmount > 0;
  const leader = hasPublishedResults ? rankedResults[0] : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-900 pb-16 pt-24 text-canvas md:pb-20 md:pt-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <header className="mx-auto max-w-3xl animate-fade-in text-center">
          <h1 className="font-manrope text-3xl font-semibold uppercase leading-tight text-canvas sm:text-4xl md:text-5xl">Hasil voting</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-canvas/80 md:text-base">
            {results.campaign?.name ?? "Kampanye voting belum tersedia"} · {results.categoryName}
          </p>
        </header>

        <nav className="mx-auto mt-7 grid grid-cols-2 gap-2 rounded-xl bg-canvas/20 p-2 backdrop-blur-sm sm:flex sm:w-fit" aria-label="Kategori hasil voting">
          {navigation.categories.map((item) => {
            const active = item.slug === results.categorySlug;
            return (
              <Link key={item.slug} href={"/voting/hasil/" + item.slug} aria-current={active ? "page" : undefined} className={cn("rounded-md border border-highlight px-3 py-2 text-center text-xs font-semibold text-canvas transition-colors sm:px-4 sm:text-sm", active ? "bg-highlight text-ink" : "bg-transparent hover:bg-canvas/10")}>{item.name}</Link>
            );
          })}
        </nav>

        <section className="mt-5 overflow-hidden rounded-xl border border-canvas/20 bg-canvas/16 shadow-xl shadow-ink/15 backdrop-blur-md">
          <div className="border-b border-canvas/20 bg-canvas/8 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-manrope text-2xl font-semibold text-canvas md:text-3xl">{results.categoryName}</h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-md border border-highlight bg-brand-900/35 px-3 py-2 text-xs font-semibold text-canvas">
                {hasPublishedResults ? <ChartNoAxesColumnIncreasing className="size-4" /> : <Clock3 className="size-4" />}
                {hasPublishedResults ? "Hasil tersedia" : results.visible ? "Menunggu rekap" : "Hasil disembunyikan"}
              </div>
            </div>
          </div>

          <div className="grid border-b border-canvas/20 bg-brand-900/18 sm:grid-cols-2">
            <ResultSummary icon={<Users className="size-4" />} label="Jumlah peserta" value={results.visible ? rankedResults.length + " orang" : "Belum ditampilkan"} />
            <ResultSummary icon={<Trophy className="size-4" />} label="Peringkat pertama" value={leader?.name ?? "Belum ditetapkan"} className="border-t sm:border-l sm:border-t-0" />
          </div>

          <div className="p-5 sm:p-7">
            {hasPublishedResults ? (
              <ol className="space-y-3" aria-label={"Peringkat " + results.categoryName}>
                {rankedResults.map((item, index) => (
                  <li key={item.id} className="grid gap-3 rounded-lg border border-canvas/15 bg-brand-900/30 p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem] sm:items-center">
                    <span className={cn("grid size-9 place-items-center rounded-md font-manrope text-sm font-bold", index === 0 ? "bg-highlight text-ink" : "border border-highlight text-canvas")}>{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-canvas sm:text-base">{item.name}</p>
                      <p className="mt-1 text-xs text-canvas/65">{formatCurrency(item.amount)}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas/15" aria-hidden="true"><div className="h-full rounded-full bg-highlight" style={{ width: Math.min(100, Math.max(0, item.percentage)) + "%" }} /></div>
                    </div>
                    <p className="font-manrope text-lg font-semibold text-canvas sm:text-right">{item.percentage.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div>
                <div className="rounded-xl border border-dashed border-highlight bg-brand-900/32 px-5 py-8 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-md border border-highlight bg-canvas/10 text-canvas"><Clock3 className="size-5" /></span>
                  <h3 className="mt-4 font-manrope text-lg font-semibold text-canvas">{!results.campaign ? "Kampanye belum tersedia" : !results.visible ? "Hasil belum dipublikasikan" : "Rekap belum tersedia"}</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-canvas/75">
                    {!results.campaign
                      ? "Belum ada kampanye voting untuk edisi " + results.editionYear + "."
                      : !results.visible
                        ? "Hasil voting belum ditampilkan oleh panitia."
                        : "Belum ada rekap dukungan yang tercatat untuk kategori ini."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function ResultSummary({ icon, label, value, className }: { icon: ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 border-canvas/20 px-5 py-4 sm:px-7", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-highlight bg-canvas/10 text-canvas">{icon}</span>
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-canvas/60">{label}</p><p className="mt-0.5 truncate text-sm font-semibold text-canvas">{value}</p></div>
    </div>
  );
}
