import { createClient } from "@libsql/client/node";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { approveAccessRequestWithDb, rejectAccessRequestWithDb, updateUserRolesWithDb } from "../auth/user-roles";
import { seedAuthorizationCatalog } from "../auth/seed";
import * as schema from "./schema";
import { accessRequests, adminProfiles, auditLogs, authUsers, roles, userRoles } from "./schema";

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "moka-access-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  await seedAuthorizationCatalog(db);
  return { client, db };
}

test("approveAccessRequestWithDb menetapkan beberapa peran sekaligus dan updateUserRolesWithDb mengganti peran non-super_admin", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-10-16T00:00:00.000Z");
    await db.insert(authUsers).values([
      { id: "admin-1", name: "Admin", email: "admin@pamoka.id", emailVerified: true, createdAt: now, updatedAt: now },
      { id: "user-1", name: "Staff", email: "staff@pamoka.id", emailVerified: true, createdAt: now, updatedAt: now },
    ]);
    await db.insert(adminProfiles).values({
      userId: "user-1",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(accessRequests).values({
      id: "req-1",
      userId: "user-1",
      status: "open",
      reason: "Perlu akses konten dan voting",
      createdAt: now,
      updatedAt: now,
    });

    await approveAccessRequestWithDb(
      db,
      { id: "admin-1", email: "admin@pamoka.id" },
      "req-1",
      ["content_editor", "voting_operator"],
      "Setuju kombinasi peran",
    );

    const assignedAfterApprove = await db
      .select({ slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, "user-1"));
    assert.deepEqual(assignedAfterApprove.map((r) => r.slug).sort(), ["content_editor", "voting_operator"]);

    // Tambahkan super_admin manual untuk memastikan updateUserRolesWithDb tidak menghapus super_admin
    const superRole = await db.query.roles.findFirst({ where: eq(roles.slug, "super_admin") });
    assert.ok(superRole);
    await db.insert(userRoles).values({
      userId: "user-1",
      roleId: superRole.id,
      grantedByUserId: "admin-1",
      grantedAt: now,
    });

    await updateUserRolesWithDb(
      db,
      { id: "admin-1", email: "admin@pamoka.id" },
      "user-1",
      ["content_publisher", "auditor"],
      "Rotasi tugas",
    );

    const assignedAfterUpdate = await db
      .select({ slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, "user-1"));
    assert.deepEqual(assignedAfterUpdate.map((r) => r.slug).sort(), ["auditor", "content_publisher", "super_admin"]);

    await assert.rejects(
      () => updateUserRolesWithDb(db, { id: "admin-1", email: "admin@pamoka.id" }, "user-1", ["super_admin"]),
      /Super admin/,
    );
    await assert.rejects(
      () => updateUserRolesWithDb(db, { id: "admin-1", email: "admin@pamoka.id" }, "user-1", []),
      /minimal satu peran/,
    );

    const audits = await db.select().from(auditLogs);
    assert.equal(audits.length, 2);
  } finally {
    client.close();
  }
});

test("rejectAccessRequestWithDb menolak permohonan akses dan memperbarui profil serta audit log", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-10-18T00:00:00.000Z");
    await db.insert(authUsers).values([
      { id: "admin-1", name: "Admin", email: "admin@pamoka.id", emailVerified: true, createdAt: now, updatedAt: now },
      { id: "user-2", name: "Pemohon", email: "pemohon@pamoka.id", emailVerified: true, createdAt: now, updatedAt: now },
    ]);
    await db.insert(adminProfiles).values({
      userId: "user-2",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(accessRequests).values({
      id: "req-2",
      userId: "user-2",
      status: "open",
      reason: "Permohonan akses yang tidak memenuhi syarat",
      createdAt: now,
      updatedAt: now,
    });

    await rejectAccessRequestWithDb(
      db,
      { id: "admin-1", email: "admin@pamoka.id" },
      "req-2",
      "Tidak memenuhi persyaratan administrasi",
    );

    const updatedRequest = await db.query.accessRequests.findFirst({ where: eq(accessRequests.id, "req-2") });
    assert.ok(updatedRequest);
    assert.equal(updatedRequest.status, "rejected");
    assert.equal(updatedRequest.reviewedByUserId, "admin-1");
    assert.equal(updatedRequest.reviewNote, "Tidak memenuhi persyaratan administrasi");

    const updatedProfile = await db.query.adminProfiles.findFirst({ where: eq(adminProfiles.userId, "user-2") });
    assert.ok(updatedProfile);
    assert.equal(updatedProfile.status, "rejected");
    assert.equal(updatedProfile.statusReason, "Tidak memenuhi persyaratan administrasi");

    const assignedRoles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, "user-2"));
    assert.equal(assignedRoles.length, 0);

    const rejectAudit = await db.query.auditLogs.findFirst({
      where: eq(auditLogs.action, "access.request.reject"),
    });
    assert.ok(rejectAudit);
    assert.equal(rejectAudit.actorUserId, "admin-1");
    assert.equal(rejectAudit.resourceId, "req-2");
    assert.equal(rejectAudit.reason, "Tidak memenuhi persyaratan administrasi");

    await assert.rejects(
      () => rejectAccessRequestWithDb(db, { id: "admin-1", email: "admin@pamoka.id" }, "req-2", "Ulangi tolak"),
      /Open access request not found/,
    );
  } finally {
    client.close();
  }
});

