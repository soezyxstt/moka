"use client";

import { useState, useTransition } from "react";
import { Database, LoaderCircle } from "lucide-react";

import { AdminButton } from "@/components/admin/primitives";
import type { Import2025Result } from "@/server/cms/import-2025";
import { import2025ContentAction } from "./import-2025-action";

const countLabels: Record<keyof Import2025Result["counts"], string> = {
  editions: "Edisi",
  pageSections: "Bagian halaman",
  programs: "Program",
  siteAssets: "Binding aset situs",
  organizationPeriods: "Periode organisasi",
  organizationMembers: "Keanggotaan organisasi",
  categories: "Kategori",
  selectionStages: "Tahap seleksi",
  participants: "Peserta unik",
  achievements: "Prestasi",
  participantMedia: "Media peserta tambahan",
  stageEntries: "Entri tahap",
  events: "Kegiatan",
  albums: "Album",
  galleryItems: "Item galeri",
  newsArticles: "Berita",
  sponsors: "Sponsor",
  votingCampaigns: "Kampanye voting",
  profileVideos: "Video profil peserta",
};

export function Import2025Button() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Import2025Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runImport = () => startTransition(async () => {
    setError(null);
    setResult(null);
    try {
      setResult(await import2025ContentAction());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import gagal.");
    }
  });

  return (
    <div className="space-y-4">
      <AdminButton type="button" disabled={pending} onClick={runImport}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Database className="size-4" />}
        {pending ? "Mengimpor" : "Import konten 2025"}
      </AdminButton>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {result ? (
        <div aria-live="polite" className="space-y-3 rounded-xl border border-dgb-100 bg-dgb-50/50 p-4">
          <h2 className="font-montserrat font-semibold text-dgb-900">Import selesai</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {(Object.keys(countLabels) as (keyof Import2025Result["counts"])[]).map((key) => (
              <div key={key}>
                <dt className="text-muted-foreground">{countLabels[key]}</dt>
                <dd className="font-semibold text-dgb-900">{result.counts[key]}</dd>
              </div>
            ))}
          </dl>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
