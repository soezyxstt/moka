# Plan 014: CMS Dinamis untuk Konten Publik dan Siklus Tahunan

Status: IN PROGRESS.

## Tujuan

Memindahkan pengelolaan konten tahunan ke CMS yang sudah tersedia, lalu menyiapkan halaman lokal untuk mengonsumsi aset dan teks yang diterbitkan admin. Kepengurusan baru ditambahkan sebagai periode baru agar susunan dan foto periode terdahulu tetap menjadi riwayat.

## Cakupan

- Beranda: foto hero, copy, daftar program, dan media tiap bagian.
- Tentang: foto dan teks tetap, visi dan misi per periode, anggota kepengurusan per periode, serta beberapa preview album dengan tautan `Lihat lebih lengkap`.
- Galeri: route `/galeri` yang mengelompokkan media berdasarkan album, termasuk album mandiri dan album acara.
- Acara: judul, deskripsi, hero, serta carousel berdasarkan item album terkait.
- Peserta: kategori, foto, bio, prestasi, QR peserta, dan video pada profil finalis.
- Seleksi: kuota stage dapat ditentukan untuk masing-masing kategori `JD`, `MD`, `JR`, dan `MR`.
- Kepengurusan: periode dapat ditambahkan. Riwayat periode lama tidak boleh terhapus atau berubah akibat perubahan profil orang yang dipakai ulang.
- Admin: editor teks memakai slot tetap dan primitive CMS yang ada. Perubahan yang menyentuh data wajib memakai permission, validasi, transaksi, audit, dan revalidasi.

## Batas implementasi route lokal

- File route: `src/app/page.tsx`, `src/app/tentang/page.tsx`, `src/app/galeri/page.tsx`, `src/app/rangkaian-kegiatan/[event]/page.tsx`, serta daftar dan profil pada `src/app/profil-finalis/` dan `src/app/profil-semifinalis/`.
- Reader publik: `src/server/cms/public-readers.ts` dan reader peserta lokal terpisah bila dibutuhkan.
- Public routes hanya membaca CMS terbit untuk edisi aktif; tidak memakai fallback konten hardcoded.
- Seed lokal 2025 dan upload aset ke UploadThing hanya dijalankan setelah target `file:local.db` diverifikasi dan backup valid tersedia.
- STOP jika runtime target memakai database remote, atau pekerjaan memerlukan production cutover, migrasi remote, atau deploy.

## Kemajuan lokal per 2026-10-01

- Selesai pada source: editor teks untuk sembilan slot beranda dan Tentang; penguncian periode arsip; kuota seleksi per `JD`, `MD`, `JR`, dan `MR`; serta media video pada editor peserta.
- Migrasi additive `0015_cuddly_lucky_pierre.sql` dibuat dari schema dan `db:check` lulus. Setelah target `local.db` diverifikasi dan backup lolos `PRAGMA integrity_check`, migrasi diterapkan secara lokal; kini tercatat 16 migrasi dan integritas database lulus. Tidak ada database remote yang ditulis.
- Operator mengotorisasi pada 2026-09-30 seed media/konten edisi 2025 dan pembacaan CMS pada runtime lokal `localhost:3001`. Public routes membaca CMS terbit untuk edisi aktif tanpa fallback hardcoded.
- Import media selesai 340 dari 340 file dan semua aset berstatus siap pada `local.db`. Custom ID `/sponsors/LAVIOSA.png` diberi versi stabil baru setelah reservation lama dihapus dan UploadThing tetap menolak ID sebelumnya.
- Otorisasi ini mencakup source lokal, penulisan `local.db`, upload aset 2025 ke UploadThing terkonfigurasi, dan inspeksi browser lokal. Tidak mencakup penulisan database remote, production cutover, atau deploy.
- Reader dan route lokal untuk beranda, Tentang, Galeri, detail kegiatan, daftar dan profil finalis, serta daftar dan profil semifinalis sudah tersambung ke CMS terbit; halaman menampilkan empty state sampai edisi aktif memiliki konten.
- Tentang menampilkan maksimal tiga preview album dan tombol **Lihat lebih lengkap** ke `/galeri`. Detail kegiatan membaca carousel dari item album, sedangkan profil finalis dan semifinalis membaca foto, bio, prestasi, QR, dan video profil.
- Import konten selesai. Edisi 2025 aktif, edisi 2026 menjadi draf. Hasil database: 9 page sections, 6 program, 23 binding aset situs, 5 periode kepengurusan dan 20 membership, 4 kategori, 2 tahap seleksi, 60 peserta dengan 44 finalis, 164 prestasi, 60 foto dan QR, 6 acara, 7 album, 69 item galeri, 1 artikel, dan 68 sponsor. `PRAGMA integrity_check` menghasilkan `ok`, pemeriksaan foreign key tidak menemukan masalah. Backup sebelum transaksi tersedia di `local.db-before-content-seed-20261001.db`.
- Browser memverifikasi konten beranda, Tentang, preview album dan tautan **Lihat lebih lengkap**, album Galeri, carousel Audisi, kategori/profil finalis, serta daftar semifinalis. Public routes membaca edisi aktif dari CMS.
- Data sumber tidak menyediakan jadwal/harga kampanye voting, tally yang dapat dipercaya, tier sponsor, atau video profil peserta. Belum ada voting campaign atau tally; seluruh sponsor memakai tier `pendukung` sementara. Admin dapat membuat campaign setelah jadwal dan harga diverifikasi. Tidak ada data placeholder yang dibuat untuk mengisi kekosongan sumber.

## Batas dan kondisi berhenti

- Target eksekusi adalah source dan runtime lokal yang diminta pengguna pada `localhost:3001`, menggunakan database lokal yang dikonfigurasi.
- Import yang diotorisasi hanya boleh menargetkan data sumber 2025 pada `file:local.db` lokal. Jangan menulis ke Turso remote, melakukan production cutover atau deploy, atau mengubah transaksi voting/pembayaran.
- Jangan menghapus field compatibility maupun data historis. Perubahan skema harus additive dan dibuat melalui Drizzle dari `schema.ts`.
- Terapkan migration hanya pada target lokal yang teridentifikasi setelah backup diverifikasi. Tidak ada migration remote dalam plan ini.
- Jika browser runtime memakai database remote, hentikan segala write dan lanjutkan dengan pemeriksaan source saja.
- Jika pekerjaan membutuhkan penulisan database remote, production cutover, atau deployment, berhenti pada hasil lokal yang dapat ditinjau. UploadThing hanya digunakan untuk media sumber 2025 lokal yang telah diotorisasi.

## Verifikasi

- Review SQL hasil generator dan jalankan `npm.cmd run db:check` bila ada perubahan skema.
- Jalankan lint dan typecheck, tanpa mengubah atau menambah environment toolchain.
- Buka route relevan pada Chrome `localhost:3001`, periksa desktop dan mobile, serta pastikan tidak ada route yang menggunakan edisi atau periode lain.
- Catat fitur yang menunggu data CMS, migration lokal, atau otorisasi operator.
