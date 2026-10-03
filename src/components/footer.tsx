import { Instagram, Youtube, Mail, MoveUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';
import type { ReactNode } from 'react';

export type FooterCategory = { slug: string; name: string };
export type FooterEvent = { slug: string; label: string };
export type FooterEdition = { year: number; logoUrl: string | null; logoAlt: string | null; slogan: string | null };

export default function Footer({ categories, events, edition, aboutDescription, resultsVisible }: {
  categories: FooterCategory[];
  events: FooterEvent[];
  edition: FooterEdition;
  aboutDescription: string | null;
  resultsVisible: boolean;
}) {
  return (
    <footer className="relative w-full overflow-hidden bg-linear-to-br from-dgb to-fb text-white">
      <div className="pointer-events-none absolute inset-0 bg-dgb-900/24" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-fb-400/60 to-transparent" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[0.85fr_1.2fr_0.55fr] md:px-12 md:py-16">
        <div>
          {edition.logoUrl
            ? <Image src={edition.logoUrl} alt={edition.logoAlt || "MOKA Garut"} width={320} height={120} className="h-auto w-full max-w-72 object-contain object-left" />
            : <p className="font-montserrat text-2xl font-bold tracking-wide">MOKA Garut</p>}
          {edition.slogan ? <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">{edition.slogan}</p> : null}
          <div className="mt-6 flex gap-2 text-white">
            <SocialLink href="https://www.instagram.com/mokagarut/" label="Instagram MOKA Garut"><Instagram className="size-4" /></SocialLink>
            <SocialLink href="https://www.youtube.com/@mokagarut" label="YouTube MOKA Garut"><Youtube className="size-4" /></SocialLink>
            <SocialLink href="mailto:mojangjajakagrt@gmail.com" label="Email MOKA Garut"><Mail className="size-4" /></SocialLink>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fb-300">Tentang kami</p>
          <h2 className="mt-3 font-montserrat text-xl font-semibold">PAMOKA Garut</h2>
          {aboutDescription ? <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">{aboutDescription}</p> : null}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fb-300">Jelajahi</p>
          <nav className="mt-3 flex flex-col" aria-label="Navigasi footer">
            <FooterLink href="/tentang">Tentang</FooterLink>
            <FooterLink href="/galeri">Galeri</FooterLink>
            {events.map((event) => <FooterLink key={`event-${event.slug}`} href={`/rangkaian-kegiatan/${event.slug}`}>{event.label}</FooterLink>)}
            {categories.map((category) => <FooterLink key={`finalis-${category.slug}`} href={`/profil-finalis/${category.slug}`}>Profil finalis {category.name}</FooterLink>)}
            {resultsVisible ? categories.map((category) => <FooterLink key={`hasil-${category.slug}`} href={`/voting/hasil/${category.slug}`}>Hasil voting {category.name}</FooterLink>) : null}
          </nav>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-5 font-montserrat md:px-12">
        <Separator className="bg-white/16" />
        <div className="flex flex-col gap-2 pt-4 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © PAMOKA Garut {edition.year}</p>
          <p>@mokagarut · #nyundaturnyakola</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return <Link href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-md border border-white/18 bg-white/7 text-white/80 transition-colors hover:border-fb-300/60 hover:bg-white/12 hover:text-white">{children}</Link>;
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="group flex items-center justify-between border-b border-white/10 py-2.5 text-sm text-white/70 transition-colors hover:text-white">{children}<MoveUpRight className="size-3.5 text-fb-300 opacity-0 transition-opacity group-hover:opacity-100" /></Link>;
}
