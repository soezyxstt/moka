"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/primitives";
import { createApplicantAction } from "../selection-actions";

type CategoryOption = {
  id: string;
  code: string;
  label: string;
};

type FirstStage = {
  id: string;
  name: string;
  targetParticipantCount: number;
  lifecycle: string;
};

export function ParticipantCreateForm({
  categories,
  firstStage,
}: {
  categories: CategoryOption[];
  firstStage: FirstStage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.code} (${cat.label})`,
  }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedNumber = parseInt(number, 10);

    if (!trimmedName) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    if (!categoryId) {
      toast.error("Kategori wajib dipilih");
      return;
    }
    if (isNaN(parsedNumber) || parsedNumber < 1) {
      toast.error("Nomor peserta harus berupa bilangan bulat positif");
      return;
    }

    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("name", trimmedName);
    formData.set("number", String(parsedNumber));
    if (slug.trim()) formData.set("slug", slug.trim());
    if (bio.trim()) formData.set("bio", bio.trim());

    startTransition(async () => {
      try {
        const result = await createApplicantAction(formData);
        toast.success("Pendaftar berhasil ditambahkan");
        router.push(`/admin/content/participants/${result.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menambahkan pendaftar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminCard>
        <AdminCardHeader
          title="Penempatan pendaftar"
          description="Pendaftar baru otomatis masuk ke tahap pertama dengan status terdaftar."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Tahap seleksi awal" hint="Tahap pertama alur seleksi yang sedang berjalan">
            <AdminInput
              value={`${firstStage.name} (target: ${firstStage.targetParticipantCount} peserta)`}
              readOnly
              disabled
            />
          </AdminField>
          <AdminField label="Status seleksi" hint="Status default pendaftar baru">
            <AdminInput value="Pending (terdaftar)" readOnly disabled />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="Identitas pendaftar"

        />
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Kategori" hint="Pilih kategori peserta">
              <AdminSelect
                value={categoryId}
                onValueChange={setCategoryId}
                options={categoryOptions}
                aria-label="Pilih kategori"
              />
            </AdminField>

            <AdminField label="Nomor peserta" hint="Nomor urut peserta per kategori">
              <AdminInput
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </AdminField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Nama lengkap" hint="Nama lengkap peserta">
              <AdminInput
                placeholder="Contoh: Mochammad Fauzan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </AdminField>

            <AdminField label="Slug tautan (opsional)" hint="Dibuat otomatis dari nama jika kosong">
              <AdminInput
                placeholder="Contoh: mochammad-fauzan"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </AdminField>
          </div>

          <AdminField label="Biodata singkat (opsional)" hint="Profil ringkas atau latar belakang peserta">
            <AdminTextarea
              placeholder="Tulis ringkasan profil atau biodata pendaftar..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </AdminField>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <AdminLinkButton href="/admin/content/participants" variant="secondary">
          Batal
        </AdminLinkButton>
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan pendaftar"}
        </AdminButton>
      </div>
    </form>
  );
}
