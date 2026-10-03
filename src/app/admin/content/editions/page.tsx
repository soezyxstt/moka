import { desc, eq } from "drizzle-orm";
import { Check, Plus } from "lucide-react";

import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminEmptyState, AdminField, AdminInput, AdminListRow, AdminPage, AdminSelect } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { categories, editions } from "@/server/db/schema";
import { activateEditionAction, createCategoryAction, createEditionAction } from "./actions";

export default async function EditionsPage() {
  await requirePermission("content.view");
  const [rows, categoryRows] = await Promise.all([
    database.select().from(editions).orderBy(desc(editions.year)),
    database.select({ id: categories.id, label: categories.label, code: categories.code, editionId: categories.editionId, editionName: editions.name }).from(categories).leftJoin(editions, eq(categories.editionId, editions.id)),
  ]);

  return (
    <AdminPage eyebrow="Edisi" title="Edisi & kategori">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader eyebrow="Periode baru" title="Buat edisi" description="Edisi baru dimulai sebagai draft sampai diaktifkan." />
            <form action={createEditionAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <AdminField label="Tahun"><AdminInput type="number" name="year" placeholder="2026" /></AdminField>
                <AdminField label="Nama edisi"><AdminInput name="name" placeholder="Pasanggiri 2026" /></AdminField>
              </div>
              <AdminButton type="submit"><Plus size={16} /> Buat draft edisi</AdminButton>
            </form>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader eyebrow="Kategori peserta" title="Tambah kategori" />
            <form action={createCategoryAction} className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Edisi"><AdminSelect name="editionId" required options={[{ value: "", label: "Pilih edisi" }, ...rows.map((edition) => ({ value: edition.id, label: edition.name }))]} /></AdminField>
              <AdminField label="Kode"><AdminInput name="code" placeholder="JD" required /></AdminField>
              <AdminField label="Label"><AdminInput name="label" placeholder="Jajaka Dewasa" required /></AdminField>
              <AdminField label="Slug"><AdminInput name="slug" placeholder="jajaka-dewasa" required /></AdminField>
              <AdminButton type="submit" className="sm:col-span-2"><Plus size={16} /> Tambah kategori</AdminButton>
            </form>
          </AdminCard>
        </div>
        <AdminCard>
          <AdminCardHeader eyebrow="Daftar tersimpan" title="Edisi aktif dan draft" description="Aktifkan satu edisi setelah kategori minimal tersedia." />
          <div className="space-y-3">
            {rows.length === 0 ? <AdminEmptyState icon="calendar" title="Belum ada edisi" description="Buat edisi pertama dari panel di sebelah kiri." /> : rows.map((edition) => {
              const editionCategories = categoryRows.filter((category) => category.editionId === edition.id);
              return (
                <AdminListRow key={edition.id} title={edition.name} meta={`${edition.year} · ${editionCategories.length} kategori`} action={<AdminBadge value={edition.lifecycle} />}>
                  <div className="flex flex-wrap gap-2">{editionCategories.length ? editionCategories.map((category) => <span key={category.id} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{category.code} <span className="text-muted-foreground">{category.label}</span></span>) : <span className="text-xs text-muted-foreground">Belum ada kategori</span>}</div>
                  {edition.lifecycle !== "active" ? <form action={activateEditionAction} className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="editionId" value={edition.id} /><AdminInput className="h-10" name="reason" placeholder="Alasan aktivasi (wajib)" required /><AdminButton type="submit" className="h-10 shrink-0 bg-fb text-dgb-900 hover:bg-fb-300"><Check size={15} /> Aktifkan</AdminButton></form> : null}
                </AdminListRow>
              );
            })}
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
