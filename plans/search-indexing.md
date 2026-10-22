# Plan 019: Metadata dan sitemap publik

Status: DONE untuk source, tes dan build produksi webpack pada 2026-10-22. Penyerahan melalui branch terpisah dan draft PR. Deployment dan penerimaan HTTP produksi terpisah.

## Tujuan dan dasar

Audit Search Console, respons publik, dan source `642fd3e` menemukan sinyal URL yang belum lengkap. Patch ini memperbaiki metadata dan sitemap tanpa menganggap setiap URL yang tidak terindeks sebagai kesalahan. Dependensi yang dibaca: Plan 013, Plan 014, `AGENTS.md`, serta panduan metadata, sitemap, robots dan redirects pada Next.js 16.3.4 yang terpasang. Drift nama/status file terhadap baseline `3874ede` sudah ditinjau; working tree awal bersih.

## Cakupan

- Root `src/app/layout.tsx`: `metadataBase`, tanpa canonical beranda yang diwarisi semua route.
- Metadata halaman publik: beranda, Tentang, Galeri, Pendaftaran, Berita/slug, Voting, kategori/profil finalis dan semifinalis, serta kegiatan.
- `src/app/admin/layout.tsx`: `noindex,nofollow` bagi seluruh area admin.
- `src/app/sitemap.ts`: kategori berisi peserta saja, indeks Berita, tanpa tanggal perubahan buatan, serta respons kosong pada sesi pratinjau berizin.
- `src/app/robots.ts`: izinkan crawl dan sebut sitemap. Admin tetap dapat dicrawl agar `noindex` terbaca.
- `next.config.ts`: redirect hasil voting yang sudah dipensiunkan memakai 308.
- Tes metadata/sitemap, runbook pengujian, registry dan Project State.
- `package.json`: script `test:seo` dan integrasi ke `verify`, agar tes SEO menjadi bagian pemeriksaan proyek.

## Batas dan kondisi berhenti

- Jangan mengubah izin, sesi, preview guard, reader edisi, status publikasi, konten, kampanye, data, skema atau aset.
- Jangan memberi `robots.index=true` pada metadata anak atau menambah `noindex` pada placeholder publik tanpa keputusan isi.
- Jangan membuat arsip lintas edisi atau redirect massal URL lama ke beranda. Kebutuhan arsip memerlukan rancangan tersendiri.
- Tindak lanjut permintaan fix mencakup branch terpisah dan draft PR. Berhenti sebelum merge ke main, deploy, write CMS, migrasi atau permintaan indeks/validasi ulang GSC.
- Hasil kode tidak membuktikan Google akan mengindeks URL. Cocokkan waktu crawl dan contoh URL GSC dengan keadaan sekarang.

## Uji penerimaan

Uji fungsi sitemap dengan fixture tahap aktif/kosong, preview, pendaftaran, berita internal/eksternal, dan URL. Uji metadata route nyata dengan fixture CMS dan resolver Next terpasang agar canonical tepat serta robots preview/admin tetap utuh. Jalankan `npm run typecheck`, `npm run lint`, tes terarah dan `git diff --check`. Catat batas uji produksi di runbook.

## Hasil lokal

Source menambahkan canonical per halaman tanpa canonical root, mempertahankan noindex preview, menambahkan noindex admin, membatasi sitemap ke kategori berisi peserta, menyertakan indeks Berita, dan menghapus lastmod buatan. Sitemap sesi preview kosong sebelum reader isi dipanggil. Robots mengizinkan crawl dengan sitemap pada origin utama. Metadata kegiatan mengikuti data kegiatan; redirect hasil voting yang sudah dipensiunkan memakai 308.

Lima tes terarah lulus melalui `npm run test:seo`, yang juga masuk `npm run verify`. Cakupan metadata memakai resolver Next asli untuk 12 jenis halaman publik dalam keadaan normal dan preview, ditambah admin/login. Matcher Next memverifikasi redirect hasil voting, parameter query, batas route, dan tidak ada loop. Typegen/TypeScript dan ESLint lulus; satu warning TanStack existing tetap ada. Diff whitespace lulus. Tes tidak membaca database atau jaringan.

`npm run build -- --webpack` lulus penuh, termasuk TypeScript, generate 41/41 dan traces. Build memakai environment lokal terisolasi, DB `file::memory:`, nilai auth dummy, proxy dan CA sistem untuk font publik, serta telemetry nonaktif. Tidak ada kredensial atau database produksi. Build default Turbopack pada runner ini gagal fetch font lalu cache persistence internal; hasil webpack tidak dinyatakan sebagai kelulusan Turbopack. Sesi preview nyata, cache/CDN dan HTTP setelah deployment belum diuji.

Audit GSC membedakan sitemap lama dengan URL host deployment dari sitemap www yang kini sukses, serta status agregat lama dari URL Inspection terbaru. Patch ini tidak membuktikan akar masalah setiap URL pada laporan GSC atau memulihkan arsip edisi lama. Tindak lanjut permintaan fix mencakup penyerahan source melalui branch dan draft PR. Tidak ada perubahan data atau environment produksi, merge, deployment, permintaan indeks atau validasi GSC. Petunjuk operator ada di `docs/runbooks/search-indexing.md`.
