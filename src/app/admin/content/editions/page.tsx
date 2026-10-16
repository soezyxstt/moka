import { desc, eq } from "drizzle-orm";
import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { previewEditionAction } from "./preview-actions";
import { EditionForm } from "./edition-form";
import { DEFAULT_CATEGORIES, getEditionReadiness } from "@/server/cms/edition-readiness";

import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminEmptyState, AdminField, AdminInput, AdminListRow, AdminPage, AdminSelect } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { categories, editions } from "@/server/db/schema";
import { activateEditionAction, createCategoryAction, createEditionAction } from "./actions";

export default async function EditionsPage() {
  const actor = await requirePermission("content.view");
  const canManage = actor.effectivePermissions.has("settings.manage");
  const [rows, categoryRows] = await Promise.all([
    database.select().from(editions).orderBy(desc(editions.year)),
    database.select({ id: categories.id, label: categories.label, code: categories.code, editionId: categories.editionId, editionName: editions.name }).from(categories).leftJoin(editions, eq(categories.editionId, editions.id)),
  ]);
  const readiness = new Map(await Promise.all(rows.map(async (edition) => [edition.id, await getEditionReadiness(database, edition.id)] as const)));

  return (
    <AdminPage title="Edisi & kategori">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader title="Buat edisi" />
            <EditionForm action={createEditionAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <AdminField label="Tahun"><AdminInput type="number" name="year" placeholder="2026" required min={2020} max={2100} /></AdminField>
                <AdminField label="Nama edisi"><AdminInput name="name" placeholder="Pasanggiri 2026" required maxLength={200} /></AdminField>
              </div>
              <AdminButton type="submit" disabled={!canManage}><Plus size={16} /> Buat draf</AdminButton>
            </EditionForm>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader title="Tambah kategori" />
            <EditionForm action={createCategoryAction} className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Edisi"><AdminSelect name="editionId" required options={[{ value: "", label: "Pilih edisi" }, ...rows.map((edition) => ({ value: edition.id, label: edition.name }))]} /></AdminField>
              <AdminField label="Kategori"><AdminSelect name="code" required options={DEFAULT_CATEGORIES.map((category) => ({ value: category.code, label: category.label }))} /></AdminField>
              <AdminButton type="submit" disabled={!actor.effectivePermissions.has("participants.manage")} className="sm:col-span-2"><Plus size={16} /> Tambah kategori</AdminButton>
            </EditionForm>
          </AdminCard>
        </div>
        <AdminCard>
          <AdminCardHeader title="Kesiapan edisi" />
          <div className="space-y-3">
            {rows.length === 0 ? <AdminEmptyState icon="calendar" title="Belum ada edisi" /> : rows.map((edition) => {
              const editionCategories = categoryRows.filter((category) => category.editionId === edition.id);
              return (
                <AdminListRow key={edition.id} title={edition.name} meta={`${edition.year} · ${editionCategories.length} kategori`} action={<AdminBadge value={edition.lifecycle} />}>
                  <div className="flex flex-wrap gap-2">{editionCategories.length ? editionCategories.map((category) => <span key={category.id} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{category.code} <span className="text-muted-foreground">{category.label}</span></span>) : <span className="text-xs text-muted-foreground">Belum ada kategori</span>}</div>
                  <ul className="mt-4 space-y-2 text-sm">{readiness.get(edition.id)?.map((item) => <li key={item.label}><Link href={item.href} className="underline underline-offset-4">{item.ready ? "Siap" : "Lengkapi"}: {item.label}</Link></li>)}</ul>
                  <form action={previewEditionAction} className="mt-4"><input type="hidden" name="editionId" value={edition.id} /><AdminButton variant="secondary" type="submit">Pratinjau situs edisi {edition.year}</AdminButton></form>
                  {edition.lifecycle === "draft" && canManage ? <EditionForm action={activateEditionAction} className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="editionId" value={edition.id} /><input type="hidden" name="version" value={edition.version} /><AdminInput className="h-10" name="reason" aria-label={`Alasan aktivasi ${edition.name}`} placeholder="Alasan aktivasi (wajib)" minLength={8} maxLength={1000} required /><AdminButton type="submit" disabled={readiness.get(edition.id)?.some((item) => !item.ready)} className="h-10 shrink-0 bg-highlight text-brand-900 hover:bg-highlight-300"><Check size={15} /> Aktifkan</AdminButton></EditionForm> : null}
                </AdminListRow>
              );
            })}
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
