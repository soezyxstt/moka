"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminButton, AdminCard, AdminCardHeader } from "@/components/admin/primitives";
import { import2025MediaBatch } from "@/server/media/import-2025-action";

type ImportResult = Awaited<ReturnType<typeof import2025MediaBatch>>;

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusLabel(status: ImportResult["status"]) {
  if (status === "complete") return "Import selesai";
  if (status === "in_progress") return "Batch selesai";
  if (status === "remote_pending") return "Menunggu UploadThing menyelesaikan file";
  if (status === "storage_limit") return "Kapasitas UploadThing tidak cukup";
  if (status === "blocked") return "File sumber perlu diperiksa";
  return "Batch terhenti dan dapat dicoba lagi";
}

export function Import2025MediaPanel() {
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const running = useRef(false);

  async function runBatch() {
    if (running.current || result?.status === "complete") return;
    running.current = true;
    setPending(true);
    setFailed(false);
    try {
      let currentCursor = cursor;
      while (true) {
        const next = await import2025MediaBatch(currentCursor);
        setResult(next);
        setCursor(next.nextCursor);
        if (next.status !== "in_progress") break;
        currentCursor = next.nextCursor;
      }
    } catch {
      setFailed(true);
    } finally {
      running.current = false;
      setPending(false);
      router.refresh();
    }
  }

  const progress = result ? Math.min(100, (cursor / Math.max(1, result.totalCount)) * 100) : 0;
  const buttonLabel = pending
    ? "Memproses batch"
    : result?.status === "remote_pending"
      ? "Periksa status lagi"
      : result?.status === "in_progress"
      ? "Lanjutkan import"
      : result
        ? "Coba lagi pada batch ini"
        : "Mulai import media 2025";

  return (
    <AdminCard className="mb-6">
      <AdminCardHeader
        eyebrow="Migrasi lokal"
        title="Import media 2025"
        description="Unggah media sumber ke UploadThing dan simpan referensinya di pustaka lokal. Import berjalan per batch dan berhenti jika ada file yang perlu diperiksa atau kapasitas tidak cukup."
      />
      {result ? (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-dgb-900" role="status">{getStatusLabel(result.status)}</p>
          <div>
            <div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground">
              <span>Progres manifest</span>
              <span>{cursor} dari {result.totalCount}</span>
            </div>
            <progress className="h-2 w-full accent-dgb" value={progress} max={100} aria-label="Progres import media 2025" />
          </div>
          <p className="text-xs text-muted-foreground">
            Batch ini: {result.uploadedCount} diunggah, {result.reconciledCount} dipulihkan, {result.skippedCount} sudah tersedia.
          </p>
          {result.status === "storage_limit" ? (
            <p className="text-xs text-destructive" role="alert">
              Diperlukan {formatBytes(result.requiredBytes)}. Kapasitas tersisa {formatBytes(result.remainingBytes)}.
            </p>
          ) : null}
          {failed ? <p className="text-xs text-destructive" role="alert">Batch tidak berhasil. Coba lagi dari posisi ini.</p> : null}
          {result.pendingFiles.length > 0 || result.blockedFiles.length > 0 || result.failedFiles.length > 0 ? (
            <div className="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-xs">
              <p className="mb-2 font-semibold text-foreground">
                {result.pendingFiles.length > 0
                  ? "File yang masih diproses UploadThing"
                  : result.blockedFiles.length > 0
                    ? "File yang perlu diperiksa"
                    : "File yang gagal diproses"}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {[...result.pendingFiles, ...result.blockedFiles, ...result.failedFiles].map((filename) => (
                  <li key={filename} className="break-all"><code>{filename}</code></li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : failed ? (
        <p className="mb-3 text-sm text-destructive" role="alert">Import tidak berhasil. Coba lagi pada batch ini.</p>
      ) : null}
      {result?.status !== "complete" ? (
        <div className="mt-4">
          <AdminButton type="button" disabled={pending} onClick={() => void runBatch()}>
            {buttonLabel}
          </AdminButton>
        </div>
      ) : null}
    </AdminCard>
  );
}
