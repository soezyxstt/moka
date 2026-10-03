import { redirect } from "next/navigation";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { NewsWorkspace } from "../news-workspace";

export const metadata = { title: "Tulis Berita Baru" };

export default async function NewNewsPage() {
  const actor = await requirePermission("content.edit");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    redirect("/admin/content/news");
  }

  const canPublish = actor.effectivePermissions.has("content.publish");
  const canManage = actor.effectivePermissions.has("media.manage");

  return (
    <AdminPage
      eyebrow="Konten"
      title="Tulis berita"
    >
      <NewsWorkspace
        editionName={currentEdition.name}
        activeEditionId={currentEdition.id}
        canPublish={canPublish}
        canManage={canManage}
        canEdit
      />
    </AdminPage>
  );
}
