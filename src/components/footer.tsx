import { Instagram, Youtube, Mail, MoveUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';
import type { ReactNode } from 'react';
import type { SiteContact } from '@/server/cms/site-copy';
import type { BrandLogo } from '@/server/cms/brand-assets';

export type FooterCategory = { slug: string; name: string };
export type FooterEvent = { slug: string; label: string };
export type FooterEdition = { year: number; logoUrl: string | null; logoAlt: string | null; slogan: string | null };

const CATEGORY_LABELS: Record<string, string> = {
  jd: 'Jajaka Dewasa',
  md: 'Mojang Dewasa',
  jr: 'Jajaka Remaja',
  mr: 'Mojang Remaja',
  jg: 'Jajaka Garut',
  mg: 'Mojang Garut',
  'jajaka-dewasa': 'Jajaka Dewasa',
  'mojang-dewasa': 'Mojang Dewasa',
  'jajaka-remaja': 'Jajaka Remaja',
  'jajaka-rumaja': 'Jajaka Remaja',
  'mojang-remaja': 'Mojang Remaja',
  'mojang-rumaja': 'Mojang Remaja',
};

export function formatCategoryName(category: FooterCategory): string {
  const byName = CATEGORY_LABELS[category.name.trim().toLowerCase()];
  if (byName) return byName;
  const bySlug = CATEGORY_LABELS[category.slug.trim().toLowerCase()];
  if (bySlug) return bySlug;
  return category.name;
}

export default function Footer({ categories, events, edition, logo, aboutDescription, contacts, signature, participantKind, registrationVisible = false }: {
  participantKind: 'semifinalis' | 'finalis';
  registrationVisible?: boolean;
  logo?: BrandLogo;
  contacts: SiteContact[];
  signature: string;
  categories: FooterCategory[];
  events: FooterEvent[];
  edition: FooterEdition;
  aboutDescription: string | null;
  resultsVisible?: boolean;
}) {
  const instagramHref = contacts.find((contact) => contact.kind === 'instagram')?.href ?? 'https://www.instagram.com/mokagarut';
  const otherContacts = contacts.filter((contact) => contact.kind !== 'instagram');

  return (
    <footer className="relative w-full overflow-hidden bg-linear-to-br from-brand-600 to-highlight-700 text-canvas">
      <div className="pointer-events-none absolute inset-0 bg-brand-900/24" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-highlight-400/60 to-transparent" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:px-12 md:py-12 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <div>
          {logo?.url || edition.logoUrl
            ? <Image src={logo?.url || edition.logoUrl!} alt={logo?.alt || edition.logoAlt || "MOKA Garut"} unoptimized={logo?.mimeType === "image/svg+xml"} width={320} height={120} className="h-auto w-full max-w-56 object-contain object-left" />
            : <p className="font-manrope text-2xl font-bold tracking-wide">MOKA Garut</p>}
          {edition.slogan ? <p className="mt-4 max-w-xs text-sm leading-6 text-canvas/82">{edition.slogan}</p> : null}
          {aboutDescription ? <p className="mt-3 max-w-md text-sm leading-6 text-canvas/85">{aboutDescription}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-canvas">
            <Link
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram resmi @mokagarut"
              className="inline-flex h-10 items-center gap-2.5 rounded-md border border-canvas/20 bg-canvas/10 px-3.5 text-sm font-medium text-canvas transition-colors hover:border-highlight-300/70 hover:bg-canvas/16"
            >
              <Instagram className="size-4 shrink-0 text-highlight-300" aria-hidden="true" />
              <span>@mokagarut</span>
            </Link>
            {otherContacts.map((contact) => (
              <SocialLink key={contact.kind} href={contact.href} label={contact.label}>
                {contact.kind === 'youtube' ? <Youtube className="size-4" /> : <Mail className="size-4" />}
              </SocialLink>
            ))}
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3" aria-label="Navigasi footer">
          <div className="col-span-2 sm:col-span-1">
            <h2 className="mb-3 font-manrope text-sm font-semibold text-canvas">Jelajahi</h2>
            <div className="flex flex-wrap gap-x-6 sm:block">
              <FooterLink href="/tentang">Tentang</FooterLink>
              {registrationVisible ? <FooterLink href="/pendaftaran">Pendaftaran</FooterLink> : null}
              <FooterLink href="/voting">Voting</FooterLink>
              <FooterLink href="/galeri">Galeri</FooterLink>
            </div>
          </div>
          {events.length ? <div>
            <h2 className="mb-3 font-manrope text-sm font-semibold text-canvas">Rangkaian kegiatan</h2>
            {events.map((event) => <FooterLink key={`event-${event.slug}`} href={`/rangkaian-kegiatan/${event.slug}`}>{event.label}</FooterLink>)}
          </div> : null}
          {categories.length ? <div>
            <h2 className="mb-3 font-manrope text-sm font-semibold text-canvas">{participantKind === 'semifinalis' ? 'Profil semifinalis' : 'Profil finalis'}</h2>
            {categories.map((category) => <FooterLink key={`participant-${category.slug}`} href={`/profil-${participantKind}/${category.slug}`}>{formatCategoryName(category)}</FooterLink>)}
          </div> : null}
        </nav>
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-5 font-inter md:px-12">
        <Separator className="bg-canvas/16" />
        <div className="flex flex-col gap-2 pt-4 text-[11px] text-canvas/75 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © PAMOKA Garut {edition.year}</p>
          {signature ? <p>{signature}</p> : null}
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return <Link href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-md border border-canvas/18 bg-canvas/7 text-canvas/80 transition-colors hover:border-highlight-300/60 hover:bg-canvas/12 hover:text-canvas">{children}</Link>;
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="group flex min-h-11 items-center justify-between gap-2 py-2 text-sm text-canvas/85 transition-colors hover:text-canvas focus-visible:text-canvas">{children}<MoveUpRight className="size-3.5 shrink-0 text-highlight-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></Link>;
}
