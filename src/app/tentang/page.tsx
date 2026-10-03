import { Images, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { typography } from "@/components/custom/typography";
import { Button } from "@/components/custom/button";
import { getPublicAboutContent, type PublicGalleryAlbum } from "@/server/cms/public-readers";

export const metadata = { title: "Tentang Kami" };

function cssBackground(url?: string) {
  return url ? `url(${JSON.stringify(url)})` : undefined;
}

export default async function AboutUs() {
  const about = await getPublicAboutContent();
  const hero = about.sections.hero;
  const visi = about.sections.visi;
  const misiSection = about.sections.misi;
  const legalitas = about.sections.legalitas;
  const organisasi = about.sections.organisasi;
  const heroImage = about.assets["about.hero.bg"];
  const introImage = about.assets["about.intro.image"];
  const visionImage = about.assets["about.vision.image"];
  const history = about.history.filter((period) => period.members.length > 0);
  const hasHero = Boolean(hero?.eyebrow?.trim() || hero?.title?.trim() || hero?.body?.trim() || heroImage);
  const hasVision = Boolean(visi?.eyebrow?.trim() || visi?.title?.trim() || about.vision || about.mission.length || misiSection?.title?.trim() || introImage || visionImage || about.assets["about.vision.bg"]);
  const hasLegalitas = Boolean(legalitas?.eyebrow?.trim() || legalitas?.title?.trim() || legalitas?.body?.trim());
  const hasOrganisasi = Boolean(organisasi?.eyebrow?.trim() || organisasi?.title?.trim() || organisasi?.body?.trim() || about.pengurus.length);

  return (
    <main className="relative min-h-screen">
      {hasHero ? <section className="relative grid h-[62svh] min-h-[28rem] place-items-center overflow-hidden bg-dgb-900 bg-cover bg-center md:h-[75svh] md:min-h-[34rem]" style={{ backgroundImage: cssBackground(heroImage?.url) }}>
        {heroImage ? <Image src={heroImage.url} alt={heroImage.alt ?? ""} fill preload className="object-cover object-center opacity-40" sizes="100vw" /> : null}
        <div aria-hidden className="absolute inset-0 bg-linear-to-br from-dgb-800 via-dgb-600/60 via-65% to-95% to-fb-300/50" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-8 text-center md:px-20">
          {hero?.eyebrow?.trim() ? <p className="mb-2 font-inter text-sm font-semibold uppercase tracking-wide text-white/85">{hero.eyebrow.trim()}</p> : null}
          {hero?.title?.trim() ? <h1 className="mx-auto max-w-2xl font-montserrat !text-3xl font-semibold leading-tight text-white animate-fade-in md:!text-5xl">{hero.title.trim()}</h1> : null}
          {hero?.body?.trim() ? <p className="mx-auto mt-4 max-w-3xl font-inter text-white/85">{hero.body.trim()}</p> : null}
        </div>
      </section> : null}

      {hasVision ? <section id="visi-misi" className="relative overflow-x-clip bg-dgb-50 bg-cover bg-center pb-14 md:pb-20" style={{ backgroundImage: cssBackground(about.assets["about.vision.bg"]?.url) }}>
        {introImage ? <div className="relative z-10 mx-auto w-[88vw] max-w-4xl -translate-y-14 md:-translate-y-20">
          <Image src={introImage.url} alt={introImage.alt ?? ""} width={1080} height={720} className="aspect-[16/9] w-full rounded-l-full rounded-br-full object-cover shadow-xl shadow-dgb-900/15" sizes="(max-width: 768px) 88vw, 896px" />
        </div> : null}

        <div className={introImage ? "-mt-2 md:-mt-4" : "pt-14 md:pt-20"}>
          <div className={`mx-auto grid max-w-7xl items-end gap-8 px-8 md:gap-16 md:px-20 ${visionImage ? "md:grid-cols-[minmax(0,1fr)_25rem]" : "md:grid-cols-1"}`}>
            <div className="pb-4 md:pb-12 md:pl-[6%]">
              {visi?.eyebrow?.trim() ? <typography.t1>{visi.eyebrow.trim()}</typography.t1> : null}
              {visi?.title?.trim() ? <typography.h1 className="text-dgb-900">{visi.title.trim()}</typography.h1> : null}
              {about.vision ? <typography.p className="mt-4 max-w-2xl leading-7">{about.vision}</typography.p> : null}
            </div>
            {visionImage ? <div className="relative hidden md:block">
              <div aria-hidden className="absolute -inset-y-10 left-1/3 w-[50vw] bg-dgb-300" />
              <Image src={visionImage.url} alt={visionImage.alt ?? ""} width={500} height={360} className="relative aspect-[5/3] w-full rounded-tl-2xl object-cover" />
            </div> : null}
          </div>

          {about.mission.length || misiSection?.title?.trim() || misiSection?.eyebrow?.trim() ? <div className="ml-auto mt-16 w-[94%] rounded-tl-[64px] bg-linear-to-bl from-dgb-300 via-dgb-300 via-30% to-fb-300 px-7 py-10 text-white md:w-[90%] md:rounded-tl-[80px] md:px-12 md:py-12">
            {misiSection?.eyebrow?.trim() ? <typography.t1>{misiSection.eyebrow.trim()}</typography.t1> : null}
            {misiSection?.title?.trim() ? <h2 className="mb-8 font-montserrat text-2xl font-semibold">{misiSection.title.trim()}</h2> : null}
            {about.mission.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
              {about.mission.map((item, index) => <article key={`${index}-${item}`} className="font-montserrat lg:border-l lg:border-white/22 lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0">
                <div className="mb-3 flex items-center gap-2"><h3 className="font-semibold">Misi {index + 1}</h3></div>
                <p className="text-sm leading-6 text-white/85">{item}</p>
              </article>)}
            </div> : null}
          </div> : null}
        </div>
      </section> : null}

      {hasLegalitas ? <section className="relative overflow-hidden bg-fb-50 px-8 py-14 md:px-20 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-fb-50/80" />
        <div className="relative mx-auto max-w-7xl">
          {legalitas?.eyebrow?.trim() ? <typography.t1>{legalitas.eyebrow.trim()}</typography.t1> : null}
          {legalitas?.title?.trim() ? <typography.h1 className="mt-2 text-dgb-900">{legalitas.title.trim()}</typography.h1> : null}
          {legalitas?.body?.trim() ? <typography.p className="mt-3 max-w-4xl font-medium leading-7">{legalitas.body.trim()}</typography.p> : null}
        </div>
      </section> : null}

      {hasOrganisasi ? <section className="relative overflow-hidden bg-dgb-50 px-8 py-14 md:px-20 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-fb-50/40" />
        <div className="relative mx-auto w-full max-w-7xl">
          {organisasi?.eyebrow?.trim() ? <typography.t1>{organisasi.eyebrow.trim()}</typography.t1> : null}
          {organisasi?.title?.trim() ? <typography.h1 className="mt-2 max-w-3xl text-dgb-900">{organisasi.title.trim()}</typography.h1> : null}
          {organisasi?.body?.trim() ? <typography.p className="mt-3 max-w-3xl">{organisasi.body.trim()}</typography.p> : null}
          {about.organizationPeriodLabel ? <p className="mt-4 font-inter text-sm font-medium text-dgb-700">{about.organizationPeriodLabel}</p> : null}
          {about.pengurus.length ? <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            {about.pengurus.map((person) => <article key={`${person.name}-${person.position}`} className="group mx-auto flex w-full max-w-xs flex-col rounded-lg p-4 font-montserrat sm:p-6">
              <div className="relative mb-4 aspect-square w-full overflow-hidden bg-dgb-100">
                {person.imageUrl ? <Image src={person.imageUrl} alt={`${person.name}, ${person.position}`} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width: 640px) 80vw, (max-width: 768px) 42vw, 24vw" /> : <div aria-hidden className="absolute inset-0 bg-linear-to-br from-dgb-200/80 to-fb-200/80" />}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-dgb-900 md:text-xl">{person.name}</h3>
              <p className="text-sm italic leading-6 text-[#505050]">{person.position}</p>
            </article>)}
          </div> : null}
        </div>
      </section> : null}

      {history.length ? <section className="relative overflow-hidden bg-fb-50 px-8 py-14 md:px-20 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-fb-50/80" />
        <div className="relative mx-auto w-full max-w-7xl">
          <typography.t1>Riwayat</typography.t1>
          <typography.h1 className="mt-2 text-dgb-900">Riwayat kepengurusan</typography.h1>
          <div className="mt-8 space-y-10">
            {history.map((period) => <section key={period.id} className="rounded-xl border border-dgb-100 bg-white/75 p-5 md:p-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="font-montserrat text-xl font-semibold text-dgb-900">{period.label}</h2>
                <p className="font-inter text-sm text-[#505050]">{period.startYear} sampai {period.endYear}</p>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {period.members.map((person) => <article key={person.id} className="group rounded-lg bg-dgb-50/70 p-4">
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-dgb-100">
                    {person.imageUrl ? <Image src={person.imageUrl} alt={`${person.name}, ${person.position}`} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width: 640px) 80vw, (max-width: 768px) 42vw, 24vw" /> : <div aria-hidden className="absolute inset-0 grid place-items-center bg-linear-to-br from-dgb-200/80 to-fb-200/80"><UserRound className="size-10 text-dgb-700/70" /></div>}
                  </div>
                  <h3 className="font-montserrat font-semibold text-dgb-900">{person.name}</h3>
                  <p className="mt-1 font-inter text-sm leading-6 text-[#505050]">{person.position}</p>
                </article>)}
              </div>
            </section>)}
          </div>
        </div>
      </section> : null}

      <section id="gallery" className="relative bg-dgb-50 bg-cover bg-center px-8 py-14 md:px-24 md:py-20" style={{ backgroundImage: cssBackground(about.assets["about.gallery.bg"]?.url) }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dgb-50/90" />
        <div className="relative mx-auto max-w-6xl">
          <typography.t1>Dokumentasi</typography.t1>
          <typography.h1 className="mt-2 text-dgb-900">Galeri PAMOKA</typography.h1>
          {about.galleries.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {about.galleries.slice(0, 3).map((album) => <AlbumPreview key={album.id} album={album} />)}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-dgb-200 bg-white/55 px-6 py-10 text-center font-inter text-sm text-[#505050]">Belum ada album terbit untuk edisi ini.</p>
          )}
          <div className="mt-8 flex justify-center"><Link href="/galeri"><Button variant="outline">Lihat lebih lengkap</Button></Link></div>
        </div>
      </section>
    </main>
  );
}

function AlbumPreview({ album }: { album: PublicGalleryAlbum }) {
  const firstVideo = album.items.find((item) => item.youtubeId)?.youtubeId;
  return (
    <article className="overflow-hidden rounded-xl border border-dgb-100 bg-white/80">
      <Link href={`/galeri#${album.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fb-400">
        {album.coverUrl ? <Image src={album.coverUrl} alt={album.coverAlt ?? album.title} width={640} height={420} className="aspect-[3/2] w-full object-cover" /> : firstVideo ? <Image src={`https://img.youtube.com/vi/${firstVideo}/hqdefault.jpg`} alt={album.title} width={640} height={420} className="aspect-[3/2] w-full object-cover" /> : <div className="flex aspect-[3/2] items-center justify-center bg-dgb-50"><Images className="size-8 text-dgb-400" aria-hidden="true" /></div>}
        <div className="p-4"><h3 className="font-montserrat text-lg font-semibold text-dgb-900">{album.title}</h3>{album.description ? <p className="mt-2 line-clamp-3 font-inter text-sm leading-6 text-[#505050]">{album.description}</p> : null}</div>
      </Link>
    </article>
  );
}
