import { desc } from "drizzle-orm";

import { AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAuditUserLookup, formatAuditAction, formatAuditResource } from "@/lib/audit-format";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { auditLogs, authUsers } from "@/server/db/schema";

export default async function AuditPage() {
  await requirePermission("audit.view");
  const [logs, users] = await Promise.all([
    database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100),
    database.select({ id: authUsers.id, name: authUsers.name, email: authUsers.email }).from(authUsers),
  ]);
  const lookup = createAuditUserLookup(users);

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
              {logs.map((log) => {
                const actor = lookup.resolveActor(log);
                const actionLabel = formatAuditAction(log.action);
                const resourceLabel = formatAuditResource(log.resourceType);
                const contentDetail = lookup.resolveContentLabel(log);

                return (
                  <TableRow className="border-border hover:bg-muted/30" key={log.id}>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground font-inter whitespace-nowrap">
                      {log.createdAt.toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm font-medium text-brand-900">{actor.name}</div>
                      {actor.subtext ? (
                        <div className="text-xs text-muted-foreground">{actor.subtext}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm font-medium text-brand" title={log.action}>
                        {actionLabel}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{resourceLabel}</span>
                      {contentDetail ? <span> · {contentDetail}</span> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPage>
  );
}

