"use server";
import { revalidatePath } from "next/cache";
import { approveAccessRequest, updateUserRoles } from "@/server/auth/access-requests";

export async function approveAction(formData: FormData) {
  const multi = formData.getAll("roleSlugs").map(String).filter(Boolean);
  const roles = multi.length > 0 ? multi : [String(formData.get("roleSlug") ?? "")].filter(Boolean);
  await approveAccessRequest(String(formData.get("requestId")), roles, String(formData.get("note") ?? ""));
  revalidatePath("/admin/users");
}

export async function updateUserRolesAction(formData: FormData) {
  const roles = formData.getAll("roleSlugs").map(String).filter(Boolean);
  await updateUserRoles(String(formData.get("userId")), roles, String(formData.get("reason") ?? ""));
  revalidatePath("/admin/users");
}

