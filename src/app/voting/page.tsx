import Link from "next/link";

import { typography } from "@/components/custom/typography";
import { getPublicVotingCategories } from "@/server/cms/public-readers";

export const metadata = { title: "Voting" };

export default async function VotingPage() {
  const { editionYear, categories } = await getPublicVotingCategories();

  return (
    <main className="relative min-h-screen bg-dgb-50 px-8 py-14 md:px-20 md:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dgb-50/90" />
      <div className="relative mx-auto max-w-7xl">
        <typography.t1>Pasanggiri Mojang Jajaka {editionYear}</typography.t1>
        <h1 className="mt-2 text-4xl font-semibold font-montserrat text-dgb-900 md:text-5xl">Voting</h1>
        <p className="mt-4 max-w-2xl font-inter text-base text-[#505050]">
          Pilih kategori untuk melihat informasi voting edisi {editionYear}.
        </p>

        {categories.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/voting/${category.slug}`}
                className="rounded-xl border border-dgb-100 bg-white/80 p-6 transition-colors hover:border-dgb-400 hover:bg-white"
              >
                <h2 className="font-montserrat text-xl font-semibold text-dgb-900">{category.name}</h2>
                <p className="mt-2 font-inter text-sm text-[#505050]">Lihat informasi kategori</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-xl border border-dgb-100 bg-white/80 p-6 font-inter text-[#505050]">
            Belum ada kategori voting untuk edisi ini.
          </p>
        )}
      </div>
    </main>
  );
}
