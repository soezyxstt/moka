"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { getAdminEditionContext } from "@/server/cms/context";
import {
  closeVotingCampaign,
  createVotingCampaign,
  deleteVotingCampaign,
  saveVotingTally,
  saveVotingTalliesBatch,
  setVotingResultVisibility,
  startVotingCampaign,
  updateVotingCampaign,
  updateVotingCampaignStage,
} from "@/server/voting-operations";

function parseWibDateTime(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return new Date(Number.NaN);
  return new Date(`${raw}:00+07:00`);
}

function actorFromSession(actor: Awaited<ReturnType<typeof requirePermission>>) {
  return { userId: actor.session.user.id, label: actor.session.user.email };
}

async function requireEditionId() {
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Konteks edisi aktif tidak ditemukan");
  return edition.id;
}

export async function createCampaignAction(formData: FormData) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  await createVotingCampaign(
    database,
    editionId,
    {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      eligibilityStageId: String(formData.get("eligibilityStageId") ?? ""),
      startsAt: parseWibDateTime(formData.get("startsAt")),
      endsAt: parseWibDateTime(formData.get("endsAt")),
      pricePerPoint: Number(formData.get("pricePerPoint")),
    },
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  revalidatePath("/voting");
}

export async function updateCampaignAction(
  input:
    | FormData
    | {
        campaignId: string;
        expectedVersion: number;
        name: string;
        slug: string;
        eligibilityStageId?: string;
        startsAt: string | Date;
        endsAt: string | Date;
        pricePerPoint: number;
      },
) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();

  let campaignId: string;
  let expectedVersion: number;
  let name: string;
  let slug: string;
  let eligibilityStageId: string | undefined;
  let startsAt: Date;
  let endsAt: Date;
  let pricePerPoint: number;

  if (input instanceof FormData) {
    campaignId = String(input.get("campaignId") ?? "");
    expectedVersion = Number(input.get("expectedVersion"));
    name = String(input.get("name") ?? "");
    slug = String(input.get("slug") ?? "");
    const rawStage = input.get("eligibilityStageId");
    eligibilityStageId = rawStage ? String(rawStage) : undefined;
    startsAt = parseWibDateTime(input.get("startsAt"));
    endsAt = parseWibDateTime(input.get("endsAt"));
    pricePerPoint = Number(input.get("pricePerPoint"));
  } else {
    campaignId = input.campaignId;
    expectedVersion = input.expectedVersion;
    name = input.name;
    slug = input.slug;
    eligibilityStageId = input.eligibilityStageId;
    startsAt =
      typeof input.startsAt === "string"
        ? input.startsAt.includes("T") && !input.startsAt.includes("+") && !input.startsAt.endsWith("Z")
          ? parseWibDateTime(input.startsAt)
          : new Date(input.startsAt)
        : input.startsAt;
    endsAt =
      typeof input.endsAt === "string"
        ? input.endsAt.includes("T") && !input.endsAt.includes("+") && !input.endsAt.endsWith("Z")
          ? parseWibDateTime(input.endsAt)
          : new Date(input.endsAt)
        : input.endsAt;
    pricePerPoint = input.pricePerPoint;
  }

  const result = await updateVotingCampaign(
    database,
    editionId,
    {
      campaignId,
      expectedVersion,
      name,
      slug,
      eligibilityStageId,
      startsAt,
      endsAt,
      pricePerPoint,
    },
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  revalidatePath("/voting");
  return result;
}

export async function deleteCampaignAction(input: {
  campaignId: string;
  expectedVersion: number;
  confirmation: string;
  reason: string;
}) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  const result = await deleteVotingCampaign(
    database,
    editionId,
    input,
    actorFromSession(actor),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  revalidatePath("/voting");
  return result;
}

export async function updateCampaignStageAction(input: {
  campaignId: string;
  stageId: string;
  expectedVersion: number;
}) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  const result = await updateVotingCampaignStage(
    database,
    editionId,
    input,
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin/voting");
  return result;
}

export async function startCampaignAction(input: {
  campaignId: string;
  expectedVersion: number;
  confirmation: string;
  reason: string;
}) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  const result = await startVotingCampaign(
    database,
    editionId,
    input,
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  return result;
}

export async function closeCampaignAction(input: {
  campaignId: string;
  expectedVersion: number;
  confirmation: string;
  reason: string;
}) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  const result = await closeVotingCampaign(
    database,
    editionId,
    input,
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  return result;
}

export async function setResultVisibilityAction(input: {
  campaignId: string;
  expectedVersion: number;
  visibility: "hidden" | "visible";
  reason: string;
}) {
  const actor = await requirePermission("voting.manage");
  const editionId = await requireEditionId();
  const result = await setVotingResultVisibility(
    database,
    editionId,
    input,
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin/voting");
  return result;
}

export async function saveTallyAction(formData: FormData) {
  const actor = await requirePermission("voting.tally");
  const editionId = await requireEditionId();
  await saveVotingTally(
    database,
    editionId,
    {
      campaignId: String(formData.get("campaignId") ?? ""),
      participantId: String(formData.get("participantId") ?? ""),
      localDate: String(formData.get("localDate") ?? ""),
      amount: Number(formData.get("amount")),
      expectedVersion: Number(formData.get("version") ?? 0),
      reason: String(formData.get("reason") ?? ""),
    },
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin/voting");
}

export async function saveBatchTallyAction(input: {
  campaignId: string;
  entries: Array<{
    participantId: string;
    votes: number;
    mode?: "add" | "set";
    expectedVersion?: number;
  }>;
  reason: string;
}) {
  const actor = await requirePermission("voting.tally");
  const editionId = await requireEditionId();
  const result = await saveVotingTalliesBatch(
    database,
    editionId,
    input,
    actorFromSession(actor),
    new Date(),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/voting");
  revalidatePath("/voting");
  return result;
}

