export const permissionCatalog = {
  "admin.view": "Melihat area admin",
  "content.view": "Melihat konten CMS",
  "content.edit": "Membuat dan mengedit konten",
  "content.publish": "Menayangkan konten",
  "media.view": "Melihat pustaka media",
  "media.manage": "Mengunggah dan mengelola media",
  "news.manage": "Mengelola berita",
  "sponsors.manage": "Mengelola sponsor",
  "people.manage": "Mengelola kepengurusan",
  "participants.manage": "Mengelola peserta",
  "events.manage": "Mengelola acara",
  "gallery.manage": "Mengelola galeri",
  "voting.view": "Melihat administrasi voting",
  "voting.manage": "Mengelola kampanye voting",
  "voting.tally": "Memasukkan tally voting manual",
  "voting.tally.manage": "Mengoreksi atau mengatur total perolehan voting",
  "voting.results.publish": "Menayangkan hasil voting",
  "users.view": "Melihat pengguna",
  "access.approve": "Menyetujui permintaan akses",
  "access.manage": "Mengelola role dan izin pengguna",
  "audit.view": "Melihat audit log",
  "audit.export": "Mengekspor audit log",
  "settings.manage": "Mengelola pengaturan situs",
  "system.superadmin": "Akses penuh sistem",
} as const;

export type PermissionKey = keyof typeof permissionCatalog;
export const permissionKeys = Object.keys(permissionCatalog) as PermissionKey[];

export const roleTemplates = {
  super_admin: { label: "Super Admin", permissions: permissionKeys },
  content_editor: { label: "Editor Konten", permissions: ["admin.view", "content.view", "content.edit", "media.view", "news.manage", "sponsors.manage", "people.manage", "participants.manage", "events.manage", "gallery.manage"] },
  content_publisher: { label: "Publisher Konten", permissions: ["admin.view", "content.view", "content.edit", "content.publish", "media.view", "media.manage", "news.manage", "sponsors.manage", "people.manage", "participants.manage", "events.manage", "gallery.manage"] },
  voting_operator: { label: "Operator Voting", permissions: ["admin.view", "voting.view", "voting.tally"] },
  voting_editor: { label: "Editor Voting", permissions: ["admin.view", "voting.view", "voting.tally", "voting.tally.manage"] },
  voting_manager: { label: "Manajer Voting", permissions: ["admin.view", "voting.view", "voting.manage", "voting.tally", "voting.tally.manage", "voting.results.publish"] },
  role_administrator: { label: "Role Administrator", permissions: ["admin.view", "users.view", "access.approve", "access.manage"] },
  auditor: { label: "Auditor", permissions: ["admin.view", "audit.view", "audit.export"] },
} as const satisfies Record<string, { label: string; permissions: readonly PermissionKey[] }>;

export type RoleSlug = keyof typeof roleTemplates;
export const criticalAccessPermissions = new Set<PermissionKey>(["access.approve", "access.manage", "system.superadmin"]);
