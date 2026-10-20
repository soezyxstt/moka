"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronRight, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminScrollArea, adminNativeScrollbarClassName } from "./admin-scroll-area";
import { AdminIcon, type AdminIconName } from "./icons";
import { AdminEditionSelector } from "./edition-selector";
import type { AdminEditionContext } from "@/server/cms/context";
import { useAdminBranding, type AdminBranding } from "./branding";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminIconName;
  group: string;
  exact?: boolean;
};

export type AdminUser = { name: string; email: string };

const CONTENT_NAV_STORAGE_KEY = "pamoka_admin_nav_content_open";

const isContentPath = (value: string) =>
  value.startsWith("/admin/content") && value !== "/admin/content/editions";

const contentNavigationFallbacks = new WeakMap<Window, boolean>();

const contentNavigationStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    contentNavigationStore.listeners.add(listener);
    if (typeof window === "undefined") return () => contentNavigationStore.listeners.delete(listener);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONTENT_NAV_STORAGE_KEY || event.key === null) listener();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      contentNavigationStore.listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  },
  getSnapshot() {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(CONTENT_NAV_STORAGE_KEY);
      return stored !== null ? stored === "true" : contentNavigationFallbacks.get(window) ?? true;
    } catch {
      return contentNavigationFallbacks.get(window) ?? true;
    }
  },
  getServerSnapshot() {
    return true;
  },
  setOpen(isOpen: boolean) {
    if (typeof window !== "undefined") {
      contentNavigationFallbacks.set(window, isOpen);
      try {
        window.localStorage.setItem(CONTENT_NAV_STORAGE_KEY, String(isOpen));
      } catch {
        // Persistence is optional; the in-memory value keeps navigation usable.
      }
    }
    contentNavigationStore.listeners.forEach((listener) => listener());
  },
};

export function AdminShell({
  branding: editionBranding,
  children,
  links,
  user,
  currentEdition,
  allEditions = [],
}: {
  branding?: AdminBranding;
  children: React.ReactNode;
  links: AdminNavItem[];
  user: AdminUser;
  currentEdition: AdminEditionContext | null;
  allEditions?: AdminEditionContext[];
}) {
  const publicBranding = useAdminBranding();
  const branding = editionBranding ?? publicBranding;
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isContentOpen = useSyncExternalStore(
    contentNavigationStore.subscribe,
    contentNavigationStore.getSnapshot,
    contentNavigationStore.getServerSnapshot,
  );
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const wasContentPath = isContentPath(previousPathnameRef.current);
    const isCurrentContentPath = isContentPath(pathname);

    if (isCurrentContentPath && !wasContentPath) {
      contentNavigationStore.setOpen(true);
    }

    previousPathnameRef.current = pathname;
  }, [pathname]);

  const handleToggleContent = () => {
    contentNavigationStore.setOpen(!isContentOpen);
  };

  const groups = [...new Set(links.map((link) => link.group))];
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (item: AdminNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const renderNavGroup = (group: string) => {
    const groupLinks = links.filter((link) => link.group === group);
    if (groupLinks.length === 0) return null;

    if (group === "Konten") {
      return (
        <div key={group} className="space-y-1">
          <Button
            type="button"
            onClick={handleToggleContent}
            aria-expanded={isContentOpen}
            variant="ghost"
            size="sm"
            className="flex h-auto w-full justify-between rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-brand-50 hover:text-brand"
          >
            <span>{group}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {isContentOpen ? (
                <ChevronDown size={14} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={14} className="text-muted-foreground" />
              )}
            </span>
          </Button>
          {isContentOpen ? (
            <div className="space-y-1 pt-1">
              {groupLinks.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                      active
                        ? "bg-brand text-canvas font-semibold"
                        : "text-brand-800 hover:bg-brand-50 hover:text-brand",
                    )}
                  >
                    <AdminIcon name={item.icon} size={15} strokeWidth={1.8} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active ? <span className="size-1.5 bg-highlight" aria-hidden="true" /> : null}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div key={group}>
        <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
          {group}
        </p>
        <div className="space-y-1">
          {groupLinks.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                  active
                    ? "bg-brand text-canvas"
                    : "text-brand-800 hover:bg-brand-50 hover:text-brand",
                )}
              >
                <AdminIcon name={item.icon} size={16} strokeWidth={1.8} />
                <span className="flex-1 truncate">{item.label}</span>
                {active ? <span className="size-1.5 bg-highlight" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const navigation = (
    <nav className="space-y-5" aria-label="Navigasi admin">
      {groups.map(renderNavGroup)}
    </nav>
  );

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <div className="relative h-screen h-dvh overflow-hidden bg-background text-foreground lg:flex" data-lenis-prevent>
        <aside className="relative hidden w-64 shrink-0 overflow-hidden border-r border-brand-100 bg-card lg:flex lg:h-full lg:flex-col" data-lenis-prevent>
          <div className="flex h-20 shrink-0 items-center border-b border-brand-100 px-5">
            <Link href="/admin" className="flex items-center gap-3" aria-label="Dashboard PAMOKA CMS">
              {branding.logo ? <Image src={branding.logo.url} unoptimized alt={branding.logo.alt || branding.title} width={150} height={57} className="h-auto w-36 object-contain" /> : <span className="font-manrope font-semibold text-brand-900">{branding.title}</span>}
            </Link>
          </div>
          <AdminScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-5">{navigation}</div>
          </AdminScrollArea>
          <div className="relative border-t border-brand-100 p-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-brand transition-colors hover:bg-brand-50"
            >
              Lihat situs publik <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>

        <SheetContent
          side="left"
          className="w-[min(86vw,19rem)] gap-0 overflow-hidden border-brand-100 bg-card p-0 text-foreground sm:max-w-[19rem]"
          data-lenis-prevent
        >
          <SheetTitle className="sr-only">Navigasi admin PAMOKA CMS</SheetTitle>
          <SheetDescription className="sr-only">Menu ruang kerja admin PAMOKA.</SheetDescription>
          <div className="flex h-20 shrink-0 items-center border-b border-brand-100 px-5 pr-14">
            <Link href="/admin" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3" aria-label="Dashboard PAMOKA CMS">
              {branding.logo ? <Image src={branding.logo.url} unoptimized alt={branding.logo.alt || branding.title} width={150} height={57} className="h-auto w-36 object-contain" /> : <span className="font-manrope font-semibold text-brand-900">{branding.title}</span>}
            </Link>
          </div>
          <AdminScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-5">{navigation}</div>
          </AdminScrollArea>
        </SheetContent>

        <div className={cn("relative h-full min-w-0 flex-1 overflow-y-auto", adminNativeScrollbarClassName)} data-lenis-prevent>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-brand-100 bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6 lg:px-8">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-ml-1.5 size-9 shrink-0 text-brand-900 shadow-none hover:bg-brand-50 hover:text-brand lg:hidden"
                  aria-label="Buka navigasi"
                  aria-expanded={isMobileOpen}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                <span className="font-manrope font-semibold text-brand-900">Admin</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
              <AdminEditionSelector
                currentEdition={currentEdition}
                editions={allEditions}
              />

              <Link
                href="/admin/profile"
                className="flex shrink-0 items-center gap-2.5 rounded-md p-0.5 transition-colors hover:bg-brand-100/50 sm:p-1"
                aria-label={`Profil ${user.name}`}
              >
                <div className="hidden text-right lg:block">
                  <p className="text-xs font-semibold leading-tight text-brand-900">{user.name}</p>
                  <p className="max-w-[160px] truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="grid size-8 place-items-center rounded-md bg-brand text-xs font-semibold text-canvas sm:size-9">
                  {initials || "A"}
                </div>
              </Link>
            </div>
          </header>
          {children}
        </div>
      </div>
    </Sheet>
  );
}

export function AdminAuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  const branding = useAdminBranding();
  return (
    <main className="grid min-h-svh bg-background text-foreground lg:grid-cols-2" data-lenis-prevent>
      <section className="flex min-w-0 flex-col px-6 py-6 sm:px-12 sm:py-10 lg:px-16">
        <Link href="/" className="w-fit" aria-label="Beranda PAMOKA Garut">
          {branding.logo ? <Image src={branding.logo.url} unoptimized alt={branding.logo.alt || branding.title} width={190} height={72} className="h-auto w-36 object-contain sm:w-44" /> : <span className="font-manrope text-xl font-semibold text-brand-900">{branding.title}</span>}
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16 lg:py-12">
          <h1 className="font-manrope !text-3xl font-semibold leading-tight tracking-tight text-brand-900 sm:!text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
        <Button asChild variant="link" className="w-fit px-0 text-sm text-brand hover:text-brand-700">
          <Link href="/"><ArrowLeft className="size-4" /> Kembali ke situs</Link>
        </Button>
      </section>
      <aside className="relative m-4 ml-0 hidden overflow-hidden rounded-xl bg-brand-900 lg:block" aria-label="PAMOKA Garut">
        {branding.background ? <Image src={branding.background} alt="" fill sizes="50vw" className="object-cover" preload /> : null}
        <div className="absolute inset-0 bg-linear-to-t from-brand-900 via-brand-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16">
          {branding.slogan ? <p className="max-w-lg font-manrope text-4xl font-semibold leading-tight text-canvas xl:text-5xl">{branding.slogan}</p> : null}
          <p className="mt-5 text-sm text-canvas/80">{branding.title}</p>
        </div>
      </aside>
    </main>
  );
}
