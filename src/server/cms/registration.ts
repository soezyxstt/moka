export const REGISTRATION_SECTIONS = ["hero", "status", "usia", "syarat", "kriteria", "jalur", "ots", "berkas", "langkah", "timeline", "faq"] as const;

export function registrationEditionEligible(year: number) {
  return Number.isInteger(year) && year >= 2026;
}

export function registrationLines(body: string | null | undefined) {
  return (body ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function registrationRows(body: string | null | undefined) {
  return registrationLines(body).flatMap((line) => {
    const fields = line.split("|").map((field) => field.trim());
    return fields.length >= 2 && fields.length <= 3 && fields[0] && fields[1]
      ? [{ label: fields[0], title: fields[1], detail: fields[2] || null }]
      : [];
  });
}

export function registrationVisible(year: number, hero: { title: string | null; body: string | null } | undefined) {
  return registrationEditionEligible(year) && Boolean(hero?.title?.trim() && hero.body?.trim());
}
