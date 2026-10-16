import { desc } from "drizzle-orm";

import { AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

export default async function AuditPage() {
  await requirePermission("audit.view");
  const logs = await database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <AdminPage title="Riwayat aktivitas">
      {logs.length === 0 ? (
        <AdminEmptyState icon="clock" title="Belum ada aktivitas" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[760px]">
            <TableHeader className="border-b border-border bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground">Waktu (WIB)</TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">Aktor</TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">Aksi</TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">Konten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow className="border-border hover:bg-muted/30" key={log.id}>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground font-inter">
                    {log.createdAt.toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="py-3 text-sm font-medium text-brand-900">{log.actorLabel}</TableCell>
                  <TableCell className="py-3 text-xs font-medium text-brand">{log.action}</TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {log.resourceType} · {log.resourceLabel ?? log.resourceId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPage>
  );
}
