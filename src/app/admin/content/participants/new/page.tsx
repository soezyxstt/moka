import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

import {
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
      <AdminPage title="Tambah pendaftar">
        <AdminEmptyState
          icon="users"
          title="Pilih edisi terlebih dahulu"
        />
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
      title="Tambah pendaftar"
      action={
        <AdminLinkButton href="/admin/content/participants" variant="secondary">
          <ArrowLeft className="size-4" />
          Kembali ke daftar
        </AdminLinkButton>
      }
    >
      {!firstStage ? (
        <div className="space-y-4">
          <AdminEmptyState
            icon="settings"
            title="Tahap seleksi belum tersedia"
          />
          <div className="flex justify-center">
            <AdminLinkButton href="/admin/content/participants/stages">
              Atur tahap seleksi
            </AdminLinkButton>
          </div>
        </div>
      ) : firstStage.lifecycle === "closed" ? (
        <div className="space-y-4">
          <AdminEmptyState
            icon="settings"
            title={`Tahap ${firstStage.name} sudah ditutup`}
          />
          <div className="flex justify-center">
            <AdminLinkButton href="/admin/content/participants/stages" variant="secondary">
              Kelola tahap seleksi
            </AdminLinkButton>
          </div>
        </div>
      ) : (
        <ParticipantCreateForm
          categories={categoryRows}
          firstStage={firstStage}
        />
      )}
    </AdminPage>
  );
}
