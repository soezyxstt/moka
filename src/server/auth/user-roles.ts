import { and, eq, inArray } from "drizzle-orm";

import { accessRequests, adminProfiles, authUsers, roles, userRoles } from "@/server/db/schema";
import type { Database } from "@/server/db/queries";

import { appendAuditLog } from "./audit";
import { seedAuthorizationCatalog } from "./seed";

function normalizeAssignableSlugs(input: string | readonly string[]) {
  const raw = Array.isArray(input) ? input : [input];
  const slugs = [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
  if (slugs.length === 0) throw new Error("Pilih minimal satu peran");
  if (slugs.includes("super_admin")) {
    throw new Error("Super admin can only be assigned through the manual Turso runbook");
  }
  return slugs;
}

export async function approveAccessRequestWithDb(
  db: Database,
  actor: { id: string; email: string },
  requestId: string,
  roleInput: string | readonly string[],
  note?: string,
) {
  const slugs = normalizeAssignableSlugs(roleInput);
  await seedAuthorizationCatalog(db);

  await db.transaction(async (tx) => {
    const request = await tx.query.accessRequests.findFirst({ where: eq(accessRequests.id, requestId) });
    if (!request || request.status !== "open") throw new Error("Open access request not found");

    const roleRows = await tx.select().from(roles).where(inArray(roles.slug, slugs));
    if (roleRows.length !== slugs.length || roleRows.some((r) => r.slug === "super_admin")) {
      throw new Error("Requested role is not assignable");
    }

    const now = new Date();
    for (const role of roleRows) {
      await tx.insert(userRoles)
        .values({ userId: request.userId, roleId: role.id, grantedByUserId: actor.id, grantedAt: now })
        .onConflictDoNothing();
    }
    await tx.update(adminProfiles)
      .set({ status: "active", statusReason: note?.trim() || null, updatedAt: now })
      .where(eq(adminProfiles.userId, request.userId));
    await tx.update(accessRequests)
      .set({ status: "approved", reviewedByUserId: actor.id, reviewNote: note?.trim() || null, reviewedAt: now, updatedAt: now })
      .where(eq(accessRequests.id, requestId));
    await appendAuditLog(tx, {
      actorUserId: actor.id,
      actorLabel: actor.email,
      action: "access.request.approve",
      resourceType: "accessRequest",
      resourceId: requestId,
      resourceLabel: request.userId,
      before: { status: "open" },
      after: { status: "approved", roles: slugs, profileStatus: "active" },
      changedFields: ["status", "roles", "profileStatus"],
      source: "admin-users",
      reason: note?.trim() || null,
    });
  });
}

export async function rejectAccessRequestWithDb(
  db: Database,
  actor: { id: string; email: string },
  requestId: string,
  note?: string,
) {
  await db.transaction(async (tx) => {
    const request = await tx.query.accessRequests.findFirst({ where: eq(accessRequests.id, requestId) });
    if (!request || request.status !== "open") throw new Error("Open access request not found");

    const now = new Date();
    await tx.update(adminProfiles)
      .set({ status: "rejected", statusReason: note?.trim() || null, updatedAt: now })
      .where(eq(adminProfiles.userId, request.userId));
    await tx.update(accessRequests)
      .set({
        status: "rejected",
        reviewedByUserId: actor.id,
        reviewNote: note?.trim() || null,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(accessRequests.id, requestId));
    await appendAuditLog(tx, {
      actorUserId: actor.id,
      actorLabel: actor.email,
      action: "access.request.reject",
      resourceType: "accessRequest",
      resourceId: requestId,
      resourceLabel: request.userId,
      before: { status: "open" },
      after: { status: "rejected", profileStatus: "rejected" },
      changedFields: ["status", "profileStatus"],
      source: "admin-users",
      reason: note?.trim() || null,
    });
  });
}

export async function updateUserRolesWithDb(
  db: Database,
  actor: { id: string; email: string },
  targetUserId: string,
  roleInput: string | readonly string[],
  reason?: string,
) {
  const slugs = normalizeAssignableSlugs(roleInput);
  await seedAuthorizationCatalog(db);

  await db.transaction(async (tx) => {
    const user = await tx.query.authUsers.findFirst({ where: eq(authUsers.id, targetUserId) });
    if (!user) throw new Error("Pengguna tidak ditemukan");

    const requestedRoles = await tx.select().from(roles).where(inArray(roles.slug, slugs));
    if (requestedRoles.length !== slugs.length || requestedRoles.some((r) => r.slug === "super_admin")) {
      throw new Error("Requested role is not assignable");
    }

    const existingRows = await tx
      .select({ roleId: userRoles.roleId, slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, targetUserId));

    const beforeSlugs = existingRows.map((r) => r.slug).sort();
    const preservedSuperAdmin = existingRows.filter((r) => r.slug === "super_admin");
    const nonSuperExistingIds = existingRows.filter((r) => r.slug !== "super_admin").map((r) => r.roleId);

    if (nonSuperExistingIds.length > 0) {
      await tx.delete(userRoles).where(
        and(eq(userRoles.userId, targetUserId), inArray(userRoles.roleId, nonSuperExistingIds)),
      );
    }

    const now = new Date();
    for (const role of requestedRoles) {
      await tx.insert(userRoles)
        .values({ userId: targetUserId, roleId: role.id, grantedByUserId: actor.id, grantedAt: now })
        .onConflictDoNothing();
    }

    await tx.insert(adminProfiles)
      .values({ userId: targetUserId, status: "active", statusReason: reason?.trim() || null, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: adminProfiles.userId,
        set: { status: "active", statusReason: reason?.trim() || null, updatedAt: now },
      });

    const afterSlugs = [...new Set([...preservedSuperAdmin.map((r) => r.slug), ...slugs])].sort();

    await appendAuditLog(tx, {
      actorUserId: actor.id,
      actorLabel: actor.email,
      action: "user.roles.update",
      resourceType: "user",
      resourceId: targetUserId,
      resourceLabel: user.email,
      before: { roles: beforeSlugs },
      after: { roles: afterSlugs },
      changedFields: ["roles"],
      source: "admin-users",
      reason: reason?.trim() || null,
    });
  });
}
