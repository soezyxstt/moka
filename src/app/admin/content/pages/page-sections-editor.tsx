"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminField, AdminInput, AdminTextarea } from "@/components/admin/primitives";
import { publishPageSectionAction, savePageSectionDraftAction } from "./actions";

export type PageSectionCopy = {
  title: string | null;
  eyebrow: string | null;
  body: string | null;
  actionLabel: string | null;
  actionHref: string | null;
};

export type PageSectionEditorItem = {
  slotKey: string;
  pageKey: "home" | "tentang";
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
  return left.title === right.title && left.eyebrow === right.eyebrow && left.body === right.body && left.actionLabel === right.actionLabel && left.actionHref === right.actionHref;
}

export function PageSectionsEditor({
  initialSections,
  canEdit,
  canPublish,
}: {
  initialSections: PageSectionEditorItem[];
  canEdit: boolean;
  canPublish: boolean;
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
      title: clean(section.value.title ?? ""),
      eyebrow: clean(section.value.eyebrow ?? ""),
      body: clean(section.value.body ?? ""),
      actionLabel: clean(section.value.actionLabel ?? ""),
      actionHref: clean(section.value.actionHref ?? ""),
    };
    try {
      const result = await savePageSectionDraftAction({
        slotKey: section.slotKey,
        expectedVersion: section.version,
        patch: section.slotKey === "home/ajakan"
          ? copy
          : { title: copy.title, eyebrow: copy.eyebrow, body: copy.body },
      });
      setSections((current) => current.map((item) => item.slotKey === section.slotKey
        ? { ...item, version: result.version, value: copy, draft: copy }
        : item));
      toast.success("Draf teks disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draf gagal disimpan");
    } finally {
      setPending(null);
    }
  }

  async function publish(section: PageSectionEditorItem) {
    setPending(`${section.slotKey}:publish`);
    try {
      const result = await publishPageSectionAction({ slotKey: section.slotKey });
      setSections((current) => current.map((item) => item.slotKey === section.slotKey
        ? { ...item, version: result.version, status: "published", published: { ...item.value }, draft: null }
        : item));
      toast.success("Teks diterbitkan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Teks gagal diterbitkan");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      {(["home", "tentang"] as const).map((pageKey) => (
        <section key={pageKey} aria-labelledby={`${pageKey}-sections-title`} className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 id={`${pageKey}-sections-title`} className="font-montserrat text-lg font-semibold text-dgb-900">
              {pageKey === "home" ? "Beranda" : "Tentang"}
            </h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {sections.filter((section) => section.pageKey === pageKey).map((section) => {
              const hasUnpublishedChanges = section.draft !== null && !sameCopy(section.value, section.draft);
              const missionHint = section.slotKey === "tentang/misi" ? "Tulis satu misi per baris." : undefined;
              return (
                <AdminCard key={section.slotKey} className="space-y-4">
                  <AdminCardHeader
                    eyebrow={`${section.pageKey}/${section.sectionKey}`}
                    title={section.label}
                    action={<AdminBadge value={section.draft ? "draft" : section.status ?? "draft"} />}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AdminField label="Label kecil">
                      <AdminInput
                        value={section.value.eyebrow ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "eyebrow", event.target.value)}
                        maxLength={120}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                    <AdminField label="Judul">
                      <AdminInput
                        value={section.value.title ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "title", event.target.value)}
                        maxLength={200}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                  </div>
                  <AdminField label="Teks" hint={missionHint}>
                    <AdminTextarea
                      value={section.value.body ?? ""}
                      onChange={(event) => updateValue(section.slotKey, "body", event.target.value)}
                      maxLength={20_000}
                      className="min-h-36"
                      readOnly={!canEdit}
                      disabled={Boolean(pending)}
                    />
                  </AdminField>
                  {section.slotKey === "home/ajakan" ? <div className="grid gap-4 sm:grid-cols-2">
                    <AdminField label="Label tombol">
                      <AdminInput
                        value={section.value.actionLabel ?? ""}
                        onChange={(event) => updateValue(section.slotKey, "actionLabel", event.target.value)}
                        maxLength={120}
                        readOnly={!canEdit}
                        disabled={Boolean(pending)}
                      />
                    </AdminField>
                    <AdminField label="Tautan tombol" hint="Gunakan path situs seperti /pendaftaran atau URL http(s) lengkap.">
                      <AdminInput
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
                        <AdminButton type="button" disabled={Boolean(pending)} onClick={() => void save(section)}>
                          {pending === `${section.slotKey}:save` ? "Menyimpan" : "Simpan draf"}
                        </AdminButton>
                      ) : null}
                      {canPublish && section.draft ? (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          disabled={Boolean(pending) || hasUnpublishedChanges}
                          onClick={() => void publish(section)}
                        >
                          {pending === `${section.slotKey}:publish` ? "Menerbitkan" : "Terbitkan"}
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
