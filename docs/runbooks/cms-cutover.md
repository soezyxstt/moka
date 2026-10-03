# Runbook cutover CMS (production belum diotorisasi)

Dokumen ini adalah checklist; menjalankannya pada staging/production memerlukan persetujuan eksplisit yang menyebut target.

## Seed 2025 lokal

Untuk pemeriksaan lokal yang diotorisasi, gunakan hanya `TURSO_DATABASE_URL=file:local.db` setelah backup lokal lolos `PRAGMA integrity_check`. Jalankan **Import media 2025** di `/admin/media`, tunggu seluruh file menjadi aset siap, lalu jalankan **Import konten 2025** di `/admin/content`. Media diunggah ke akun UploadThing yang dikonfigurasi; data CMS ditulis ke database lokal dengan audit. Import konten mengaktifkan edisi 2025 dan memindahkan edisi aktif yang lebih baru ke draf tanpa menghapusnya. Tindakan ini tidak mengotorisasi database Turso remote, production cutover, atau deployment.

Hasil seed lokal pada 2026-10-01: 340 media siap, 9 page sections, 6 program, 23 binding aset situs, 5 periode kepengurusan dengan 20 membership, 60 peserta termasuk 44 finalis, 6 acara, 7 album dengan 69 item, 1 artikel, dan 68 sponsor. Edisi 2025 aktif, edisi 2026 draf. `PRAGMA integrity_check` menghasilkan `ok` dan `PRAGMA foreign_key_check` tidak menemukan masalah. Backup sebelum seed konten: `local.db-before-content-seed-20261001.db`.

Kampanye dan tally voting tidak diimpor karena sumber tidak menyediakan jadwal, harga, atau nilai tally yang dapat diverifikasi. Buat campaign setelah jadwal dan harga dikonfirmasi. Semua tier sponsor lokal sementara `pendukung`; verifikasi dan petakan ulang tier sebelum production cutover. Video profil individu tidak tersedia pada aset sumber.

## Yang disiapkan manual

- Google OAuth client ID/secret dan callback untuk setiap domain: `/api/auth/callback/google`.
- `BETTER_AUTH_SECRET`, URL aplikasi publik, URL/token database Turso production.
- Token UploadThing, domain delivery yang diizinkan, serta konfirmasi quota bucket.
- Email Google calon super admin yang sudah pernah login; promosi dilakukan manual dengan `bootstrap-super-admin.md`.
- Verifikasi dan mapping ulang 68 sponsor ke tier utama, pendukung, pendamping, atau pelengkap. Seed lokal memakai tier `pendukung` sementara karena sumber tidak menyebutkan tier.
- Lokasi backup repo/bundle, snapshot Turso, target deployment, maintenance window, dan penanggung jawab rollback.

## Sebelum migrasi

1. Pilih edisi aktif di header admin dan catat ID, tahun, slug, serta zona waktunya.
2. Pastikan dashboard edisi aktif menunjukkan modul yang siap dan buka setiap tautan yang belum lengkap.
3. Review worktree dan commit SHA hardcoded.
4. Buat tag atau arsip immutable dan checksum di lokasi yang disetujui.
5. Buat serta uji snapshot Turso target.
6. Jalankan `npm run cms:import:2025 -- --dry-run --report .tmp/cms-import-2025.json`.
7. Selesaikan seluruh blocker dalam report, uji permission matrix, dan minta persetujuan visual manusia.

## Pemetaan data lama

- Pertahankan `pageSections`, `organizationAssignments`, `newsArticles.body`, `participants.stage`, `participants.paymentUrl`, dan `participants.portraitMediaId` sampai cutover public selesai.
- Petakan aset halaman lama ke slot Aset situs. Jangan membuat slot baru untuk halaman atau hero yang sudah tetap.
- Petakan `participants.stage` ke tahap dinamis dalam edisi yang sama melalui backfill resmi. Tinjau setiap entry bertanda `Perlu ditinjau`.
- Petakan `portraitMediaId` ke media peserta dengan peran `closeup`. QRIS harus berupa gambar eksternal tersendiri.
- Hubungkan data organisasi lama ke periode dan unit yang benar. Jangan memindahkan edisi antarperiode tanpa konfirmasi admin.
- Simpan daftar record yang belum terpetakan sebagai blocker. Jangan menghapus record lama untuk membuat pemeriksaan terlihat lulus.

## Cutover dan rollback

Apply migrasi/import hanya setelah target disebutkan dan disetujui. Simpan ID deployment dan snapshot secara privat. Jika smoke test auth, media, public route, atau audit gagal, redeploy artifact hardcoded dan pulihkan snapshot pasangannya; jangan mencoba memperbaiki data production secara ad-hoc.

Setelah migrasi skema seleksi disetujui dan berhasil pada target yang sama, jalankan backfill berikut dengan hostname Turso yang persis:

```powershell
npm.cmd run cms:backfill:selection -- --confirm-host <hostname-turso>
```

Periksa ringkasan jumlah edisi, tahap, peserta, dan entry. Menjalankan ulang perintah tidak menggandakan tahap atau entry. Jangan menjalankannya sebelum migrasi skema atau pada hostname yang belum disetujui.

Sebelum menerapkan migrasi `0014_burly_sprite.sql`, pastikan query berikut mengembalikan nol baris:

```sql
SELECT id
FROM galleryItem
WHERE (mediaId IS NULL AND youtubeId IS NULL)
   OR (mediaId IS NOT NULL AND youtubeId IS NOT NULL);
```

Migrasi tersebut menambahkan aturan tepat satu sumber pada item galeri. Jika query menemukan data, hentikan proses dan koreksi data pada prosedur terpisah yang disetujui untuk target tersebut.
