"use client";

import { useState } from "react";
import { AdminMediaField, type MediaAssetSummary } from "@/components/admin/media-picker";
import { toast } from "sonner";

import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminField, AdminInput, AdminTextarea } from "@/components/admin/primitives";
import { publishPageSectionAction, savePageSectionDraftAction } from "./actions";
import { CONTENT_DRAFT_2026 } from "./content-draft-2026";
import { REGISTRATION_2026 } from "./registration-2026";

export type PageSectionCopy = {
  documentMediaId: string | null;
  documentTitle: string | null;
  title: string | null;
  eyebrow: string | null;
  body: string | null;
  actionLabel: string | null;
  actionHref: string | null;
};

export type PageSectionEditorItem = {
  slotKey: string;
  pageKey: "site" | "home" | "tentang" | "galeri" | "voting" | "pendaftaran";
  sectionKey: string;
  label: string;
  version: number | null;
  status: string | null;
  published: PageSectionCopy;
  draft: PageSectionCopy | null;
  value: PageSectionCopy;
};

function clean(value: string) {
  return value.trim() || null;
}

function sameCopy(left: PageSectionCopy, right: PageSectionCopy) {
  return left.documentMediaId === right.documentMediaId && left.documentTitle === right.documentTitle && left.title === right.title && left.eyebrow === right.eyebrow && left.body === right.body && left.actionLabel === right.actionLabel && left.actionHref === right.actionHref;
}

export function PageSectionsEditor({
  initialSections,
  canEdit,
  canPublish,
  documentAssets,
  organizationPeriod,
  editionId,
  editionYear,
}: {
  initialSections: PageSectionEditorItem[];
  canEdit: boolean;
  canPublish: boolean;
  documentAssets: MediaAssetSummary[];
  organizationPeriod: { label: string; vision: string | null; missionJson: string } | null;
  editionId: string;
  editionYear: number;
}) {
  const [sections, setSections] = useState(initialSections);
  const [pending, setPending] = useState<string | null>(null);

  function updateValue(slotKey: string, field: keyof PageSectionCopy, value: string) {
    setSections((current) => current.map((section) => section.slotKey === slotKey
      ? { ...section, value: { ...section.value, [field]: value || null } }
      : section));
  }

  async function save(section: PageSectionEditorItem) {
    setPending(`${section.slotKey}:save`);
    const copy: PageSectionCopy = {
      documentMediaId: section.value.documentMediaId,
      documentTitle: clean(section.value.documentTitle ?? ""),
      title: clean(section.value.title ?? ""),
      eyebrow: clean(section.value.eyebrow ?? ""),
      body: clean(section.value.body ?? ""),
      actionLabel: clean(section.value.actionLabel ?? ""),
      actionHref: clean(section.value.actionHref ?? ""),
    };
    const toastId = toast.loading("Menyimpan draf teks...");
    try {
      const result = await savePageSectionDraftAction({
        expectedEditionId: editionId,
        slotKey: section.slotKey,
        expectedVersion: section.version,
        patch: section.slotKey === "home/ajakan" || section.slotKey === "pendaftaran/hero"
          ? copy
          : { title: copy.title, eyebrow: copy.eyebrow, body: copy.body, ...(section.slotKey === "tentang/legalitas" ? { documentMediaId: copy.documentMediaId, documentTitle: copy.documentTitle } : {}) },
      });
      if (result.error || result.version === null) throw new Error(result.error ?? "Draf gagal disimpan");
      setSections((current) => current.map((item) => item.slotKey === section.slotKey
        ? { ...item, version: result.version, value: copy, draft: copy }
        : item));
      toast.success("Draf teks disimpan", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draf gagal disimpan", { id: toastId });
    } finally {
      setPending(null);
    }
  }

  async function publish(section: PageSectionEditorItem) {
    setPending(`${section.slotKey}:publish`);
    const toastId = toast.loading("Menerbitkan teks...");
    try {
      const result = await publishPageSectionAction({ slotKey: section.slotKey, expectedEditionId: editionId });
      if (result.error || result.version === null) throw new Error(result.error ?? "Teks gagal diterbitkan");
      setSections((current) => current.map((item) => item.slotKey === section.slotKey
        ? { ...item, version: result.version, status: "published", published: { ...item.value }, draft: null }
        : item));
      toast.success("Teks diterbitkan", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Teks gagal diterbitkan", { id: toastId });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      {(["site", "home", "tentang", "galeri", "voting", "pendaftaran"] as const).filter((pageKey) => sections.some((section) => section.pageKey === pageKey)).map((pageKey) => (
        <section key={pageKey} aria-labelledby={`${pageKey}-sections-title`} className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 id={`${pageKey}-sections-title`} className="font-manrope text-lg font-semibold text-brand-900">
              {{ site: "Identitas dan kontak", home: "Beranda", tentang: "Tentang", galeri: "Galeri", voting: "Voting", pendaftaran: "Pendaftaran" }[pageKey]}
            </h2>
            {["home", "tentang", "pendaftaran"].includes(pageKey) && editionYear === 2026 && canEdit ? <AdminButton type="button" variant="secondary" disabled={Boolean(pending)} onClick={() => setSections((current) => current.map((section) => {
              const preset = section.pageKey === pageKey ? CONTENT_DRAFT_2026[section.slotKey] : undefined;
              return preset ? { ...section, value: { ...section.value, ...preset } } : section;
            }))}>Isi draf perubahan</AdminButton> : null}
            {pageKey === "pendaftaran" && editionYear === 2026 && canEdit ? <AdminButton type="button" variant="secondary" disabled={Boolean(pending) || !sections.some((section) => section.pageKey === "pendaftaran" && !section.value.title && !section.value.body)} onClick={() => setSections((current) => current.map((section) => {
              const preset = section.pageKey === "pendaftaran" && !section.value.title && !section.value.body ? REGISTRATION_2026[section.sectionKey] : null;
              return preset ? { ...section, value: { ...section.value, ...preset } } : section;
            }))}>Isi materi 2026</AdminButton> : null}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {sections.filter((section) => section.pageKey === pageKey).map((section) => {
              const hasUnpublishedChanges = section.draft !== null && !sameCopy(section.value, section.draft);
              const rowSection = ["home/agenda", "tentang/peran", "tentang/nilai", "pendaftaran/jalur", "pendaftaran/langkah", "pendaftaran/faq"].includes(section.slotKey);
              const missionHint = rowSection ? "Satu baris: judul | penjelasan | keterangan opsional. Agenda beranda diperbarui manual oleh panitia." : section.pageKey === "pendaftaran" ? section.sectionKey === "timeline" ? "Satu agenda per baris: tanggal | agenda | keterangan opsional. Urutan baris mengikuti tampilan publik." : section.sectionKey === "usia" ? "Satu kategori per baris: kategori | rentang usia | keterangan opsional." : "Satu poin per baris. Simpan draf, lalu tinjau melalui pratinjau edisi." : section.slotKey === "tentang/misi" ? "Tulis satu misi per baris." : undefined;
              const fromPeriod = Boolean(organizationPeriod && ["tentang/visi", "tentang/misi"].includes(section.slotKey));
              const isContact = section.pageKey === "site" && section.sectionKey !== "identity";
              return (
                <AdminCard key={section.slotKey} className="space-y-4">
                  <AdminCardHeader
                    title={section.label}
                    action={<AdminBadge value={section.draft ? "draft" : section.status ?? "draft"} />}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {!isContact && section.pageKey !== "pendaftaran" ? <AdminField label={section.slotKey === "site/identity" ? "Baris identitas dan tagar" : "Label kecil"}>
                      <AdminInput
                        value={section.value.eyebrow ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "eyebrow", event.target.value)}
                        maxLength={120}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField> : null}
                    <AdminField label={isContact ? "Nama tautan" : "Judul"}>
                      <AdminInput
                        value={section.value.title ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "title", event.target.value)}
                        maxLength={200}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                  </div>
                  {fromPeriod ? <p className="text-sm text-muted-foreground">Isi mengikuti {organizationPeriod?.label}. Ubah visi dan misi melalui menu Kepengurusan. Judul bagian tetap dapat diubah di sini.</p> : <AdminField label={isContact ? (section.sectionKey === "email" ? "Alamat email" : "Tautan lengkap") : section.slotKey === "site/identity" ? "Deskripsi pencarian" : "Teks"} hint={isContact ? "Kosongkan lalu terbitkan untuk menyembunyikan kontak ini." : missionHint}>
                    <AdminTextarea
                      value={section.value.body ?? ""}
                      onChange={(event) => updateValue(section.slotKey, "body", event.target.value)}
                      maxLength={20_000}
                      className="min-h-36"
                      readOnly={!canEdit}
                      disabled={Boolean(pending)}
                    />
                  </AdminField>}
                  {section.slotKey === "tentang/legalitas" ? <div className="space-y-4">
                    <AdminMediaField name="documentMediaId" label="Dokumen legalitas" acceptType="pdf" value={section.value.documentMediaId} initialAsset={documentAssets.find((asset) => asset.id === section.value.documentMediaId)} canManageMedia={canEdit && !pending} onChange={(asset) => updateValue(section.slotKey, "documentMediaId", asset?.id ?? "")} />
                    <AdminField label="Nama dokumen"><AdminInput value={section.value.documentTitle ?? ""} onChange={(event) => updateValue(section.slotKey, "documentTitle", event.target.value)} disabled={!canEdit || Boolean(pending)} /></AdminField>
                  </div> : null}
                  {section.slotKey === "home/ajakan" || section.slotKey === "pendaftaran/hero" ? <div className="grid gap-4 sm:grid-cols-2">
                    <AdminField label="Label tombol">
                      <AdminInput
                        value={section.value.actionLabel ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "actionLabel", event.target.value)}
                        maxLength={120}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                    <AdminField label="Tautan tombol">
                      <AdminInput
                        placeholder="/pendaftaran atau https://..."
                        value={section.value.actionHref ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "actionHref", event.target.value)}
                        maxLength={2048}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                  </div> : null}
                  {canEdit || canPublish ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      {canEdit ? (
                        <AdminButton
                          type="button"
                          loading={pending === `${section.slotKey}:save`}
                          disabled={Boolean(pending)}
                          onClick={() => void save(section)}
                        >
                          Simpan draf
                        </AdminButton>
                      ) : null}
                      {canPublish && section.draft ? (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          loading={pending === `${section.slotKey}:publish`}
                          disabled={Boolean(pending) || hasUnpublishedChanges}
                          onClick={() => void publish(section)}
                        >
                          Terbitkan
                        </AdminButton>
                      ) : null}
                      {section.draft ? (
                        <p className="text-xs text-muted-foreground" role="status">
                          {hasUnpublishedChanges ? "Simpan perubahan sebelum menerbitkan." : "Draf siap diterbitkan."}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </AdminCard>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
