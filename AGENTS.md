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
| **Headings & brand titles** | **Manrope** (weights 400-800) | `font-manrope` | Section headings, hero titles, card titles, page headers. Loaded in `src/style/font.ts`. |
| **Body, UI, captions** | **Inter** (weights 400-800) | `font-inter` | Default on `body` (set in `src/app/layout.tsx`). Paragraphs, nav, footer, form text. |

`next/font` exposes `--font-manrope-next` and `--font-inter-next`; `@theme` maps `font-manrope` / `font-inter` to those variables. `font-sans` and `font-mono` also resolve to Inter; only Manrope and Inter are loaded.

## Typography (public)

Use the shared `typography` object from `@/components/custom/typography` for public copy. It is the canonical set, not a suggestion:

| Export | Renders | Base classes | Use |
|--------|---------|--------------|-----|
| `typography.t1` | `h3` | `uppercase text-highlight-400 font-manrope text-base font-bold` | Eyebrow / section label above a heading. |
| `typography.h1` | `h2` | `text-4xl font-semibold font-manrope` | Section heading. Override size to `text-3xl md:text-5xl` and color to `text-on-media` on photo sections. |
| `typography.p` | `p` | `text-base font-normal font-inter leading-relaxed text-body` | Body copy. `text-justify` and `text-body` are the established body look. |

Rules:
- Headings are Manrope; never use Inter for a title and never use `text-gray-900`-style ad hoc heading colors on the public site.
- On dark photo heroes use `text-on-media` and muted `text-on-media/85` / `text-on-media/80`; on light sections use `text-body` body text.
- Body text is left-aligned by default; use `text-justify` only where the design already does.

## Color

Tailwind maps each `--color-*` token to utilities: `text-{name}`, `bg-{name}`, `border-{name}`, and so on.

### Brand palettes (the identity; use first)

| Utility | Role |
|---------|------|
| `brand`, `brand-50` through `brand-950` | Annual dark color, derived from `--palette-dark`. Use `bg-primary text-primary-foreground` for actions, `text-brand-900` for headings, `bg-brand-50` for soft fills. |
| `highlight`, `highlight-50` through `highlight-950` | Annual lighter color, derived from `--palette-light`. Use for accents and decorative strips; check foreground contrast. |

### Semantic UI (shadcn) ; use for base surfaces

These adapt in light/dark via `:root` / `.dark` in `globals.css`. `primary` derives from the annual dark color with bounded lightness for white labels. Annual pairs are saved per edition through Identitas edisi as validated `pageSection site/palette` JSON; the root reader sets only `--palette-dark` and `--palette-light`. CSS retains edition/default fallbacks. See `docs/runbooks/annual-color-palette.md`. Neutral, success, danger, warning, info, provider identity, mask and overlay tokens are centralized. Never use literal colors or built-in Tailwind palettes outside the central definitions; the color-policy test enforces this across source.

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
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Primary action. |
| `outline` | `border border-brand bg-transparent hover:bg-primary hover:text-primary-foreground` | Secondary action on light surfaces. |
| `destructive` | `bg-destructive` | Destructive action. |

Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10). For links styled as buttons, wrap the custom `Button` in a `Link`.

## Imagery & backgrounds

- Use `next/image` with explicit `width`/`height` (or `fill` inside a sized box) and `object-cover`. Never use plain `<img>` for site assets.
- Full-bleed hero sections: `bg-[url(/asset.webp)] bg-cover bg-center` on the `<section>`, with a radial vignette overlay: `bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800` (fixed, `pointer-events-none`, `z-0`).
- Legibility washes over photo sections: `bg-brand-50/90` or `bg-highlight-50/90` full-section overlays behind content. Use the `Section` component (`background` + `overlay`) for this pattern.
- `BG` (`@/components/next-image-bg`) is the reusable fixed site-texture background; `HeroVideo` + `HeroTextWrapper` (`@/components/custom/hero-video`, `@/components/custom/hero-text`) are the video-hero pattern with a poster fallback; `ImageMaskFade` (`@/components/custom/image-mask`) is the masked edge image.
- Prefer the established organic crops (`rounded-lg`, `rounded-b-full`, `rounded-t-full`, `rounded-full` circles) for creative compositions; do not invent new shapes.

## Layout & motion

- Mobile-first single column: `flex-col` / `grid-cols-1` under `sm:`, switch with `md:` breakpoints (`max-sm:` for mobile-only overrides). Test at 380px.
- Section rhythm: use the `Section` component (full-bleed, `px-8 md:px-20` / `py-12 md:py-20`, optional `background` + `overlay`); keep existing `min-h-screen` hero rhythm on the homepage.
- Footer: `bg-linear-to-br from-brand to-highlight` with `text-on-media` content and a `Separator`.
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
7. The current Vercel Production artifact already serves CMS-backed public routes at `www.pamokagarut.com`. On 2026-10-03 it was Ready at commit `69649984b582821f64432fc51a7eaa4f57a4322e`. Production CMS content is incomplete compared with local. The local runtime at `localhost:3001` reads published CMS data only for its active edition and has no hardcoded 2025 fallback. Local authorization does not authorize remote database writes, migrations, or a new deployment.
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
| 010 | Import 2025 content, run end-to-end QA, and perform a reversible cutover | IN PROGRESS (production schema migrated; content reconciliation and release pending) |
| 011 | Unify public and admin design, media navigation, and annual CMS context | DONE |
| 012 | Admin CMS PAMOKA Berbasis Edisi | IN PROGRESS (rework) |
| 013 | Penyegaran Visual dan Performa Situs Publik | IN PROGRESS |
| 017 | Sistem warna dua warna utama | DONE (source dan palet 2026 di produksi; tanpa deploy) |
| 018 | Informasi pendaftaran per edisi | DONE (source, QA lokal dan konten database produksi; deployment terpisah) |
| 014 | CMS Dinamis untuk Konten Publik dan Siklus Tahunan | IN PROGRESS (2026 production preparation and browser QA verified; release pending) |
| 016 | Identitas dan aset Pasanggiri per edisi | DONE (original-source image correction, production preparation and browser QA; deployment separate) |

### Verified / working

- On 2026-10-16, operator-authorized production activation made 2026 active and archived 2025. The semifinal stage is active; no final roster is public. Spreadsheet responses completed 65 profiles, 28 updates and 37 creates, with 192 achievements; total 67 participants. Motivation and CTA form two bio paragraphs, private biodata excluded. Iqbal remains JR-029 by operator confirmation. Rahma is pending because MD-08 and MD-20 are both absent and her photo requires access; do not guess. Fachri and Yoga have no response and remain unchanged. A fresh encrypted/DPAPI backup restored 49 tables/3,236 rows. Readback confirms 66 audits, 28 revisions, unchanged unrelated tables, existing photos/QR preserved, integrity ok and zero FK errors. Live desktop and 380 px checks confirm content and semifinal navigation. Evidence: .tmp/semifinal-2026/verification.json. Temporary operation removed. Additional local final-reader guards require the prior phase to finish and an active roster; two query tests pass, guard deployment separate. No upload, migration or deployment. Earlier draft-state notes are historical.

- On 2026-10-16, loading was simplified at the operator's request to three centered dots, 20 px on mobile and 24 px on desktop, with sequential CSS hops and reduced-motion support. There is no visible copy, spinner, or photo. The accessible status label remains; unused loading props were removed from SiteStatus. Typegen, TypeScript and lint pass with the existing TanStack warning using bundled Node. Browser/build not run; no data writes or deployment.

- Extended typography QA on 2026-10-15 passes 100 route/width samples (31 admin, 19 public at 380/1440 px), plus media dialog and authorized 2026 registration preview. Heading defaults/CardTitle use Manrope, body and controls Inter, admin microcopy minimum 12 px, shared mobile fields 16 px. Responsive h1 sizing now works through the base layer. No sampled heading mismatch or document overflow remains; production webpack build, TypeScript, lint with one existing TanStack warning and five token tests pass. Evidence: .tmp/font-audit-report.json. Preview restored to 2025; no CMS content write, upload, activation or deployment. Physical devices, access-request lifecycle and internal published-news body remain outside this runtime sample.

- On 2026-10-15, operator-requested typography uses only Manrope and Inter. Public/admin heading callers, root/global-error font variables, body typography, navigation and UI are aligned. Five token-policy tests, lint with one existing TanStack warning, TypeScript and the webpack production build pass. Browser samples of Home, About and admin login at 380 px and desktop 1280/1440 px show no horizontal overflow; computed heading/body fonts confirm Manrope/Inter. Local source only; no CMS writes, uploads or deployment.

- Image correction on 2026-10-15 follows explicit operator approval to use originals and Pillow. Thirty-two WebPs include a transparent four-pinilih adult/youth hero, a transparent youth pair and 30 cropped Patandang portraits without poster frames/QR. Total 1,002,454 bytes, maximum 206,522; original hashes and exact RGBA crop provenance pass independent Sharp verification. No generated variant is used. Production readback `.tmp/edition-2026/refinement/production-final-verification.json` passes 32 new media, two binding replacements, 30 participant portrait/30 closeup replacements, 62 revisions and 94 audits; all prior media and unrelated/2025 data remain intact, integrity/FK/readiness pass. V4 encrypted restore-verified backup covers 49 tables/3,048 rows/17 migrations. Three correction-operation tests, global TypeScript, scoped lint and production `--webpack` build pass. Renewed browser QA passes 10 samples at 380/1440 px with no overflow/observed broken images; six screenshots confirm the four-person transparent hero, transparent youth CTA and cleaned portraits/cards. Evidence `.tmp/edition-2026/refinement/browser-qa.json`; this is local fixture QA, not production activation. The earlier 98-test/full QA result below predates this correction. 2025 remains active, 2026 draft; no activation, migration or deployment.

- Final 2026 preparation verification on 2026-10-15 passes 98 DB/script tests, two additional navigation query tests, TypeScript, production build and lint with zero errors/one existing TanStack warning. Build uses bundled Node and Next `--webpack` because the host Node shim blocks Turbopack. Browser QA covers 21 route/width samples at 380/1440 px plus home 1366 px on a local production build with an auth-free public production-data fixture, with no overflow or observed broken images. Semifinal menus, JD 12/JR 18, empty MD/MR/final lists, no-campaign voting, 77 inherited sponsors and the inherited 10-photo carousel work. Hero contains the full portrait without text overlap and CTA uses a legibility wash. Evidence: `.tmp/edition-2026/browser-qa.json`; this is fixture QA, not production activation or deployment.

- On 2026-10-15, operator-authorized production palette persistence completed on the `.env.prod` host. The 2026 `site/palette` record is published at version 1 with the requested blue/gold pair, one revision and one transactional audit. The authenticated local operator was checked against the same verified active production super admin. Readback confirms all 12 checked 2025 tables unchanged and no FK errors; 2025 remains active and 2026 draft. The temporary operation route was removed. CMS palette editing now requires edit/publish permissions, checks version/archive state and validates hex/order/contrast; the public/preview root consumes only its own edition's valid published palette. Seven related tests, typecheck, lint with the existing TanStack warning, and production build pass. Encrypted backup restored 49 tables/2632 rows with integrity ok and no FK errors; plaintext copies were removed. No activation, migration, upload or deployment.

- On 2026-10-15, the operator explicitly authorized registration content on the production database selected by `.env.prod`, verified as `pamoka-soezyxstt.aws-ap-south-1.turso.io`. A fresh encrypted backup passed restore verification. Seven 2026 registration sections are published at version 2, with 14 timeline entries, 14 transactional audit entries, seven revisions, no remaining registration drafts and zero foreign-key errors. Existing edition-scoped 2025 records were verified unchanged. 2025 remains active and 2026 remains draft. No activation, migration or deployment. The authenticated temporary operation page was removed; evidence is in `.tmp/registration-prod-result-20261015.json` and the encrypted registration backup. Plan 018 source/content scope is complete.

- On 2026-10-15, the operator requested incremental 2026 CMS preparation, superseding the earlier empty-section/no-cross-year behavior. Public content resolves the current/authorized-preview edition, then older active/archived editions dynamically. Text replaces whole sections, general assets replace per slot, program/sponsor/news use the first nonempty edition list, events merge by slug with independent hero/carousel sources, and galleries replace per slug. Identity/year/slogan, registration, categories, participants/photos/QR, campaigns and results remain current-edition only; contacts may inherit. Sponsor and event carousels remain from the previous source until replaced. Source overlay tests and integrated browser QA on a local production build with a public production-data fixture pass; source is not deployed. See `plans/public-content-cms.md`.

- On 2026-10-15, operator-authorized 2026 preparation completed through authenticated permission-checked CMS server actions on `pamoka-soezyxstt.aws-ap-south-1.turso.io`. The V3 encrypted/DPAPI backup restored 49 tables and 2,648 rows successfully. Readback `.tmp/edition-2026/production-final-verification.json` passes: 18 published sections (10 core, seven registration, palette), six programs, one organization unit/16 memberships through 2028, four categories, an active semifinal target of 20 each/80 total, 30 verified participants (12 JD, 18 JR) and 30 photos. No unsupported identities, bios, achievements, payment QR or final results were invented. Of 204 prepared WebPs (97.8 percent byte reduction, originals retained), 35 were uploaded and byte/hash verified. The existing UploadThing kit supplies 18 media/22 brand slots, with 15 new production media registrations and the edition logo assigned. All 38 bindings and 166 new audit entries are verified. Data 2025, all 19 people/auth records, existing media/revisions/audit, 77 sponsors, 14 news, six events and 70 gallery items remain intact; integrity ok, FK errors zero and core readiness blockers empty. 2025 stays active and 2026 draft. Integrated browser QA passed on a local production build with a public production-data fixture. Source deployment remains separate; no production activation, migration or deployment. See `docs/runbooks/cms-cutover.md`.

- On 2026-10-15, Plan 018 adds `/pendaftaran` for editions starting 2026, with seven CMS sections, optional safe CTA, age panels, ornaments, shadcn accordions and a motion/react timeline. The year and published-intro policy is shared by route, navigation, footer and sitemap. Seven operator-content drafts were saved through authenticated audited actions to local.db only; 2025 remains public and 2026 remains draft. The admin-only preset is never a public fallback or copied to later editions. Server validation rejects pre-2026/archived registration writes, changed edition context, malformed rows and unsafe links. See `plans/registration-page.md` for verification and publication boundaries.

- On 2026-10-15, the operator's blue/gold 2026 pair is scoped to `:root[data-edition-year="2026"]`. Root layout selects the public or authorized-preview edition year; admin edition selection alone does not change the public palette. The light mobile navbar preserves contrast for the navy logo. Five color-policy tests, typecheck and the final production build pass. Browser QA at 1440/380 px confirms the exact 2026 pair and no overflow; exiting preview restores 2025 green/orange. No CMS domain writes, activation or deployment. See Plan 017 and the annual palette runbook.

- On 2026-10-15, with explicit operator authorization, 18 unique kit files were uploaded/reconciled in the PAMOKA UploadThing project and bound to all 22 brand slots for edition 2026 in `file:local.db`. All remote bytes match source hashes. The existing 340 media rows, 23 bindings, and both edition records are unchanged. 2025 remains active, 2026 remains draft. Audit contains 18 upload and 22 binding entries; integrity and foreign-key checks pass. Backup and mapping/report live in `.tmp/branding-2026/`. The permission-checked temporary operation page was removed. No remote database write, migration, or deployment.

- On 2026-10-15, authenticated local production-build QA verified 2026 preview home, gallery, voting, and finalist lists without 2025 content/images. Activation stays disabled: local 2026 is draft with two categories and no edition content. Contact/signature defaults, old favicon fallback, and unused legacy public fixture readers were removed; admin branding follows CMS. The serial DB/script suite passes 88 tests; typecheck, production build, and lint pass with the existing table warning. No domain content write, upload, remote write, migration, activation, or deployment. Full populated-edition and real upload QA remain open. See `docs/cms-2026-readiness.md`.

- On 2026-10-15, Plan 016 connects edition-scoped logos, navbar/footer overrides, browser/Apple/app icons, OG/Twitter, and a dynamic manifest to CMS assets. The manifest has 47 slots, including 22 brand slots. Binding writes reject stale edition context/version and archived editions, and preserve previous bindings in transactional revisions/audit without deleting media. Static SVG uploads are validated before becoming ready and rendered without raster optimization. The new kit is mapped only to 2026 in `.tmp/branding-2026/`; uploads and bindings were subsequently completed locally under explicit operator authorization as recorded above. Existing 2025 bindings/media are preserved; the original favicon is retained byte-identically at `public/brand/2025/favicon.ico`. 87 tests, typecheck, lint with the existing table warning, and production build pass. Authenticated editor checks at 1440/380 px and picker opening pass; 2026 remains draft and the ordinary public site still reads 2025. No content writes, migration, remote write, or deployment.

- On 2026-10-15, Plan 017 centralizes annual colors in `--palette-dark` and `--palette-light`. All source styling uses brand/highlight or stable neutral/status/provider tokens; default Tailwind palettes are disabled. Full-source color guard and four policy tests pass; typecheck, lint with the existing table warning, and production build pass. Three palette pairs and dark mode were checked in a fixture; a real Voting page followed a temporary purple/gold pair before restoring the original pair. Public and authenticated CMS viewport samples passed. This is color/reflow QA, not complete CMS workflow acceptance. No CMS writes, uploads or deployment. See `plans/color-system.md` and `docs/runbooks/annual-color-palette.md`.

- On 2026-10-15, 404, loading, route error, and global error share the public Section, Babancong background, brand/highlight tokens, and responsive typography. Next 16.3 `retry` handles recovery; the global fallback includes its own document, styles, and fonts without CMS reads. Browser checks at 1440 and 380 px found no horizontal overflow. A temporary fixture verified loading status, error presentation, hidden technical details, and the retry callback; the fixture was removed. Type generation, typecheck, and lint pass with the existing data-table warning. Root-layout failure recovery was not runtime-tested. No data writes, uploads, or deployment.

- On 2026-10-15, the operator corrected the dark Tentang opening. Hero and activities now follow the homepage's mint/cream photo washes using the public Section primitive, dark green headings, and shared body typography. Content order and all CMS records remain unchanged. Desktop 1440 px and mobile 380 px checks find no overflow or broken images. Type generation, typecheck, and lint pass with the existing data-table warning. Local source only, no deployment.

- On 2026-10-15, the critique-led Tentang pass simplifies the hero to one photo, explains PAMOKA/MOKA naming, moves activities before formal sections, groups the complete roster by stored role labels, increases name/role text, lowers the archive heading weight, and adds CMS contact links. Desktop 1440 px, mobile 380 px, and 320 px reflow checks show no horizontal overflow; 5 missions, 16 current members, and 4 archived periods remain. Type generation, typecheck, and lint pass with the existing data-table warning. No CMS writes, uploads, or deployment.

- On 2026-10-15, the critique-led Tentang pass simplifies the hero to one photo, explains PAMOKA/MOKA naming, moves activities before formal sections, groups the complete roster by stored role labels, increases name/role text, lowers the archive heading weight, and adds CMS contact links. Desktop 1440 px, mobile 380 px, and 320 px reflow checks show no horizontal overflow; 5 missions, 16 current members, and 4 archived periods remain. Compiler/lint verification is pending. No CMS writes, uploads, or deployment.

- On 2026-10-15, Plan 015 completed the UI pass: light split login with Google pending/error feedback, concise CMS copy, public brand tokens, shared shadcn controls, accessible labels and selected states. All 50 page templates and 152 TSX files were scanned. After operator sign-in, all 30 CMS templates passed 1440 px and 380 px rendering/overflow checks, including sample detail records. Mobile news, participant and album grids plus the period toolbar were repaired. Isolated fixtures additionally verify Select required/reset and real FormData. Final verification: 87 tests, typecheck and production build passed; lint has only the existing TanStack warning. No CMS content writes, upload, deployment, schema or permission changes were made by this UI pass.

- On 2026-10-15, CMS readiness source adds edition-scoped site identity, validated contacts, sharing images, profile backgrounds, Gallery/Voting introductions, and legal PDF selection through draft/publication/audit. New editions receive JD/MD/JR/MR automatically. Activation checks published core content, ready assets, four categories, and the linked organization period inside the transaction. Permission-checked previews select an edition without activating it and overlay saved page-text drafts. Organization vision/mission follows the linked period. Updating a shared person preserves immutable archived identity snapshots in content revisions. No schema migration is required. Authenticated browser QA and production reconciliation remain open; this is not a production readiness declaration.

- On 2026-10-15, Galeri became a photo wall without album cards or visible captions, with desktop counterflow, hover zoom, and an accessible full-photo viewer. All 60 photos and 9 CMS videos remain available; album anchors are preserved. Browser checks at 380/1366/1440 px, keyboard navigation, wraparound, Escape, and focus return passed. Typecheck, media preservation test, and lint passed with the existing table warning. Local source only, no CMS writes or deployment.

- Profile text contrast now uses a dark green glass tint behind the reading area, a lighter gradient toward the desktop portrait, and brighter QR instructions. The shared finalist and semifinalist component preserves the prominent QR and photo fade. Typecheck and lint pass with the existing table warning. No deployment.

- On 2026-10-15, finalist and semifinalist detail routes share `ParticipantProfile`. Voting QR appears directly below the participant identity before the biography and mobile portrait. Glass styling and photo fades are preserved. Desktop and 380 px browser checks passed for Vina Faulina and Arella Kireida Andriani, with QR images visible on the initial screen and no horizontal overflow. Typecheck and lint pass with the existing table warning. No data writes or deployment.

- The subsequent 2026-10-15 About refinement combines the opening photos, tightens section spacing, uses desktop mission columns and a denser roster, and presents archived periods as an open horizontal timeline. All existing CMS content and the legal PDF remain available. Lint and typecheck passed; desktop and 380 px browser checks found no horizontal overflow. Local source only.
- Estetika profil finalis dipulihkan sesuai koreksi operator: panel kaca putih transparan dengan blur 2 px, overlay asli, serta foto dengan fade horizontal di desktop dan vertikal di mobile. Hierarki teks dan blok QR terpisah dipertahankan. Pemeriksaan browser desktop dan 380 px tidak menemukan overflow; lint dan typecheck lulus dengan satu warning existing.

- On 2026-10-15, About received a responsive vision/mission layout, consistent open portraits, history rows without cards, and a photo-led gallery without card containers. The published legal PDF reference is resolved from CMS metadata and restricted to ready PDF media over HTTPS. HTTP 200 and exact byte parity with the original SK_MOKA.pdf were verified. All 26 images loaded locally; checks at 380, 768, 1366, and 1440 px found no horizontal overflow. Two document tests, typecheck, lint with the existing table warning, and production build passed. No database writes or deployment were performed.
- Pada 2026-10-15, profil detail finalis ditata menjadi identitas, bio tanpa nested scroll, prestasi, dan blok QR terpisah dengan tautan gambar untuk ponsel. Foto tetap dominan di kolom desktop dan berada setelah nama pada mobile. Browser lokal memverifikasi 1440 px, 1366 px, dan 380 px tanpa overflow horizontal; foto dan QR termuat. Lint dan typecheck lulus, dengan satu warning existing pada data-table. Tidak ada perubahan data CMS atau deployment.

- On 2026-10-15, the public footer groups general, event, and finalist links into responsive columns, combines brand and optional CMS description, and preserves all existing destinations. Local browser checks at 1440 px, 1366 px, and 380 px found no horizontal overflow. The navbar is unchanged.
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
  * Implementasi peserta sudah mendukung input pendaftar manual, tahap seleksi linear yang dapat dikelola, keputusan kelolosan, gelar multi-assignment, dan QRIS gambar eksternal (`/admin/content/participants`). Catatan stage tetap merujuk ke baseline sebelum CP8B/CP8C; runtime QA lanjutan masih tercatat OPEN di bagian blocker.
  * Rangkaian acara dan studio galeri terpadu dengan album standalone/event, video YouTube, dan live split preview (`/admin/content/events`, `/admin/content/galleries`).
  * Operasional voting terisolasi per edisi dengan rekap tally harian merchant QRIS dan switch visibilitas hasil (`/admin/voting`).
  * Dashboard utama dengan panel checklist kesiapan edisi (10 indikator kesiapan) dan pintas navigasi cepat (`/admin`).
- Public routes include `/`, `/tentang`, `/galeri`, `/rangkaian-kegiatan/[event]`, `/berita/[slug]`, `/voting`, `/profil-finalis`, `/profil-semifinalis`, and `/voting/hasil`. Legacy `/monitor` redirects to `/admin/voting`; committee data is managed in admin and is not rendered publicly.
- Plan 014 local source adds the fixed-slot page text editor at `/admin/content/pages` with draft, publish, revision, and audit flows; the `home/ajakan` slot stores an optional action label and validated path or `http(s)` target in `presentationJson`; per-category selection quotas; participant profile video media; and CMS readers for home, About, gallery albums, event carousels, finalists, semifinalists, and voting categories. About links album previews to `/galeri`; finalist and semifinalist lists read the active edition slogan. Archived organization periods are read-only; shared profile updates preserve archived identity snapshots; active and archived periods cannot be deleted. Migrations `0015_cuddly_lucky_pierre.sql` and `0016_faithful_edwin_jarvis.sql` are applied to local `local.db` and the confirmed production Turso database; both record 17 migrations, production has no missing columns, and production foreign-key checks pass. Public routes consume published CMS data for the active edition with no hardcoded 2025 fallback.
- On 2026-10-01, the operator-authorized local 2025 seed completed. All 340 media assets are ready in UploadThing and `local.db`. The content transaction imported 9 page sections, 6 programs, 23 site-asset bindings, 5 organization periods with 20 memberships, 4 categories, 2 selection stages, 60 participants including 44 finalists, 164 achievements, 60 portraits and QR codes, 6 events, 7 albums with 69 items, 1 news article, and 68 sponsors. Edition 2025 is active and 2026 is draft. Local integrity check passed with no foreign key issues. No voting campaign, tally, or participant profile video was invented because the source does not provide those values. All 68 sponsor tiers currently use `pendukung` pending a verified tier mapping. No remote database was written; production cutover and deploy remain gated by Plan 010.
- On 2026-10-03, the audited local 2025 stage-numbering repair filled stage numbers and display order for 104 source entries. Verification found no missing or duplicate entries; integrity and foreign-key checks passed. Backup before migration `0016` and repair: `local.db-before-stage-numbering-20261001.db`. Three published page-section labels were corrected to Bahasa Indonesia. Public `/voting` and category routes now remain accessible without a hardcoded deadline; pages show the no-campaign state because no verified campaign or tally exists.
- On 2026-10-03, the public `/voting` category chooser changed from four cards to a CMS-driven popover, with mobile spacing below the fixed navbar. Chrome verified keyboard opening, all category routes, and the 390 px layout without horizontal overflow. Campaign, tally, and payment data were unchanged.
- On 2026-10-03, local production build and smoke checks passed for 25 public and compatibility routes. `/admin/voting` redirects signed-out users to login and users without `voting.view` to the access request page. The retired `/monitor` route redirects to that permission-checked workspace. Finalist and semifinalist category pages read their hero video and poster from CMS media when available. The unsafe legacy `cms:apply:2025` writer was removed; it hardcoded an unverified public campaign and tally rows and assigned sponsor tiers cyclically.
- On 2026-10-03, the voting admin UI treats unrecognized legacy result-visibility values as hidden. A permission-checked, audited action can explicitly normalize them to `hidden`; this task has not changed the production campaign.
- Production cutover work on 2026-10-03: the operator confirmed Turso host `pamoka-soezyxstt.aws-ap-south-1.turso.io`; the 49-table, 2,601-row snapshot was encrypted and locally restore-verified. Additive migrations 0015 and 0016 were applied, leaving 17 migrations, no missing columns, 2025 active, and zero foreign-key errors. A read-only record-level comparison found the production CMS still lacks 8 of 9 published page sections, 6 programs, 23 site-asset bindings, and 5 organization periods; 1 page section differs. It also found 44 duplicate participant identity keys, 104 differing stage-entry keys, 123 extra achievements, 6 nonmatching galleries and 70 nonmatching gallery items, 14 production-only news items, and 9 production-only sponsors. Preserve these production records until reviewed mappings exist. The closed legacy campaign and 572 tallies remain untouched; its `resultVisibility=public` is not a valid visible value for the current CMS reader, and its dates, price, and tally provenance are unverified. No content write or deployment has been made yet.
- Baseline commit for the plans drift check: `3874ede`.

### Blockers

- Plan 015 UI acceptance is complete: the operator signed in with Google and 30 CMS templates passed desktop and 380 px render/overflow checks. Actual upload, save/autosave, publication, approvals, alternate-account permission states, and active-campaign operations were not exercised. These remain functional QA boundaries for Plan 012, not a blocker on the completed UI pass. See `plans/ui-consistency.md`.

- Plan 010 production update is requested by the operator. Vercel project `pamoka-garut`, domain `www.pamokagarut.com`, and Turso host `pamoka-soezyxstt.aws-ap-south-1.turso.io` are confirmed. The encrypted snapshot restore check and additive migrations 0015/0016 are complete. Production CMS content is still incomplete and has record-level conflicts; the read-only reconciliation is saved in `.tmp/production-cms-reconciliation-20261003.json`. Do not overwrite production-only or differing records without an audited, source-backed mapping. Keep 2025 active and 2026 draft. Preserve the closed campaign and its 572 tallies until an authorized admin explicitly normalizes its legacy visibility; no dates, price, or tally provenance are verified. Vercel Production environment targets were not independently verified. Deployment and public cutover remain pending. See `docs/runbooks/cms-cutover.md`.
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
- Do not copy the current admin styling (slate-heavy backgrounds, `rounded-full` status pills, strong card shadows) into new UI. The public site is the design reference; align new admin UI with Manrope headings, `brand`/`highlight` brand colors, `rounded-md`/`rounded-xl`, and the shared semantic tokens.
- Keep dialog/form shells in `components/ui/*` and radix; do not introduce a second component library.
- Server actions stay thin: permission check, validation, transaction + audit, `revalidatePath`.

- Public controls use local shadcn components whenever a suitable primitive exists, following the operator request on 2026-10-15.

- On 2026-10-15, the voting index received a CMS photo header, visible shadcn category buttons, immediate category content, and finalist links. Local desktop and 380 px checks passed without horizontal overflow; category switching, keyboard activation, lint, and typecheck passed. Active-campaign runtime QA remains open because the local CMS has no active campaign. No database writes or deployment were performed.

Pemeriksaan akhir halaman sistem 2026-10-15: typecheck sempat lulus, tetapi pengulangan setelah penghapusan fixture terblokir error TypeScript pada src/server/media/static-svg.ts yang berubah di luar cakupan pekerjaan ini. Tidak ada error pada file halaman sistem. Lint lulus dengan warning data-table existing; build dan pemulihan root-layout nyata belum diuji.
