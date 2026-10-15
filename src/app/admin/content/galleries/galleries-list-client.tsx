"use client";

import {
  Calendar,
  FileEdit,
  Globe,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminSelect,
} from "@/components/admin/primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteGalleryAction } from "./actions";

export type GalleryListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  ownerType: "standalone" | "event";
  ownerId: string;
  ownerLabel: string | null;
  displayOrder: number;
  status: string;
  active: boolean;
  version: number;
  coverUrl: string | null;
  coverAlt: string | null;
  itemCount: number;
  photoCount: number;
  videoCount: number;
};

export type GalleriesListClientProps = {
  initialGalleries: GalleryListItem[];
  editionName: string;
  editionId: string;
  filterEventId?: string;
  canEdit: boolean;
};

export function GalleriesListClient({
  initialGalleries,
  editionName,
  filterEventId,
  canEdit,
}: GalleriesListClientProps) {
  const [galleries, setGalleries] = useState<GalleryListItem[]>(initialGalleries);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "standalone" | "event">(
    filterEventId ? "event" : "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<GalleryListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredGalleries = useMemo(() => {
    return galleries.filter((g) => {
      const matchSearch =
        search.trim() === "" ||
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.slug.toLowerCase().includes(search.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()));

      const matchOwner =
        ownerFilter === "all" ||
        (ownerFilter === "standalone" && g.ownerType === "standalone") ||
        (ownerFilter === "event" && g.ownerType === "event");

      const matchEventId = !filterEventId || g.ownerId === filterEventId;

      const matchStatus =
        statusFilter === "all" || g.status === statusFilter;

      return matchSearch && matchOwner && matchEventId && matchStatus;
    });
  }, [galleries, search, ownerFilter, filterEventId, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteGalleryAction({
        id: deleteTarget.id,
        expectedVersion: deleteTarget.version,
      });
      setGalleries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Album "${deleteTarget.title}" berhasil dihapus`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus galeri";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul album, slug, atau deskripsi..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Owner Type Filter */}
          <AdminSelect
            aria-label="Filter tipe album"
            value={ownerFilter}
            onValueChange={(value) => setOwnerFilter(value as "all" | "standalone" | "event")}
            className="h-9 w-auto min-w-[10rem] text-xs"
            options={[
              { value: "all", label: "Semua Tipe Album" },
              { value: "standalone", label: "Album umum" },
              { value: "event", label: "Album Acara" },
            ]}
          />

          {/* Status Filter */}
          <AdminSelect
            aria-label="Filter status album"
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | "published" | "draft")}
            className="h-9 w-auto min-w-[9rem] text-xs"
            options={[
              { value: "all", label: "Semua status" },
              { value: "published", label: "Terbit" },
              { value: "draft", label: "Draf" },
            ]}
          />
        </div>

        {canEdit && (
          <Button asChild className="bg-brand hover:bg-brand/90 text-canvas text-xs h-9">
            <Link href="/admin/content/galleries/new">
              <Plus size={15} className="mr-1.5" /> Tambah album
            </Link>
          </Button>
        )}
      </div>

      {/* Grid of Albums */}
      {filteredGalleries.length === 0 ? (
        <AdminEmptyState
          icon="gallery"
          title="Tidak ada album galeri"
          description={
            search || ownerFilter !== "all" || statusFilter !== "all"
              ? "Tidak ada album galeri yang sesuai dengan filter pencarian."
              : `Belum ada album galeri untuk ${editionName}. Klik Tambah album untuk memulai.`
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGalleries.map((gal) => (
            <AdminCard key={gal.id} padding="none" className="flex flex-col justify-between overflow-hidden">
              <div>
                {/* Cover Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {gal.coverUrl ? (
                    <Image
                      src={gal.coverUrl}
                      alt={gal.coverAlt || gal.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon size={32} className="opacity-40" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {gal.ownerType === "event" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-highlight/90 px-2 py-0.5 text-xs font-semibold text-ink backdrop-blur-xs">
                        <Calendar size={11} /> {gal.ownerLabel || "Acara"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand/90 px-2 py-0.5 text-xs font-semibold text-canvas backdrop-blur-xs">
                        <Globe size={11} /> Umum
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <AdminBadge value={gal.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-inter text-muted-foreground">
                      Urutan: {gal.displayOrder}
                    </span>
                    <span className="text-xs text-highlight-700 font-inter font-medium">
                      /{gal.slug}
                    </span>
                  </div>

                  <h3 className="font-manrope text-sm font-semibold text-foreground line-clamp-1">
                    {gal.title}
                  </h3>

                  {gal.description ? (
                    <p className="font-inter text-xs text-muted-foreground line-clamp-2">
                      {gal.description}
                    </p>
                  ) : (
                    <p className="font-inter text-xs italic text-muted-foreground/60">
                      Tidak ada deskripsi album.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer / Meta & Actions */}
              <div className="border-t border-border p-4 pt-3 bg-muted/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon size={13} className="text-highlight-700" /> {gal.photoCount} Foto
                  </span>
                  {gal.videoCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Video size={13} className="text-highlight-700" /> {gal.videoCount} Video
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                    <Link href={`/admin/content/galleries/${gal.id}`}>
                      <FileEdit size={13} className="mr-1" /> Kelola
                    </Link>
                  </Button>

                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(gal)}
                      className="h-8 px-2 text-xs"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">Hapus album</AlertDialogTitle>
            <AlertDialogDescription className="font-inter text-xs">
              Apakah Anda yakin ingin menghapus album <strong>&quot;{deleteTarget?.title}&quot;</strong>? Semua {deleteTarget?.itemCount} item media di dalam album ini akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              {isDeleting ? "Menghapus..." : "Hapus Album"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
