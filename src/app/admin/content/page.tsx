import { eq } from "drizzle-orm";

import { requirePermission } from "@/server/auth/authorization";
import { AdminIcon, type AdminIconName } from "@/components/admin/icons";
import { AdminBadge, AdminCard, AdminCardHeader, AdminLinkButton, AdminListRow, AdminPage } from "@/components/admin/primitives";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { editions } from "@/server/db/schema";
import { Import2025Button } from "./import-2025-button";

export const metadata = { title: "Ikhtisar konten" };

const modules: { slug: string; label: string; description: string; icon: AdminIconName }[] = [
  { slug: "editions", label: "Kelola edisi", description: "Periode, kategori, dan status edisi.", icon: "calendar" },
  { slug: "edition-settings", label: "Identitas edisi", description: "Logo, slogan, dan program unggulan.", icon: "award" },
  { slug: "site-assets", label: "Aset situs", description: "Gambar untuk bagian situs yang tetap.", icon: "images" },
  { slug: "news", label: "Berita", description: "Artikel, pratinjau, dan publikasi.", icon: "newspaper" },
  { slug: "sponsors", label: "Sponsor", description: "Partner dan tingkat sponsor.", icon: "handshake" },
  { slug: "participants", label: "Mojang Jajaka", description: "Pendaftar, seleksi, profil, dan gelar.", icon: "users" },
  { slug: "events", label: "Acara", description: "Agenda kegiatan dan tautan album.", icon: "calendar" },
  { slug: "galleries", label: "Galeri", description: "Album foto dan video kegiatan.", icon: "gallery" },
  { slug: "committee", label: "Panitia", description: "Struktur panitia edisi aktif.", icon: "clipboard" },
];

export default async function ContentPage() {
  const actor = await requirePermission("content.view");
  const currentEdition = await getAdminEditionContext();
  const canImport2025 = actor.effectivePermissions.has("settings.manage") && process.env.NODE_ENV !== "production" && process.env.TURSO_DATABASE_URL === "file:local.db";
  const existing2025 = canImport2025
    ? await database.select({ id: editions.id }).from(editions).where(eq(editions.year, 2025)).limit(1)
    : [];

  return (
    <AdminPage
      eyebrow="Konten"
      title="Kelola konten"
      action={currentEdition ? <AdminBadge value={currentEdition.lifecycle} /> : null}
    >
      <div className="divide-y divide-dgb-100 border-y border-dgb-100">
        {modules.map((module) => (
          <AdminListRow
            key={module.slug}
            title={
              <span className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-dgb-50 text-dgb">
                  <AdminIcon name={module.icon} size={18} strokeWidth={1.8} />
                </span>
                <span className="font-montserrat">{module.label}</span>
              </span>
            }
            meta={module.description}
            action={
              <AdminLinkButton href={`/admin/content/${module.slug}`} variant="secondary" className="w-full sm:w-auto">
                Buka
              </AdminLinkButton>
            }
          />
        ))}
      </div>
      {canImport2025 ? (
        <AdminCard className="mt-6">
          <AdminCardHeader
            eyebrow="Database lokal"
            title="Import konten 2025"
            description="Menyalin konten sumber 2025 ke file:local.db. Import hanya berjalan sekali agar perubahan CMS tidak tertimpa."
          />
          {existing2025.length ? (
            <p className="text-sm text-muted-foreground">Edisi 2025 sudah tersedia. Gunakan editor CMS untuk perubahan berikutnya.</p>
          ) : (
            <Import2025Button />
          )}
        </AdminCard>
      ) : null}
    </AdminPage>
  );
}
