import { and, count, desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminIcon, type AdminIconName } from "@/components/admin/icons";
import {
  AdminLinkButton,
  AdminPage,
  AdminSection,
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
import { createAuditUserLookup, formatAuditAction, formatAuditResource } from "@/lib/audit-format";
import {
  auditLogs,
  authUsers,
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
  icon: AdminIconName;
  permission: PermissionKey;
}> = [
  { href: "/admin/content/editions", label: "Kelola edisi", icon: "calendar", permission: "content.view" },
  { href: "/admin/content/edition-settings", label: "Identitas edisi", icon: "award", permission: "content.view" },
  { href: "/admin/content/site-assets", label: "Aset situs", icon: "layout", permission: "content.view" },
  { href: "/admin/content/participants", label: "Mojang Jajaka", icon: "users", permission: "content.view" },
  { href: "/admin/content/news", label: "Berita", icon: "newspaper", permission: "content.view" },
  { href: "/admin/content/galleries", label: "Galeri", icon: "gallery", permission: "content.view" },
  { href: "/admin/voting", label: "Voting", icon: "bar-chart", permission: "voting.view" },
  { href: "/admin/audit", label: "Riwayat audit", icon: "clock", permission: "audit.view" },
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
    allUsers,
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
    database.select({ id: authUsers.id, name: authUsers.name, email: authUsers.email }).from(authUsers),
  ]);

  const auditLookup = createAuditUserLookup(allUsers);

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
      ready: isIdentityReady,
      href: "/admin/content/edition-settings",
      detail: isIdentityReady ? "Lengkap" : "Belum diisi",
    },
    {
      label: "Program unggulan",
      ready: isProgramsReady,
      href: "/admin/content/edition-settings",
      detail: `${totalPrograms} aktif`,
    },
    {
      label: "Aset situs",
      ready: isSiteAssetsReady,
      href: "/admin/content/site-assets",
      detail: `${boundSiteAssets}/${totalManifestSlots} terisi`,
    },
    {
      label: "Struktur panitia",
      ready: isCommitteeReady,
      href: "/admin/content/committee",
      detail: `${totalCommittee} panitia`,
    },
    {
      label: "Peserta",
      ready: isParticipantsReady,
      href: "/admin/content/participants",
      detail: `${totalActiveParticipants}/${totalParticipants} aktif`,
    },
    {
      label: "Rangkaian acara",
      ready: isEventsReady,
      href: "/admin/content/events",
      detail: `${totalEvents} acara`,
    },
    {
      label: "Voting",
      ready: isVotingReady,
      href: "/admin/voting",
      detail: `${totalVoting} kampanye`,
    },
    {
      label: "Sponsor",
      ready: isSponsorsReady,
      href: "/admin/content/sponsors",
      detail: `${totalSponsors} mitra`,
    },
    {
      label: "Berita",
      ready: isNewsReady,
      href: "/admin/content/news",
      detail: `${totalNews} terbit`,
    },
    {
      label: "Galeri",
      ready: isGalleriesReady,
      href: "/admin/content/galleries",
      detail: `${totalGalleries} album`,
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
              : "Pilih edisi dari header"
          }
        />
        <AdminStatCard
          label="Peserta aktif"
          value={totalActiveParticipants}
          note={
            currentEdition
              ? `${totalActiveParticipants} dari ${totalParticipants} terdaftar`
              : undefined
          }
        />
        <AdminStatCard
          label="Berita terbit"
          value={totalNews}
          note={currentEdition ? `${totalNews} artikel` : undefined}
        />
        <AdminStatCard
          label="Sponsor"
          value={totalSponsors}
          note={currentEdition ? `${totalSponsors} mitra` : undefined}
        />
      </section>

      {currentEdition ? (
        <AdminSection
          title="Kesiapan konten"
          action={
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-foreground">{readinessPercent}%</span>
              <span className="text-xs text-muted-foreground">({readyCount}/{readinessItems.length} siap)</span>
              <progress
                value={readyCount}
                max={readinessItems.length}
                aria-label="Kesiapan konten"
                className="h-1.5 w-24 overflow-hidden rounded-md bg-muted accent-brand [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand"
              />
            </div>
          }
          className="mt-6"
        >
          {editionDetailRow?.organizationPeriodLabel ? (
            <p className="mb-3 text-xs text-muted-foreground">
              Periode kepengurusan:{" "}
              <span className="font-medium text-foreground">
                {editionDetailRow.organizationPeriodLabel} ({editionDetailRow.organizationPeriodStartYear}-{editionDetailRow.organizationPeriodEndYear})
              </span>
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {readinessItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                  <p className={`mt-0.5 text-xs ${item.ready ? "text-muted-foreground" : "font-medium text-highlight-700"}`}>
                    {item.detail}
                  </p>
                </div>
                {item.ready ? (
                  <CheckCircle2 size={16} className="shrink-0 text-brand" />
                ) : (
                  <XCircle size={16} className="shrink-0 text-highlight-700" />
                )}
              </Link>
            ))}
          </div>
        </AdminSection>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminSection title="Pintasan modul">
          <div className="grid gap-2 sm:grid-cols-2">
            {quickActions
              .filter((item) => permissions.has(item.permission))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-md border border-brand-100 bg-card p-3 transition-colors hover:bg-brand-50/40"
                >
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-brand-900">
                    <AdminIcon name={item.icon} size={16} className="text-brand" />
                    {item.label}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
          </div>
        </AdminSection>

        <AdminSection
          title="Riwayat audit"
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
        >
          <div className="divide-y divide-brand-100">
            {recentLogs.length ? (
              recentLogs.map((log) => {
                const actor = auditLookup.resolveActor(log);
                const actionLabel = formatAuditAction(log.action);
                const resourceLabel = formatAuditResource(log.resourceType);
                const contentDetail = auditLookup.resolveContentLabel(log);

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium text-brand-900">
                        {resourceLabel} · {contentDetail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actionLabel} · oleh {actor.name}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground font-inter">
                      {log.createdAt.toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada aktivitas.
              </p>
            )}
          </div>
        </AdminSection>
      </div>
    </AdminPage>
  );
}
