"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Camera,
  Check,
  ExternalLink,
  Eye,
  Plus,
  QrCode,
  Save,
  Share2,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminField,
  AdminInput,
  AdminMediaField,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/primitives";
import { AdminMediaPicker, type MediaAssetSummary } from "@/components/admin/media-picker";
import {
  saveParticipantAchievementsAction,
  saveParticipantMediaAction,
  saveParticipantSocialLinksAction,
  updateParticipantAction,
  updateParticipantQrisAction,
  type ParticipantAchievementItem,
  type ParticipantMediaItem,
  type ParticipantSocialLinkItem,
} from "../actions";
import type { ParticipantMediaRole, SocialPlatform } from "@/server/db/schema";

export type CategoryOption = { id: string; code: string; label: string };
type EditionInfo = { id: string; year: number; name: string; lifecycle: string };

export type MediaAssetDetail = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  alt: string | null;
  decorative: boolean;
};

export type ParticipantDetail = {
  id: string;
  editionId: string;
  categoryId: string;
  categoryCode: string;
  categoryLabel: string;
  number: number;
  name: string;
  slug: string;
  currentStageId: string | null;
  currentStageName: string | null;
  selectionStatus: "registered" | "active" | "eliminated" | "completed";
  bio: string | null;
  portraitMediaId: string | null;
  portraitAsset: MediaAssetDetail | null;
  qrisMediaId: string | null;
  qrisAsset: MediaAssetDetail | null;
  displayOrder: number;
  active: boolean;
  version: number;
  achievements: { id: string; text: string; displayOrder: number }[];
  socialLinks: { id: string; platform: SocialPlatform; label: string | null; url: string; displayOrder: number }[];
  titles: { id: string; name: string }[];
  media: {
    id: string;
    role: ParticipantMediaRole;
    mediaId: string;
    caption: string | null;
    displayOrder: number;
    active: boolean;
    asset: MediaAssetDetail | null;
  }[];
};

type Props = {
  edition: EditionInfo;
  categories: CategoryOption[];
  participant: ParticipantDetail;
  canEdit: boolean;
  canManageMedia: boolean;
};

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X (Twitter)" },
  { value: "website", label: "Website / Portofolio" },
  { value: "other", label: "Lainnya" },
];

const MEDIA_ROLES: { value: ParticipantMediaRole; label: string; description: string }[] = [
  { value: "closeup", label: "Closeup", description: "Foto wajah/portrait utama (sinkron ke kartu publik)" },
  { value: "full_body", label: "Full Body", description: "Foto seluruh badan dengan busana resmi" },
  { value: "detail", label: "Detail Busana", description: "Detail ornamen batik, bordir, atau aksesoris" },
  { value: "karantina", label: "Karantina", description: "Dokumentasi kegiatan dan pembekalan karantina" },
  { value: "other", label: "Lainnya", description: "Foto pendukung dan kegiatan lainnya" },
  { value: "profile_video", label: "Video profil", description: "Video untuk profil finalis" },
];

export function ParticipantDetailWorkspace({
  edition,
  categories,
  participant: initialParticipant,
  canEdit,
  canManageMedia,
}: Props) {
  const [participant, setParticipant] = useState<ParticipantDetail>(initialParticipant);
  const [activeTab, setActiveTab] = useState<"identity" | "achievements" | "social" | "media" | "qris">("identity");
  const [isPending, startTransition] = useTransition();

  // 1. Identity State
  const [name, setName] = useState(participant.name);
  const [slug, setSlug] = useState(participant.slug);
  const [number, setNumber] = useState(participant.number);
  const [categoryId, setCategoryId] = useState(participant.categoryId);
  const [displayOrder, setDisplayOrder] = useState(participant.displayOrder);
  const [active, setActive] = useState(participant.active);
  const [bio, setBio] = useState(participant.bio ?? "");
  const [identityReason, setIdentityReason] = useState("");

  // 2. Achievements State
  const [achievements, setAchievements] = useState<ParticipantAchievementItem[]>(
    participant.achievements.map((a) => ({ id: a.id, text: a.text, displayOrder: a.displayOrder }))
  );
  const [newAchievementText, setNewAchievementText] = useState("");
  const [achievementsReason, setAchievementsReason] = useState("");

  // 3. Social Links State
  const [socialLinks, setSocialLinks] = useState<ParticipantSocialLinkItem[]>(
    participant.socialLinks.map((s) => ({
      id: s.id,
      platform: s.platform,
      label: s.label,
      url: s.url,
      displayOrder: s.displayOrder,
    }))
  );
  const [socialReason, setSocialReason] = useState("");

  // 4. Media State
  const [mediaItems, setMediaItems] = useState<
    (ParticipantMediaItem & { asset?: MediaAssetDetail | null })[]
  >(
    participant.media.map((m) => ({
      id: m.id,
      role: m.role,
      mediaId: m.mediaId,
      caption: m.caption,
      displayOrder: m.displayOrder,
      active: m.active,
      asset: m.asset,
    }))
  );
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [targetRoleForNewMedia, setTargetRoleForNewMedia] = useState<ParticipantMediaRole>("closeup");
  const [mediaReason, setMediaReason] = useState("");

  // 5. QRIS State
  const [qrisAsset, setQrisAsset] = useState<MediaAssetDetail | null>(participant.qrisAsset);
  const [qrisReason, setQrisReason] = useState("");

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === participant.slug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  // Find active closeup
  const activeCloseupItem = mediaItems.find((m) => m.role === "closeup" && m.active);
  const liveCloseupUrl = activeCloseupItem?.asset?.url ?? participant.portraitAsset?.url ?? null;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Save Identity
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      toast.error("Nama dan kategori wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateParticipantAction({
          participantId: participant.id,
          expectedVersion: participant.version,
          categoryId,
          name: name.trim(),
          slug: slug.trim() || undefined,
          number: Number(number),
          bio: bio.trim() || null,
          displayOrder: Number(displayOrder),
          active,
          reason: identityReason.trim() || undefined,
        });

        const selectedCat = categories.find((c) => c.id === categoryId);
        setParticipant((prev) => ({
          ...prev,
          name: name.trim(),
          slug: slug.trim(),
          number: Number(number),
          categoryId,
          categoryCode: selectedCat?.code ?? prev.categoryCode,
          categoryLabel: selectedCat?.label ?? prev.categoryLabel,
          bio: bio.trim() || null,
          displayOrder: Number(displayOrder),
          active,
          version: res.version,
        }));

        setIdentityReason("");
        toast.success("Identitas peserta berhasil diperbarui");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui identitas peserta");
      }
    });
  };

  // Add Achievement Row
  const handleAddAchievement = () => {
    if (!newAchievementText.trim()) return;
    setAchievements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: newAchievementText.trim(),
        displayOrder: prev.length,
      },
    ]);
    setNewAchievementText("");
  };

  // Move Achievement
  const handleMoveAchievement = (index: number, direction: "up" | "down") => {
    const newItems = [...achievements];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIdx, 0, moved);
    setAchievements(newItems.map((item, idx) => ({ ...item, displayOrder: idx })));
  };

  // Delete Achievement
  const handleDeleteAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, displayOrder: idx })));
  };

  // Save Achievements
  const handleSaveAchievements = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await saveParticipantAchievementsAction(
          participant.id,
          achievements,
          participant.version,
          achievementsReason.trim() || undefined
        );
        setParticipant((prev) => ({
          ...prev,
          version: res.version,
          achievements: achievements.map((a, i) => ({ id: a.id ?? String(i), text: a.text, displayOrder: a.displayOrder })),
        }));
        setAchievementsReason("");
        toast.success("Daftar prestasi berhasil diperbarui");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan prestasi");
      }
    });
  };

  // Add Social Link Row
  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        platform: "instagram",
        label: "",
        url: "https://instagram.com/",
        displayOrder: prev.length,
      },
    ]);
  };

  // Move Social Link
  const handleMoveSocialLink = (index: number, direction: "up" | "down") => {
    const newItems = [...socialLinks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIdx, 0, moved);
    setSocialLinks(newItems.map((item, idx) => ({ ...item, displayOrder: idx })));
  };

  // Delete Social Link
  const handleDeleteSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, displayOrder: idx })));
  };

  // Save Social Links
  const handleSaveSocialLinks = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await saveParticipantSocialLinksAction(
          participant.id,
          socialLinks,
          participant.version,
          socialReason.trim() || undefined
        );
        setParticipant((prev) => ({
          ...prev,
          version: res.version,
          socialLinks: socialLinks.map((s, i) => ({
            id: s.id ?? String(i),
            platform: s.platform,
            label: s.label ?? null,
            url: s.url,
            displayOrder: s.displayOrder,
          })),
        }));
        setSocialReason("");
        toast.success("Tautan sosial media berhasil disimpan");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan sosial media");
      }
    });
  };

  // Select Media from Picker
  const handleMediaSelected = (asset: MediaAssetSummary) => {
    const assetDetail: MediaAssetDetail = {
      id: asset.id,
      url: asset.url,
      filename: asset.filename,
      mimeType: asset.mimeType,
      bytes: asset.bytes,
      alt: asset.alt,
      decorative: asset.decorative,
    };

    // If target role is closeup, deactivate other closeup items
    let updatedMedia = [...mediaItems];
    if (targetRoleForNewMedia === "closeup" || targetRoleForNewMedia === "profile_video") {
      updatedMedia = updatedMedia.map((m) => (m.role === targetRoleForNewMedia ? { ...m, active: false } : m));
    }

    updatedMedia.push({
      id: crypto.randomUUID(),
      role: targetRoleForNewMedia,
      mediaId: asset.id,
      caption: "",
      displayOrder: updatedMedia.length,
      active: true,
      asset: assetDetail,
    });

    setMediaItems(updatedMedia);
    setMediaPickerOpen(false);
    toast.success(`Media ${asset.filename} ditambahkan`);
  };

  // Delete Media Row
  const handleDeleteMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, idx) => idx !== index).map((m, idx) => ({ ...m, displayOrder: idx })));
  };

  // Toggle Media Active
  const handleToggleMediaActive = (index: number) => {
    setMediaItems((prev) =>
      prev.map((m, idx) => {
        if (idx !== index) return m;
        // If enabling a closeup, ensure other closeups become inactive
        if (!m.active && (m.role === "closeup" || m.role === "profile_video")) {
          return { ...m, active: true };
        }
        return { ...m, active: !m.active };
      }).map((m) => {
        const changed = prev[index];
        if (m.active && changed?.id !== m.id && m.role === changed?.role && (m.role === "closeup" || m.role === "profile_video")) {
          return { ...m, active: false };
        }
        return m;
      })
    );
  };

  // Save Media Gallery
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload: ParticipantMediaItem[] = mediaItems.map((m, idx) => ({
          role: m.role,
          mediaId: m.mediaId,
          caption: m.caption?.trim() || null,
          displayOrder: Number.isInteger(m.displayOrder) ? m.displayOrder : idx,
          active: m.active,
        }));

        const res = await saveParticipantMediaAction(
          participant.id,
          payload,
          participant.version,
          mediaReason.trim() || undefined
        );

        setParticipant((prev) => ({
          ...prev,
          version: res.version,
          portraitMediaId: res.portraitMediaId,
          media: mediaItems.map((m, i) => ({
            id: m.id ?? String(i),
            role: m.role,
            mediaId: m.mediaId,
            caption: m.caption ?? null,
            displayOrder: m.displayOrder,
            active: m.active ?? true,
            asset: m.asset ?? null,
          })),
        }));

        setMediaReason("");
        toast.success("Media peserta berhasil diperbarui");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan foto peserta");
      }
    });
  };

  // Save QRIS
  const handleSaveQris = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrisReason.trim()) {
      toast.error("Alasan pembaruan QRIS wajib diisi");
      return;
    }

    const formData = new FormData();
    formData.set("participantId", participant.id);
    formData.set("expectedVersion", String(participant.version));
    if (qrisAsset) formData.set("qrisMediaId", qrisAsset.id);
    formData.set("reason", qrisReason.trim());

    startTransition(async () => {
      try {
        const res = await updateParticipantQrisAction(formData);
        setParticipant((prev) => ({
          ...prev,
          qrisMediaId: qrisAsset?.id ?? null,
          qrisAsset,
          version: res.version,
        }));
        setQrisReason("");
        toast.success("QRIS berhasil diperbarui");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui QRIS");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb, Title, and Version Pill */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
            <Link href="/admin/content/participants">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-montserrat text-xs font-semibold uppercase text-fb-500">
                Peserta #{String(participant.number).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{participant.categoryLabel}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{edition.name}</span>
            </div>
            <h1 className="font-montserrat text-xl font-bold text-dgb-900 sm:text-2xl">
              {participant.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-dgb-200 bg-dgb-50 px-2.5 py-1 font-mono text-xs font-semibold text-dgb-900">
            v{participant.version}
          </span>
          <AdminBadge value={participant.currentStageName ?? "Tahap belum terhubung"} />
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              participant.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {participant.active ? "Aktif" : "Nonaktif"}
          </span>
        </div>
      </div>

      {/* 2. Main Content Grid: Tabs in Left (60-65%) + Live Preview in Right (35-40%) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Editor Tabs */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("identity")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-montserrat text-xs font-semibold transition-all ${
                activeTab === "identity"
                  ? "bg-white text-dgb-900 shadow-xs"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <User size={14} /> Identitas
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("achievements")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-montserrat text-xs font-semibold transition-all ${
                activeTab === "achievements"
                  ? "bg-white text-dgb-900 shadow-xs"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <Award size={14} /> Prestasi ({achievements.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("social")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-montserrat text-xs font-semibold transition-all ${
                activeTab === "social"
                  ? "bg-white text-dgb-900 shadow-xs"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <Share2 size={14} /> Sosial Media ({socialLinks.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("media")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-montserrat text-xs font-semibold transition-all ${
                activeTab === "media"
                  ? "bg-white text-dgb-900 shadow-xs"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <Camera size={14} /> Galeri Foto ({mediaItems.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("qris")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-montserrat text-xs font-semibold transition-all ${
                activeTab === "qris"
                  ? "bg-white text-dgb-900 shadow-xs"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <QrCode size={14} /> QRIS
            </Button>
          </div>

          {/* TAB 1: IDENTITAS */}
          {activeTab === "identity" ? (
            <AdminCard className="p-4 sm:p-5">
              <AdminCardHeader
                eyebrow="Identitas"
                title="Informasi Dasar & Biodata"
              />
              <form onSubmit={handleSaveIdentity} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Kategori" className="sm:col-span-2">
                    <AdminSelect
                      value={categoryId}
                      onValueChange={setCategoryId}
                      required
                      options={categories.map((c) => ({ value: c.id, label: `${c.label} (${c.code})` }))}
                    />
                  </AdminField>

                  <AdminField label="Nama lengkap" className="sm:col-span-2">
                    <AdminInput
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </AdminField>

                  <AdminField label="Slug profil" hint="URL slug unik per tahap">
                    <AdminInput
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                    />
                  </AdminField>

                  <AdminField label="Nomor urut">
                    <AdminInput
                      type="number"
                      min="1"
                      value={number}
                      onChange={(e) => setNumber(Number(e.target.value))}
                      required
                    />
                  </AdminField>

                  <AdminField label="Tahap seleksi">
                    <AdminInput value={participant.currentStageName ?? "Belum terhubung"} readOnly disabled />
                  </AdminField>

                  <AdminField label="Urutan penampilan">
                    <AdminInput
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    />
                  </AdminField>

                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 sm:col-span-2">
                    <Checkbox
                      id="participant-active-toggle"
                      checked={active}
                      onCheckedChange={(checked) => setActive(checked === true)}
                    />
                    <label htmlFor="participant-active-toggle" className="cursor-pointer text-xs">
                      <span className="font-semibold text-foreground">Status Aktif</span>
                      <p className="text-muted-foreground">
                        Peserta aktif akan muncul dalam daftar seleksi dan halaman profil publik.
                      </p>
                    </label>
                  </div>

                  <AdminField label="Bio singkat" className="sm:col-span-2">
                    <AdminTextarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tuliskan latar belakang pendidikan, hobi, atau kutipan peserta..."
                    />
                  </AdminField>

                  <AdminField label="Alasan perubahan (opsional)" className="sm:col-span-2">
                    <AdminInput
                      placeholder="Misal: Penyesuaian nomor urut dan kategori"
                      value={identityReason}
                      onChange={(e) => setIdentityReason(e.target.value)}
                    />
                  </AdminField>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canEdit || isPending}
                    className="bg-dgb font-montserrat text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Save size={14} className="mr-1.5" />
                    {isPending ? "Menyimpan..." : "Simpan identitas"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          ) : null}

          {/* TAB 2: PRESTASI */}
          {activeTab === "achievements" ? (
            <AdminCard className="p-4 sm:p-5">
              <AdminCardHeader
                eyebrow="Prestasi & Penghargaan"
                title={`Daftar Prestasi (${achievements.length})`}
              />
              <form onSubmit={handleSaveAchievements} className="space-y-4 pt-2">
                {/* Add Achievement Input */}
                <div className="flex gap-2">
                  <AdminInput
                    placeholder="Tuliskan prestasi baru (contoh: Juara 1 Duta Bahasa 2024)..."
                    value={newAchievementText}
                    onChange={(e) => setNewAchievementText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddAchievement}
                    disabled={!newAchievementText.trim()}
                    className="shrink-0 bg-dgb text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Plus size={14} className="mr-1" /> Tambah
                  </Button>
                </div>

                {/* Achievements List */}
                {achievements.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Belum ada prestasi yang ditambahkan. Gunakan input di atas untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {achievements.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        className="flex items-center gap-2 rounded-lg border border-border bg-white p-2.5 shadow-xs"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-dgb-50 text-[11px] font-bold text-dgb">
                          {index + 1}
                        </span>
                        <AdminInput
                          value={item.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAchievements((prev) =>
                              prev.map((a, i) => (i === index ? { ...a, text: val } : a))
                            );
                          }}
                          className="h-8 text-xs flex-1"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => handleMoveAchievement(index, "up")}
                            className="size-8 p-0"
                            title="Pindah ke atas"
                          >
                            <ArrowUp size={13} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === achievements.length - 1}
                            onClick={() => handleMoveAchievement(index, "down")}
                            className="size-8 p-0"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown size={13} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAchievement(index)}
                            className="size-8 p-0 text-destructive hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AdminField label="Alasan perubahan (opsional)">
                  <AdminInput
                    placeholder="Misal: Menambahkan gelar kejuaraan terbaru"
                    value={achievementsReason}
                    onChange={(e) => setAchievementsReason(e.target.value)}
                  />
                </AdminField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canEdit || isPending}
                    className="bg-dgb font-montserrat text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Save size={14} className="mr-1.5" />
                    {isPending ? "Menyimpan..." : "Simpan daftar prestasi"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          ) : null}

          {/* TAB 3: SOSIAL MEDIA */}
          {activeTab === "social" ? (
            <AdminCard className="p-4 sm:p-5">
              <AdminCardHeader
                eyebrow="Media sosial"
                title={`Akun Sosial Media (${socialLinks.length})`}
              />
              <form onSubmit={handleSaveSocialLinks} className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Format URL harus menggunakan http/https lengkap.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSocialLink}
                    className="text-xs border-dgb-200 text-dgb hover:bg-dgb-50"
                  >
                    <Plus size={14} className="mr-1" /> Tambah akun
                  </Button>
                </div>

                {socialLinks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Belum ada tautan sosial media. Klik tombol di atas untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {socialLinks.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        className="grid gap-2 rounded-lg border border-border bg-white p-3 shadow-xs sm:grid-cols-12 sm:items-center"
                      >
                        <div className="sm:col-span-3">
                          <AdminSelect
                            value={item.platform}
                            onValueChange={(nextPlatform) => {
                              const platform = nextPlatform as SocialPlatform;
                              setSocialLinks((prev) =>
                                prev.map((s, i) => (i === index ? { ...s, platform } : s))
                              );
                            }}
                            className="h-8 text-xs"
                            options={SOCIAL_PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
                          />
                        </div>

                        {item.platform === "other" ? (
                          <div className="sm:col-span-3">
                            <AdminInput
                              placeholder="Label platform"
                              value={item.label ?? ""}
                              onChange={(e) => {
                                const label = e.target.value;
                                setSocialLinks((prev) =>
                                  prev.map((s, i) => (i === index ? { ...s, label } : s))
                                );
                              }}
                              className="h-8 text-xs"
                              required
                            />
                          </div>
                        ) : null}

                        <div className={item.platform === "other" ? "sm:col-span-4" : "sm:col-span-7"}>
                          <AdminInput
                            type="url"
                            placeholder="https://..."
                            value={item.url}
                            onChange={(e) => {
                              const url = e.target.value;
                              setSocialLinks((prev) =>
                                prev.map((s, i) => (i === index ? { ...s, url } : s))
                              );
                            }}
                            className="h-8 text-xs"
                            required
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1 sm:col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => handleMoveSocialLink(index, "up")}
                            className="size-8 p-0"
                          >
                            <ArrowUp size={13} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === socialLinks.length - 1}
                            onClick={() => handleMoveSocialLink(index, "down")}
                            className="size-8 p-0"
                          >
                            <ArrowDown size={13} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSocialLink(index)}
                            className="size-8 p-0 text-destructive hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AdminField label="Alasan perubahan (opsional)">
                  <AdminInput
                    placeholder="Misal: Update link akun Instagram resmi"
                    value={socialReason}
                    onChange={(e) => setSocialReason(e.target.value)}
                  />
                </AdminField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canEdit || isPending}
                    className="bg-dgb font-montserrat text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Save size={14} className="mr-1.5" />
                    {isPending ? "Menyimpan..." : "Simpan sosial media"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          ) : null}

          {/* TAB 4: GALERI MEDIA PESERTA */}
          {activeTab === "media" ? (
            <AdminCard className="p-4 sm:p-5">
              <AdminCardHeader
                eyebrow="Galeri"
                title={`Media Peserta (${mediaItems.length})`}
              />
              <form onSubmit={handleSaveMedia} className="space-y-4 pt-2">
                {/* Actions & Role Picker */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dgb-100 bg-dgb-50/30 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-dgb-900">Jenis media:</span>
                    <AdminSelect
                      value={targetRoleForNewMedia}
                      onValueChange={(nextRole) => setTargetRoleForNewMedia(nextRole as ParticipantMediaRole)}
                      className="h-8 text-xs w-36 bg-white"
                      options={MEDIA_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="h-8 bg-dgb text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Plus size={14} className="mr-1" /> Tambah {targetRoleForNewMedia === "profile_video" ? "video profil" : "foto"}
                  </Button>
                </div>

                {/* Media Items List */}
                {mediaItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada media peserta. Pilih jenis media lalu tambahkan aset dari pustaka.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mediaItems.map((item, index) => {
                      const asset = item.asset;
                      const isCloseup = item.role === "closeup";
                      const isVideo = item.role === "profile_video";
                      const roleOptions = MEDIA_ROLES.filter((role) =>
                        role.value === item.role || (role.value === "profile_video"
                          ? asset?.mimeType.startsWith("video/")
                          : asset?.mimeType.startsWith("image/"))
                      );

                      return (
                        <div
                          key={item.id ?? index}
                          className={`flex flex-col gap-3 rounded-lg border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                            item.active ? "border-border bg-white" : "border-border/60 bg-muted/40 opacity-75"
                          }`}
                        >
                          {/* Image Thumbnail & Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              {asset?.url && asset.mimeType.startsWith("image/") ? (
                                <Image
                                  src={asset.url}
                                  alt={asset.alt ?? asset.filename}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : isVideo && asset?.mimeType.startsWith("video/") ? (
                                <div className="grid size-full place-items-center bg-fb-50 text-fb-700">
                                  <Video size={22} />
                                </div>
                              ) : (
                                <div className="grid size-full place-items-center bg-muted text-muted-foreground">
                                  <Camera size={20} />
                                </div>
                              )}
                              {isCloseup && item.active ? (
                                <span className="absolute top-0 right-0 rounded-bl-sm bg-dgb px-1 py-0.2 text-[9px] font-bold text-white">
                                  UTAMA
                                </span>
                              ) : null}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <AdminSelect
                                  value={item.role}
                                  onValueChange={(nextRole) => {
                                    const role = nextRole as ParticipantMediaRole;
                                    setMediaItems((prev) => prev.map((m, i) => {
                                      if (i === index) return { ...m, role };
                                      return m.role === role && (role === "closeup" || role === "profile_video")
                                        ? { ...m, active: false }
                                        : m;
                                    }));
                                  }}
                                  className="h-7 text-[11px] font-semibold w-32"
                                  options={roleOptions.map((r) => ({ value: r.value, label: r.label }))}
                                />

                                <span className="truncate text-xs font-semibold text-dgb-900 max-w-44" title={asset?.filename}>
                                  {asset?.filename ?? item.mediaId}
                                </span>
                              </div>

                              <AdminInput
                                placeholder="Keterangan media (opsional)..."
                                value={item.caption ?? ""}
                                onChange={(e) => {
                                  const caption = e.target.value;
                                  setMediaItems((prev) =>
                                    prev.map((m, i) => (i === index ? { ...m, caption } : m))
                                  );
                                }}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>

                          {/* Control Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleMediaActive(index)}
                              className={`h-7 text-[11px] ${
                                item.active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {item.active ? "Aktif" : "Nonaktif"}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMedia(index)}
                              className="h-7 text-[11px] text-destructive hover:bg-rose-50"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <AdminField label="Alasan perubahan (opsional)">
                  <AdminInput
                    placeholder="Misal: Menambahkan foto karantina dan busana adat"
                    value={mediaReason}
                    onChange={(e) => setMediaReason(e.target.value)}
                  />
                </AdminField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canEdit || isPending}
                    className="bg-dgb font-montserrat text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Save size={14} className="mr-1.5" />
                    {isPending ? "Menyimpan..." : "Simpan galeri foto"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          ) : null}

          {/* TAB 5: QRIS */}
          {activeTab === "qris" ? (
            <AdminCard className="p-4 sm:p-5">
              <AdminCardHeader
                eyebrow="Voting"
                title="Gambar QRIS"
                description="Unggah atau pilih gambar QRIS yang dibuat di luar website."
              />
              <form onSubmit={handleSaveQris} className="space-y-4 pt-2">
                <AdminMediaField
                  name="qrisMediaId"
                  label="Gambar QRIS Peserta"
                  hint="Gunakan gambar siap pakai dari pustaka media."
                  aspectRatioHint="1:1"
                  initialAsset={
                    qrisAsset
                      ? {
                          id: qrisAsset.id,
                          url: qrisAsset.url,
                          filename: qrisAsset.filename,
                          mimeType: qrisAsset.mimeType,
                          bytes: qrisAsset.bytes,
                          alt: qrisAsset.alt,
                          decorative: qrisAsset.decorative,
                          lifecycle: "ready",
                          folderId: null,
                        }
                      : null
                  }
                  onChange={(asset) => {
                    setQrisAsset(
                      asset
                        ? {
                            id: asset.id,
                            url: asset.url,
                            filename: asset.filename,
                            mimeType: asset.mimeType,
                            bytes: asset.bytes,
                            alt: asset.alt,
                            decorative: asset.decorative,
                          }
                        : null
                    );
                  }}
                  acceptType="image"
                  canManageMedia={canManageMedia}
                  activeEditionId={edition.id}
                />

                <AdminField label="Alasan perubahan QRIS">
                  <AdminInput
                    placeholder="Contoh: Pembaruan QRIS merchant edisi 2026"
                    value={qrisReason}
                    onChange={(e) => setQrisReason(e.target.value)}
                    required
                  />
                </AdminField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canEdit || isPending}
                    className="bg-dgb font-montserrat text-xs font-semibold text-white hover:bg-dgb/90"
                  >
                    <Save size={14} className="mr-1.5" />
                    {isPending ? "Menyimpan..." : "Simpan QRIS peserta"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          ) : null}
        </div>

        {/* Right Column: Live Preview Card */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 space-y-4">
            <h3 className="font-montserrat text-sm font-bold text-dgb-900 flex items-center gap-2">
              <Eye size={16} className="text-fb" /> Live Preview Profil
            </h3>

            {/* Public Card Mockup */}
            <div className="overflow-hidden rounded-xl border border-dgb-200/80 bg-white shadow-md">
              {/* Image Box */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-dgb-900">
                {liveCloseupUrl ? (
                  <Image
                    src={liveCloseupUrl}
                    alt={participant.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-dgb-300">
                    <User size={64} />
                    <p className="absolute bottom-6 text-xs text-white/70">Foto closeup belum diatur</p>
                  </div>
                )}

                {/* Card Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                {/* Top badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span className="rounded-md bg-black/60 px-2 py-1 font-montserrat text-xs font-bold text-white backdrop-blur-xs">
                    #{String(number).padStart(2, "0")}
                  </span>
                  <span className="rounded-md bg-fb px-2.5 py-1 font-montserrat text-xs font-bold text-black shadow-xs">
                    {categories.find((c) => c.id === categoryId)?.label ?? participant.categoryLabel}
                  </span>
                </div>

                {/* Bottom Card Content */}
                <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                  <p className="font-montserrat text-lg font-bold leading-snug drop-shadow-xs">
                    {name || "Nama Peserta"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/80">
                    {edition.name} · {participant.currentStageName ?? "Tahap belum terhubung"}
                  </p>
                </div>
              </div>

              {/* Brand strip */}
              <div className="flex h-6 items-center justify-center gap-4 bg-gradient-to-r from-fb via-fb-200 to-fb px-3 text-[10px] font-bold text-black uppercase">
                <span>mokagarut</span>
                <span>#nyundaturnyakola</span>
                <span>#kayakarya</span>
              </div>

              {/* Card Body Details */}
              <div className="p-4 space-y-3 text-xs">
                {bio ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Bio</span>
                    <p className="text-xs text-foreground/90 line-clamp-3 mt-0.5">{bio}</p>
                  </div>
                ) : null}

                {/* Achievements Chips */}
                {achievements.length > 0 ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Prestasi</span>
                    <ul className="mt-1 space-y-1">
                      {achievements.slice(0, 3).map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                          <Award size={12} className="shrink-0 text-fb-500 mt-0.5" />
                          <span className="truncate">{a.text}</span>
                        </li>
                      ))}
                      {achievements.length > 3 ? (
                        <li className="text-[10px] text-muted-foreground font-medium">
                          +{achievements.length - 3} prestasi lainnya
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {participant.titles.length > 0 ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Gelar</span>
                    <p className="mt-0.5 text-xs font-semibold text-dgb-900">
                      {participant.titles.map((title) => title.name).join(", ")}
                    </p>
                  </div>
                ) : null}

                {/* Social Icons */}
                {socialLinks.length > 0 ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Sosial Media</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {socialLinks.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-sm border border-dgb-100 bg-dgb-50/50 px-2 py-0.5 text-[10px] font-medium text-dgb-900 hover:bg-dgb-100"
                        >
                          <ExternalLink size={10} />
                          {s.label || s.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* QRIS Status */}
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <QrCode size={14} className={qrisAsset ? "text-emerald-600" : "text-destructive"} />
                    <span className="text-[11px] font-medium">
                      {qrisAsset ? "QRIS Terpasang" : "QRIS Belum Ada"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Checklist */}
            <AdminCard className="space-y-2 p-4 sm:p-4">
              <h4 className="font-montserrat text-xs font-bold text-dgb-900">Kelengkapan Profil</h4>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Foto Closeup Utama</span>
                  {liveCloseupUrl ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check size={13} /> Siap
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <AlertCircle size={13} /> Belum ada
                    </span>
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Biodata Singkat</span>
                  {bio ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check size={13} /> Terisi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                      Kosong
                    </span>
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prestasi Tercatat</span>
                  <span className="font-semibold text-foreground">{achievements.length} butir</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aset QRIS Voting</span>
                  {qrisAsset ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check size={13} /> Siap
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-destructive">
                      <X size={13} /> Belum ada
                    </span>
                  )}
                </li>
              </ul>
            </AdminCard>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <AdminMediaPicker
        key={targetRoleForNewMedia}
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelected}
        acceptType={targetRoleForNewMedia === "profile_video" ? "video" : "image"}
        title={targetRoleForNewMedia === "profile_video" ? "Pilih video profil" : `Pilih foto untuk ${targetRoleForNewMedia}`}
        canManageMedia={canManageMedia}
        activeEditionId={edition.id}
      />
    </div>
  );
}
