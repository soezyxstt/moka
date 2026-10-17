import type { auditLogs, authUsers } from "@/server/db/schema";

type UserSummary = Pick<typeof authUsers.$inferSelect, "id" | "name" | "email">;
type AuditLogEntry = Pick<
  typeof auditLogs.$inferSelect,
  "id" | "createdAt" | "action" | "actorUserId" | "actorLabel" | "resourceType" | "resourceId" | "resourceLabel"
>;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // Sponsor
  "sponsor.create": "Tambah sponsor",
  "sponsor.update": "Perbarui sponsor",
  "sponsor.delete": "Hapus sponsor",
  "sponsor.activate": "Aktifkan sponsor",
  "sponsor.deactivate": "Nonaktifkan sponsor",

  // Acara
  "event.create": "Tambah acara",
  "event.update": "Perbarui acara",
  "event.delete": "Hapus acara",
  "event.reorder": "Ubah urutan acara",

  // Berita
  "news.create": "Buat berita",
  "news.update": "Perbarui berita",
  "news.publish": "Terbitkan berita",
  "news.unpublish": "Tarik publikasi berita",
  "news.archive": "Arsipkan berita",
  "news.delete": "Hapus berita",

  // Peserta
  "participant.create": "Tambah peserta",
  "participant.update": "Perbarui data peserta",
  "participant.achievements.update": "Perbarui prestasi peserta",
  "participant.social_links.update": "Perbarui media sosial peserta",
  "participant.media.update": "Perbarui foto peserta",
  "participant.qris.update": "Perbarui QRIS peserta",
  "participant.active.toggle": "Ubah status aktif peserta",
  "participant.delete": "Hapus peserta",

  // Galeri
  "gallery.create": "Buat album galeri",
  "gallery.update": "Perbarui album galeri",
  "gallery.delete": "Hapus album galeri",
  "gallery.items.add": "Tambah foto galeri",
  "gallery.item.update": "Perbarui foto galeri",
  "gallery.item.delete": "Hapus foto galeri",
  "gallery.items.reorder": "Ubah urutan foto galeri",

  // Berkas Media
  "media.upload.complete": "Unggah berkas media",
  "media.folder.create": "Buat folder media",
  "media.folder.rename": "Ubah nama folder media",
  "media.asset.metadata.update": "Perbarui info berkas media",
  "media.asset.move": "Pindahkan berkas media",

  // Akses & Pengguna
  "access.request.create": "Ajukan permohonan akses",
  "access.request.approve": "Setujui permohonan akses",
  "access.request.reject": "Tolak permohonan akses",
  "access.bootstrap": "Inisialisasi hak akses",
  "user.roles.update": "Ubah peran pengguna",
  "user.permission_overrides.update": "Ubah izin khusus pengguna",
  "user.profile.update": "Perbarui profil",

  // Edisi & Kategori
  "edition.create": "Buat edisi baru",
  "edition.update": "Perbarui edisi",
  "edition.activate": "Aktifkan edisi",
  "edition.context.select": "Pilih konteks edisi",
  "edition.palette.publish": "Publikasikan palet warna",
  "category.create": "Tambah kategori",
  "category.update": "Perbarui kategori",

  // Organisasi & Kepengurusan
  "organization.period.create": "Buat periode kepengurusan",
  "organization.period.update": "Perbarui periode kepengurusan",
  "organization.period.editions.update": "Perbarui edisi kepengurusan",
  "organization.period.delete": "Hapus periode kepengurusan",
  "organization.unit.create": "Tambah bidang organisasi",
  "organization.unit.update": "Perbarui bidang organisasi",
  "organization.unit.delete": "Hapus bidang organisasi",
  "organization.unit.reorder": "Ubah urutan bidang organisasi",
  "organization.membership.create": "Tambah pengurus organisasi",
  "organization.membership.update": "Perbarui pengurus organisasi",
  "organization.membership.delete": "Hapus pengurus organisasi",
  "person.create": "Tambah profil anggota",
  "person.update": "Perbarui profil anggota",
  "person.delete": "Hapus profil anggota",
  "organization.legacy.map": "Pemetaan struktur kepengurusan",

  // Voting
  "voting.campaign.create": "Buat kampanye voting",
  "voting.campaign.update": "Perbarui kampanye voting",
  "voting.campaign.stage.update": "Perbarui tahap voting",
  "voting.campaign.start": "Mulai kampanye voting",
  "voting.campaign.close": "Tutup kampanye voting",
  "voting.campaign.delete": "Hapus kampanye voting",
  "voting.campaign.visibility.update": "Ubah visibilitas voting",
  "voting.campaign.resultUpdatedAt.update": "Ubah visibilitas waktu pembaruan voting",
  "voting.tally.create": "Catat suara voting",
  "voting.tally.correct": "Koreksi suara voting",

  // Seleksi & Gelar
  "selection_stage.create": "Buat tahap seleksi",
  "selection_stage.update": "Perbarui tahap seleksi",
  "selection_stage.reorder": "Ubah urutan tahap seleksi",
  "selection_stage.open": "Buka tahap seleksi",
  "selection_stage.close": "Tutup tahap seleksi",
  "selection_stage.reopen": "Buka kembali tahap seleksi",
  "selection_stage.delete": "Hapus tahap seleksi",
  "participant_stage_entry.bulk_decision": "Perbarui kelulusan peserta",
  "participant_stage_entry.rollback": "Batalkan status kelulusan",
  "edition_title.create": "Tambah gelar kejuaraan",
  "edition_title.update": "Perbarui gelar kejuaraan",
  "edition_title.reorder": "Ubah urutan gelar kejuaraan",
  "edition_title.active.update": "Ubah status gelar kejuaraan",
  "edition_title.delete": "Hapus gelar kejuaraan",
  "edition_title.assign": "Sematkan gelar ke peserta",
  "edition_title.unassign": "Lepas gelar dari peserta",
  "selection.backfill": "Sinkronisasi riwayat seleksi",

  // Konten & CMS
  "content.draft.save": "Simpan draf konten",
  "content.publish": "Publikasikan konten",
  "site_asset.bind": "Pasang aset tampilan situs",
  "site_asset.unbind": "Lepas aset tampilan situs",
  "cms.import.2025": "Impor konten 2025",
  "cms.repair.2025-stage-numbering": "Perbaikan urutan tahap seleksi 2025",
};

export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  sponsor: "Sponsor",
  event: "Acara",
  news: "Berita",
  newsArticle: "Berita",
  participant: "Peserta",
  gallery: "Galeri",
  mediaAsset: "Berkas media",
  mediaFolder: "Folder media",
  accessRequest: "Permohonan akses",
  user: "Pengguna",
  adminProfile: "Profil admin",
  edition: "Edisi",
  category: "Kategori",
  organizationPeriod: "Periode kepengurusan",
  organization_unit: "Bidang organisasi",
  organizationUnit: "Bidang organisasi",
  organizationMembership: "Keanggotaan",
  person: "Profil pengurus",
  votingCampaign: "Voting",
  voteDailyTally: "Perolehan suara",
  selectionStage: "Tahap seleksi",
  selection_stage: "Tahap seleksi",
  editionTitle: "Gelar kejuaraan",
  edition_title: "Gelar kejuaraan",
  participant_stage_entry: "Peserta seleksi",
  pageSection: "Konten halaman",
  siteAssetBinding: "Aset situs",
};

const VERB_DICTIONARY: Record<string, string> = {
  create: "Tambah",
  update: "Perbarui",
  delete: "Hapus",
  reorder: "Ubah urutan",
  publish: "Terbitkan",
  unpublish: "Tarik publikasi",
  archive: "Arsipkan",
  activate: "Aktifkan",
  deactivate: "Nonaktifkan",
  open: "Buka",
  close: "Tutup",
  reopen: "Buka kembali",
  start: "Mulai",
  stop: "Hentikan",
  move: "Pindahkan",
  bind: "Pasang",
  unbind: "Lepas",
  approve: "Setujui",
  reject: "Tolak",
  save: "Simpan",
  complete: "Selesaikan",
  select: "Pilih",
};

const NOUN_DICTIONARY: Record<string, string> = {
  sponsor: "sponsor",
  event: "acara",
  news: "berita",
  participant: "peserta",
  gallery: "galeri",
  media: "media",
  folder: "folder",
  asset: "berkas",
  access: "akses",
  request: "permohonan",
  user: "pengguna",
  roles: "peran",
  edition: "edisi",
  category: "kategori",
  organization: "organisasi",
  period: "periode",
  unit: "bidang",
  membership: "keanggotaan",
  person: "profil pengurus",
  voting: "voting",
  campaign: "kampanye",
  tally: "suara",
  selection: "seleksi",
  stage: "tahap",
  title: "gelar",
  content: "konten",
  draft: "draf",
};

export function formatAuditAction(action: string): string {
  if (AUDIT_ACTION_LABELS[action]) {
    return AUDIT_ACTION_LABELS[action];
  }
  const parts = action.split(/[._]/);
  const lastPart = parts[parts.length - 1]?.toLowerCase() ?? "";
  const verb = VERB_DICTIONARY[lastPart];
  if (verb && parts.length > 1) {
    const nouns = parts
      .slice(0, -1)
      .map((p) => NOUN_DICTIONARY[p.toLowerCase()] || p)
      .join(" ");
    return `${verb} ${nouns}`.trim();
  }
  return parts
    .map((p) => NOUN_DICTIONARY[p.toLowerCase()] || (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join(" ");
}

export function formatAuditResource(resourceType: string): string {
  if (AUDIT_RESOURCE_LABELS[resourceType]) {
    return AUDIT_RESOURCE_LABELS[resourceType];
  }
  return resourceType
    .replace(/([A-Z])/g, " $1")
    .replace(/[._]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export type ResolvedActor = {
  name: string;
  subtext?: string;
};

export function createAuditUserLookup(users: readonly UserSummary[]) {
  const userById = new Map<string, UserSummary>();
  const userByEmail = new Map<string, UserSummary>();

  for (const user of users) {
    if (user.id) userById.set(user.id, user);
    if (user.email) userByEmail.set(user.email.toLowerCase(), user);
  }

  function resolveUser(idOrEmailOrLabel?: string | null): UserSummary | null {
    if (!idOrEmailOrLabel) return null;
    const byId = userById.get(idOrEmailOrLabel);
    if (byId) return byId;
    const byEmail = userByEmail.get(idOrEmailOrLabel.toLowerCase());
    if (byEmail) return byEmail;
    return null;
  }

  function resolveActor(entry: Pick<AuditLogEntry, "actorUserId" | "actorLabel">): ResolvedActor {
    const user = (entry.actorUserId ? resolveUser(entry.actorUserId) : null) ?? resolveUser(entry.actorLabel);
    if (user?.name) {
      return {
        name: user.name,
        subtext: user.email && user.email !== user.name ? user.email : undefined,
      };
    }
    if (entry.actorLabel === "manual-turso-bootstrap") {
      return {
        name: "Sistem",
        subtext: "Bootstrap",
      };
    }
    return {
      name: entry.actorLabel,
    };
  }

  function resolveContentLabel(entry: Pick<AuditLogEntry, "resourceType" | "resourceId" | "resourceLabel">): string {
    const rawLabel = entry.resourceLabel?.trim() || entry.resourceId;
    if (entry.resourceType === "user" || entry.resourceType === "accessRequest") {
      const targetUser = resolveUser(entry.resourceLabel) ?? resolveUser(entry.resourceId);
      if (targetUser?.name) {
        return targetUser.email && targetUser.email !== targetUser.name
          ? `${targetUser.name} (${targetUser.email})`
          : targetUser.name;
      }
    }
    return rawLabel;
  }

  return {
    resolveUser,
    resolveActor,
    resolveContentLabel,
  };
}
