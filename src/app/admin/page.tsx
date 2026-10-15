import { and, count, desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminIcon, type AdminIconName } from "@/components/admin/icons";
import {
  AdminCard,
  AdminCardHeader,
  AdminLinkButton,
  AdminListRow,
  AdminPage,
  AdminStatCard,
} from "@/components/admin/primitives";
import { getAdminEditionContext } from "@/server/cms/context";
import { SITE_ASSET_SLOTS } from "@/server/cms/site-asset-manifest";
import {
  ensurePendingAdminProfile,
  getEffectivePermissions,
} from "@/server/auth/authorization";
import type { PermissionKey } from "@/server/auth/permissions";
import { auth } from "@/server/auth/config";
import { database } from "@/server/db/client";
import {
  auditLogs,
  committeeAssignments,
  editionPrograms,
  editions,
  events,
  galleries,
  newsArticles,
  organizationPeriods,
  participants,
  siteAssetBindings,
  sponsors,
  votingCampaigns,
} from "@/server/db/schema";

export const metadata = { title: "Ringkasan admin" };

const quickActions: Array<{
  href: string;
  label: string;
  description: string;
  icon: AdminIconName;
  permission: PermissionKey;
}> = [
  {
    href: "/admin/content/editions",
    label: "Kelola edisi",
    description: "Atur periode, kategori, dan aktivasi tahunan",
    icon: "calendar",
    permission: "content.view",
  },
  {
    href: "/admin/content/edition-settings",
    label: "Identitas edisi",
    description: "Logo, slogan, dan program unggulan",
    icon: "award",
    permission: "content.view",
  },
  {
    href: "/admin/content/site-assets",
    label: "Aset situs",
    description: "Atur foto dan video halaman publik",
    icon: "layout",
    permission: "content.view",
  },
  {
    href: "/admin/content/participants",
    label: "Mojang Jajaka",
    description: "Kelola profil peserta dan QRIS",
    icon: "users",
    permission: "content.view",
  },
  {
    href: "/admin/content/news",
    label: "Berita",
    description: "Tulis dan pratinjau berita",
    icon: "newspaper",
    permission: "content.view",
  },
  {
    href: "/admin/content/galleries",
    label: "Galeri",
    description: "Kelola album dan dokumentasi acara",
    icon: "gallery",
    permission: "content.view",
  },
  {
    href: "/admin/voting",
    label: "Voting",
    description: "Kelola kampanye, rekap harian, dan hasil",
    icon: "bar-chart",
    permission: "voting.view",
  },
  {
    href: "/admin/audit",
    label: "Riwayat audit",
    description: "Jejak perubahan data dan keputusan admin",
    icon: "clock",
    permission: "audit.view",
  },
];

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/admin/login");
  await ensurePendingAdminProfile(session.user.id);
  const permissions = await getEffectivePermissions(session.user.id);
  if (!permissions.has("admin.view")) redirect("/admin/request-access");

  const currentEdition = await getAdminEditionContext();

  const [
    participantCountRows,
    activeParticipantCountRows,
    programCountRows,
    newsCountRows,
    sponsorCountRows,
    eventCountRows,
    votingCountRows,
    galleryCountRows,
    siteAssetBindingRows,
    committeeCountRows,
    editionDetailRows,
    recentLogs,
  ] = await Promise.all([
    currentEdition
      ? database
          .select({ value: count() })
          .from(participants)
          .where(eq(participants.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(participants)
          .where(and(eq(participants.editionId, currentEdition.id), eq(participants.active, true)))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(editionPrograms)
          .where(
            and(
              eq(editionPrograms.editionId, currentEdition.id),
              eq(editionPrograms.active, true),
            ),
          )
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(newsArticles)
          .where(
            and(
              eq(newsArticles.editionId, currentEdition.id),
              eq(newsArticles.status, "published"),
            ),
          )
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(sponsors)
          .where(eq(sponsors.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(events)
          .where(eq(events.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(votingCampaigns)
          .where(eq(votingCampaigns.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(galleries)
          .where(eq(galleries.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({ slotKey: siteAssetBindings.slotKey, mediaId: siteAssetBindings.mediaId })
          .from(siteAssetBindings)
          .where(eq(siteAssetBindings.editionId, currentEdition.id))
      : Promise.resolve([]),
    currentEdition
      ? database
          .select({ value: count() })
          .from(committeeAssignments)
          .where(eq(committeeAssignments.editionId, currentEdition.id))
      : Promise.resolve([{ value: 0 }]),
    currentEdition
      ? database
          .select({
            logoMediaId: editions.logoMediaId,
            slogan: editions.slogan,
            organizationPeriodLabel: organizationPeriods.label,
            organizationPeriodStartYear: organizationPeriods.startYear,
            organizationPeriodEndYear: organizationPeriods.endYear,
          })
          .from(editions)
          .leftJoin(
            organizationPeriods,
            eq(organizationPeriods.id, editions.organizationPeriodId),
          )
          .where(eq(editions.id, currentEdition.id))
          .limit(1)
      : Promise.resolve([]),
    database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
  ]);

  const totalParticipants = participantCountRows[0]?.value ?? 0;
  const totalActiveParticipants = activeParticipantCountRows[0]?.value ?? 0;
  const totalPrograms = programCountRows[0]?.value ?? 0;
  const totalNews = newsCountRows[0]?.value ?? 0;
  const totalSponsors = sponsorCountRows[0]?.value ?? 0;
  const totalEvents = eventCountRows[0]?.value ?? 0;
  const totalVoting = votingCountRows[0]?.value ?? 0;
  const totalGalleries = galleryCountRows[0]?.value ?? 0;
  const requiredSiteAssetSlots = SITE_ASSET_SLOTS.filter((slot) => slot.required);
  const requiredSiteAssetKeys = new Set(requiredSiteAssetSlots.map((slot) => slot.slotKey));
  const boundSiteAssets = siteAssetBindingRows.filter(
    (binding) => binding.mediaId && requiredSiteAssetKeys.has(binding.slotKey),
  ).length;
  const totalCommittee = committeeCountRows[0]?.value ?? 0;
  const editionDetailRow = editionDetailRows[0];
  const totalManifestSlots = requiredSiteAssetSlots.length;

  // Readiness Checklist Calculation
  const isIdentityReady = Boolean(
    editionDetailRow?.logoMediaId && editionDetailRow?.slogan?.trim(),
  );
  const isProgramsReady = totalPrograms > 0;
  const isSiteAssetsReady = boundSiteAssets >= totalManifestSlots;
  const isCommitteeReady = totalCommittee > 0;
  const isParticipantsReady = totalActiveParticipants > 0;
  const isEventsReady = totalEvents > 0;
  const isVotingReady = totalVoting > 0;
  const isSponsorsReady = totalSponsors > 0;
  const isNewsReady = totalNews > 0;
  const isGalleriesReady = totalGalleries > 0;

  const readinessItems = [
    {
      label: "Identitas edisi",
      description: "Logo edisi dan slogan Pasanggiri",
      ready: isIdentityReady,
      href: "/admin/content/edition-settings",
      detail: isIdentityReady ? "Lengkap" : "Logo/slogan belum diisi",
    },
    {
      label: "Program unggulan",
      description: "Program utama edisi",
      ready: isProgramsReady,
      href: "/admin/content/edition-settings",
      detail: `${totalPrograms} program aktif`,
    },
    {
      label: "Aset situs",
      description: "Slot gambar hero, banner, dan kategori",
      ready: isSiteAssetsReady,
      href: "/admin/content/site-assets",
      detail: `${boundSiteAssets}/${totalManifestSlots} slot terisi`,
    },
    {
      label: "Struktur panitia",
      description: "Susunan panitia pelaksana edisi",
      ready: isCommitteeReady,
      href: "/admin/content/committee",
      detail: `${totalCommittee} penugasan panitia`,
    },
    {
      label: "Peserta Pasanggiri",
      description: "Peserta aktif edisi",
      ready: isParticipantsReady,
      href: "/admin/content/participants",
      detail: `${totalActiveParticipants}/${totalParticipants} peserta aktif`,
    },
    {
      label: "Rangkaian acara",
      description: "Agenda edisi",
      ready: isEventsReady,
      href: "/admin/content/events",
      detail: `${totalEvents} acara`,
    },
    {
      label: "Kampanye voting",
      description: "Kampanye voting kameumeut edisi aktif",
      ready: isVotingReady,
      href: "/admin/voting",
      detail: `${totalVoting} kampanye terdaftar`,
    },
    {
      label: "Sponsor dan mitra",
      description: "Logo dan partner pendukung acara",
      ready: isSponsorsReady,
      href: "/admin/content/sponsors",
      detail: `${totalSponsors} sponsor terdaftar`,
    },
    {
      label: "Berita",
      description: "Artikel yang telah dipublikasikan",
      ready: isNewsReady,
      href: "/admin/content/news",
      detail: `${totalNews} berita terbit`,
    },
    {
      label: "Galeri",
      description: "Album foto dan video",
      ready: isGalleriesReady,
      href: "/admin/content/galleries",
      detail: `${totalGalleries} album galeri`,
    },
  ];

  const readyCount = readinessItems.filter((i) => i.ready).length;
  const readinessPercent = Math.round((readyCount / readinessItems.length) * 100);

  const editionStatusLabel = currentEdition
    ? currentEdition.lifecycle === "active"
      ? "Aktif"
      : currentEdition.lifecycle === "draft"
        ? "Draf"
        : "Arsip"
    : "Belum dipilih";

  return (
    <AdminPage
      title={`Selamat datang, ${session.user.name.split(" ")[0]}`}
      action={
        <AdminLinkButton href="/" variant="secondary">
          Lihat situs <ArrowUpRight size={15} />
        </AdminLinkButton>
      }
    >
      {/* Top Stats Cards */}
      <section
        className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan data"
      >
        <AdminStatCard
          label="Edisi terpilih"
          value={currentEdition?.year ?? "-"}
          note={
            currentEdition
              ? `${currentEdition.name} (${editionStatusLabel})`
              : "Pilih edisi dari header selector"
          }
          icon="calendar"
        />
        <AdminStatCard
          label="Peserta aktif"
          value={totalActiveParticipants}
          note={
            currentEdition
              ? `${totalActiveParticipants} dari ${totalParticipants} peserta terdaftar`
              : "Pilih edisi untuk melihat data"
          }
          icon="users"
          accent="gold"
        />
        <AdminStatCard
          label="Berita"
          value={totalNews}
          note={
            currentEdition
              ? `${totalNews} artikel terbit`
              : "Pilih edisi untuk melihat data"
          }
          icon="newspaper"
          accent="blue"
        />
        <AdminStatCard
          label="Sponsor"
          value={totalSponsors}
          note={
            currentEdition
              ? `${totalSponsors} sponsor edisi ${currentEdition.year}`
              : "Pilih edisi untuk melihat data"
          }
          icon="handshake"
          accent="green"
        />
      </section>

      {/* Edition Readiness Checklist Panel */}
      {currentEdition && (
        <div className="mt-6">
          <AdminCard className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-md bg-highlight/10 text-highlight-700 font-bold">
                    <ClipboardList size={16} />
                  </span>
                  <h3 className="font-manrope text-base font-semibold text-foreground">
                    Kesiapan konten
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-manrope text-lg font-bold text-foreground">
                    {readinessPercent}%
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {readyCount} dari {readinessItems.length} modul siap
                  </span>
                </div>
                <progress value={readyCount} max={readinessItems.length} aria-label="Kesiapan konten" className="h-2 w-28 overflow-hidden rounded-md bg-muted accent-brand [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Periode kepengurusan terkait</p>
              <p className="mt-1 font-manrope text-sm font-semibold text-foreground">
                {editionDetailRow?.organizationPeriodLabel
                  ? `${editionDetailRow.organizationPeriodLabel} (${editionDetailRow.organizationPeriodStartYear}-${editionDetailRow.organizationPeriodEndYear})`
                  : "Belum terhubung"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {readinessItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                    item.ready
                      ? "border-brand-200 bg-brand-50/30 hover:border-brand-300"
                      : "border-highlight-200 bg-highlight-50/30 hover:border-highlight-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-manrope text-xs font-semibold text-foreground">
                        {item.label}
                      </span>
                      {item.ready ? (
                        <CheckCircle2 size={15} className="text-brand shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-highlight-700 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                    <span
                      className={`font-medium ${
                        item.ready ? "text-brand-700" : "text-highlight-700 font-semibold"
                      }`}
                    >
                      {item.detail}
                    </span>
                    <ArrowRight
                      size={12}
                      className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      {/* Quick Navigation and Recent Audit Grid */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <AdminCardHeader
            title="Pintasan modul"
          />
          <div className="grid border-t border-brand-100 sm:grid-cols-2">
            {quickActions
              .filter((item) => permissions.has(item.permission))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex gap-3 border-b border-brand-100 p-4 transition-colors hover:bg-brand-50/40 sm:odd:border-r"
                >
                  <span className="grid size-10 shrink-0 place-items-center border border-brand-100 text-brand">
                    <AdminIcon name={item.icon} size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-manrope text-sm font-semibold text-brand-900">
                      {item.label}
                      <ArrowRight className="size-3.5 text-highlight-600 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
          </div>
        </AdminCard>

        {/* Recent Audit Log Feed */}
        <AdminCard>
          <AdminCardHeader
            title="Riwayat audit"
            description="Waktu dalam WIB."
            action={
              permissions.has("audit.view") ? (
                <Link
                  href="/admin/audit"
                  className="text-xs font-semibold text-brand hover:text-brand-600"
                >
                  Lihat semua
                </Link>
              ) : null
            }
          />
          <div className="space-y-2 border-t border-brand-100 pt-3">
            {recentLogs.length ? (
              recentLogs.map((log) => (
                <AdminListRow
                  key={log.id}
                  title={log.resourceLabel ?? log.resourceType}
                  meta={`${log.action} · ${log.actorLabel}`}
                  action={
                    <time className="text-xs text-muted-foreground font-inter">
                      {log.createdAt.toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  }
                />
              ))
            ) : (
              <p className="border-y border-dashed border-brand-200 bg-brand-50/30 px-5 py-9 text-center text-sm text-muted-foreground">
                Belum ada aktivitas yang tercatat.
              </p>
            )}
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
