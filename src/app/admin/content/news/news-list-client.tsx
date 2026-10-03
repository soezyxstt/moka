"use client";

import {
  Calendar,
  FileEdit,
  Newspaper,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
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
import { deleteNewsArticleAction } from "./actions";

export type NewsListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  coverUrl: string | null;
  coverAlt: string | null;
};

export type NewsListClientProps = {
  initialArticles: NewsListItem[];
  editionName: string;
  canEdit: boolean;
};

function newsStatusLabel(status: string): string {
  if (status === "published") return "Terbit";
  if (status === "archived") return "Arsip";
  return "Draf";
}

export function NewsListClient({
  initialArticles,
  editionName,
  canEdit,
}: NewsListClientProps) {
  const [articles, setArticles] = useState<NewsListItem[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [deleteTarget, setDeleteTarget] = useState<NewsListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase()) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [articles, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteNewsArticleAction({ id: deleteTarget.id });
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        toast.success(`Artikel "${deleteTarget.title}" berhasil dihapus`);
        setDeleteTarget(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus artikel";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, slug, atau ringkasan..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "draft", label: "Draft" },
              { key: "published", label: "Terbit" },
              { key: "archived", label: "Arsip" },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className={`h-7 px-3 text-xs font-medium ${
                statusFilter === tab.key
                  ? "bg-white font-semibold text-dgb shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 rounded-sm bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {tab.key === "all"
                  ? articles.length
                  : articles.filter((a) => a.status === tab.key).length}
              </span>
            </Button>
          ))}
        </div>

      </div>

      {/* Article List Grid / Cards */}
      {filteredArticles.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon="file"
            title={articles.length === 0 ? "Belum ada berita" : "Tidak ada berita yang cocok"}
            description={
              articles.length === 0
                ? `Mulai dengan menulis draft berita pertama untuk edisi ${editionName}.`
                : "Coba ubah kata kunci pencarian atau filter status yang dipilih."
            }
          />
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:border-dgb-200 hover:shadow-sm sm:flex-row sm:items-center"
            >
              {/* Cover Thumbnail */}
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-20 sm:w-32">
                {article.coverUrl ? (
                  <Image
                    src={article.coverUrl}
                    alt={article.coverAlt || article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-dgb-50/40 text-dgb-700">
                    <Newspaper size={24} />
                  </div>
                )}
              </div>

              {/* Info Area */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge value={newsStatusLabel(article.status)} />
                  <span className="font-mono text-xs text-muted-foreground">
                    /berita/{article.slug}
                  </span>
                  <span className="text-xs text-muted-foreground">· versi {article.version}</span>
                </div>

                <h3 className="font-montserrat text-base font-bold text-dgb-900 line-clamp-1">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="font-inter text-xs text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {article.publishedAt
                      ? `Tayang: ${new Date(article.publishedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`
                      : `Dibuat: ${new Date(article.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href={`/admin/content/news/${article.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-border text-xs hover:border-dgb-200 hover:bg-dgb-50 hover:text-dgb"
                  >
                    <FileEdit size={13} /> Edit dan pratinjau
                  </Button>
                </Link>

                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(article)}
                    className="h-8 px-2 text-xs text-destructive hover:bg-rose-50"
                    title="Hapus berita"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">Hapus Berita Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel &quot;{deleteTarget?.title}&quot; beserta draft dan riwayat revisinya akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Berita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
