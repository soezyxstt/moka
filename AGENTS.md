<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Codebase Preview Reminder

> [!IMPORTANT]
> **READ BEFORE WRITING CODE**: This file is the authoritative source for project state, architecture, design system, and execution rules. Skim the full file before starting work. If a statement here conflicts with your training data, this file wins.

# Brand naming

- The project is the official website of **Paguyuban Mojang Jajaka Kabupaten Garut** (PAMOKA Garut).
- Use **PAMOKA Garut** for the site title and formal references; use **MOKA Garut** for the product/consumer-facing brand (footer, socials, metadata template `%s | MOKA Garut`). Never invent other spellings.
- The flagship event is the **Pasanggiri Mojang Jajaka Kabupaten Garut**. Keep the Sundanese tagline as brand copy: **Nu Nyunda Tur Nyakola**.
- Participant categories are fixed codes `JD`, `MD`, `JR`, `MR` (see `categoryValues` in `src/server/db/schema.ts`); they are rendered with their abbreviated label, never invented names.
- Social handles and hashtags are brand copy: `@mokagarut`, `#nyundaturnyakola`, `#kayakarya`.

# Design system

The design reference is the **public site** (`src/app/*` pages plus `src/components/custom/*` and `src/components/*`). The admin CMS surfaces are **NOT** the design reference; when you touch admin UI, reuse the existing admin primitives but steer the styling toward the public system. Do not treat the current admin look (slate-heavy, pill badges, deep shadows) as canonical.

Authoritative tokens live in `src/app/globals.css` (`@theme inline`, `:root`, `.dark`, `@layer base`). Prefer the semantic Tailwind utilities below over hard-coded hex or ad hoc font stacks.

## Font families

| Role | Font | Tailwind | Notes |
|------|------|----------|-------|
| **Headings & brand titles** | **Montserrat** (weights 400-800) | `font-montserrat` | Section headings, hero titles, card titles, page headers. Loaded in `src/style/font.ts`. |
| **Body, UI, captions** | **Inter** (weights 400-800) | `font-inter` | Default on `body` (set in `src/app/layout.tsx`). Paragraphs, nav, footer, form text. |

`next/font` exposes `--font-montserrat-next` and `--font-inter-next`; `@theme` maps `font-montserrat` / `font-inter` to those variables. The `--font-geist-*` tokens in `@theme` are unused defaults; do not rely on them.

## Typography (public)

Use the shared `typography` object from `@/components/custom/typography` for public copy. It is the canonical set, not a suggestion:

| Export | Renders | Base classes | Use |
|--------|---------|--------------|-----|
| `typography.t1` | `h3` | `uppercase text-fb-400 font-montserrat text-base font-bold` | Eyebrow / section label above a heading. |
| `typography.h1` | `h2` | `text-4xl font-semibold font-montserrat` | Section heading. Override size to `text-3xl md:text-5xl` and color to `text-white` on photo sections. |
| `typography.p` | `p` | `text-base font-normal font-montserrat text-[#505050]` | Body copy. `text-justify` and `text-[#505050]` are the established body look. |

Rules:
- Headings are Montserrat; never use Inter for a title and never use `text-gray-900`-style ad hoc heading colors on the public site.
- On dark photo heroes use `text-white` and muted `text-[#ddd]` / `text-white/80`; on light sections use `#505050` body text.
- Body text is left-aligned by default; use `text-justify` only where the design already does.

## Color

Tailwind maps each `--color-*` token to utilities: `text-{name}`, `bg-{name}`, `border-{name}`, and so on.

### Brand palettes (the identity; use first)

| Utility | Role |
|---------|------|
| `dgb`, `dgb-50` … `dgb-900` | Deep green primary. `bg-dgb` for primary buttons and CTAs; `text-dgb-900` for headings; `bg-dgb-50` for soft fills; `to-dgb-800` for hero vignettes. |
| `fb`, `fb-50` … `fb-900` | Firebrand orange accent. `text-fb-400`/`text-fb-500` for eyebrows; `text-fb` for inline highlights; `bg-fb` / `from-fb via-fb-200` for brand strips. |

### Semantic UI (shadcn) ; use for base surfaces

These adapt in light/dark via `:root` / `.dark` and are defined in `globals.css`. The default shadcn `primary` is neutral (near-black), so brand CTAs use `bg-dgb` explicitly rather than `bg-primary`.

| Token / utility | Use |
|-----------------|-----|
| `bg-background` / `text-foreground` | Page surface and primary text. |
| `bg-card` / `text-card-foreground` | Cards and elevated panels. |
| `bg-muted` / `text-muted-foreground` | Subtle fills; de-emphasized text. |
| `bg-secondary` / `text-secondary-foreground` | Secondary surfaces. |
| `border-border` | Default borders and dividers. |
| `bg-input` / `border-input` | Form fields. |
| `text-destructive` / destructive buttons | Errors and destructive actions. |
| `chart-1` … `chart-5` | Recharts series (mapped in theme). |

## Buttons

Public CTAs use `@/components/custom/button` (`rounded-md`, white text). Do not restyle buttons inline.

| Variant | Classes | Use |
|---------|---------|-----|
| `default` | `bg-dgb hover:bg-dgb/90 disabled:bg-dgb-600` | Primary action. |
| `outline` | `border border-dgb bg-transparent hover:bg-dgb hover:text-white` | Secondary action on light surfaces. |
| `destructive` | `bg-destructive` | Destructive action. |

Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10). For links styled as buttons, wrap the custom `Button` in a `Link`.

## Imagery & backgrounds

- Use `next/image` with explicit `width`/`height` (or `fill` inside a sized box) and `object-cover`. Never use plain `<img>` for site assets.
- Full-bleed hero sections: `bg-[url(/asset.webp)] bg-cover bg-center` on the `<section>`, with a radial vignette overlay: `bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800` (fixed, `pointer-events-none`, `z-0`).
- Legibility washes over photo sections: `bg-dgb-50/90` or `bg-fb-50/90` full-section overlays behind content. Use the `Section` component (`background` + `overlay`) for this pattern.
- `BG` (`@/components/next-image-bg`) is the reusable fixed site-texture background; `HeroVideo` + `HeroTextWrapper` (`@/components/custom/hero-video`, `@/components/custom/hero-text`) are the video-hero pattern with a poster fallback; `ImageMaskFade` (`@/components/custom/image-mask`) is the masked edge image.
- Prefer the established organic crops (`rounded-lg`, `rounded-b-full`, `rounded-t-full`, `rounded-full` circles) for creative compositions; do not invent new shapes.

## Layout & motion

- Mobile-first single column: `flex-col` / `grid-cols-1` under `sm:`, switch with `md:` breakpoints (`max-sm:` for mobile-only overrides). Test at 380px.
- Section rhythm: use the `Section` component (full-bleed, `px-8 md:px-20` / `py-12 md:py-20`, optional `background` + `overlay`); keep existing `min-h-screen` hero rhythm on the homepage.
- Footer: `bg-linear-to-br from-dgb to-fb` with `text-white` content and a `Separator`.
- Animation: `motion/react` (not `framer-motion`) and Lenis smooth scroll (`@/components/lenis`). Hover transitions use `transition-all`/`transition-colors` with short durations (e.g. `duration-500`, `group-hover:scale-102`); entrance uses the `animate-fade-in` keyframes in `globals.css`.
- Icons: `lucide-react`, `size-4` default.

## Radius

- Interactive elements and buttons: `rounded-md`.
- Media: `rounded-lg`; cards/surfaces: `rounded-xl`.
- `rounded-full` is allowed for circles, dots, and the site's organic circular compositions, not for elongated pills.

## Language & copy

- UI copy is **Bahasa Indonesia**, short labels, sentence case (e.g. `Batal`, `Lanjut`, `Selengkapnya`, `Geser untuk melihat berita lain`).
- Sundanese brand phrases (`Nu Nyunda Tur Nyakola`, `Ulin Ngaprak Garut`, and so on) are kept verbatim.
- Numbers over sentences; no exclamation marks, no filler, no em/en dashes.

---

## No Em/En Dashes

- Never use em dashes or en dashes (long hyphen characters) in any file. Use `;`, `,`, or `.` instead. This applies to code comments, UI copy, metadata descriptions, and documentation.

---

## Date & Time Handling

All timestamps are stored as **integer epoch milliseconds** with Drizzle `{ mode: "timestamp_ms" }`. Drizzle maps those columns to and from JS `Date` objects automatically; never treat them as seconds and never re-invent a converter.

### Rules

1. **Schema timestamps**: use `integer(..., { mode: "timestamp_ms" })` for `createdAt`/`updatedAt` and any instant. The shared `timestamps` helper in `src/server/db/schema.ts` is the pattern; reuse it.
2. **Day-granularity text columns**: `voteDailyTallies.localDate` stores a `yyyy-MM-dd` string (validated by `/^\d{4}-\d{2}-\d{2}$/`). Generate and validate it with that exact format; do not hand-roll a different date string.
3. **Timezones**: `edition.timezone` and `votingCampaign.timezone` default to `Asia/Jakarta` (WIB, `+07:00`). For WIB deadlines use explicit offset literals; voting campaign dates are read from the active edition's CMS records. Never assume the server clock is WIB.
4. **Display formatting**: use `Date.prototype.toLocaleDateString("en-US", ...)` with an uppercase month for badge dates (pattern in `src/lib/metadata-fetcher.ts` and `getBadgeInfo` in `src/components/news-card.tsx`).
5. **Hydration safety**: the root `<html>` already uses `suppressHydrationWarning`. Keep server and client date rendering identical so the UI never flashes a different date.
6. **Deterministic tests**: pass explicit `Date` values (or `now` injection, see `src/server/db/mutations.ts`) instead of calling `new Date()` inside tested code paths.

---

## Media & Uploads

All uploads go through **UploadThing** only. There is no R2, S3, or local-blob write path. Do not add one.

- Client helpers: `src/lib/uploadthing.ts`; server config: `src/app/api/uploadthing/core.ts`.
- Limits are finite policy constants in `src/server/media/policy.ts`, never inline and never unlimited:
  - Images: 32 MB route cap, 20 MB application-level cap, max 10 files.
  - Video: 512 MB, max 1 file.
  - PDF: 64 MB, max 5 files.
- Every upload creates a `mediaAsset` row (`provider`, `url`, `filename`, `mimeType`, `bytes`, `alt`, `decorative`, `ownerUserId`).
- Fill `alt` for informative images; mark purely decorative assets `decorative: true`. Reuse the same asset across content instead of re-uploading.
- Uploads and media mutations are authenticated and go through server actions with permission checks and audit; never expose an unauthenticated upload endpoint.
- Do not upload personal data, credentials, or documents that should stay private.

---

## Execution Rules

1. Before DB or env work, read `src/server/db/schema.ts` and `src/env.js` for the current schema and env state.
2. Schema changes: edit `src/server/db/schema.ts` only, then `npm.cmd run db:generate`, review the generated SQL in `drizzle/`, run `npm.cmd run db:check`. Apply with `npm.cmd run db:migrate` only to the explicitly chosen target (`DRIZZLE_DATABASE_URL` / `DRIZZLE_AUTH_TOKEN` are separate from the app env). Never `drizzle-kit push`, never hand-edit `drizzle/`, never run production migrations without authorization.
3. After every meaningful edit batch: `npm.cmd run verify` (db tests, Next type generation, typecheck, lint, production build) or at least `npm.cmd run lint` + `npm.cmd run typecheck`. All must pass with zero new errors. Do not invent other lint/build commands.
4. Every write is a server action with `requirePermission(...)` from `src/server/auth/authorization.ts` plus `appendAuditLog` inside the same database transaction (`src/server/auth/audit.ts`). Hidden UI controls, client checks, or a redirect are never proof of authorization.
5. Follow the plans programme in `plans/README.md`. Read the full plan plus its dependencies, restate the in-scope files and STOP conditions, update the status row to `IN PROGRESS`, and run the drift check against baseline commit `3874ede` before editing.
6. No production migration, super-admin promotion, upload, deploy, or public cutover without the operator's explicit authorization for that exact action and target. Follow the runbooks in `docs/runbooks/`.
7. The deployed production site remains on its existing artifact until production cutover is authorized through Plan 010. The explicitly authorized local runtime at `localhost:3001` reads published CMS data only for its active edition and has no hardcoded 2025 fallback. Local authorization does not authorize remote database writes, production cutover, or deployment.
8. UI copy: Bahasa Indonesia, short labels, sentence case, numbers over sentences. No exclamation marks, no filler, no em/en dashes.
   - Tampilkan deskripsi admin hanya saat membantu keputusan atau tindakan; jangan mengulang judul dan konteks edisi.
   - Jangan gunakan ikon `Sparkle` atau `Sparkles` di area admin maupun UI baru; pilih ikon semantik yang menjelaskan fungsi. Jangan mengubah public UI existing untuk aturan ini.
   - Semua kontrol admin memakai primitive shadcn lokal berbasis Radix atau wrapper Admin primitive; migrasi caller dilakukan bertahap sesuai checkpoint.
   - Voting selalu tersedia untuk setiap edisi; kampanye, tally, dan visibilitas hasil tetap terisolasi berdasarkan edisi.
   - Scrollbar kustom hanya boleh scoped pada area admin; jangan mengubah scrollbar global, public site, font, atau globals untuk kebutuhan admin.
9. **Auto-update docs**: every time you add a feature, table, env var, or change core architecture, update the relevant docs:
   - `docs/admin-guide-id.md` for user-facing admin workflows
   - `docs/runbooks/*` for manual operator procedures
   - `plans/README.md` for plan status and architecture decisions
   - `AGENTS.md` Project State section for completed/blocked items
   Scan `docs/` and `plans/` for any file made inaccurate by the change and update it.

---

## Project State

### Plans (authoritative status lives in `plans/README.md`)

| Plan | Title | Status |
|------|-------|--------|
| 001 | Replace PostgreSQL and Prisma with Turso and Drizzle | DONE |
| 002 | Restore the verification baseline and upgrade to Next.js 16.2.12 | DONE |
| 003 | Add Google OAuth, access requests, and granular RBAC | DONE |
| 004 | Add annual CMS data models, revisions, and transactional audit logs | DONE |
| 005 | Build the reusable admin shell, dashboard, users, profile, and audit UI | DONE |
| 006 | Add the media library with authenticated UploadThing uploads | DONE |
| 007 | Move global, home, news, sponsor, and organization content into the CMS | DONE |
| 008 | Move editions, participants, events, carousels, and galleries into the CMS | DONE |
| 009 | Make voting campaigns, tallies, visibility, and results manageable | DONE |
| 010 | Import 2025 content, run end-to-end QA, and perform a reversible cutover | IN PROGRESS (local seed complete; production pending) |
| 011 | Unify public and admin design, media navigation, and annual CMS context | DONE |
| 012 | Admin CMS PAMOKA Berbasis Edisi | IN PROGRESS (rework) |
| 013 | Penyegaran Visual dan Performa Situs Publik | IN PROGRESS |
| 014 | CMS Dinamis untuk Konten Publik dan Siklus Tahunan | IN PROGRESS (local source; public cutover gated) |

### Verified / working

- Turso (libSQL) + Drizzle data layer with the seed of 44 finalists and 572 zero-income daily rows over 13 dates (`npm run db:seed`; refuses non-seed databases).
- Better Auth Google login with pending access requests, composable roles, permission overrides, and transactional audit. No automatic super-admin bootstrap; the first super admin is promoted manually in Turso per `docs/runbooks/bootstrap-super-admin.md`.
- Admin shell with permission-filtered navigation (`/admin`), active edition selector in header with cookie persistence, collapsible content sidebar, reusable media picker (`AdminMediaPicker`), and edition-scoped folders.
- Baseline Plan 012 implementation remains available while the supervisor-gated rework proceeds:
  * Identitas edisi & program unggulan (`/admin/content/edition-settings`).
  * Aset situs tetap dengan 24 slot manifest terdefinisi (`/admin/content/site-assets`).
  * Manajemen sponsor dengan modal sheet editor, tier grouping, dan live card preview (`/admin/content/sponsors`).
  * Studio berita TipTap WYSIWYG dengan image insertion, autosave draft, dan live split preview (`/admin/content/news`).
  * Kepengurusan organisasi multi-periode dengan struktur pohon hierarkis dan direktori orang (`/admin/organization`).
  * Panitia pelaksana terisolasi per edisi dengan struktur pohon hingga 4 level (`/admin/content/committee`).
  * Baseline peserta masih memakai stage tetap. Plan rework menggantinya dengan input pendaftar manual, stage linear dinamis, keputusan lolos, gelar multi-assignment, dan QRIS gambar eksternal (`/admin/content/participants`).
  * Rangkaian acara dan studio galeri terpadu dengan album standalone/event, video YouTube, dan live split preview (`/admin/content/events`, `/admin/content/galleries`).
  * Operasional voting terisolasi per edisi dengan rekap tally harian merchant QRIS dan switch visibilitas hasil (`/admin/voting`).
  * Dashboard utama dengan panel checklist kesiapan edisi (8 indikator kesiapan) dan pintas navigasi cepat (`/admin`).
- Public routes include `/`, `/tentang`, `/galeri`, `/rangkaian-kegiatan/[event]`, `/berita/[slug]`, `/voting`, `/profil-finalis`, `/profil-semifinalis`, `/voting/hasil`, and `/monitor`.
- Plan 014 local source adds the fixed-slot page text editor at `/admin/content/pages` with draft, publish, revision, and audit flows; the `home/ajakan` slot stores an optional action label and validated path or `http(s)` target in `presentationJson`; per-category selection quotas; participant profile video media; and CMS readers for home, About, gallery albums, event carousels, finalists, and semifinalists. About links album previews to `/galeri`. Archived organization periods and their shared profiles are read-only; active and archived periods cannot be deleted. Migration `0015_cuddly_lucky_pierre.sql` was applied only to the backed-up local `local.db`; 16 migrations are recorded and `PRAGMA integrity_check` passed. Public routes consume published CMS data for the active edition with no hardcoded 2025 fallback.
- On 2026-10-01, the operator-authorized local 2025 seed completed. All 340 media assets are ready in UploadThing and `local.db`. The content transaction imported 9 page sections, 6 programs, 23 site-asset bindings, 5 organization periods with 20 memberships, 4 categories, 2 selection stages, 60 participants including 44 finalists, 164 achievements, 60 portraits and QR codes, 6 events, 7 albums with 69 items, 1 news article, and 68 sponsors. Edition 2025 is active and 2026 is draft. Local integrity check passed with no foreign key issues. No voting campaign, tally, or participant profile video was invented because the source does not provide those values. All 68 sponsor tiers currently use `pendukung` pending a verified tier mapping. No remote database was written; production cutover and deploy remain gated by Plan 010.
- Baseline commit for the plans drift check: `3874ede`.

### Blockers

- Plan 010 production cutover (public runtime switch to production CMS data) and deployment remain unauthorized. Local seed and browser checks for home, About, gallery, event carousel, finalists, and semifinalists are complete. Public voting remains unavailable until an operator configures a campaign with verified dates and pricing; the source has no trusted 2025 campaign or tally data.
- Plan 012 rework berjalan bertahap dan dikendalikan supervisor; checkpoint 1, 1b, 2A, 2B.1, 2B.2A, 2B.2B, 2B.3, CP2B.4 source implementation, CP1C.1, CP1C.2, CP1C.3A, CP1C.3B, CP1C.4, CP3, CP4, CP5, CP6, source CP7, source CP8A, source CP8B, source CP8C, source CP9, source CP10, dan source CP11 diterima. CP8A menambahkan skema additive serta backfill idempotent. CP8B menangani pendaftar manual serta stage linear dinamis. CP8C mengunci detail peserta ke edisi aktif, menjadikan stage hanya-baca, memakai QRIS gambar eksternal, serta menambahkan gelar per edisi dengan capacity dan assignment multi-gelar hanya bagi peserta tahap final. CP9 memisahkan pengelolaan acara dan album, mengunci owner ke edisi aktif, serta mewajibkan tepat satu sumber per item galeri. CP10 memakai stage voting dinamis, snapshot saat mulai manual, QRIS gambar siap pakai, tally terisolasi per edisi, serta dashboard dengan 10 indikator kesiapan. CP11 menghapus caller legacy dan merangkum overview Konten tanpa menghapus data kompatibilitas. Migrasi `0013` dan `0014` serta backfill sudah diterapkan ke database prod operator pada 2026-09-14; hasil backfill 1 edisi, 2 stage, 104 peserta, dan 104 entry pending. Browser dataset nonempty, runtime upload, true FormData, viewport admin 380 px, autosave artikel nyata, QA detail periode kepengurusan berisi data, runtime visual CP7, runtime visual CP8B, runtime visual CP8C, runtime visual CP9, runtime visual CP10, dan runtime QA CP11 tetap OPEN.

---

## Core Architectural Stack

- **Framework**: Next.js 16 (App Router) under `src/`, React 19, TypeScript, Tailwind CSS v4 (`@theme inline`, `@custom-variant dark`). App code lives in `src/app`, `src/components`, `src/lib`, `src/server`.
- **Database**: Turso (libSQL) with Drizzle ORM. DB access via `src/server/db/client.ts` (`database`), queries in `src/server/db/queries.ts`, mutations in `src/server/db/mutations.ts`, schema in `src/server/db/schema.ts`. PostgreSQL and Prisma were removed in Plan 001; never reintroduce them.
- **Auth**: Better Auth 1.6.x with Google OAuth (`src/server/auth/config.ts`), roles and permission overrides in `src/server/auth/permissions.ts`, authorization boundary in `src/server/auth/authorization.ts`, immutable audit in `src/server/auth/audit.ts`. No email/password provider.
- **Media**: UploadThing (`src/app/api/uploadthing`), policy in `src/server/media/policy.ts`.
- **CMS domain**: editions, categories, participants, events, galleries, news, sponsors, people, page sections, content drafts/revisions, voting campaigns and daily tallies, plus auth/audit tables. All in `src/server/db/schema.ts`.
- **Env**: `src/env.js` (server-only `TURSO_*`, `BETTER_AUTH_*`, `GOOGLE_*`, `BASE_URL`). There are no `FEATURE_*` flags; do not invent a feature-flag system.
- **UI**: radix primitives + shadcn-style components in `src/components/ui`, custom brand components in `src/components/custom`, lucide-react icons, `motion` + Lenis for animation, recharts for charts, sonner for toasts.
- **Commands**: npm (not bun). See the scripts table in `package.json` (`dev`, `verify`, `db:generate`, `db:check`, `db:migrate`, `db:seed`, `db:inspect`, `cms:*`).

---

## UI Primitives & Layout

### Public primitives

| Need | Use | Import |
|---|---|---|
| Headings / body copy | `typography.t1`, `typography.h1`, `typography.p` | `components/custom/typography` |
| Section shell / full-bleed background + overlay | `Section`, `Vignette` | `components/custom/section` |
| Section eyebrow + title + description | `SectionHeader` | `components/custom/section-header` |
| Finalis card grid | `FinalistCard` | `components/custom/finalist-card` |
| Video hero (poster fallback) | `HeroVideo` | `components/custom/hero-video` |
| Hero text fade-in wrapper | `HeroTextWrapper` | `components/custom/hero-text` |
| Masked edge image | `ImageMaskFade` | `components/custom/image-mask` |
| Buttons | `Button` (custom; `rounded-md`) | `components/custom/button` |
| Background texture | `BG` | `components/next-image-bg` |
| Modals / confirms | `AlertDialog` | `components/ui/alert-dialog` |
| Side panels | `Sheet` | `components/ui/sheet` |
| Selects / inputs | `Select`, `Input`, `Textarea`, `ScrollArea` | `components/ui/*` |
| Cards | `Card` | `components/ui/card` |
| Carousel | `Carousel` (embla) | `components/ui/carousel` |
| Tables | `Table` family | `components/ui/table` |
| Toasts | `Toaster` (sonner) | `components/ui/sonner` |
| Accordion / popover | `Accordion`, `Popover` | `components/ui/*` |
| Icons | lucide-react, default `size-4` | `lucide-react` |

### CMS primitives (reuse, but not the design reference)

`src/components/admin/primitives.tsx` provides the shared building blocks for the admin: `AdminPage`, `AdminCard`, `AdminCardHeader`, `AdminField`, `AdminInput` / `AdminSelect` / `AdminTextarea`, `AdminButton` / `AdminLinkButton`, `AdminBadge`, `AdminStatCard`, `AdminEmptyState`, `AdminListRow`. The admin shell lives in `src/components/admin/admin-shell.tsx`.

Rules for admin work:
- Compose from these primitives instead of hand-rolling per-page markup; a lint-clean file does not excuse duplication.
- Do not copy the current admin styling (slate-heavy backgrounds, `rounded-full` status pills, strong card shadows) into new UI. The public site is the design reference; align new admin UI with Montserrat headings, `dgb`/`fb` brand colors, `rounded-md`/`rounded-xl`, and the shared semantic tokens.
- Keep dialog/form shells in `components/ui/*` and radix; do not introduce a second component library.
- Server actions stay thin: permission check, validation, transaction + audit, `revalidatePath`.
