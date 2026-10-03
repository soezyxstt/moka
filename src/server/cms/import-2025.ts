import { createHash } from "node:crypto";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { categories as sourceCategories, logoNames, misi, rangkaianKegiatan } from "@/lib/data";
import { newsUrls } from "@/lib/news";
import { ketua, pengurus } from "@/lib/organogram";
import { appendAuditLog } from "@/server/auth/audit";
import type { Database } from "@/server/db/queries";
import {
  categories,
  editionPrograms,
  editions,
  events,
  galleries,
  galleryItems,
  mediaAssets,
  newsArticles,
  organizationMemberships,
  organizationPeriods,
  organizationUnits,
  pageSections,
  participantAchievements,
  participantMedia,
  participantStageEntries,
  participants,
  people,
  selectionStages,
  sponsors,
  siteAssetBindings,
  type Category,
} from "@/server/db/schema";
import { SITE_ASSET_SLOTS } from "@/server/cms/site-asset-manifest";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type ImportTable = SQLiteTable & { id: SQLiteColumn };
type ImportRow = Record<string, unknown> & { id: string };
type SourceParticipant = { no: number | string; name: string; description: string; achievements: string[] };

const editionId = stableId("edition:2025");
const organizationVision = "Mewujudkan Paguyuban Mojang Jajaka Garut sebagai tempat pengembangan diri yang inspiratif dan berbudaya serta berwawasan global.";
const galleryVideoIds = [
  "5w0ORZ0XUkE", "PEx2wVwReX4", "Str4439U-OM", "f6rmvU8o6CI", "I-R_T7cULcI",
  "05GxYCSbhg4", "qG8qy-QUxKY", "pWTQEm_gCaY", "S4NanSPqf00",
] as const;

const siteAssetPaths: Record<string, string> = {
  "home.hero.bg": "/babancong.webp",
  "home.hero.fg": "/hero.webp",
  "home.programs.bg": "/programs.jpg",
  "home.programs.collage.1": "/program-1.webp",
  "home.programs.collage.2": "/program-2.webp",
  "home.programs.collage.3": "/program-3.webp",
  "home.programs.collage.4": "/bagendit.webp",
  "home.news.bg": "/bagendit.webp",
  "home.cta.bg": "/gf-1.webp",
  "home.cta.image": "/moka.png",
  "about.hero.bg": "/hero-about.webp",
  "about.vision.bg": "/gf-1.webp",
  "about.intro.image": "/gf-about.webp",
  "about.vision.image": "/vision.jpg",
  "about.gallery.bg": "/bagendit.jpg",
  "category.jd.poster": "/finalis/hero.webp",
  "category.md.poster": "/finalis/hero.webp",
  "category.jr.poster": "/finalis/hero.webp",
  "category.mr.poster": "/finalis/hero.webp",
  "category.jd.video": "/finalis/hero.webm",
  "category.md.video": "/finalis/hero.webm",
  "category.jr.video": "/finalis/hero.webm",
  "category.mr.video": "/finalis/hero.webm",
};

const homePrograms = [
  "Pasanggiri Mojang Jajaka Kabupaten Garut.",
  "MOKA Uninga: Mojang Jajaka Ulin Ngaprak Garut.",
  "Balakecrakan: Buka Bersama Lampahan Kanggo Ngakeun Rukun Atikan Maparin Kaberkahan.",
  "Hurub Guyub: Miara Hubungan, Ngabudikeun Guyub.",
  "Berseka: Bersama Sehat Bareng Moka Garut.",
  "Karmisun: Kartu Miara Kasundaan.",
] as const;

function stableId(value: string) {
  return `import-${createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "konten";
}

function sourcePath(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\/?public\//, "").replace(/^\/+/, "");
  const segments = normalized.split("/");
  if (!normalized || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Path media sumber tidak valid: ${value}`);
  }
  return `/${normalized}`;
}

async function upsertOwned(tx: Transaction, table: ImportTable, row: ImportRow) {
  const [current] = await tx.select().from(table).where(eq(table.id, row.id)).limit(1);
  if (!current) {
    await tx.insert(table).values(row as never);
    return;
  }

  const existing = current as Record<string, unknown>;
  const changed = Object.entries(row).some(([key, value]) =>
    key !== "id" && key !== "version" && JSON.stringify(existing[key] ?? null) !== JSON.stringify(value ?? null),
  );
  if (!changed) return;

  const update: Record<string, unknown> = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id"));
  update.updatedAt = new Date();
  if (typeof existing.version === "number") update.version = existing.version + 1;
  await tx.update(table).set(update as never).where(eq(table.id, row.id));
}

function mediaPathForOrganizationMember(name: string) {
  return pengurus.some((person) => person.nama === name)
    ? `/pengurus/${name}.png`
    : `/ketua/${name}.png`;
}

function getSourceParticipants() {
  const folderBySlug: Record<string, string> = {
    "mojang-rumaja": "MR",
    "jajaka-rumaja": "JR",
    "mojang-dewasa": "MD",
    "jajaka-dewasa": "JD",
  };
  return sourceCategories.map((category) => {
    if (folderBySlug[category.slug] !== category.abrev) {
      throw new Error(`Folder kategori tidak cocok untuk ${category.slug} (${category.abrev})`);
    }
    const semifinalists = category.list as SourceParticipant[];
    const finalists = category.finalist as SourceParticipant[];
    const semifinalBySlug = new Map(semifinalists.map((person) => [slugify(person.name), person]));
    const finalistBySlug = new Map(finalists.map((person) => [slugify(person.name), person]));
    if (semifinalBySlug.size !== semifinalists.length || finalistBySlug.size !== finalists.length) {
      throw new Error(`Nama peserta duplikat pada kategori ${category.abrev}`);
    }
    for (const person of finalists) {
      if (!semifinalBySlug.has(slugify(person.name))) {
        throw new Error(`Finalis ${person.name} tidak ditemukan pada daftar semifinalis ${category.abrev}`);
      }
    }
    return { category, semifinalists, finalists, semifinalBySlug, finalistBySlug };
  });
}

export type Import2025Result = {
  counts: {
    editions: number;
    pageSections: number;
    programs: number;
    siteAssets: number;
    organizationPeriods: number;
    organizationMembers: number;
    categories: number;
    selectionStages: number;
    participants: number;
    achievements: number;
    participantMedia: number;
    stageEntries: number;
    events: number;
    albums: number;
    galleryItems: number;
    newsArticles: number;
    sponsors: number;
    votingCampaigns: number;
    profileVideos: number;
  };
  notes: string[];
};

export async function import2025Content(tx: Transaction, actor: { userId: string; label: string }): Promise<Import2025Result> {
  const owner = await tx.select({ id: editions.id }).from(editions)
    .where(or(eq(editions.year, 2025), eq(editions.slug, "2025"))).limit(1);
  if (owner[0]?.id === editionId) {
    throw new Error("Konten edisi 2025 sudah pernah diimpor. Import dihentikan agar perubahan CMS tidak tertimpa.");
  }
  if (owner[0]) {
    throw new Error("Edisi 2025 sudah ada dengan ID berbeda. Import dibatalkan agar data yang ada tidak tertimpa.");
  }

  const mediaRows = await tx.select().from(mediaAssets);
  const mediaByPath = new Map<string, (typeof mediaRows[number])[]>();
  for (const media of mediaRows) {
    const key = sourcePath(media.filename);
    mediaByPath.set(key, [...(mediaByPath.get(key) ?? []), media]);
  }
  const getMedia = (path: string) => {
    const key = sourcePath(path);
    const ready = (mediaByPath.get(key) ?? []).filter(
      (asset) => asset.lifecycle === "ready" && /^https?:\/\//i.test(asset.url),
    );
    if (ready.length > 1) throw new Error(`Path media sumber memiliki lebih dari satu aset siap: ${key}`);
    return ready[0] ?? null;
  };

  const participantSources = getSourceParticipants();
  const requiredPaths = new Set<string>([
    ...Object.values(siteAssetPaths), "/logo-w.png", "/pdf/SK_MOKA.pdf",
    "/berita/press-release-semifinalis.webp", "/berita/press-release-semifinalis.pdf",
  ]);
  for (const logo of logoNames) requiredPaths.add(sourcePath(`/sponsors/${logo}`));
  for (const event of rangkaianKegiatan) {
    const slug = slugify(event.label);
    const eventPaths = [...mediaByPath.keys()].filter((path) => path.startsWith(`/rangkaian-kegiatan/${slug}/`));
    if (!eventPaths.length) throw new Error(`Foto untuk album ${event.label} belum diunggah ke pustaka media.`);
    eventPaths.forEach((path) => requiredPaths.add(path));
  }
  const expectedEventSlugs = new Set(["audisi", "semifinal", "karantina", "unjuk-kabisa", "gala-dinner", "grand-final"]);
  const sourceEventSlugs = new Set(rangkaianKegiatan.map((event) => slugify(event.label)));
  if (sourceEventSlugs.size !== expectedEventSlugs.size || [...sourceEventSlugs].some((slug) => !expectedEventSlugs.has(slug))) {
    throw new Error("Slug kegiatan 2025 tidak cocok dengan enam folder foto sumber.");
  }
  for (const { category, semifinalists, finalists } of participantSources) {
    for (const person of semifinalists) {
      const folder = person.name.trim().replaceAll(" ", "_");
      requiredPaths.add(`/peserta/${category.abrev}/${folder}/default.png`);
      requiredPaths.add(`/qr/${category.abrev}/${folder}.jpg`);
    }
    for (const person of finalists) {
      requiredPaths.add(`/finalis/${category.abrev}/${category.abrev}${String(Number(person.no)).padStart(2, "0")}.webp`);
    }
  }
  for (const person of [...pengurus, ...ketua]) requiredPaths.add(mediaPathForOrganizationMember(person.nama));

  const missing = [...requiredPaths].filter((path) => !getMedia(path));
  if (missing.length) {
    throw new Error(`Import dibatalkan. ${missing.length} media belum siap di UploadThing: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ", dan lainnya" : ""}`);
  }
  const getMediaId = (path: string) => getMedia(path)?.id ?? null;
  const now = new Date();
  const periods = ketua.map((chair, index) => {
    const [startYear, rawEndYear] = chair.posisi.split("-");
    const endYear = rawEndYear === "Sekarang" ? 2025 : Number(rawEndYear);
    const start = Number(startYear);
    return {
      id: stableId(`organization-period:${chair.posisi}`),
      label: chair.posisi,
      startYear: start,
      endYear,
      vision: index === ketua.length - 1 ? organizationVision : null,
      missionJson: index === ketua.length - 1 ? JSON.stringify(misi) : "[]",
      lifecycle: index === ketua.length - 1 ? "active" : "archived",
    };
  });
  const activePeriod = periods.at(-1);
  if (!activePeriod) throw new Error("Periode kepengurusan sumber kosong");

  const pages = [
    { key: "home/hero", pageKey: "home", sectionKey: "hero", title: "Paguyuban Mojang Jajaka Kabupaten Garut", eyebrow: null, body: "Nu Nyunda Tur Nyakola", presentationJson: "{}" },
    { key: "home/program", pageKey: "home", sectionKey: "program", title: "Program Unggulan Paguyuban Mojang Jajaka Kabupaten Garut", eyebrow: "Program Kami", body: null, presentationJson: "{}" },
    { key: "home/berita", pageKey: "home", sectionKey: "berita", title: "Berita dan Update", eyebrow: null, body: "Tetap terinformasi dengan perkembangan terkini agar Anda tetap terupdate.", presentationJson: "{}" },
    { key: "home/ajakan", pageKey: "home", sectionKey: "ajakan", title: "Mari Bergabung Bersama Kami di Mojang Jajaka Kab. Garut", eyebrow: "Mari Bergabung", body: "Apakah kamu generasi muda Garut yang berbakat, cerdas, berwawasan luas, dan memiliki jiwa kepemimpinan serta cinta terhadap budaya Sunda? Inilah saatnya kamu unjuk diri dan jadi representasi anak muda terbaik Kabupaten Garut di ajang Pasanggiri Mojang Jajaka Kabupaten Garut 2025!", presentationJson: JSON.stringify({ actionLabel: "Daftar", actionHref: "https://linktr.ee/mokagarut" }) },
    { key: "tentang/hero", pageKey: "tentang", sectionKey: "hero", title: "Kenali Kami Lebih Dekat", eyebrow: null, body: null, presentationJson: "{}" },
    { key: "tentang/visi", pageKey: "tentang", sectionKey: "visi", title: "Visi Kami", eyebrow: null, body: organizationVision, presentationJson: "{}" },
    { key: "tentang/misi", pageKey: "tentang", sectionKey: "misi", title: "Misi Kami", eyebrow: null, body: misi.join("\n"), presentationJson: JSON.stringify(misi) },
    { key: "tentang/legalitas", pageKey: "tentang", sectionKey: "legalitas", title: "Legalitas Organisasi", eyebrow: null, body: "Paguyuban Mojang Jajaka Kabupaten Garut merupakan perkumpulan yang sah dan terdaftar secara hukum di Indonesia. Status badan hukum kami telah disahkan melalui Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia Nomor AHU-0001483.AH.01.07.TAHUN 2024.", presentationJson: JSON.stringify({ documentMediaId: getMediaId("/pdf/SK_MOKA.pdf"), documentTitle: "Surat Keputusan Pengesahan Badan Hukum" }) },
    { key: "tentang/organisasi", pageKey: "tentang", sectionKey: "organisasi", title: "Pengurus Paguyuban Mojang Jajaka Kabupaten Garut", eyebrow: null, body: null, presentationJson: "{}" },
  ];

  for (const period of periods) {
    await upsertOwned(tx, organizationPeriods, { ...period, version: 1 } as ImportRow);
    const unitId = stableId(`organization-unit:${period.id}`);
    await upsertOwned(tx, organizationUnits, { id: unitId, periodId: period.id, parentId: null, name: `Pengurus ${period.label}`, displayOrder: 0, active: true } as ImportRow);
    const membershipRows = period.id === activePeriod.id
      ? pengurus.map((person, index) => ({ person, title: person.posisi, displayOrder: index }))
      : ketua.filter((person) => stableId(`organization-period:${person.posisi}`) === period.id)
        .map((person) => ({ person, title: "Ketua Umum", displayOrder: 0 }));
    for (const { person, title, displayOrder } of membershipRows) {
      const personSlug = slugify(person.nama);
      const personId = stableId(`person:${personSlug}`);
      await upsertOwned(tx, people, { id: personId, name: person.nama, slug: personSlug, portraitMediaId: getMediaId(mediaPathForOrganizationMember(person.nama)) } as ImportRow);
      await upsertOwned(tx, organizationMemberships, {
        id: stableId(`organization-membership:${period.id}:${displayOrder}:${personId}`),
        periodId: period.id, unitId, personId, title, displayOrder, active: true, version: 1,
      } as ImportRow);
    }
  }

  await upsertOwned(tx, editions, {
    id: editionId, year: 2025, slug: "2025", name: "Pasanggiri Mojang Jajaka Garut 2025",
    timezone: "Asia/Jakarta", lifecycle: "active", organizationPeriodId: activePeriod.id,
    logoMediaId: getMediaId("/logo-w.png"), slogan: "Nu Nyunda Tur Nyakola", version: 1,
  } as ImportRow);
  const activeNewerEditions = await tx.select().from(editions)
    .where(and(eq(editions.lifecycle, "active"), gt(editions.year, 2025)));
  for (const edition of activeNewerEditions) {
    await tx.update(editions).set({ lifecycle: "draft", version: edition.version + 1, updatedAt: now }).where(eq(editions.id, edition.id));
  }

  for (const page of pages) {
    await upsertOwned(tx, pageSections, {
      id: stableId(`page-section:${editionId}:${page.key}`), editionId, pageKey: page.pageKey,
      sectionKey: page.sectionKey, title: page.title, eyebrow: page.eyebrow, body: page.body,
      presentationJson: page.presentationJson, status: "published", version: 1,
    } as ImportRow);
  }
  for (const [displayOrder, title] of homePrograms.entries()) {
    await upsertOwned(tx, editionPrograms, {
      id: stableId(`edition-program:${editionId}:${displayOrder}`), editionId, title, description: null, displayOrder, active: true,
    } as ImportRow);
  }
  for (const [slotKey, path] of Object.entries(siteAssetPaths)) {
    if (!SITE_ASSET_SLOTS.some((slot) => slot.slotKey === slotKey)) throw new Error(`Slot aset tidak terdaftar: ${slotKey}`);
    await upsertOwned(tx, siteAssetBindings, {
      id: stableId(`site-asset:${editionId}:${slotKey}`), editionId, slotKey, mediaId: getMediaId(path), altOverride: null,
    } as ImportRow);
  }
  for (const [displayOrder, logo] of logoNames.entries()) {
    const name = logo.replace(/\.[^.]+$/, "");
    await upsertOwned(tx, sponsors, {
      id: stableId(`sponsor:2025:${displayOrder}:${logo}`), editionId, name, tier: "pendukung",
      website: null, logoMediaId: getMediaId(sourcePath(`/sponsors/${logo}`)), displayOrder, active: true, version: 1,
    } as ImportRow);
  }

  for (const [categoryIndex, source] of sourceCategories.entries()) {
    const categoryId = stableId(`category:2025:${source.abrev}`);
    const categoryCode = source.abrev as Category;
    await upsertOwned(tx, categories, {
      id: categoryId, editionId, code: categoryCode, slug: source.slug, label: source.name, displayOrder: categoryIndex, active: true,
    } as ImportRow);
  }

  const targets = new Map(sourceCategories.map((source) => [source.abrev, source.list.length]));
  const finalTargets = new Map(sourceCategories.map((source) => [source.abrev, source.finalist.length]));
  const stageDefinitions = [
    { slug: "semifinalis", name: "Semifinalis", order: 1, finalStage: false, lifecycle: "closed", total: sourceCategories.reduce((sum, source) => sum + source.list.length, 0), targets },
    { slug: "finalis", name: "Finalis", order: 2, finalStage: true, lifecycle: "closed", total: sourceCategories.reduce((sum, source) => sum + source.finalist.length, 0), targets: finalTargets },
  ] as const;
  const stageIds = new Map<string, string>();
  for (const stage of stageDefinitions) {
    const id = stableId(`selection-stage:2025:${stage.slug}`);
    stageIds.set(stage.slug, id);
    await upsertOwned(tx, selectionStages, {
      id, editionId, name: stage.name, slug: stage.slug, displayOrder: stage.order, targetParticipantCount: stage.total,
      targetJDCount: stage.targets.get("JD") ?? 0, targetMDCount: stage.targets.get("MD") ?? 0,
      targetJRCount: stage.targets.get("JR") ?? 0, targetMRCount: stage.targets.get("MR") ?? 0,
      lifecycle: stage.lifecycle, finalStage: stage.finalStage, version: 1,
    } as ImportRow);
  }

  let participantCount = 0;
  let achievementCount = 0;
  let participantMediaCount = 0;
  let stageEntryCount = 0;
  const currentFinalStageId = stageIds.get("finalis");
  const semifinalStageId = stageIds.get("semifinalis");
  if (!currentFinalStageId || !semifinalStageId) throw new Error("Tahap sumber tidak lengkap");

  for (const { category, semifinalists, finalistBySlug } of participantSources) {
    const categoryId = stableId(`category:2025:${category.abrev}`);
    for (const [displayOrder, semifinalist] of semifinalists.entries()) {
      const slug = slugify(semifinalist.name);
      const finalist = finalistBySlug.get(slug);
      const finalNumber = finalist ? Number(finalist.no) : null;
      const semifinalNumber = Number(semifinalist.no);
      const number = finalNumber ?? semifinalNumber;
      if (!Number.isInteger(semifinalNumber) || semifinalNumber < 1 || !Number.isInteger(number) || number < 1) throw new Error(`Nomor peserta tidak valid: ${semifinalist.name}`);
      const participantId = stableId(`participant:2025:${category.abrev}:${slug}`);
      const semifinalPhotoPath = `/peserta/${category.abrev}/${semifinalist.name.trim().replaceAll(" ", "_")}/default.png`;
      const portraitPath = finalist
        ? `/finalis/${category.abrev}/${category.abrev}${String(Number(finalist.no)).padStart(2, "0")}.webp`
        : semifinalPhotoPath;
      const profile = finalist ?? semifinalist;
      const currentStage = finalist ? "finalis" : "semifinalis";
      const currentStageId = finalist ? currentFinalStageId : semifinalStageId;
      await upsertOwned(tx, participants, {
        id: participantId, editionId, categoryId, stage: currentStage, currentStageId,
        selectionStatus: finalist ? "completed" : "eliminated", number, name: semifinalist.name, slug,
        bio: profile.description, portraitMediaId: getMediaId(portraitPath), qrisMediaId: getMediaId(`/qr/${category.abrev}/${semifinalist.name.trim().replaceAll(" ", "_")}.jpg`),
        paymentUrl: null, displayOrder: finalist ? category.finalist.findIndex((person) => slugify(person.name) === slug) : displayOrder,
        active: true, version: 1,
      } as ImportRow);
      participantCount += 1;

      if (finalist) {
        await upsertOwned(tx, participantMedia, {
          id: stableId(`participant-media:2025:${participantId}:semifinal-portrait`), participantId,
          role: "other", mediaId: getMediaId(semifinalPhotoPath), caption: "Foto semifinalis 2025", displayOrder: 0, active: true,
        } as ImportRow);
        participantMediaCount += 1;
      }

      for (const [achievementOrder, text] of profile.achievements.entries()) {
        await upsertOwned(tx, participantAchievements, {
          id: stableId(`participant-achievement:2025:${participantId}:${achievementOrder}`), participantId, text, displayOrder: achievementOrder,
        } as ImportRow);
        achievementCount += 1;
      }

      await upsertOwned(tx, participantStageEntries, {
        id: stableId(`participant-stage-entry:2025:${participantId}:semifinalis`), participantId, stageId: semifinalStageId,
        number: semifinalNumber, displayOrder,
        decision: finalist ? "advanced" : "eliminated", decidedAt: null, decidedByUserId: null,
        reason: null, version: 1,
      } as ImportRow);
      stageEntryCount += 1;
      if (finalist) {
        const finalistDisplayOrder = category.finalist.findIndex((person) => slugify(person.name) === slug);
        await upsertOwned(tx, participantStageEntries, {
          id: stableId(`participant-stage-entry:2025:${participantId}:finalis`), participantId, stageId: currentFinalStageId,
          number: finalNumber, displayOrder: finalistDisplayOrder,
          decision: "pending", decidedAt: null, decidedByUserId: null, reason: null, version: 1,
        } as ImportRow);
        stageEntryCount += 1;
      }
    }
  }

  let eventCount = 0;
  let albumCount = 0;
  let galleryItemCount = 0;
  for (const [displayOrder, source] of rangkaianKegiatan.entries()) {
    const slug = slugify(source.label);
    const eventId = stableId(`event:2025:${slug}`);
    const paths = [...mediaByPath.keys()]
      .filter((path) => path.startsWith(`/rangkaian-kegiatan/${slug}/`))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
    const coverMediaId = getMediaId(paths[0] ?? "");
    await upsertOwned(tx, events, {
      id: eventId, editionId, slug, label: source.label, description: source.desc,
      heroMediaId: coverMediaId, displayOrder, active: true, version: 1,
    } as ImportRow);
    eventCount += 1;
    const galleryId = stableId(`gallery:event:${eventId}`);
    await upsertOwned(tx, galleries, {
      id: galleryId, editionId, slug: `galeri-${slug}`, title: `Galeri ${source.label}`, description: source.desc,
      coverMediaId, ownerType: "event", ownerId: eventId, displayOrder, status: "published", active: true, version: 1,
    } as ImportRow);
    albumCount += 1;
    for (const [itemOrder, path] of paths.entries()) {
      await upsertOwned(tx, galleryItems, {
        id: stableId(`gallery-item:${galleryId}:${path}`), galleryId, mediaId: getMediaId(path), youtubeId: null,
        caption: `${source.label} ${itemOrder + 1}`, displayOrder: itemOrder, active: true,
      } as ImportRow);
      galleryItemCount += 1;
    }
  }

  const videoGalleryId = stableId(`gallery:2025:video-dokumentasi`);
  await upsertOwned(tx, galleries, {
    id: videoGalleryId, editionId, slug: "dokumentasi-video-2025", title: "Dokumentasi Pasanggiri 2025",
    description: "Dokumentasi video PAMOKA Garut 2025.", coverMediaId: null, ownerType: "standalone", ownerId: editionId,
    displayOrder: rangkaianKegiatan.length, status: "published", active: true, version: 1,
  } as ImportRow);
  albumCount += 1;
  for (const [displayOrder, youtubeId] of galleryVideoIds.entries()) {
    await upsertOwned(tx, galleryItems, {
      id: stableId(`gallery-item:${videoGalleryId}:youtube:${youtubeId}`), galleryId: videoGalleryId,
      mediaId: null, youtubeId, caption: `Dokumentasi PAMOKA Garut ${displayOrder + 1}`, displayOrder, active: true,
    } as ImportRow);
    galleryItemCount += 1;
  }

  const sourceNews = newsUrls.filter((item): item is Exclude<(typeof newsUrls)[number], string> => typeof item !== "string");
  const pressRelease = sourceNews.find((item) => item.url.endsWith("press-release-semifinalis.pdf"));
  if (!pressRelease) throw new Error("Press release 2025 tidak ditemukan pada sumber berita.");
  await upsertOwned(tx, newsArticles, {
    id: stableId("news:2025:press-release-semifinalis"), editionId, title: pressRelease.title,
    slug: "press-release-semifinalis-2025", excerpt: pressRelease.description, body: null, bodyJson: null,
    kind: "file", sourceUrl: getMedia(sourcePath(pressRelease.url))?.url ?? null,
    coverMediaId: getMediaId(sourcePath(pressRelease.imageUrl)), publishedAt: pressRelease.date,
    status: "published", version: 1,
  } as ImportRow);
  const counts: Import2025Result["counts"] = {
    editions: 1, pageSections: pages.length, programs: homePrograms.length, siteAssets: Object.keys(siteAssetPaths).length,
    organizationPeriods: periods.length, organizationMembers: pengurus.length + ketua.length - 1,
    categories: sourceCategories.length, selectionStages: stageDefinitions.length,
    participants: participantCount, achievements: achievementCount, participantMedia: participantMediaCount,
    stageEntries: stageEntryCount, events: eventCount, albums: albumCount, galleryItems: galleryItemCount,
    newsArticles: 1, sponsors: logoNames.length, votingCampaigns: 0, profileVideos: 0,
  };
  await appendAuditLog(tx, {
    actorUserId: actor.userId,
    actorLabel: actor.label,
    action: "cms.import.2025",
    resourceType: "edition",
    resourceId: editionId,
    resourceLabel: "Pasanggiri Mojang Jajaka Garut 2025",
    before: { newerActiveEditionIds: activeNewerEditions.map((edition) => edition.id) },
    after: counts,
    changedFields: ["edition", "pageSections", "programs", "siteAssets", "organization", "participants", "events", "galleries", "news"],
    source: "admin-local-import",
    reason: "Import data sumber 2025 ke database lokal",
  });

  return {
    counts,
    notes: [
      "Logo sponsor dari sumber lama diimpor sebagai pendukung karena tier rinci tidak tersedia.",
      "Kampanye dan tally voting tidak diimpor karena tanggal serta total tepercaya tidak tersedia pada sumber 2025.",
      "Tidak ada video profil per peserta pada berkas sumber.",
      "Berita contoh dari data.ts serta tautan eksternal tanpa metadata tanggal tidak diimpor.",
      "Edisi aktif dengan tahun di atas 2025 dipindahkan ke draft tanpa menghapus datanya.",
    ],
  };
}

export async function import2025ContentTransaction(
  actor: { userId: string; label: string },
): Promise<Import2025Result> {
  const existing = await import("@/server/db/client");
  return existing.database.transaction((tx) => import2025Content(tx, actor));
}

export async function repair2025StageNumbers(
  tx: Transaction,
  actor: { userId: string; label: string },
) {
  const [edition] = await tx.select({ id: editions.id, year: editions.year, name: editions.name })
    .from(editions)
    .where(eq(editions.id, editionId))
    .limit(1);
  if (!edition || edition.year !== 2025) throw new Error("Edisi sumber 2025 tidak ditemukan");

  const stageRows = await tx.select({ id: selectionStages.id, slug: selectionStages.slug, finalStage: selectionStages.finalStage })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, editionId));
  const semifinalStage = stageRows.find((stage) => stage.slug === "semifinalis");
  const finalStage = stageRows.find((stage) => stage.slug === "finalis");
  if (!semifinalStage || semifinalStage.finalStage || !finalStage?.finalStage) {
    throw new Error("Tahap semifinalis atau finalis edisi 2025 tidak cocok dengan data sumber");
  }

  const expected: Array<{ participantId: string; categoryId: string; stageId: string; stage: "semifinalis" | "finalis"; number: number; displayOrder: number }> = [];
  const participantIds = new Set<string>();
  for (const { category, semifinalists, finalists } of getSourceParticipants()) {
    if (
      new Set(semifinalists.map((person) => Number(person.no))).size !== semifinalists.length
      || new Set(finalists.map((person) => Number(person.no))).size !== finalists.length
    ) {
      throw new Error(`Nomor sumber peserta duplikat pada kategori ${category.abrev}`);
    }
    const categoryId = stableId(`category:2025:${category.abrev}`);
    for (const [displayOrder, person] of semifinalists.entries()) {
      const number = Number(person.no);
      if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Nomor semifinalis tidak valid: ${category.abrev}`);
      const participantId = stableId(`participant:2025:${category.abrev}:${slugify(person.name)}`);
      participantIds.add(participantId);
      expected.push({ participantId, categoryId, stageId: semifinalStage.id, stage: "semifinalis", number, displayOrder });
    }
    for (const [displayOrder, person] of finalists.entries()) {
      const number = Number(person.no);
      if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Nomor finalis tidak valid: ${category.abrev}`);
      const participantId = stableId(`participant:2025:${category.abrev}:${slugify(person.name)}`);
      participantIds.add(participantId);
      expected.push({ participantId, categoryId, stageId: finalStage.id, stage: "finalis", number, displayOrder });
    }
  }

  const participantRows = await tx.select({ id: participants.id, categoryId: participants.categoryId })
    .from(participants)
    .where(and(eq(participants.editionId, editionId), inArray(participants.id, [...participantIds])));
  const entryRows = await tx.select({
      id: participantStageEntries.id,
      participantId: participantStageEntries.participantId,
      stageId: participantStageEntries.stageId,
      number: participantStageEntries.number,
      displayOrder: participantStageEntries.displayOrder,
      version: participantStageEntries.version,
    })
    .from(participantStageEntries)
    .where(inArray(participantStageEntries.participantId, [...participantIds]));
  const participantsById = new Map(participantRows.map((participant) => [participant.id, participant]));
  const entriesByKey = new Map(entryRows.map((entry) => [`${entry.participantId}:${entry.stageId}`, entry]));
  const now = new Date();
  const updatedByStage = { semifinalis: 0, finalis: 0 };
  let missingNumbers = 0;
  let missingOrders = 0;

  for (const item of expected) {
    if (participantsById.get(item.participantId)?.categoryId !== item.categoryId) {
      throw new Error("Peserta sumber 2025 tidak cocok dengan kategori pada database");
    }
    const entry = entriesByKey.get(`${item.participantId}:${item.stageId}`);
    if (!entry) throw new Error(`Data tahap ${item.stage} tidak ditemukan untuk peserta sumber 2025`);
    if (entry.number !== null && entry.number !== item.number) throw new Error(`Nomor tahap ${item.stage} sudah memiliki nilai berbeda`);
    if (entry.displayOrder !== null && entry.displayOrder !== item.displayOrder) throw new Error(`Urutan tahap ${item.stage} sudah memiliki nilai berbeda`);
    if (entry.number === null) missingNumbers += 1;
    if (entry.displayOrder === null) missingOrders += 1;
    if (entry.number === item.number && entry.displayOrder === item.displayOrder) continue;

    await tx.update(participantStageEntries)
      .set({ number: item.number, displayOrder: item.displayOrder, version: entry.version + 1, updatedAt: now })
      .where(eq(participantStageEntries.id, entry.id));
    updatedByStage[item.stage] += 1;
  }

  const updatedEntries = updatedByStage.semifinalis + updatedByStage.finalis;
  if (updatedEntries) {
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "cms.repair.2025-stage-numbering",
      resourceType: "edition",
      resourceId: editionId,
      resourceLabel: edition.name,
      before: { missingNumbers, missingOrders },
      after: { updatedEntries, ...updatedByStage },
      changedFields: ["participantStageEntry.number", "participantStageEntry.displayOrder"],
      source: "admin-local-repair",
      reason: "Mengisi nomor dan urutan per tahap dari data sumber 2025.",
    });
  }

  return { updatedEntries, ...updatedByStage };
}
