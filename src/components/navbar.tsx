"use client";

import { ChevronDown, LogIn, MoveUpRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BrandLogo } from "@/server/cms/brand-assets";

type NavbarCategory = { name: string; slug: string };
type NavbarEvent = { label: string; slug: string };
type DesktopMenuItem = { href: string; label: string };
type NavbarEdition = { year: number; logoUrl: string | null; logoAlt: string | null; slogan: string | null };

export function Navbar({
  categories,
  events,
  resultsVisible,
  edition,
  desktopLogo,
  mobileLogo,
  participantKind,
  registrationVisible = false,
}: {
  categories: NavbarCategory[];
  events: NavbarEvent[];
  resultsVisible: boolean;
  edition: NavbarEdition;
  desktopLogo?: BrandLogo;
  mobileLogo?: BrandLogo;
  participantKind: 'semifinalis' | 'finalis';
  registrationVisible?: boolean;
}) {
  const pathname = usePathname();
  const user = authClient.useSession().data?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const eventItems = events
    .map((item) => ({ href: `/rangkaian-kegiatan/${item.slug}`, label: item.label }));
  const categoryItems = (page: string) => categories.map((category) => ({ href: `/${page}/${category.slug}`, label: category.name }));
  const participantItems = categoryItems(`profil-${participantKind}`);
  const participantLabel = participantKind === 'semifinalis' ? 'Profil Semifinalis' : 'Profil Finalis';
  const resultItems = categoryItems("voting/hasil");

  const desktopLinks: Array<
    | { href: string; label: string }
    | { label: string; menu: DesktopMenuItem[]; match: string }
  > = [
    { href: "/", label: "Beranda" },
    { href: "/tentang", label: "Tentang" },
    ...(registrationVisible ? [{ href: "/pendaftaran", label: "Pendaftaran" }] : []),
    ...(eventItems.length ? [{ label: "Rangkaian Kegiatan", menu: eventItems, match: "/rangkaian-kegiatan" }] : []),
    { href: "/voting", label: "Voting" },
    ...(participantItems.length ? [{ label: participantLabel, menu: participantItems, match: `/profil-${participantKind}` }] : []),
    ...(resultsVisible && resultItems.length ? [{ label: "Hasil Voting", menu: resultItems, match: "/voting/hasil" }] : []),
  ];

  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref as RefObject<HTMLDivElement>, () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.matchMedia(registrationVisible ? "(max-width: 1279px)" : "(max-width: 767px)").matches) {
        setIsNavbarVisible(true);
        return;
      }
      const currentScrollY = window.scrollY;
      setIsNavbarVisible(currentScrollY <= 80 || currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [registrationVisible]);

  return (
    <>
      <motion.nav
        key={`${pathname}-navbar`}
        className={cn("fixed left-8 right-8 top-2 z-40 hidden h-16 items-center justify-between rounded-full border border-canvas/15 bg-brand-900/85 px-8 py-3 shadow-lg shadow-ink/15 backdrop-blur-md backdrop-saturate-150", registrationVisible ? "xl:flex" : "md:flex")}
        initial={{ y: 0 }}
        animate={{ y: isNavbarVisible ? 0 : "-120%" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        aria-label="Navigasi utama"
      >
        <Link href="/" className="h-full shrink-0" aria-label={`Beranda MOKA Garut ${edition.year}`} title={edition.slogan ?? undefined}>
          {desktopLogo?.url || edition.logoUrl
            ? <Image src={desktopLogo?.url || edition.logoUrl!} alt={desktopLogo?.alt || edition.logoAlt || "MOKA Garut"} unoptimized={desktopLogo?.mimeType === "image/svg+xml"} width={100} height={60} className="h-full w-auto object-contain" priority />
            : <span className="font-manrope text-sm font-bold tracking-wide text-highlight">MOKA Garut</span>}
        </Link>
        <div className="flex h-full items-center gap-3 font-inter lg:gap-5 xl:gap-7">
          {desktopLinks.map((link) => {
            if ("menu" in link) {
              return <DesktopNavMenu key={link.label} label={link.label} items={link.menu} active={pathname.startsWith(link.match)} />;
            }
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.label} href={link.href} className={desktopLinkClass(active)} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <Link
              href="/admin"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-highlight/40 py-1 pl-1 pr-3 text-sm font-semibold text-highlight transition-colors hover:border-highlight hover:bg-canvas/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-200 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
              aria-label={`Buka admin sebagai ${user.name}`}
              title={user.name}
            >
              <UserAvatar name={user.name} image={user.image} />
              <span className="hidden max-w-24 truncate lg:inline">{user.name}</span>
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-highlight px-3 text-sm font-semibold text-highlight transition-colors hover:bg-highlight hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-200 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
              aria-label="Masuk ke ruang kerja PAMOKA"
              title="Masuk"
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span className="hidden lg:inline">Masuk</span>
            </Link>
          )}
        </div>
      </motion.nav>

      <nav className={cn("fixed top-0 z-40 w-full bg-(--nav-mobile-surface) shadow-md backdrop-blur-md", registrationVisible ? "xl:hidden" : "md:hidden")} ref={ref} aria-label="Navigasi utama seluler">
        <div className="flex h-16 w-full items-center justify-between px-6">
          <Link href="/" className="h-9" aria-label={`Beranda MOKA Garut ${edition.year}`} title={edition.slogan ?? undefined}>
            {mobileLogo?.url || edition.logoUrl
              ? <Image src={mobileLogo?.url || edition.logoUrl!} alt={mobileLogo?.alt || edition.logoAlt || "MOKA Garut"} unoptimized={mobileLogo?.mimeType === "image/svg+xml"} width={100} height={44} className="h-full w-auto object-contain" priority />
              : <span className="font-manrope text-sm font-bold tracking-wide text-(--nav-mobile-control)">MOKA Garut</span>}
          </Link>
          <Button type="button" variant="ghost" size="icon" className="relative z-[60] flex size-9 items-center justify-center hover:bg-canvas/10" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-navbar-content">
            <motion.span className="absolute h-0.5 w-6 bg-(--nav-mobile-control)" animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 0 : -7 }} />
            <motion.span className="absolute h-0.5 w-5 bg-(--nav-mobile-control)" animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} />
            <motion.span className="absolute h-0.5 bg-(--nav-mobile-control)" animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? 0 : 7, width: isMobileMenuOpen ? 24 : 16 }} />
          </Button>
        </div>
        <Accordion type="single" collapsible value={isMobileMenuOpen ? "root-navbar" : ""} onValueChange={(value) => setIsMobileMenuOpen(value === "root-navbar")}>
          <AccordionItem value="root-navbar" className="border-0">
            <AccordionContent id="mobile-navbar-content" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-canvas/10 bg-brand-900/78 px-6 pb-6 text-canvas backdrop-blur-md">
              <div className="flex flex-col pt-3 font-inter">
                <MobileLink href="/" label="Beranda" close={() => setIsMobileMenuOpen(false)} />
                <MobileLink href="/tentang" label="Tentang" close={() => setIsMobileMenuOpen(false)} />
                {registrationVisible ? <MobileLink href="/pendaftaran" label="Pendaftaran" close={() => setIsMobileMenuOpen(false)} /> : null}
                {eventItems.length ? <MobileMenu label="Rangkaian Kegiatan" items={eventItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                <MobileLink href="/voting" label="Voting" close={() => setIsMobileMenuOpen(false)} />
                {participantItems.length ? <MobileMenu label={participantLabel} items={participantItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                {resultsVisible && resultItems.length ? <MobileMenu label="Hasil Voting" items={resultItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                {user ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mt-4 inline-flex min-h-11 items-center gap-3 rounded-md border border-highlight/40 px-3 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-canvas/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
                    aria-label={`Buka admin sebagai ${user.name}`}
                  >
                    <UserAvatar name={user.name} image={user.image} />
                    <span className="min-w-0 truncate">{user.name}</span>
                  </Link>
                ) : (
                  <Link
                    href="/admin/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-highlight bg-highlight px-4 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-highlight-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
                    aria-label="Masuk ke ruang kerja PAMOKA"
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    Masuk
                  </Link>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
    </>
  );
}

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return image
    ? <Image src={image} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full object-cover" />
    : <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-highlight font-manrope text-xs font-bold text-brand-900">{initials}</span>;
}

function desktopLinkClass(active: boolean) {
  return cn(
    "relative inline-flex h-full items-center whitespace-nowrap text-sm font-medium drop-shadow-(--nav-text-shadow) transition-colors after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:rounded-full after:bg-highlight after:transition-all",
    active ? "text-highlight-300 after:w-5" : "text-highlight after:w-0 hover:text-highlight-500 hover:after:w-3",
  );
}

function DesktopNavMenu({ label, items, active }: { label: string; items: DesktopMenuItem[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={cn(desktopLinkClass(active), "gap-1 px-0 hover:bg-transparent", "data-[state=open]:text-highlight-300")}>
          {label}<ChevronDown aria-hidden="true" className={cn("size-3.5 text-highlight transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={12} className="w-72 rounded-xl border-canvas/15 bg-brand-900/48 p-2 font-inter text-canvas shadow-xl shadow-ink/20 backdrop-blur-md backdrop-saturate-150" aria-label={label}>
          <div className="space-y-0.5">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="group/item flex min-h-10 items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm font-medium text-canvas drop-shadow-(--nav-text-shadow) transition-colors hover:border-highlight hover:bg-canvas/10 focus:border-highlight focus:bg-canvas/10 focus:outline-none">
                {item.label}<MoveUpRight className="size-3.5 text-highlight opacity-0 transition-opacity group-hover/item:opacity-100 group-focus/item:opacity-100" />
              </Link>
            ))}
          </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileLink({ href, label, close }: { href: string; label: string; close: () => void }) {
  return <Link href={href} onClick={close} className="border-b border-canvas/8 py-3 text-sm font-medium text-canvas/82 hover:text-canvas">{label}</Link>;
}

function MobileMenu({ label, items, close }: { label: string; items: DesktopMenuItem[]; close: () => void }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={label} className="border-canvas/8">
        <AccordionTrigger className="py-3 text-sm font-medium text-canvas/82 hover:text-canvas hover:no-underline">{label}</AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="border-l border-highlight/45 pl-3">
            {items.map((item) => <Link key={item.href} href={item.href} onClick={close} className="block rounded-md px-3 py-2 text-sm text-canvas/68 hover:bg-canvas/8 hover:text-canvas">{item.label}</Link>)}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
