import { ArrowLeft } from "lucide-react";

import { AdminLinkButton, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { EventForm } from "../event-form";

export const metadata = { title: "Tambah Acara" };

export default async function NewEventPage() {
  const actor = await requirePermission("events.manage");
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Pilih edisi aktif terlebih dahulu");
  return <AdminPage eyebrow="Acara" title="Tambah acara" action={<AdminLinkButton href="/admin/content/events" variant="secondary"><ArrowLeft className="size-4" />Kembali</AdminLinkButton>}><EventForm editionId={edition.id} initialValue={null} canEdit canManageMedia={actor.effectivePermissions.has("media.manage")} /></AdminPage>;
}
