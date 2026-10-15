export type SiteContact = { label: string; href: string; kind: "instagram" | "youtube" | "email" };

export function contactHref(kind: SiteContact["kind"], value: string | null | undefined) {
  if (!value?.trim()) return null;
  const text = value.trim();
  if (kind === "email") return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text) ? `mailto:${text}` : null;
  try {
    const url = new URL(text);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function organizationCopy(period: { vision: string | null; missionJson: string } | null, fallback: { vision: string | null; mission: string[] }) {
  if (!period) return fallback;
  let mission: string[] = [];
  try {
    const value: unknown = JSON.parse(period.missionJson);
    if (Array.isArray(value)) mission = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  } catch { /* Invalid legacy missions remain empty. */ }
  return { vision: period.vision?.trim() || null, mission };
}
