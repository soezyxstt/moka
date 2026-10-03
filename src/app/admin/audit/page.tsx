import { Activity } from "lucide-react";
import { desc } from "drizzle-orm";

import { AdminCard, AdminCardHeader, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

export default async function AuditPage() {
  await requirePermission("audit.view");
  const logs = await database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <AdminPage eyebrow="Operasional" title="Audit log">
      <AdminCard>
        <AdminCardHeader title="Aktivitas terbaru" description="Waktu dalam WIB." />
        {logs.length === 0 ? <AdminEmptyState icon="clock" title="Belum ada aktivitas" /> : (
          <div className="overflow-x-auto border-y border-border">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/65"><TableRow className="hover:bg-transparent"><TableHead className="h-11 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Waktu</TableHead><TableHead className="h-11 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Aktor</TableHead><TableHead className="h-11 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Aksi</TableHead><TableHead className="h-11 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Resource</TableHead></TableRow></TableHeader>
              <TableBody>{logs.map((log) => <TableRow className="border-border hover:bg-dgb-50/25" key={log.id}><TableCell className="px-4 py-3 text-xs text-muted-foreground">{log.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}</TableCell><TableCell className="py-3 text-sm font-medium text-dgb-900">{log.actorLabel}</TableCell><TableCell className="py-3"><span className="inline-flex items-center gap-1.5 rounded-md bg-dgb-50 px-2.5 py-1 text-xs font-medium text-dgb"><Activity size={13} />{log.action}</span></TableCell><TableCell className="py-3 text-sm text-muted-foreground">{log.resourceType} · {log.resourceLabel ?? log.resourceId}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
