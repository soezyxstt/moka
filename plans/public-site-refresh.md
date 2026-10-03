# Plan 013: Penyegaran Visual dan Performa Situs Publik

Status: IN PROGRESS, menunggu lint dan typecheck.

## Tujuan

Rapikan pengalaman halaman publik PAMOKA Garut lewat perubahan kecil pada hierarki, responsivitas, copy, aksesibilitas kontrol, pemuatan gambar, dan render awal. Pertahankan aset, palet, bentuk organik, dan arah visual publik yang sudah ada.

## Batas perubahan

- Pada saat Plan 013 dimulai, konten publik masih hardcoded. Pemindahan konten tahunan ke CMS kemudian dikerjakan terpisah melalui Plan 014.
- Tidak menambah route, dependensi, tabel, variabel lingkungan, atau alur CMS.
- Tidak mengubah tenggat, status, atau tindakan voting 2025, termasuk pembayaran.
- `/monitor` tetap berada di balik login admin.
- Tidak melakukan migrasi database, upload, deployment, atau cutover Plan 010.
- Hanya ubah source yang diperlukan untuk temuan audit publik.

## File dalam cakupan

- `src/app/page.tsx`
- `src/lib/metadata-fetcher.ts`
- `src/components/news-card.tsx`
- `src/components/custom/hero-video.tsx`
- `src/app/tentang/page.tsx`
- `src/app/rangkaian-kegiatan/[event]/page.tsx`
- `src/app/profil-finalis/[category]/hero-text.tsx`
- `src/app/profil-finalis/[category]/page.tsx`
- `src/app/profil-finalis/[category]/[name]/page.tsx`
- `src/app/profil-semifinalis/[category]/page.tsx`
- `src/app/profil-semifinalis/[category]/[name]/page.tsx`
- `plans/README.md`
- `AGENTS.md`
- `plans/public-site-refresh.md`

## Pemeriksaan

- Buka seluruh kategori finalis, semifinalis, hasil voting, dan kegiatan pada desktop, laptop, serta mobile.
- Periksa route beranda, Tentang, satu halaman detail tiap jenis profil, dan halaman terlindungi untuk memastikan perilaku tetap sesuai.
- Uji navigasi menu, tombol ekspansi profil, kontrol carousel, dialog unduhan, tautan dokumen, dan pemutar video di browser.
- Periksa lebar dokumen, gambar rusak, nama aksesibel kontrol, serta render awal berita beranda.
- Jalankan `npm.cmd run lint` dan `npm.cmd run typecheck`.

## Kondisi berhenti

- Hentikan perubahan bila temuan memerlukan perubahan fakta acara, status kampanye, nominal pembayaran, autentikasi, atau data CMS.
- Hentikan bila perbaikan memerlukan aset baru, dependensi baru, perubahan global design tokens, atau perubahan struktur besar.
- Biarkan route voting yang sudah tutup dan route admin tetap pada perilaku yang ditemukan.

## Catatan verifikasi

Browser Use memeriksa seluruh 24 route pada 390 px, 1366 px, dan 1440 px; tidak ditemukan overflow horizontal atau gambar rusak. `npm.cmd run lint` dan `npm.cmd run typecheck` belum dapat dijalankan: shim `npm.cmd` menunjuk ke instalasi Node yang tidak tersedia, sementara `npm.exe` meminta `nvm reshim` sebelum menjalankan script npm. Toolchain global tidak diubah.

## Kriteria penerimaan

- Identitas visual tetap konsisten dengan situs publik saat ini.
- Semua route yang diuji berfungsi pada lebar 390 px, 1366 px, dan 1440 px tanpa overflow horizontal atau gambar rusak.
- Kontrol yang tampak interaktif dapat digunakan dengan mouse dan memiliki nama aksesibel.
- Gambar di luar hero tidak diprioritaskan untuk pemuatan awal.
- Beranda menampilkan konten utama tanpa menunggu metadata dari situs berita eksternal.
- Lint dan typecheck lulus tanpa error baru.
