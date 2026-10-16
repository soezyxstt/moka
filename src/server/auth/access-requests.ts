import { and, eq } from "drizzle-orm";

import { accessRequests, adminProfiles } from "@/server/db/schema";
import { database } from "@/server/db/client";

import { appendAuditLog } from "./audit";
import { requirePermission, requireRoleAdministrator, requireSession } from "./authorization";
import { approveAccessRequestWithDb, updateUserRolesWithDb } from "./user-roles";

export { approveAccessRequestWithDb, updateUserRolesWithDb };

export async function submitAccessRequest(reason: string, requestedAreas: string[]) {
  const session = await requireSession();
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 10 || trimmedReason.length > 500) {
    throw new Error("Reason must be between 10 and 500 characters");
  }

  await database.transaction(async (tx) => {
    const existing = await tx.query.accessRequests.findFirst({
      where: and(eq(accessRequests.userId, session.user.id), eq(accessRequests.status, "open")),
    });
    if (existing) throw new Error("An access request is already open");

    const profile = await tx.query.adminProfiles.findFirst({ where: eq(adminProfiles.userId, session.user.id) });
    if (!profile || profile.status !== "pending") throw new Error("This account cannot request access in its current status");

    const requestId = crypto.randomUUID();
    await tx.insert(accessRequests).values({
      id: requestId,
      userId: session.user.id,
      reason: trimmedReason,
      requestedAreasJson: JSON.stringify(requestedAreas.slice(0, 12)),
    });
    await tx.update(adminProfiles).set({ requestedAt: new Date(), updatedAt: new Date() }).where(eq(adminProfiles.userId, session.user.id));
    await appendAuditLog(tx, {
      actorUserId: session.user.id,
      actorLabel: session.user.email,
      action: "access.request.create",
      resourceType: "accessRequest",
      resourceId: requestId,
      resourceLabel: session.user.email,
      after: { status: "open", requestedAreas },
      changedFields: ["reason", "requestedAreas", "status"],
      source: "admin-request-access",
      reason: trimmedReason,
    });
  });
}

export async function approveAccessRequest(requestId: string, roleInput: string | readonly string[], note?: string) {
  const reviewer = await requireRoleAdministrator();
  await approveAccessRequestWithDb(
    database,
    { id: reviewer.session.user.id, email: reviewer.session.user.email },
    requestId,
    roleInput,
    note,
  );
}

export async function updateUserRoles(targetUserId: string, roleInput: string | readonly string[], reason?: string) {
  const { session } = await requirePermission("access.manage");
  await updateUserRolesWithDb(
    database,
    { id: session.user.id, email: session.user.email },
    targetUserId,
    roleInput,
    reason,
  );
}


