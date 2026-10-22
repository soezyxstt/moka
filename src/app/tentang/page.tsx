import { ArrowRight, ArrowUpRight, FileText, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { registrationRows } from "@/server/cms/registration";
import { Section } from "@/components/custom/section";
import { Button } from "@/components/custom/button";
import { typography } from "@/components/custom/typography";
import { getPublicAboutContent, getPublicHomeContent, getPublicSiteIdentity } from "@/server/cms/public-readers";

export const metadata = { title: "Tentang Kami", alternates: { canonical: '/tentang' } };

export default async function AboutUs() {
  const [about, site, home] = await Promise.all([getPublicAboutContent(), getPublicSiteIdentity(), getPublicHomeContent()]);
  const theme = home.sections.ajakan;
  const themeTitle = theme?.title?.trim();
  const themeCards = themeTitle ? resolvePhilosophyCards(themeTitle, theme.body) : [];
  const themeAction = theme?.actionLabel && theme.actionHref ? { label: theme.actionLabel, href: theme.actionHref } : null;
  const roles = registrationRows(about.sections.peran?.body);
  const values = registrationRows(about.sections.nilai?.body);
  const contact = site.contacts.find((item) => item.kind === "email") ?? site.contacts.find((item) => item.kind === "instagram");
  const { hero, visi, misi, legalitas, organisasi } = about.sections;
  const heroImage = about.assets["about.hero.bg"];
  const introImage = about.assets["about.vision.image"] ?? about.assets["about.intro.image"] ?? heroImage;
  const history = about.history
    .map((period) => ({
      ...period,
      members: period.members.filter((person) => isKetuaUmum(person.position)),
    }))
    .filter((period) => period.members.length > 0);
  const hasHero = Boolean(hero?.title?.trim() || hero?.body?.trim() || heroImage || introImage);
  const hasVision = Boolean(visi?.title?.trim() || about.vision);
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
      {hasHero ? <Section className="overflow-hidden bg-brand-50 pb-10 pt-28 md:pb-14 md:pt-40" >
        <div className={`relative mx-auto grid w-full max-w-7xl items-center gap-8 lg:gap-12 ${introImage ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}>
          <div>
            {hero?.title?.trim() ? <h1 className="max-w-3xl font-manrope text-4xl font-semibold leading-[1.1] text-brand-900 sm:text-5xl lg:text-6xl">{hero.title.trim() === "Kenali Kami Lebih Dekat" ? "PAMOKA Garut" : hero.title.trim()}</h1> : null}
            {hero?.body?.trim() ? <typography.p className="mt-4 max-w-2xl leading-7">{hero.body.trim()}</typography.p> : hero?.title?.trim() === "Kenali Kami Lebih Dekat" && about.mission.length ? <typography.p className="mt-4 max-w-2xl leading-7">Wadah pengembangan diri generasi muda Garut melalui budaya, kepemimpinan, dan kegiatan bersama.</typography.p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span id="program" className="sr-only" /><span id="gallery" className="sr-only" />
              <Button asChild size="lg"><Link href="/#program">Lihat program kami<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button>
              {contact ? <a href="#kontak" className="inline-flex min-h-11 items-center text-base text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Hubungi pengurus</a> : null}
            </div>
          </div>
          {introImage ? <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
            <Image src={introImage.url} alt={introImage.alt ?? ""} fill preload className="object-cover" sizes="(max-width: 1023px) 90vw, 45vw" />
          </div> : null}
        </div>
      </Section> : null}

      {roles.length ? <Section className="border-b border-neutral-200/70 bg-background" contentClassName="mx-auto max-w-7xl"><typography.h1 className="text-brand-900">{about.sections.peran.title}</typography.h1><div className="mt-8 grid gap-8 md:grid-cols-3">{roles.map((item) => <div key={item.label} className="border-t border-neutral-200 pt-4"><h3 className="font-manrope text-xl font-semibold text-brand-900">{item.label}</h3><typography.p className="mt-3 max-w-prose">{item.title}</typography.p></div>)}</div></Section> : null}
      {hasVision || hasMission ? <Section id="visi-misi" className="bg-brand-50 py-10 md:py-12" contentClassName="mx-auto max-w-7xl">
        {hasVision ? <div className={`grid items-center gap-6 lg:gap-12 `}>
          <div className="min-w-0">
            {visi?.title?.trim() ? <typography.h1 className="text-2xl text-brand-900 md:text-3xl">{visi.title.trim()}</typography.h1> : null}
            {about.vision ? <typography.p className="mt-4 max-w-3xl text-xl font-medium leading-8 text-brand-800 md:text-2xl md:leading-9">{about.vision}</typography.p> : null}
          </div>

        </div> : null}

        {hasMission ? <div className={hasVision ? "mt-8 md:mt-10" : ""}>
          {misi?.title?.trim() ? <typography.h1 className="mb-5 text-2xl text-brand-900 md:text-3xl">{misi.title.trim()}</typography.h1> : null}
          <ul className="grid gap-x-10 lg:grid-cols-2">
            {about.mission.map((item, index) => <li key={`${index}-${item}`} className="border-t border-brand-200 py-4 lg:last:odd:col-span-2">
              <typography.p className="min-w-0 leading-7">{item}</typography.p>
            </li>)}
          </ul>
        </div> : null}
      </Section> : null}

      {values.length || themeTitle ? <Section id="filosofi-tema" className="border-b border-neutral-200/70 bg-background" contentClassName="mx-auto max-w-7xl">
        <typography.h1 className="text-brand-900">{about.sections.nilai?.title || "Nu Nyunda Tur Nyakola"}</typography.h1>
        <div className={`mt-8 grid gap-10 lg:gap-16 ${themeTitle && values.length ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
          {themeTitle ? <div>
            <h3 className="font-manrope text-2xl font-semibold text-brand-900 md:text-3xl">{themeTitle}</h3>
            {theme.body?.trim() ? <typography.p className="mt-4 max-w-prose">{theme.body.trim()}</typography.p> : null}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {themeCards.map((card) => <div key={card.title} className="border-t border-neutral-200 pt-4">
                <h4 className="font-manrope text-lg font-semibold text-brand-900">{card.title}</h4>
                <typography.p className="mt-2 text-sm">{card.description}</typography.p>
              </div>)}
            </div>
            {themeAction ? <Button asChild className="mt-6"><Link href={themeAction.href} target={/^https?:\/\//i.test(themeAction.href) ? "_blank" : undefined} rel={/^https?:\/\//i.test(themeAction.href) ? "noopener noreferrer" : undefined}>{themeAction.label}<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button> : null}
          </div> : null}
          {values.length ? <div className="divide-y divide-neutral-200 border-y border-neutral-200">{values.map((item) => <div key={item.label} className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr]"><h3 className="font-manrope text-lg font-semibold text-brand-900">{item.label}</h3><typography.p>{item.title}</typography.p></div>)}</div> : null}
        </div>
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
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linear-to-t from-brand-200/70 to-brand-50">
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
        <typography.h1 className="text-3xl text-brand-900 md:text-4xl">Ketua terdahulu</typography.h1>
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

function isKetuaUmum(position: string) {
  const normalized = position.trim().toLowerCase();
  return normalized === "ketua umum" || normalized.startsWith("ketua umum ") || normalized === "ketua";
}


function resolvePhilosophyCards(title: string | null | undefined, body: string | null | undefined) {
  const parts = (title ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const firstTitle = parts[0] || 'Niti Harti';
  const secondTitle = parts[1] || 'Nanjeur Bukti';
  const isNitiHarti = /niti\s+harti|nanjeur\s+bukti/i.test(title ?? "");

  if (isNitiHarti) {
    return [
      {
        title: firstTitle,
        description:
          'Mengenal nilai budaya dan memperdalam pengetahuan sebagai dasar bersikap.',
      },
      {
        title: secondTitle,
        description:
          'Menunjukkan sikap, karya, dan kontribusi yang berguna bagi Garut.',
      },
    ];
  }

  const sentences = (body ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return [
    {
      title: firstTitle,
      description:
        sentences[0] ||
        'Menjaga jati diri generasi muda Kabupaten Garut yang berwawasan luas, berbudaya, dan berdaya saing.',
    },
    {
      title: secondTitle,
      description:
        sentences.slice(1).join(' ') ||
        'Mewujudkan gagasan menjadi aksi kolaboratif yang memberi manfaat nyata bagi pariwisata, budaya, dan masyarakat.',
    },
  ];
}

