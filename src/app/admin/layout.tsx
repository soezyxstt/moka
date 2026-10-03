import { headers } from "next/headers";
import { auth } from "@/server/auth/config";
import { getEffectivePermissions } from "@/server/auth/authorization";
import { AdminShell, type AdminNavItem } from "@/components/admin/admin-shell";
import { getAdminEditionContext, getAdminEditions } from "@/server/cms/context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const permissions = session?.user ? await getEffectivePermissions(session.user.id) : new Set<string>();
  if (!session?.user || !permissions.has("admin.view")) return children;

  const [currentEdition, allEditions] = await Promise.all([
    getAdminEditionContext(),
    getAdminEditions(),
  ]);

  const links: (AdminNavItem & { permission: string })[] = [
    // Ringkasan
    { href: "/admin", label: "Dashboard", icon: "layout", group: "Ringkasan", exact: true, permission: "admin.view" },

    // Konteks
    { href: "/admin/content/editions", label: "Kelola edisi", icon: "calendar", group: "Konteks", exact: false, permission: "content.view" },

    // Konten (Collapsible)
    { href: "/admin/content/edition-settings", label: "Identitas edisi", icon: "award", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/site-assets", label: "Aset situs", icon: "images", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/pages", label: "Teks halaman", icon: "file", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/news", label: "Berita", icon: "newspaper", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/sponsors", label: "Sponsor", icon: "handshake", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/participants", label: "Mojang Jajaka", icon: "users", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/events", label: "Acara", icon: "calendar", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/galleries", label: "Galeri", icon: "gallery", group: "Konten", exact: false, permission: "content.view" },
    { href: "/admin/content/committee", label: "Panitia", icon: "clipboard", group: "Konten", exact: false, permission: "content.view" },

    // Umum
    { href: "/admin/organization", label: "Kepengurusan", icon: "building", group: "Umum", exact: false, permission: "content.view" },

    // Studio
    { href: "/admin/media", label: "Pustaka media", icon: "folder", group: "Studio", exact: false, permission: "media.view" },

    // Operasional
    { href: "/admin/voting", label: "Voting", icon: "bar-chart", group: "Operasional", exact: false, permission: "voting.view" },
    { href: "/admin/users", label: "Pengguna", icon: "shield", group: "Operasional", exact: false, permission: "users.view" },
    { href: "/admin/audit", label: "Riwayat audit", icon: "clock", group: "Operasional", exact: false, permission: "audit.view" },

    // Akun
    { href: "/admin/profile", label: "Profil", icon: "settings", group: "Akun", exact: true, permission: "admin.view" },
  ];

  return (
    <AdminShell
      links={links.filter(({ permission }) => permissions.has(permission))}
      user={{ name: session.user.name, email: session.user.email }}
      currentEdition={currentEdition}
      allEditions={allEditions}
    >
      {children}
    </AdminShell>
  );
}
