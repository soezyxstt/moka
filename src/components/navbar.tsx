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
import { cn } from "@/lib/utils";

type NavbarCategory = { name: string; slug: string };
type NavbarEvent = { label: string; slug: string };
type DesktopMenuItem = { href: string; label: string };
type NavbarEdition = { year: number; logoUrl: string | null; logoAlt: string | null; slogan: string | null };

export function Navbar({
  categories,
  events,
  resultsVisible,
  edition,
}: {
  categories: NavbarCategory[];
  events: NavbarEvent[];
  resultsVisible: boolean;
  edition: NavbarEdition;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const eventItems = events
    .map((item) => ({ href: `/rangkaian-kegiatan/${item.slug}`, label: item.label }));
  const categoryItems = (page: string) => categories.map((category) => ({ href: `/${page}/${category.slug}`, label: category.name }));
  const finalistItems = categoryItems("profil-finalis");
  const resultItems = categoryItems("voting/hasil");

  const desktopLinks: Array<
    | { href: string; label: string }
    | { label: string; menu: DesktopMenuItem[]; match: string }
  > = [
    { href: "/", label: "Beranda" },
    { href: "/tentang", label: "Tentang" },
    ...(eventItems.length ? [{ label: "Rangkaian Kegiatan", menu: eventItems, match: "/rangkaian-kegiatan" }] : []),
    { href: "/voting", label: "Voting" },
    ...(finalistItems.length ? [{ label: "Profil Finalis", menu: finalistItems, match: "/profil-finalis" }] : []),
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
      if (window.matchMedia("(max-width: 768px)").matches) {
        setIsNavbarVisible(true);
        return;
      }
      const currentScrollY = window.scrollY;
      setIsNavbarVisible(currentScrollY <= 80 || currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        key={`${pathname}-navbar`}
        className="fixed left-8 right-8 top-2 z-40 hidden h-16 items-center justify-between rounded-full border border-white/15 bg-dgb-900/45 px-8 py-3 shadow-lg shadow-black/15 backdrop-blur-md backdrop-saturate-150 md:flex"
        initial={{ y: 0 }}
        animate={{ y: isNavbarVisible ? 0 : "-120%" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        aria-label="Navigasi utama"
      >
        <Link href="/" className="h-full shrink-0" aria-label={`Beranda MOKA Garut ${edition.year}`} title={edition.slogan ?? undefined}>
          {edition.logoUrl
            ? <Image src={edition.logoUrl} alt={edition.logoAlt || "MOKA Garut"} width={100} height={60} className="h-full w-auto object-contain" priority />
            : <span className="font-montserrat text-sm font-bold tracking-wide text-fb">MOKA Garut</span>}
        </Link>
        <div className="flex h-full items-center gap-3 font-montserrat lg:gap-5 xl:gap-7">
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
          <Link
            href="/admin/login"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-fb px-3 text-sm font-semibold text-fb transition-colors hover:bg-fb hover:text-dgb-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fb-200 focus-visible:ring-offset-2 focus-visible:ring-offset-dgb-900"
            aria-label="Masuk ke ruang kerja PAMOKA"
            title="Masuk"
          >
            <LogIn className="size-4" aria-hidden="true" />
            <span className="hidden lg:inline">Masuk</span>
          </Link>
        </div>
      </motion.nav>

      <nav className="fixed top-0 z-40 w-full bg-white/20 shadow-md backdrop-blur-md md:hidden" ref={ref} aria-label="Navigasi utama seluler">
        <div className="flex h-16 w-full items-center justify-between px-6">
          <Link href="/" className="h-9" aria-label={`Beranda MOKA Garut ${edition.year}`} title={edition.slogan ?? undefined}>
            {edition.logoUrl
              ? <Image src={edition.logoUrl} alt={edition.logoAlt || "MOKA Garut"} width={100} height={44} className="h-full w-auto object-contain" priority />
              : <span className="font-montserrat text-sm font-bold tracking-wide text-fb">MOKA Garut</span>}
          </Link>
          <button className="relative z-[60] flex size-9 items-center justify-center" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={isMobileMenuOpen}>
            <motion.span className="absolute h-0.5 w-6 bg-fb" animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 0 : -7 }} />
            <motion.span className="absolute h-0.5 w-5 bg-fb" animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} />
            <motion.span className="absolute h-0.5 bg-fb" animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? 0 : 7, width: isMobileMenuOpen ? 24 : 16 }} />
          </button>
        </div>
        <Accordion type="single" collapsible value={isMobileMenuOpen ? "root-navbar" : ""} onValueChange={(value) => setIsMobileMenuOpen(value === "root-navbar")}>
          <AccordionItem value="root-navbar" className="border-0">
            <AccordionContent className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-dgb-900/78 px-6 pb-6 text-white backdrop-blur-md">
              <div className="flex flex-col pt-3 font-montserrat">
                <MobileLink href="/" label="Beranda" close={() => setIsMobileMenuOpen(false)} />
                <MobileLink href="/tentang" label="Tentang" close={() => setIsMobileMenuOpen(false)} />
                {eventItems.length ? <MobileMenu label="Rangkaian Kegiatan" items={eventItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                <MobileLink href="/voting" label="Voting" close={() => setIsMobileMenuOpen(false)} />
                {finalistItems.length ? <MobileMenu label="Profil Finalis" items={finalistItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                {resultsVisible && resultItems.length ? <MobileMenu label="Hasil Voting" items={resultItems} close={() => setIsMobileMenuOpen(false)} /> : null}
                <Link
                  href="/admin/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-fb bg-fb px-4 py-2.5 text-sm font-semibold text-dgb-900 transition-colors hover:bg-fb-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-dgb-900"
                  aria-label="Masuk ke ruang kerja PAMOKA"
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  Masuk
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
    </>
  );
}

function desktopLinkClass(active: boolean) {
  return cn(
    "relative inline-flex h-full items-center whitespace-nowrap text-sm font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] transition-colors after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:rounded-full after:bg-fb after:transition-all",
    active ? "text-fb-300 after:w-5" : "text-fb after:w-0 hover:text-fb-500 hover:after:w-3",
  );
}

function DesktopNavMenu({ label, items, active }: { label: string; items: DesktopMenuItem[]; active: boolean }) {
  return (
    <div className="group relative flex h-full items-center">
      <button className={cn(desktopLinkClass(active), "gap-1")} aria-haspopup="menu">
        {label}<ChevronDown className="size-3.5 text-fb transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="rounded-xl border border-white/15 bg-dgb-900/48 p-2 text-white shadow-xl shadow-black/20 backdrop-blur-md backdrop-saturate-150" role="menu">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.17em] text-fb">Pilih halaman</p>
          <div className="space-y-0.5">
            {items.map((item) => (
              <Link key={item.href} href={item.href} role="menuitem" className="group/item flex min-h-10 items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] transition-colors hover:border-fb hover:bg-white/10 focus:border-fb focus:bg-white/10 focus:outline-none">
                {item.label}<MoveUpRight className="size-3.5 text-fb opacity-0 transition-opacity group-hover/item:opacity-100 group-focus/item:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLink({ href, label, close }: { href: string; label: string; close: () => void }) {
  return <Link href={href} onClick={close} className="border-b border-white/8 py-3 text-sm font-medium text-white/82 hover:text-white">{label}</Link>;
}

function MobileMenu({ label, items, close }: { label: string; items: DesktopMenuItem[]; close: () => void }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={label} className="border-white/8">
        <AccordionTrigger className="py-3 text-sm font-medium text-white/82 hover:text-white hover:no-underline">{label}</AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="border-l border-fb/45 pl-3">
            {items.map((item) => <Link key={item.href} href={item.href} onClick={close} className="block rounded-md px-3 py-2 text-sm text-white/68 hover:bg-white/8 hover:text-white">{item.label}</Link>)}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
