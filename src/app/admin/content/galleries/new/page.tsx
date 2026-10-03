import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events } from "@/server/db/schema";
import { NewGalleryForm } from "./new-gallery-form";

export const metadata = { title: "Buat Album Galeri Baru" };

export default async function NewGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  await requirePermission("gallery.manage");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    redirect("/admin/content/galleries");
  }

  const eventRows = await database
    .select({ id: events.id, label: events.label })
    .from(events)
    .where(eq(events.editionId, currentEdition.id))
    .orderBy(asc(events.displayOrder));
  const requestedEventId = (await searchParams).eventId;

  return (
    <AdminPage
      eyebrow="Galeri"
      title="Buat album"
    >
      <NewGalleryForm
        editionName={currentEdition.name}
        editionId={currentEdition.id}
        eventsList={eventRows}
        initialEventId={requestedEventId}
      />
    </AdminPage>
  );
}
