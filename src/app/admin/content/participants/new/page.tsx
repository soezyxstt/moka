import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

import {
  AdminCard,
  AdminEmptyState,
  AdminLinkButton,
  AdminPage,
} from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { categories, selectionStages } from "@/server/db/schema";
import { ParticipantCreateForm } from "./participant-create-form";

export const metadata = { title: "Tambah Pendaftar | Mojang Jajaka" };

export default async function NewParticipantPage() {
  await requirePermission("participants.manage");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Peserta"
        title="Tambah pendaftar"
      >
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="users"
              title="Belum ada edisi dipilih"
              description="Pilih edisi aktif pada header untuk menambahkan pendaftar."
            />
          </div>
        </AdminCard>
      </AdminPage>
    );
  }

  // Fetch active categories for the current edition
  const categoryRows = await database
    .select({
      id: categories.id,
      code: categories.code,
      label: categories.label,
    })
    .from(categories)
    .where(and(eq(categories.editionId, currentEdition.id), eq(categories.active, true)))
    .orderBy(asc(categories.displayOrder));

  // Fetch first selection stage for the current edition
  const [firstStage] = await database
    .select({
      id: selectionStages.id,
      name: selectionStages.name,
      targetParticipantCount: selectionStages.targetParticipantCount,
      lifecycle: selectionStages.lifecycle,
    })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, currentEdition.id))
    .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id))
    .limit(1);

  return (
    <AdminPage
      eyebrow="Peserta"
      title="Tambah pendaftar"
      action={
        <AdminLinkButton href="/admin/content/participants" variant="secondary">
          <ArrowLeft className="size-4" />
          Kembali ke daftar
        </AdminLinkButton>
      }
    >
      {!firstStage ? (
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="settings"
              title="Tahap seleksi belum tersedia"
              description="Buat tahap seleksi pertama sebelum menambahkan pendaftar."
            />
            <div className="mt-6 flex justify-center">
              <AdminLinkButton href="/admin/content/participants/stages">
                Atur tahap seleksi
              </AdminLinkButton>
            </div>
          </div>
        </AdminCard>
      ) : firstStage.lifecycle === "closed" ? (
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="settings"
              title="Tahap pertama sudah ditutup"
              description={`Tahap ${firstStage.name} sudah ditutup dan tidak menerima pendaftar baru.`}
            />
            <div className="mt-6 flex justify-center">
              <AdminLinkButton href="/admin/content/participants/stages" variant="secondary">
                Kelola tahap seleksi
              </AdminLinkButton>
            </div>
          </div>
        </AdminCard>
      ) : (
        <ParticipantCreateForm
          categories={categoryRows}
          firstStage={firstStage}
        />
      )}
    </AdminPage>
  );
}
