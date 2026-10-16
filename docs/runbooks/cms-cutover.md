# Runbook cutover CMS production

Roster 2026 telah direkonsiliasi ke 70 semifinalis pada 2026-10-16; cakupan dan crosswalk ada di `plans/public-content-cms.md`, hasil `.tmp/semifinal-70/production-verification.json`. Backup tepat sebelum operasi adalah `.tmp/semifinal-70/preflight/production-before-2026.json.aesgcm` dengan manifest serta key DPAPI pada folder yang sama, terverifikasi 49 tabel/6.002 baris. Simpan ketiganya bersama pada akun Windows operator. Delapan audit dan lima revisi melindungi tiga penambahan, dua koreksi nomor/entry serta kuota tahap. Foto/QR dan seluruh tabel tidak terkait tetap sama; 2026 aktif/2025 arsip tidak berubah. Jangan menjalankan ulang rencana 67 peserta lama atau menimpa seluruh database; perubahan berikutnya memakai snapshot dan versi baru. Tidak ada upload, migrasi atau deployment pada pelengkapan roster.

Koreksi 2026-10-16: SVG kit memiliki URL UploadThing tanpa ekstensi. Shell admin/login dan thumbnail pustaka media harus mengirim SVG langsung melalui `next/image unoptimized` berdasarkan MIME; jangan menilai pemuatan UI hanya dari HTTP 200 aset. URL optimizer raster produksi untuk SVG mengembalikan 400 `INVALID_IMAGE_OPTIMIZE_REQUEST`. Perbaikan enam caller tersedia di source dan perlu deployment terpisah. Favicon 2026 sudah diganti melalui CMS produksi ke `symbol-navy.svg`, berupa simbol atap/tiga wajah dari logo asli. Metadata login publik sudah merujuk URL simbol. Backup sebelum perubahan terenkripsi/DPAPI dan restore-verified; satu binding, satu revisi dan satu audit berubah, seluruh tabel lain sama. Bukti `.tmp/branding-2026/favicon-2026-production-result.json`.

Verifikasi ulang aset 2026 pada 2026-10-16, 13:05 WIB: host produksi memiliki 22/22 slot brand, 18 media kit ready dengan byte/hash sama dengan sumber, dan total 38 binding 2026 ke 32 media unik. Seluruh URL media terikat merespons HTTP 200; integrity ok dan nol FK error. 2026 aktif, 2025 arsip. Bukti `.tmp/branding-2026/prod-completeness-20261016.json`. Tidak ada write database, upload atau deployment pada pemeriksaan ulang ini; jangan mengulang impor dari status parsial chat lama.

## Sinkronisasi arsip 2025, 2026-10-16

Sinkronisasi konten 2025 pada 2026-10-16 selesai di pamoka-soezyxstt.aws-ap-south-1.turso.io sesuai CMS local.db. Operator mempertahankan 2026 aktif dan 2025 arsip. Baca ulang memverifikasi seluruh 1.007 operasi dan 1.007 audit: 9 bagian terbit, 6 program, 23 binding aset, 60 peserta aktif dengan 104 entri tahap dan 164 prestasi, 6 acara, 7 album/69 item, 68 sponsor aktif dan 1 berita terbit. Sebanyak 104 record peserta lama dinonaktifkan dengan slug arsip; referensi voting dan seluruh riwayat tetap utuh. Berita tambahan menjadi draf, sponsor tambahan dan item galeri lama dinonaktifkan tanpa penghapusan. Periode dan identitas pengurus 2025 memakai snapshot terpisah agar periode 2026 sampai 2028 tetap sama. Seluruh record 2026, akun, hak akses, voting, media existing dan tabel tidak terkait lulus fingerprint perlindungan; integrity ok dan nol FK error.

Backup baru AES-256-GCM/DPAPI lulus pemulihan 49 tabel/3.596 baris. Simulasi, penolakan rencana stale, typecheck dan lint lulus dengan warning TanStack existing. Seluruh 350 URL media dan ukurannya cocok; 201 media hanya didaftarkan dari URL UploadThing existing, tanpa upload. Bukti .tmp/reconcile-2025/production-verification.json, rehearsal.json, media-check.json dan backup-v2/. Tier sponsor mengikuti lokal (pendukung), bukan klasifikasi baru yang terverifikasi. Halaman operasi sementara dihapus setelah selesai; tidak ada migrasi, deployment, aktivasi edisi atau perubahan konfigurasi login dari sinkronisasi ini.

## Hasil terbaru 2026-10-16

Pembaruan produksi 2026-10-16: operator mengotorisasi pembaruan database dan aktivasi 2026. Pada host `pamoka-soezyxstt.aws-ap-south-1.turso.io`, 2026 kini aktif dan 2025 arsip. Dari 68 respons spreadsheet (66 identitas unik), 65 profil selesai: 28 pembaruan, 37 peserta baru, 192 butir prestasi. Motivasi dan CTA menjadi dua paragraf bio; biodata pribadi tidak diimpor. Iqbal tetap JR-029 sesuai konfirmasi operator. Total 67 peserta: JD 15, MD 13, JR 19, MR 20. Rahma tertunda karena MD-08 dan MD-20 sama-sama kosong dan tidak ada nomor pada respons; foto Drive memerlukan akses. Jangan menebak nomor. Muhamad Fachri dan Yoga Pratama belum memiliki respons dan dipertahankan. Tahap semifinal aktif, final belum dibuka; timeline menyebut pengumuman finalis 25 Oktober 2026.

Backup AES-256-GCM/DPAPI baru lulus pemulihan 49 tabel/3.236 baris. Baca ulang memverifikasi 66 audit baru, 28 revisi, seluruh tabel tidak terkait sama, foto/QR existing terjaga, integrity ok dan nol FK error. Bukti `.tmp/semifinal-2026/verification.json`. Browser produksi mengonfirmasi navigasi semifinalis dan paragraf/prestasi; profil sampel 380 px tanpa overflow. Operasi sementara dihapus. Tidak ada upload, migrasi atau deployment. Guard reader tambahan pada source lokal menahan final saat tahap sebelumnya aktif atau roster final kosong; dua tes query nyata lulus, guard belum dideploy. Pernyataan 2025 aktif/2026 draf di bawah merupakan riwayat sebelum aktivasi ini.

Koreksi gambar terbaru: 32 WebP dari sumber asli memakai Pillow sudah diterapkan ke database produksi dan lulus verifikasi, dengan 62 revisi/94 audit baru serta 2025 tetap utuh. Hero menggabungkan dewasa dan rumaja transparan; potret Patandang dibersihkan dari bingkai/QR poster. Build produksi `--webpack`, typecheck, lint scoped dan QA ulang lulus; Plan 016 DONE untuk koreksi source/aset produksi/QA, deployment terpisah. Bukti `.tmp/edition-2026/refinement/production-final-verification.json`, rincian `plans/annual-brand-assets.md`. Catatan hasil sebelumnya di bawah tetap historis.

## Informasi pendaftaran 2026, penerapan 2026-10-15

Otorisasi operator mencakup tujuh bagian pendaftaran pada database `.env.prod`. Target persis `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Backup terbaru terenkripsi dengan key DPAPI dan lolos uji pemulihan. Penerapan melalui server action terautentikasi yang memeriksa `content.edit`, `content.publish`, target host, edisi draf 2026 dan akun super admin aktif di produksi. Konten existing yang berbeda menghentikan operasi, bukan ditimpa. Service existing menjaga transaksi draf/terbit, revisi dan audit. Route operasional sementara dihapus.

Hasil terverifikasi: tujuh bagian published versi 2, 14 agenda timeline, 14 audit, tujuh revisi, nol draf pendaftaran sisa dan nol foreign-key error. Seluruh record 2025 edition-scoped pada snapshot serta record edisinya tetap sama. Backup `.tmp/registration-prod-before-20261015.aesgcm`, key `.key.dpapi`, manifest `.manifest.json`; hasil `.tmp/registration-prod-result-20261015.json`. Simpan ketiganya bersama pada akun Windows ini. Penghapusan sementara diblokir kebijakan; snapshot awal `.json` dan restore `.db` diamankan dengan enkripsi AES-256-GCM di tempat, dekripsi byte-identik terverifikasi. Keduanya sekarang envelope ciphertext yang memakai key DPAPI backup, bukan file mentah yang dapat dibuka langsung.

Edisi 2025 tetap aktif dan 2026 draf. Tidak ada migrasi, aktivasi, upload atau deployment dalam operasi pendaftaran ini. Source `/pendaftaran` memerlukan deployment terpisah sebelum tersedia pada artifact website. Untuk koreksi isi, pilih 2026 pada CMS, edit bagian Pendaftaran melalui Teks halaman, simpan draf dan terbitkan ulang; jangan mengganti seluruh database dengan backup.

## Persiapan produksi edisi 2026, otorisasi terbaru 2026-10-15

Persiapan CMS 2026 selesai diterapkan pada database produksi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Verifikasi baca-saja 2026-10-15, 18:04 WIB lulus: 2025 tetap aktif, 2026 draf, integrity ok dan nol foreign-key error. Record 2025, 19 profil orang serta identitas/hak akses existing tetap sama. Tidak ada aktivasi, migrasi atau deployment.

Backup V3 `.tmp/edition-2026/production-preflight-v3/completion.json` mencakup 49 tabel, 2.648 baris dan 17 migrasi; enkripsi AES-256-GCM, key DPAPI dan pemulihan lokal terverifikasi.

Edisi 2026 memiliki 18 bagian terbit, yaitu 10 bagian inti dengan tema **Niti Harti, Nanjeur Bukti** beserta filosofi operator, tujuh bagian pendaftaran dan palet existing yang dipertahankan. Tersedia enam program, satu unit dan 16 membership pengurus dengan periode berakhir 2028; identitas/foto pengurus existing dipakai ulang. Empat kategori memiliki target semifinal sementara 20 per kategori, total 80. Peserta yang benar-benar dimasukkan hanya 30 identitas bersumber Patandang, 12 JD dan 18 JR, dengan 30 foto; MD/MR, bio, prestasi, QRIS pembayaran dan hasil final tidak dibuat tanpa sumber.

Sebanyak 35 WebP terpilih sudah diunggah melalui UploadThing dan diverifikasi hash/byte. Lima slot visual baru memakai pinilih dewasa, pinilih rumaja, Babancong dan gunung; sponsor dan carousel kegiatan tetap memakai sumber 2025. Kit identitas 18 media dipakai ulang dari UploadThing, termasuk 15 registrasi media produksi baru, untuk 22 slot brand. Logo edisi terpasang. Total 38 binding terdiri dari 16 slot umum dan 22 slot brand.

Operasi server action terautentikasi memeriksa permission, target host, konteks draf dan kecocokan operator lokal dengan super admin produksi aktif. Seluruh write memakai transaksi/audit; verifikasi mencatat 166 audit baru dibanding backup V3, seluruh media/revisi/audit existing terjaga dan tidak ada penghalang kesiapan inti. Kesiapan inti tidak menyatakan roster lengkap atau voting siap. Bukti: `.tmp/edition-2026/production-final-verification.json`. Tiga route operasi sementara dan nonce sudah dihapus dari source setelah penerapan selesai; koreksi berikutnya memakai editor CMS biasa.

Plan 016 DONE untuk source, aset produksi dan QA; Plan 014 tetap IN PROGRESS untuk rilis lebih luas. QA build produksi lokal dengan fixture data publik lulus; bukti `.tmp/edition-2026/browser-qa.json`, rincian pada `docs/cms-2026-readiness.md`. Aktivasi hanya pada fixture tanpa autentikasi. Produksi tetap 2025 aktif/2026 draf; source belum dideploy.

### Prosedur operasi dan batas

Operator mengotorisasi perubahan CMS 2026 langsung pada database produksi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Tahap ini menyiapkan edisi draf, bukan aktivasi atau deployment. Bagian rilis 2025 di bawah adalah riwayat dan prosedur terpisah; otorisasi terbaru ini menggantikan batas lokal-only untuk persiapan 2026, tanpa mengizinkan penggantian destruktif data 2025.

1. Cocokkan hostname runtime dengan target persis, tanpa menampilkan token. Berhenti bila berbeda. Sebelum write berikutnya buat backup baru sesuai runbook dan uji pemulihannya; backup V3 di atas adalah bukti sebelum operasi yang telah selesai. Pertahankan snapshot/manifest beserta kunci terlindung pada akun operator.
2. Bandingkan database terkini dengan laporan verifikasi produksi terbaru di atas. Snapshot awal 2.603 baris tanpa 2026 merupakan baseline historis, bukan keadaan sekarang. Pertahankan 77 sponsor, 14 berita, enam acara dan 70 item galeri 2025. Buat mapping insert/update/preserve/skip sebelum write baru.
3. Pakai action CMS terautentikasi, permission, transaksi dan audit untuk setiap perubahan. Operasi sementara memakai guard super-admin serta target lokal/remote yang diotorisasi. Gunakan versi terkini dan target 2026 draf; konflik versi atau mapping ambigu menghentikan operasi terkait. Media tetap melalui UploadThing, bukan upload lokal atau penyalinan database.
4. Terapkan hanya data yang bersumber: tema `Niti Harti, Nanjeur Bukti`, pengurus tetap sesuai arahan operator, aset yang dipilih dari `.tmp/edition-2026/`, dan 30 peserta bernama dari Patandang, 12 JD dan 18 JR. Target sementara 20 per kategori adalah asumsi operator; jangan membuat identitas MD/MR atau peserta lain untuk memenuhi angka. Poster foto tidak menjadi sumber QRIS pembayaran.
5. Reuse URL/media yang cocok melalui alur CMS. Kit 18 media/22 slot dan 35 WebP sudah diterapkan ke produksi. Untuk pembaruan berikutnya, ganti hanya slot 2026 yang dimaksud; jangan mengulangi import seluruh edisi. Sponsor dan carousel kegiatan tetap memakai sumber sebelumnya. Record peserta, kategori, pendaftaran, QRIS dan voting tetap terisolasi.
6. Bandingkan sebelum/sesudah: perubahan hanya sesuai mapping, 2025 tetap aktif, 2026 draf, record historis utuh, media ready, foreign key valid, dan audit lengkap. Catat hasil aktual dan lokasi bukti setelah selesai. Hasil write selesai ada pada laporan verifikasi di atas; QA browser dan deployment source memiliki bukti terpisah.
7. Uji preview berizin dan pembacaan tanpa sesi. Source overlay baru belum tersedia pada artifact publik sampai deployment terpisah. Berhenti sebelum aktivasi, migrasi baru, atau deployment; langkah tersebut tidak termasuk persiapan ini.

Pewarisan bukan copy data antar-edisi. Teks mengganti per bagian utuh, aset umum per slot, daftar program/sponsor/berita dari sumber pertama berisi, acara per slug dengan hero/carousel terpisah, dan album galeri per slug. Identitas, tahun, slogan, pendaftaran, kategori, peserta/foto/QR, kampanye dan hasil hanya dari edisi sekarang. Lihat `plans/public-content-cms.md` untuk kontrak reader.

## Pemeriksaan terdahulu rilis CMS 2026-10-15

Perubahan kesiapan CMS tidak memerlukan migrasi. Sebelum rilis, verifikasi editor identitas/kontak, 47 slot aset, pemilihan PDF legalitas, pratinjau edisi berizin, dan gerbang aktivasi pada lingkungan lokal. Profil orang yang diperbarui menyimpan snapshot identitas arsip ke tabel revisi yang sudah ada. Ikutkan tabel revisi dalam backup dan pertahankan snapshot tersebut saat rekonsiliasi. Uji bahwa browser tanpa sesi tidak dapat membaca edisi/draf pratinjau. Jangan mengaktifkan 2026 untuk sekadar mencoba fitur. Kesiapan source tidak menutup konflik production maupun menggantikan QA admin terautentikasi.

Kit brand baru dipersiapkan untuk edisi 2026 pada `.tmp/branding-2026/`, dengan mapping 22 slot. Dengan otorisasi operator 2026-10-15, 18 media unik sudah diunggah ke UploadThing dan 22 slot dipasang hanya di `file:local.db`. Seluruh 340 media dan 23 binding existing utuh, 2025 tetap aktif dan 2026 tetap draf. Audit mencatat 18 upload dan 22 binding; hash seluruh 18 URL cocok dengan sumber. Backup `.tmp/branding-2026/before-upload.db`, mapping `bindings.json`, dan laporan `upload-result.json` tersimpan lokal. Tidak ada remote database write, migrasi, atau deployment. Halaman server action operasional sementara sudah dihapus. Pertahankan binding dan media 2025 saat rekonsiliasi. Favicon original disimpan byte-identik di `public/brand/2025/favicon.ico` sebagai artefak historis; metadata publik menggunakan binding CMS dan tidak mengambil ikon tahun lama saat slot edisi baru kosong. Uji SVG pada build production, OG raster, Apple/app icons, manifest dinamis, konflik form, revisi binding, serta arsip hanya-baca. Jangan menghapus media lama setelah mengganti binding. Perubahan tidak memerlukan schema baru.

Status per 2026-10-03: the operator requested a production update and confirmed Vercel project `pamoka-garut`, domain `www.pamokagarut.com`, and Turso host `pamoka-soezyxstt.aws-ap-south-1.turso.io`. The current Ready deployment is commit `69649984b582821f64432fc51a7eaa4f57a4322e`, which matches local `HEAD`; the uncommitted changes in this workspace are not deployed. The encrypted 49-table snapshot has passed local restore verification. Additive migrations 0015 and 0016 have been applied to the confirmed production database; production now records 17 migrations, has no missing columns, and has zero foreign-key errors. CMS content reconciliation and deployment remain pending.

## Historical 2025 target and release intent

- Public edition for this release: 2025. Keep 2026 as a draft until its content is entered and reviewed.
- Confirmed production database target: `pamoka-soezyxstt.aws-ap-south-1.turso.io`. The operator confirmed this target on 2026-10-03.
- Confirmed deployment target: Vercel project `pamoka-garut`, production domain `www.pamokagarut.com`. Vercel shows the domain configuration as valid.
- The committee editor remains available to authorized admins only. No committee structure is rendered on public routes.
- `/monitor` is retired as a legacy voting monitor and redirects to `/admin/voting`. The destination applies the `voting.view` permission check.

## Local 2025 readiness

The local database has the audited 2025 content set: 9 published page sections, 6 programs, 23 site asset bindings, 5 organization periods with 20 memberships, 4 categories, 2 selection stages, 60 participants including 44 finalists, 164 achievements, 60 portraits and QR images, 6 events, 7 galleries with 69 items, 1 news article, and 68 sponsors. There are 340 ready media assets. Edition 2025 is active; edition 2026 is a draft. Integrity and foreign key checks passed after migration 0016 and the audited stage numbering repair.

The local source does not provide a verified voting schedule, price, tally, sponsor tier mapping, or individual participant videos. The public voting routes show the no-campaign state when no verified campaign exists. All 68 local sponsors currently use the temporary `pendukung` tier and must not be represented as a verified tier mapping.

## Read-only production preflight

The 2026-10-03 preflight found that production differs materially from the local release source:

| Area | Production | Local 2025 source | Cutover action |
|---|---:|---:|---|
| Schema ledger | 17 migrations, latest 0016 | 17 migrations, latest 0016 | Complete; production schema matches the current application schema and has no missing columns. |
| Editions | 2025 active; no 2026 row | 2025 active; 2026 draft | Keep public edition 2025. Add or reconcile 2026 only if needed for admin workflow. |
| Published page sections | 2 | 9 | Reconcile by stable IDs and review published copy. |
| Programs and site assets | 0 programs; 0 bindings | 6 programs; 23 bindings | Import and verify required asset bindings. |
| Organization | 0 periods, units, or memberships | 5 periods, 20 memberships | Reconcile without deleting historical records. |
| Participants | 104 rows, 60 semifinalist and 44 finalist stage rows | 60 participants with 104 stage entries | Resolve the legacy participant shape before import; do not overwrite or delete by count alone. |
| Achievements | 287 | 164 | Reconcile by matched participant and source text; keep unmatched records. |
| Galleries | 6 published, 70 items | 7 albums, 69 items | Reconcile albums and item ownership; preserve unrelated records. |
| News | 14 published | 1 published | Review production-only articles before any change. |
| Sponsors | 77 active | 68 | Match by source evidence; do not delete unmatched sponsors or infer tiers. |
| Media | 580 assets | 340 assets | Reuse matching ready assets; preserve production-only assets and existing IDs. |
| Voting | 1 closed campaign with legacy `resultVisibility=public`, 572 tally rows | No verified campaign or tally | Preserve rows; current CMS routes expose results only when the value is `visible`. Normalize to `hidden` through the audited admin flow before visibility can be changed. |

Production has no missing tables or columns and no foreign-key errors after migrations 0015 and 0016. The migration changes were additive. Edition 2025 remains the only active edition. A read-only report at `.tmp/production-cms-reconciliation-20261003.json` records the per-key comparison without including raw participant names or content. It found 8 source-only published page sections and 1 differing shared section; all 6 programs and 23 site-asset bindings are absent; all 5 organization periods are absent; 44 production duplicate participant identity keys and 104 differing stage-entry keys; 123 extra production achievements; no shared gallery slugs or gallery-item keys; 14 production-only published news items; and 9 production-only sponsors. The shared 6 event slugs and 4 categories match; stage rows share keys but differ in fields. Media has 64 duplicated production filenames and 64 differing shared filename keys. These findings rule out the old whole-edition importer and require an audited additive crosswalk.

## Snapshot and restore verification

Before any production write, a read-only snapshot was exported from the confirmed host on 2026-10-03. It contains 49 tables and 2,601 rows, including authentication and audit records. The JSON was encrypted with AES-256-GCM; the encryption key is protected with Windows DPAPI for the current user. The ignored files in `.tmp/` are `pamoka-prod-before-cms-cutover-20261003.json.aesgcm`, `pamoka-prod-before-cms-cutover-20261003.json.key.dpapi`, and `pamoka-prod-before-cms-cutover-20261003.json.manifest.json`. Keep these files together on this Windows account. Do not copy the key file separately or attach the snapshot to tickets.

The encrypted payload was decrypted in memory for integrity verification and its SHA-256 matched the manifest. The application-level backup format was restored into an ignored local SQLite database and checked: 49 tables, 2,601 rows, `PRAGMA integrity_check=ok`, and zero foreign-key errors. Temporary plaintext and restore files were removed. The production snapshot itself remains encrypted.

This release must keep its database changes additive: migrations 0015 and 0016 are already applied; next, insert only verified missing records through authenticated CMS server actions with permission checks, transactions, and audit entries. The application rollback is redeployment of the prior Ready artifact; leave the additive columns and any preserved production rows in place. Do not use a destructive database replacement as a rollback.

Live route inspection confirmed the effect of these gaps: the production home page renders news cards but not the CMS hero or programs; `/tentang` shows the mission and gallery previews but not the full local section set. The production artifact is already CMS-backed, so deploying the current dirty workspace without first reconciling schema and content would not complete the launch.

The existing campaign was written by the retired legacy importer, which hardcoded campaign dates and price and created tally rows from legacy vote tables. Its schedule, price, and results do not have a verified source. Production reports `resultVisibility=public`; the current CMS public reader exposes results only for the literal value `visible`, so it treats this legacy value as hidden. Normalize it to `hidden` through the audited, versioned admin flow after the target is approved, before an operator changes visibility. Do not run the retired `cms:apply:2025` command or copy its behavior into a new importer. The legacy importer has been removed from the package scripts and source.

## Historical 2025 release gates

1. Verify the Vercel Production `TURSO_DATABASE_URL` host matches the confirmed Turso target, and verify UploadThing uses the intended account without revealing secret values. The browser control timed out during this check, so the environment match is not yet confirmed.
2. Preserve the existing closed campaign and all 572 tally rows. Its `resultVisibility=public` is not treated as visible by the current CMS reader. After the updated admin artifact is deployed, an operator with `voting.manage` can explicitly set the legacy value to `hidden` with an audit reason; do not show results or alter campaign dates, price, or tallies until their provenance is verified.
3. Complete an audited content reconciliation for the 8 missing page sections, 6 programs, 23 site-asset bindings, and 5 organization periods. Skip the changed shared page section, stages, and all participant, achievement, gallery, news, sponsor, and campaign records until source-level crosswalks exist.
4. Verify public 2025 pages and admin permissions against the production database after reconciliation. Confirm 2026 stays draft and committee data stays admin-only.
5. Review the complete diff, run required local verification, deploy to the confirmed Vercel project, and smoke test `www.pamokagarut.com`.

The user has requested production shipping, but the record conflicts prevent the existing whole-edition importer from running safely. That writer rejects an existing 2025 edition and its upsert can overwrite changed fields. Never copy `local.db` over Turso or treat a successful build as approval to mutate production.

## Historical 2025 cutover sequence

1. Record the reviewed source commit and inspect the complete diff.
2. Snapshot and local restore verification are complete. Keep the encrypted snapshot filenames and hashes in the operator's private release record.
3. Run the read-only `cms:verify:production` preflight again against the confirmed host and save its report without credentials.
4. Generate a dry-run reconciliation report with explicit insert, update, preserve, and skip outcomes. Stop if any unmatched or destructive row is unexplained.
5. Migration review and application are complete; do not rerun the generic selection backfill because it can reset participant selection state.
6. Apply the approved, audited, additive CMS reconciliation. Preserve auth, audit, media, historical content, and production-only records unless a separate reviewed decision says otherwise. Reconcile participant rows through an explicit category, normalized-name, and stage crosswalk. Preserve all linked snapshots and tally references. Keep the 77 production sponsors and 14 published news items until individual source mappings justify a change. Compare event and gallery records item by item.
7. Verify database integrity, foreign keys, edition counts, media references, audit records, campaign visibility, and the public routes against edition 2025.
8. Deploy to the confirmed `pamoka-garut` project. Smoke test authentication, public home, About, gallery, events, news, finalist and semifinalist profiles, voting's no-campaign state, and admin permissions on `www.pamokagarut.com`.
9. If any release check fails, redeploy the prior Ready artifact; retain the additive migrations and preserved database rows. Record the deployment and rollback identifiers privately.

## Existing schema migration procedures

For migration 0013, do not remove or rewrite legacy participant fields. Review the idempotent backfill and report edition, stage, participant, and entry totals before and after.

Before applying migration `0014_burly_sprite.sql`, ensure this query returns no rows:

```sql
SELECT id
FROM galleryItem
WHERE (mediaId IS NULL AND youtubeId IS NULL)
   OR (mediaId IS NOT NULL AND youtubeId IS NOT NULL);
```

Migration 0015 adds per-category selection quotas. Migration 0016 adds stage-entry number and display order. Generate SQL from `src/server/db/schema.ts`, review it, run `db:check`, and never hand-edit migration SQL.
