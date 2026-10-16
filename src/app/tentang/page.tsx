import { ArrowRight, ArrowUpRight, FileText, Images, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Section } from "@/components/custom/section";
import { Button } from "@/components/custom/button";
import { typography } from "@/components/custom/typography";
import { getPublicAboutContent, getPublicSiteIdentity, type PublicGalleryAlbum } from "@/server/cms/public-readers";

export const metadata = { title: "Tentang Kami" };

export default async function AboutUs() {
  const [about, site] = await Promise.all([getPublicAboutContent(), getPublicSiteIdentity()]);
  const contact = site.contacts.find((item) => item.kind === "email") ?? site.contacts.find((item) => item.kind === "instagram");
  const { hero, visi, misi, legalitas, organisasi } = about.sections;
  const heroImage = about.assets["about.hero.bg"];
  const introImage = about.assets["about.intro.image"] ?? heroImage;
  const visionImage = about.assets["about.vision.image"];
  const history = about.history
    .map((period) => ({
      ...period,
      members: period.members.filter((person) => isKetuaUmum(person.position)),
    }))
    .filter((period) => period.members.length > 0);
  const hasHero = Boolean(hero?.title?.trim() || hero?.body?.trim() || heroImage || introImage);
  const hasVision = Boolean(visi?.title?.trim() || about.vision || visionImage);
  const hasMission = Boolean(misi?.title?.trim() || about.mission.length);
  const hasLegalitas = Boolean(legalitas?.title?.trim() || legalitas?.body?.trim() || about.legalDocument);
  const hasOrganisasi = Boolean(organisasi?.title?.trim() || organisasi?.body?.trim() || about.pengurus.length);
  const roleGroups = [
    { label: "Dewan pengawas", pattern: /dewan pengawas/i },
    { label: "Ketua, sekretaris, dan bendahara", pattern: /^(ketua umum|wakil ketua|sekretaris|wakil sekretaris|bendahara|wakil bendahara)/i },
    { label: "Bidang", pattern: /bidang/i },
  ];
  const roster = roleGroups.map((group, index) => ({ label: group.label, members: about.pengurus.filter((person) => roleGroups.findIndex((role) => role.pattern.test(person.position)) === index) }));
  roster.push({ label: "Pengurus lainnya", members: about.pengurus.filter((person) => !roleGroups.some((group) => group.pattern.test(person.position))) });

  return (
    <main className="relative min-h-screen">
      {hasHero ? <Section className="overflow-hidden bg-brand-50 pb-10 pt-28 md:pb-14 md:pt-40" background={heroImage?.url} overlay="brand">
        <div className={`relative mx-auto grid w-full max-w-7xl items-center gap-8 lg:gap-12 ${introImage ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}>
          <div>
            {hero?.title?.trim() ? <h1 className="max-w-3xl font-manrope text-4xl font-semibold leading-[1.1] text-brand-900 sm:text-5xl lg:text-6xl">{hero.title.trim() === "Kenali Kami Lebih Dekat" ? "PAMOKA Garut" : hero.title.trim()}</h1> : null}
            <p className="mt-5 max-w-2xl font-inter text-lg font-medium leading-7 text-brand-800">Paguyuban Mojang Jajaka Kabupaten Garut, dikenal melalui MOKA Garut.</p>
            {hero?.body?.trim() ? <typography.p className="mt-4 max-w-2xl leading-7">{hero.body.trim()}</typography.p> : hero?.title?.trim() === "Kenali Kami Lebih Dekat" && about.mission.length ? <typography.p className="mt-4 max-w-2xl leading-7">Wadah pengembangan diri generasi muda Garut melalui budaya, kepemimpinan, dan kegiatan bersama.</typography.p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild size="lg"><Link href="#gallery">Lihat kegiatan<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button>
              {contact ? <a href="#kontak" className="inline-flex min-h-11 items-center text-base text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Hubungi pengurus</a> : null}
            </div>
          </div>
          {introImage ? <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
            <Image src={introImage.url} alt={introImage.alt ?? ""} fill preload className="object-cover" sizes="(max-width: 1023px) 90vw, 45vw" />
          </div> : null}
        </div>
      </Section> : null}

      <Section id="gallery" className="bg-highlight-50 py-10 md:py-12" background={about.assets["about.gallery.bg"]?.url} overlay="highlight" contentClassName="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <typography.h1 className="text-3xl text-brand-900 md:text-4xl">Kegiatan kami</typography.h1>
          <Link href="/galeri" className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-brand/40 text-sm font-medium text-brand transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Lihat semua galeri<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        {about.galleries.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr]">
          {about.galleries.slice(0, 3).map((album, index) => <AlbumPreview key={album.id} album={album} featured={index === 0} />)}
        </div> : <typography.p className="mt-8">Belum ada album terbit untuk edisi ini.</typography.p>}
      </Section>

      {hasVision || hasMission ? <Section id="visi-misi" className="bg-brand-50 py-10 md:py-12" background={about.assets["about.vision.bg"]?.url} overlay="brand" contentClassName="mx-auto max-w-7xl">
        {hasVision ? <div className={`grid items-center gap-6 lg:gap-12 ${visionImage ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
          <div className="min-w-0">
            {visi?.title?.trim() ? <typography.h1 className="text-2xl text-brand-900 md:text-3xl">{visi.title.trim()}</typography.h1> : null}
            {about.vision ? <typography.p className="mt-4 max-w-3xl text-xl font-medium leading-8 text-brand-800 md:text-2xl md:leading-9">{about.vision}</typography.p> : null}
          </div>
          {visionImage ? <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
            <Image src={visionImage.url} alt={visionImage.alt ?? ""} fill className="object-contain" sizes="(max-width: 1023px) 90vw, 38vw" />
          </div> : null}
        </div> : null}

        {hasMission ? <div className={hasVision ? "mt-8 md:mt-10" : ""}>
          {misi?.title?.trim() ? <typography.h1 className="mb-5 text-2xl text-brand-900 md:text-3xl">{misi.title.trim()}</typography.h1> : null}
          <ol className="grid gap-x-10 lg:grid-cols-2">
            {about.mission.map((item, index) => <li key={`${index}-${item}`} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-brand-200 py-4 md:grid-cols-[3rem_1fr] md:gap-4 lg:last:odd:col-span-2">
              <span aria-hidden className="font-manrope text-3xl font-medium tabular-nums text-highlight-700">{String(index + 1).padStart(2, "0")}</span>
              <typography.p className="min-w-0 leading-7">{item}</typography.p>
            </li>)}
          </ol>
        </div> : null}
      </Section> : null}

      {hasLegalitas ? <Section id="legalitas" className="bg-highlight-50 py-8 md:py-10" contentClassName="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <div>
          {legalitas?.title?.trim() ? <typography.h1 className="text-3xl text-brand-900 md:text-4xl">{legalitas.title.trim()}</typography.h1> : null}
        </div>
        <div className="min-w-0">
          {legalitas?.body?.trim() ? <typography.p className="leading-7">{legalitas.body.trim()}</typography.p> : null}
          {about.legalDocument ? <a href={about.legalDocument.url} target="_blank" rel="noreferrer" className="group mt-6 flex min-h-14 items-center gap-4 border-y border-brand-200 py-5 text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-400">
            <FileText className="size-6 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 font-inter text-sm font-semibold leading-6">{about.legalDocument.title}<span className="block font-inter text-xs font-normal text-brand-700">Lihat dokumen PDF</span></span>
            <ArrowUpRight className="size-5 shrink-0 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden />
          </a> : null}
        </div>
      </Section> : null}

      {hasOrganisasi ? <Section id="pengurus" className="bg-brand-50 py-10 md:py-12" contentClassName="mx-auto max-w-7xl">
        <div>
          <div>
            {organisasi?.title?.trim() ? <typography.h1 className="max-w-3xl text-3xl text-brand-900 md:text-4xl">{organisasi.title.trim()}</typography.h1> : null}
            {about.organizationPeriodLabel ? <p className="mt-3 font-inter text-base font-medium text-brand-700">{about.organizationPeriodLabel}</p> : null}
            {organisasi?.body?.trim() ? <typography.p className="mt-4 max-w-3xl leading-7">{organisasi.body.trim()}</typography.p> : null}
          </div>
        </div>
        {roster.filter((group) => group.members.length).map((group) => <section key={group.label} className="mt-8 border-t border-brand-200 pt-5">
          <h3 className="font-manrope text-lg font-semibold text-brand-900">{group.label}</h3>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {group.members.map((person) => <article key={`${person.name}-${person.position}`} className="min-w-0">
            <div className="relative aspect-square overflow-hidden rounded-t-full bg-linear-to-t from-brand-200/70 to-brand-50">
              {person.imageUrl ? <Image src={person.imageUrl} alt={`${person.name}, ${person.position}`} fill className="object-contain object-bottom" sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, (max-width: 1279px) 22vw, 15vw" /> : <UserRound aria-hidden className="absolute inset-0 m-auto size-12 text-brand-400" />}
            </div>
            <h4 className="mt-3 font-manrope text-base font-semibold leading-6 text-brand-900">{person.name}</h4>
            <p className="mt-1 text-sm leading-6 text-brand-800">{person.position}</p>
          </article>)}
          </div>
        </section>)}
      </Section> : null}

      {history.length ? <Section id="ketua-sebelumnya" className="bg-highlight-50 py-10 md:py-12" contentClassName="mx-auto max-w-7xl">
        <span id="riwayat" className="sr-only" />
        <typography.h1 className="text-3xl text-brand-900 md:text-4xl">Ketua-ketua Sebelumnya</typography.h1>
        <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-8">
          {history.map((period) => <section key={period.id} className="min-w-0 border-t-2 border-highlight-300 pt-4">
            <h3 className="font-manrope text-lg font-medium tabular-nums text-brand-900 md:text-2xl">{period.label}</h3>
            <div className="mt-3 space-y-5">
              {period.members.map((person) => <div key={person.id} className="min-w-0">
                <div className="relative aspect-[3/2] overflow-hidden">
                  {person.imageUrl ? <Image src={person.imageUrl} alt={`${person.name}, ${person.position}`} fill className="object-contain object-bottom" sizes="(max-width: 1023px) 40vw, 22vw" /> : <UserRound aria-hidden className="absolute inset-0 m-auto size-8 text-brand-400" />}
                </div>
                <div className="min-w-0">
                  <h4 className="mt-3 font-manrope text-sm font-semibold leading-6 text-brand-900 md:text-base">{person.name}</h4>
                  <p className="mt-1 text-sm leading-6 text-body">{person.position}</p>
                </div>
              </div>)}
            </div>
          </section>)}
        </div>
      </Section> : null}

      {contact ? <Section id="kontak" className="bg-brand-50 py-10 md:py-12" contentClassName="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <typography.h1 className="max-w-2xl text-2xl text-brand-900 md:text-3xl">Informasi kegiatan dan kerja sama</typography.h1>
          <typography.p className="mt-3 leading-7">Hubungi pengurus PAMOKA Garut melalui {contact.kind === "email" ? "email" : "Instagram"}.</typography.p>
          <a href={contact.href} className="mt-2 inline-flex min-h-11 max-w-full items-center break-all text-base text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-400">{contact.kind === "email" ? contact.href.slice(7) : contact.label}</a>
        </div>
        <Button asChild size="lg"><a href={contact.href}>Hubungi pengurus<ArrowUpRight className="ml-2 size-4" aria-hidden /></a></Button>
      </Section> : null}
    </main>
  );
}

function AlbumPreview({ album, featured }: { album: PublicGalleryAlbum; featured: boolean }) {
  const firstVideo = album.items.find((item) => item.youtubeId)?.youtubeId;
  const imageUrl = album.coverUrl ?? (firstVideo ? `https://img.youtube.com/vi/${firstVideo}/hqdefault.jpg` : null);
  return (
    <Link href={`/galeri#${album.slug}`} className={`group flex min-w-0 flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-400 ${featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}>
      <div className={`relative overflow-hidden rounded-lg bg-brand-100 ${featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-[26rem] lg:flex-1" : "aspect-[16/9]"}`}>
        {imageUrl ? <Image src={imageUrl} alt={album.coverAlt ?? album.title} fill className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]" sizes={featured ? "(max-width: 1023px) 90vw, 55vw" : "(max-width: 639px) 90vw, 40vw"} /> : <Images className="absolute inset-0 m-auto size-8 text-brand" aria-hidden />}
      </div>
      <div className="flex items-start justify-between gap-3 text-brand-900">
        <div>
          <h3 className="font-manrope text-lg font-medium leading-7">{album.title}</h3>
          {album.description?.trim() ? <typography.p className="mt-1 leading-7">{album.description.trim()}</typography.p> : null}
          <p className="mt-2 text-sm font-medium text-brand">Lihat dokumentasi</p>
        </div>
        <ArrowRight className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
      </div>
    </Link>
  );
}

function isKetuaUmum(position: string) {
  const normalized = position.trim().toLowerCase();
  return normalized === "ketua umum" || normalized.startsWith("ketua umum ") || normalized === "ketua";
}

