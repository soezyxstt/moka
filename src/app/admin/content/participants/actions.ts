"use server";

import { and, asc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { isAllowedMediaMimeType } from "@/server/media/policy";
import {
  categories,
  mediaAssets,
  participantAchievements,
  participantMedia,
  participantMediaRoles,
  participantSocialLinks,
  participantStageEntries,
  participantTitleAssignments,
  participants,
  selectionStages,
  socialPlatforms,
  voteDailyTallies,
  votingCampaignParticipants,
  type ParticipantMediaRole,
  type SocialPlatform,
} from "@/server/db/schema";

function slugify(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "peserta";
}

function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. CREATE PARTICIPANT
// ---------------------------------------------------------------------------

export type CreateParticipantInput = {
  categoryId: string;
  name: string;
  slug?: string;
  number: number;
  stage?: string;
  bio?: string | null;
  qrisMediaId?: string | null;
  paymentUrl?: string | null;
  active?: boolean;
  displayOrder?: number;
  portraitMediaId?: string | null;
};

export async function createParticipantAction(data: FormData | CreateParticipantInput) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const editionId = editionContext.id;
  let categoryId: string;
  let name: string;
  let rawSlug: string;
  let number: number;
  let stage = "";
  let bio: string | null = null;
  let qrisMediaId: string | null = null;
  let paymentUrl: string | null = null;
  let active = true;
  let displayOrder = 0;
  let portraitMediaId: string | null = null;

  if (data instanceof FormData) {
    categoryId = String(data.get("categoryId") ?? "").trim();
    name = String(data.get("name") ?? "").trim();
    rawSlug = String(data.get("slug") ?? "").trim();
    number = Number(data.get("number"));
    bio = String(data.get("bio") ?? "").trim() || null;
    qrisMediaId = String(data.get("qrisMediaId") ?? "").trim() || null;
    paymentUrl = String(data.get("paymentUrl") ?? "").trim() || null;
    active = data.get("active") === null ? true : data.get("active") === "true" || data.get("active") === "1" || data.get("active") === "on";
    displayOrder = Number(data.get("displayOrder") ?? number);
    portraitMediaId = String(data.get("portraitMediaId") ?? "").trim() || null;
  } else {
    categoryId = data.categoryId?.trim() ?? "";
    name = data.name?.trim() ?? "";
    rawSlug = data.slug?.trim() ?? "";
    number = Number(data.number);
    bio = data.bio?.trim() || null;
    qrisMediaId = data.qrisMediaId?.trim() || null;
    paymentUrl = data.paymentUrl?.trim() || null;
    active = data.active ?? true;
    displayOrder = Number(data.displayOrder ?? number);
    portraitMediaId = data.portraitMediaId?.trim() || null;
  }

  const slug = slugify(rawSlug || name);

  if (!categoryId || !name) {
    throw new Error("Kategori dan nama peserta wajib diisi");
  }

  if (!Number.isInteger(number) || number < 1) {
    throw new Error("Nomor peserta harus berupa bilangan bulat positif");
  }

  if (paymentUrl && !isValidUrl(paymentUrl)) {
    throw new Error("URL pembayaran tidak valid");
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    // 1. Verify category belongs to active edition
    const [category] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.editionId, editionId)))
      .limit(1);

    if (!category) {
      throw new Error("Kategori harus berasal dari edisi yang aktif");
    }

    const [firstStage] = await tx
      .select()
      .from(selectionStages)
      .where(eq(selectionStages.editionId, editionId))
      .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id))
      .limit(1);
    if (!firstStage) throw new Error("Buat tahap pertama sebelum menambah pendaftar");
    if (firstStage.lifecycle === "closed") throw new Error("Tahap pertama sudah ditutup");
    stage = firstStage.slug;

    // 2. Check slug uniqueness per (editionId, stage, slug)
    const [existingSlug] = await tx
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.editionId, editionId),
          eq(participants.slug, slug)
        )
      )
      .limit(1);

    if (existingSlug) {
      throw new Error(`Slug '${slug}' sudah digunakan untuk tahap ${stage} pada edisi ini`);
    }

    // 3. Validate QRIS media if provided
    if (qrisMediaId) {
      const [qrisMedia] = await tx
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, qrisMediaId), eq(mediaAssets.lifecycle, "ready")))
        .limit(1);

      if (!qrisMedia || !qrisMedia.mimeType.startsWith("image/")) {
        throw new Error("QRIS harus memakai aset gambar yang valid dan berstatus ready");
      }
    }

    // 4. Validate Portrait / Closeup media if provided
    if (portraitMediaId) {
      const [portraitMedia] = await tx
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, portraitMediaId), eq(mediaAssets.lifecycle, "ready")))
        .limit(1);

      if (!portraitMedia || !portraitMedia.mimeType.startsWith("image/")) {
        throw new Error("Foto peserta harus memakai aset gambar yang valid dan berstatus ready");
      }
    }

    // 5. Insert participant record
    await tx.insert(participants).values({
      id,
      editionId,
      categoryId,
      stage,
      currentStageId: firstStage.id,
      selectionStatus: "registered",
      number,
      name,
      slug,
      bio,
      portraitMediaId,
      qrisMediaId,
      paymentUrl,
      displayOrder: Number.isInteger(displayOrder) ? displayOrder : number,
      active,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(participantStageEntries).values({
      id: crypto.randomUUID(),
      participantId: id,
      stageId: firstStage.id,
      decision: "pending",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // 6. If portraitMediaId is provided, also insert into participantMedia role closeup
    if (portraitMediaId) {
      await tx.insert(participantMedia).values({
        id: crypto.randomUUID(),
        participantId: id,
        role: "closeup",
        mediaId: portraitMediaId,
        caption: "Foto utama",
        displayOrder: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 7. Audit log
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.create",
      resourceType: "participant",
      resourceId: id,
      resourceLabel: `${number} - ${name}`,
      after: {
        id,
        editionId,
        categoryId,
        stage,
        currentStageId: firstStage.id,
        selectionStatus: "registered",
        number,
        name,
        slug,
        bio,
        portraitMediaId,
        qrisMediaId,
        paymentUrl,
        displayOrder,
        active,
        version: 1,
      },
      changedFields: [
        "editionId",
        "categoryId",
        "stage",
        "currentStageId",
        "selectionStatus",
        "number",
        "name",
        "slug",
        "bio",
        "portraitMediaId",
        "qrisMediaId",
        "paymentUrl",
        "displayOrder",
        "active",
      ],
      source: "admin-content",
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath("/admin/content/participants/stages");
  return { success: true, id };
}

// ---------------------------------------------------------------------------
// 2. UPDATE PARTICIPANT IDENTITY
// ---------------------------------------------------------------------------

export type UpdateParticipantInput = {
  participantId: string;
  expectedVersion: number;
  categoryId: string;
  name: string;
  slug?: string;
  number: number;
  stage?: string;
  bio?: string | null;
  displayOrder?: number;
  active?: boolean;
  reason?: string;
};

export async function updateParticipantAction(data: FormData | UpdateParticipantInput) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  let participantId: string;
  let expectedVersion: number;
  let categoryId: string;
  let name: string;
  let rawSlug: string;
  let number: number;
  let stage: string;
  let bio: string | null = null;
  let displayOrder = 0;
  let active = true;
  let reason: string | undefined;

  if (data instanceof FormData) {
    participantId = String(data.get("participantId") ?? "").trim();
    const verRaw = data.get("expectedVersion");
    expectedVersion = verRaw !== null && verRaw !== "" ? Number(verRaw) : Number.NaN;
    categoryId = String(data.get("categoryId") ?? "").trim();
    name = String(data.get("name") ?? "").trim();
    rawSlug = String(data.get("slug") ?? "").trim();
    number = Number(data.get("number"));
    stage = String(data.get("stage") ?? "").trim();
    bio = String(data.get("bio") ?? "").trim() || null;
    displayOrder = Number(data.get("displayOrder") ?? number);
    active = data.get("active") === null ? true : data.get("active") === "true" || data.get("active") === "1" || data.get("active") === "on";
    reason = String(data.get("reason") ?? "").trim() || undefined;
  } else {
    participantId = data.participantId?.trim() ?? "";
    expectedVersion = Number(data.expectedVersion);
    categoryId = data.categoryId?.trim() ?? "";
    name = data.name?.trim() ?? "";
    rawSlug = data.slug?.trim() ?? "";
    number = Number(data.number);
    stage = data.stage?.trim() ?? "";
    bio = data.bio?.trim() || null;
    displayOrder = Number(data.displayOrder ?? number);
    active = data.active ?? true;
    reason = data.reason?.trim() || undefined;
  }

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }

  if (!categoryId || !name) {
    throw new Error("Kategori dan nama peserta wajib diisi");
  }

  if (!Number.isInteger(number) || number < 1) {
    throw new Error("Nomor peserta harus berupa bilangan bulat positif");
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Versi peserta tidak valid");

  const slug = slugify(rawSlug || name);
  const now = new Date();
  let nextVersion = 1;

  await database.transaction(async (tx) => {
    // 1. Fetch current participant
    const [before] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!before) {
      throw new Error("Peserta tidak ditemukan");
    }

    // 2. Version locking check
    if (before.version !== expectedVersion) {
      throw new Error("Data peserta telah diubah oleh pengguna lain. Silakan muat ulang halaman.");
    }
    stage = before.stage;

    // 3. Verify category belongs to participant's edition
    const [category] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.editionId, before.editionId)))
      .limit(1);

    if (!category) {
      throw new Error("Kategori harus berasal dari edisi yang sama dengan peserta");
    }

    // 4. Verify slug uniqueness
    const [existingSlug] = await tx
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.editionId, before.editionId),
          eq(participants.slug, slug),
          ne(participants.id, participantId)
        )
      )
      .limit(1);

    if (existingSlug) {
      throw new Error(`Slug '${slug}' sudah digunakan untuk tahap ${stage} pada edisi ini`);
    }

    nextVersion = before.version + 1;

    // 5. Update participant record
    const updated = await tx
      .update(participants)
      .set({
        categoryId,
        stage,
        number,
        name,
        slug,
        bio,
        displayOrder: Number.isInteger(displayOrder) ? displayOrder : number,
        active,
        version: nextVersion,
        updatedAt: now,
      })
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah oleh pengguna lain. Silakan muat ulang halaman.");

    // 6. Audit log
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.update",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: `${number} - ${name}`,
      before: {
        categoryId: before.categoryId,
        stage: before.stage,
        number: before.number,
        name: before.name,
        slug: before.slug,
        bio: before.bio,
        displayOrder: before.displayOrder,
        active: before.active,
        version: before.version,
      },
      after: {
        categoryId,
        stage,
        number,
        name,
        slug,
        bio,
        displayOrder,
        active,
        version: nextVersion,
      },
      changedFields: ["categoryId", "stage", "number", "name", "slug", "bio", "displayOrder", "active", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  revalidatePath("/admin/voting");
  return { success: true, version: nextVersion };
}

// ---------------------------------------------------------------------------
// 3. SAVE PARTICIPANT ACHIEVEMENTS
// ---------------------------------------------------------------------------

export type ParticipantAchievementItem = {
  id?: string;
  text: string;
  displayOrder: number;
};

export async function saveParticipantAchievementsAction(
  participantId: string,
  achievements: ParticipantAchievementItem[],
  expectedVersion: number,
  reason?: string
) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }

  const now = new Date();
  let nextVersion = 1;

  await database.transaction(async (tx) => {
    const [participant] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!participant) {
      throw new Error("Peserta tidak ditemukan");
    }
    if (!Number.isInteger(expectedVersion) || participant.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    const currentAchievements = await tx
      .select()
      .from(participantAchievements)
      .where(eq(participantAchievements.participantId, participantId))
      .orderBy(asc(participantAchievements.displayOrder));

    // Delete existing achievements
    await tx
      .delete(participantAchievements)
      .where(eq(participantAchievements.participantId, participantId));

    // Insert updated list
    const validItems = achievements
      .map((item, idx) => ({
        text: item.text.trim(),
        displayOrder: Number.isInteger(item.displayOrder) ? item.displayOrder : idx,
      }))
      .filter((item) => item.text.length > 0);

    for (const item of validItems) {
      await tx.insert(participantAchievements).values({
        id: crypto.randomUUID(),
        participantId,
        text: item.text,
        displayOrder: item.displayOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    nextVersion = participant.version + 1;
    const updated = await tx
      .update(participants)
      .set({
        version: nextVersion,
        updatedAt: now,
      })
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.achievements.update",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: participant.name,
      before: {
        achievements: currentAchievements.map((a) => ({ text: a.text, displayOrder: a.displayOrder })),
        version: participant.version,
      },
      after: {
        achievements: validItems,
        version: nextVersion,
      },
      changedFields: ["achievements", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  return { success: true, version: nextVersion };
}

// ---------------------------------------------------------------------------
// 4. SAVE PARTICIPANT SOCIAL LINKS
// ---------------------------------------------------------------------------

export type ParticipantSocialLinkItem = {
  id?: string;
  platform: SocialPlatform;
  label?: string | null;
  url: string;
  displayOrder: number;
};

export async function saveParticipantSocialLinksAction(
  participantId: string,
  links: ParticipantSocialLinkItem[],
  expectedVersion: number,
  reason?: string
) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }

  // Validate social links format
  for (const link of links) {
    if (!socialPlatforms.includes(link.platform)) {
      throw new Error(`Platform sosial media '${link.platform}' tidak didukung`);
    }
    if (!link.url || !isValidUrl(link.url)) {
      throw new Error(`URL '${link.url}' tidak valid. Gunakan tautan http/https lengkap`);
    }
    if (link.platform === "other" && (!link.label || !link.label.trim())) {
      throw new Error("Label wajib diisi jika memilih platform 'Lainnya'");
    }
  }

  const now = new Date();
  let nextVersion = 1;

  await database.transaction(async (tx) => {
    const [participant] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!participant) {
      throw new Error("Peserta tidak ditemukan");
    }
    if (!Number.isInteger(expectedVersion) || participant.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    const currentLinks = await tx
      .select()
      .from(participantSocialLinks)
      .where(eq(participantSocialLinks.participantId, participantId))
      .orderBy(asc(participantSocialLinks.displayOrder));

    // Delete existing links
    await tx
      .delete(participantSocialLinks)
      .where(eq(participantSocialLinks.participantId, participantId));

    // Insert updated links
    const validLinks = links.map((item, idx) => ({
      platform: item.platform,
      label: item.label?.trim() || null,
      url: item.url.trim(),
      displayOrder: Number.isInteger(item.displayOrder) ? item.displayOrder : idx,
    }));

    for (const link of validLinks) {
      await tx.insert(participantSocialLinks).values({
        id: crypto.randomUUID(),
        participantId,
        platform: link.platform,
        label: link.label,
        url: link.url,
        displayOrder: link.displayOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    nextVersion = participant.version + 1;
    const updated = await tx
      .update(participants)
      .set({
        version: nextVersion,
        updatedAt: now,
      })
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.social_links.update",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: participant.name,
      before: {
        socialLinks: currentLinks.map((l) => ({ platform: l.platform, label: l.label, url: l.url, displayOrder: l.displayOrder })),
        version: participant.version,
      },
      after: {
        socialLinks: validLinks,
        version: nextVersion,
      },
      changedFields: ["socialLinks", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  return { success: true, version: nextVersion };
}

// ---------------------------------------------------------------------------
// 5. SAVE PARTICIPANT MEDIA (MULTI-ROLE & CLOSEUP SYNC)
// ---------------------------------------------------------------------------

export type ParticipantMediaItem = {
  id?: string;
  role: ParticipantMediaRole;
  mediaId: string;
  caption?: string | null;
  displayOrder: number;
  active?: boolean;
};

export async function saveParticipantMediaAction(
  participantId: string,
  mediaItems: ParticipantMediaItem[],
  expectedVersion: number,
  reason?: string
) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }

  // Validate roles and media IDs
  for (const item of mediaItems) {
    if (!participantMediaRoles.includes(item.role)) {
      throw new Error(`Role media '${item.role}' tidak valid`);
    }
    if (!item.mediaId) {
      throw new Error("Setiap item foto harus memiliki aset media yang valid");
    }
  }
  if (mediaItems.filter((item) => item.role === "closeup" && item.active !== false).length > 1) {
    throw new Error("Hanya satu foto closeup yang dapat dijadikan foto utama");
  }
  if (mediaItems.filter((item) => item.role === "profile_video" && item.active !== false).length > 1) {
    throw new Error("Hanya satu video profil yang dapat aktif");
  }

  const now = new Date();
  let nextVersion = 1;
  let synchronizedCloseupMediaId: string | null = null;

  await database.transaction(async (tx) => {
    const [participant] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!participant) {
      throw new Error("Peserta tidak ditemukan");
    }
    if (!Number.isInteger(expectedVersion) || participant.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    // Verify that each role points to a ready asset of the expected media type.
    for (const item of mediaItems) {
      const [asset] = await tx
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, item.mediaId), eq(mediaAssets.lifecycle, "ready")))
        .limit(1);

      const kind = item.role === "profile_video" ? "video" : "image";
      if (!asset || !isAllowedMediaMimeType(kind, asset.mimeType)) {
        throw new Error(item.role === "profile_video"
          ? "Video profil harus berupa MP4 atau WebM berstatus ready dari pustaka media"
          : "Foto peserta harus berupa gambar JPG, PNG, WebP, atau AVIF berstatus ready dari pustaka media");
      }
    }

    const currentMedia = await tx
      .select()
      .from(participantMedia)
      .where(eq(participantMedia.participantId, participantId))
      .orderBy(asc(participantMedia.displayOrder));

    // Delete existing media bindings
    await tx
      .delete(participantMedia)
      .where(eq(participantMedia.participantId, participantId));

    // Insert updated media items
    const validItems = mediaItems.map((item, idx) => ({
      role: item.role,
      mediaId: item.mediaId,
      caption: item.caption?.trim() || null,
      displayOrder: Number.isInteger(item.displayOrder) ? item.displayOrder : idx,
      active: item.active !== false,
    }));

    for (const item of validItems) {
      await tx.insert(participantMedia).values({
        id: crypto.randomUUID(),
        participantId,
        role: item.role,
        mediaId: item.mediaId,
        caption: item.caption,
        displayOrder: item.displayOrder,
        active: item.active,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Synchronize closeup role to participant.portraitMediaId for backward compatibility
    const closeupItem = validItems.find((item) => item.role === "closeup" && item.active);
    synchronizedCloseupMediaId = closeupItem ? closeupItem.mediaId : null;

    nextVersion = participant.version + 1;
    const updated = await tx
      .update(participants)
      .set({
        portraitMediaId: synchronizedCloseupMediaId,
        version: nextVersion,
        updatedAt: now,
      })
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.media.update",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: participant.name,
      before: {
        media: currentMedia.map((m) => ({ role: m.role, mediaId: m.mediaId, caption: m.caption, active: m.active })),
        portraitMediaId: participant.portraitMediaId,
        version: participant.version,
      },
      after: {
        media: validItems,
        portraitMediaId: synchronizedCloseupMediaId,
        version: nextVersion,
      },
      changedFields: ["media", "portraitMediaId", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  return { success: true, version: nextVersion, portraitMediaId: synchronizedCloseupMediaId };
}

// ---------------------------------------------------------------------------
// 6. UPDATE QRIS & PAYMENT URL
// ---------------------------------------------------------------------------

export async function updateParticipantQrisAction(formData: FormData) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");
  const participantId = String(formData.get("participantId") ?? "").trim();
  const qrisMediaId = String(formData.get("qrisMediaId") ?? "").trim() || null;
  const expectedVersion = Number(formData.get("expectedVersion"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!participantId || !reason) {
    throw new Error("Peserta dan alasan perubahan QRIS wajib diisi");
  }

  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Versi peserta tidak valid");

  const now = new Date();
  let nextVersion = 1;

  await database.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!before) throw new Error("Peserta tidak ditemukan");
    if (before.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    if (qrisMediaId) {
      const [qrisMedia] = await tx
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, qrisMediaId), eq(mediaAssets.lifecycle, "ready")))
        .limit(1);

      if (!qrisMedia || !qrisMedia.mimeType.startsWith("image/")) {
        throw new Error("QRIS harus memakai aset gambar yang valid dan berstatus ready");
      }
    }

    nextVersion = before.version + 1;
    const after = { qrisMediaId, version: nextVersion, updatedAt: now };

    const updated = await tx
      .update(participants)
      .set(after)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.qris.update",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: before.name,
      before: { qrisMediaId: before.qrisMediaId, version: before.version },
      after: { qrisMediaId, version: nextVersion },
      changedFields: ["qrisMediaId", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  revalidatePath("/admin/voting");
  return { success: true, version: nextVersion };
}

// ---------------------------------------------------------------------------
// 7. TOGGLE PARTICIPANT ACTIVE STATUS
// ---------------------------------------------------------------------------

export async function toggleParticipantActiveAction(formData: FormData | { participantId: string; expectedVersion: number; reason?: string }) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  let participantId: string;
  let expectedVersion: number;
  let reason: string | undefined;

  if (formData instanceof FormData) {
    participantId = String(formData.get("participantId") ?? "").trim();
    expectedVersion = Number(formData.get("expectedVersion"));
    reason = String(formData.get("reason") ?? "").trim() || undefined;
  } else {
    participantId = formData.participantId?.trim() ?? "";
    expectedVersion = Number(formData.expectedVersion);
    reason = formData.reason?.trim() || undefined;
  }

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Versi peserta tidak valid");

  const now = new Date();
  let nextActive = true;
  let nextVersion = 1;

  await database.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!before) throw new Error("Peserta tidak ditemukan");
    if (before.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    nextActive = !before.active;
    nextVersion = before.version + 1;

    const updated = await tx
      .update(participants)
      .set({
        active: nextActive,
        version: nextVersion,
        updatedAt: now,
      })
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (updated.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.active.toggle",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: before.name,
      before: { active: before.active, version: before.version },
      after: { active: nextActive, version: nextVersion },
      changedFields: ["active", "version"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath(`/admin/content/participants/${participantId}`);
  revalidatePath("/admin/voting");
  return { success: true, active: nextActive, version: nextVersion };
}

// ---------------------------------------------------------------------------
// 8. DELETE PARTICIPANT
// ---------------------------------------------------------------------------

export async function deleteParticipantAction(formData: FormData | { participantId: string; expectedVersion: number; reason?: string }) {
  const actor = await requirePermission("participants.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) throw new Error("Pilih edisi aktif terlebih dahulu");

  let participantId: string;
  let expectedVersion: number;
  let reason: string | undefined;

  if (formData instanceof FormData) {
    participantId = String(formData.get("participantId") ?? "").trim();
    expectedVersion = Number(formData.get("expectedVersion"));
    reason = String(formData.get("reason") ?? "").trim() || undefined;
  } else {
    participantId = formData.participantId?.trim() ?? "";
    expectedVersion = Number(formData.expectedVersion);
    reason = formData.reason?.trim() || undefined;
  }

  if (!participantId) {
    throw new Error("ID peserta wajib disertakan");
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Versi peserta tidak valid");

  await database.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id)))
      .limit(1);

    if (!before) throw new Error("Peserta tidak ditemukan");
    if (before.version !== expectedVersion) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    const entries = await tx.select().from(participantStageEntries).where(eq(participantStageEntries.participantId, participantId));
    const [title] = await tx.select({ participantId: participantTitleAssignments.participantId }).from(participantTitleAssignments).where(eq(participantTitleAssignments.participantId, participantId)).limit(1);
    const [snapshot] = await tx.select({ participantId: votingCampaignParticipants.participantId }).from(votingCampaignParticipants).where(eq(votingCampaignParticipants.participantId, participantId)).limit(1);
    const [tally] = await tx.select({ id: voteDailyTallies.id }).from(voteDailyTallies).where(eq(voteDailyTallies.participantId, participantId)).limit(1);
    const isUnusedApplicant = entries.length === 1 && entries[0].decision === "pending" && entries[0].stageId === before.currentStageId;
    if (!isUnusedApplicant || title || snapshot || tally) throw new Error("Peserta yang sudah diproses tidak dapat dihapus. Nonaktifkan peserta atau gunakan rollback.");

    // Cascading deletes on participantAchievements, participantSocialLinks, participantMedia are handled by foreign key or explicit delete
    await tx.delete(participantAchievements).where(eq(participantAchievements.participantId, participantId));
    await tx.delete(participantSocialLinks).where(eq(participantSocialLinks.participantId, participantId));
    await tx.delete(participantMedia).where(eq(participantMedia.participantId, participantId));
    const deleted = await tx
      .delete(participants)
      .where(and(eq(participants.id, participantId), eq(participants.editionId, editionContext.id), eq(participants.version, expectedVersion)))
      .returning({ id: participants.id });
    if (deleted.length !== 1) throw new Error("Data peserta telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "participant.delete",
      resourceType: "participant",
      resourceId: participantId,
      resourceLabel: `${before.number} - ${before.name}`,
      before: {
        id: before.id,
        editionId: before.editionId,
        categoryId: before.categoryId,
        stage: before.stage,
        number: before.number,
        name: before.name,
        slug: before.slug,
        active: before.active,
      },
      changedFields: ["id"],
      source: "admin-content",
      reason,
    });
  });

  revalidatePath("/admin/content/participants");
  revalidatePath("/admin/voting");
  return { success: true };
}
