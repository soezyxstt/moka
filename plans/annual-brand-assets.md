# Plan 016: Identitas dan aset Pasanggiri per edisi

Status: DONE (koreksi gambar dari sumber asli, penerapan produksi dan QA; deployment terpisah).

Koreksi gambar 2026, 2026-10-15: sesuai persetujuan operator, olahan dibuat dari file asli dengan Pillow. Hero memakai empat pinilih dewasa dan rumaja dari sumber transparan, berukuran 1920 x 1019 px; ajakan memakai pasangan rumaja transparan 1133 x 1200 px. Tiga puluh potret Patandang dipotong menjadi 945 x 1200 px untuk membuang bingkai, judul/footer dan QR poster. Total 32 WebP sebesar 1.002.454 byte, maksimum 206.522 byte, 26,5 persen lebih kecil daripada 32 berkas sebelumnya. Hash sumber tetap sama dan referensi crop RGBA diverifikasi independen dengan Sharp. Varian generatif tidak dipakai.

Penerapan koreksi pada database produksi lulus verifikasi baca-saja `.tmp/edition-2026/refinement/production-final-verification.json`: 32 media baru, dua binding pengganti, 30 referensi potret peserta dan 30 closeup diperbarui, dengan 62 revisi dan 94 audit baru. Seluruh media lama tetap tersedia; data 2025 dan data lain di luar whitelist persis sama. Integrity ok, FK error nol dan penghalang kesiapan inti tetap kosong. Backup V4 `.tmp/edition-2026/production-preflight-v4/completion.json` mencakup 49 tabel, 3.048 baris dan 17 migrasi, terenkripsi/DPAPI serta pemulihan terverifikasi. Route operasi sementara telah diarsipkan dan dihapus dari source. Produksi tetap 2025 aktif dan 2026 draf, tanpa aktivasi, migrasi atau deployment.

Tiga tes khusus operasi koreksi CMS lulus, termasuk rollback transaksi nyata, idempotensi dan guard; typecheck serta lint scoped lulus. Suite 98 tes di bawah adalah hasil persiapan sebelumnya, bukan pengulangan pada koreksi ini. Build produksi `--webpack`, typecheck global dan lint scoped lulus. Sepuluh sampel browser pada 380/1440 px lulus tanpa overflow atau gambar teramati rusak; enam screenshot menampilkan empat pinilih hero transparan, dua pinilih ajakan transparan, serta kartu/profil tanpa bingkai, judul dan QR poster. Jumlah JD 12/JR 18 tetap sesuai. Bukti `.tmp/edition-2026/refinement/browser-qa.json` dan enam screenshot pada folder yang sama. Ini QA build produksi lokal dengan fixture data publik tanpa autentikasi, bukan aktivasi produksi. Plan 016 DONE untuk koreksi source, aset produksi dan QA; deployment tetap terpisah.

Koreksi operator: hero harus memakai pinilih dewasa dan rumaja tanpa latar studio; foto lain ditinjau sebelum dipasang. Cakupan lanjutan meliputi olahan WebP transparan, potongan potret Patandang, presentasi beranda, penggantian media/binding 2026 melalui CMS produksi berizin, tes dan QA. Backup V4 menjadi baseline baru. Pertahankan wajah, busana, tulisan, peserta dan seluruh data 2025; hentikan bila identitas berubah, target berbeda, versi konflik atau verifikasi backup gagal. Tetap tanpa aktivasi atau deployment.

Catatan persiapan dan QA di bawah mendahului koreksi gambar terbaru.

Persiapan CMS 2026 selesai diterapkan pada database produksi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Verifikasi baca-saja 2026-10-15, 18:04 WIB lulus: 2025 tetap aktif, 2026 draf, integrity ok dan nol foreign-key error. Record 2025, 19 profil orang serta identitas/hak akses existing tetap sama. Tidak ada aktivasi, migrasi atau deployment. Backup V3 `.tmp/edition-2026/production-preflight-v3/completion.json` mencakup 49 tabel, 2.648 baris dan 17 migrasi; enkripsi AES-256-GCM, key DPAPI dan pemulihan lokal terverifikasi. Sebanyak 35 WebP terpilih sudah diunggah melalui UploadThing dan diverifikasi hash/byte. Lima slot visual baru memakai pinilih dewasa, pinilih rumaja, Babancong dan gunung; sponsor dan carousel kegiatan tetap memakai sumber 2025. Kit identitas 18 media dipakai ulang dari UploadThing, termasuk 15 registrasi media produksi baru, untuk 22 slot brand. Logo edisi terpasang. Total 38 binding terdiri dari 16 slot umum dan 22 slot brand. Operasi server action terautentikasi memeriksa permission, target host, konteks draf dan kecocokan operator lokal dengan super admin produksi aktif. Seluruh write memakai transaksi/audit; verifikasi mencatat 166 audit baru dibanding backup V3, seluruh media/revisi/audit existing terjaga dan tidak ada penghalang kesiapan inti. Kesiapan inti tidak menyatakan roster lengkap atau voting siap. Bukti: `.tmp/edition-2026/production-final-verification.json`. Plan 016 DONE untuk source, aset produksi dan QA; Plan 014 tetap IN PROGRESS untuk rilis lebih luas. QA build produksi lokal dengan fixture data publik lulus; bukti `.tmp/edition-2026/browser-qa.json`, rincian pada `docs/cms-2026-readiness.md`. Aktivasi hanya pada fixture tanpa autentikasi. Produksi tetap 2025 aktif/2026 draf; source belum dideploy.

## Persiapan lanjutan 2026-10-15

Operator meminta pemakaian aset `artifacts/2026 Edition` melalui CMS. Sebanyak 204 raster telah diolah menjadi WebP pada `.tmp/edition-2026/`, total byte turun 97,8 persen; sumber asli tidak diubah. Foto Patandang dibatasi 1200 px dan raster lain 1920 px pada sisi terpanjang, tanpa upscaling. Kit awal 18 media/22 binding yang dicatat di bawah mula-mula diterapkan lokal; penerapan produksinya kini terverifikasi pada hasil terbaru di atas.

Binding aset umum mengikuti prioritas edisi sekarang, kemudian edisi lebih lama yang aktif/arsip per slot, sesuai Plan 014. Identitas, tahun, slogan, data peserta/QR dan voting tetap terisolasi. Sponsor dan carousel kegiatan sebelumnya tetap digunakan sampai tersedia pengganti. Foto pinilih dapat dipilih untuk figur beranda; poster Patandang tidak menjadi sumber QRIS pembayaran.

Backup V3 dan hasil baca-saja terbaru menjadi bukti penerapan produksi. Seluruh upload memakai UploadThing; binding melalui action CMS berizin dengan transaksi, versi/revisi dan audit. Lima penggantian visual memakai foto pinilih dewasa/rumaja, Babancong dan gunung. Batik telah diunggah tetapi tidak dipasang sebagai latar hero. Aktivasi dan deployment belum dijalankan. Aturan lanjutan ini menggantikan batas lokal-only dan larangan pewarisan tahap awal berikut.

Otorisasi produksi lanjutan: operator meminta kit langsung diterapkan ke prod db. Target runbook `pamoka-soezyxstt.aws-ap-south-1.turso.io`, 22 slot brand edisi 2026 saja, memakai ulang URL UploadThing existing. Pertahankan 2025 dan seluruh data existing. Jika 2026 belum ada, buat konteks draf dengan kategori standar; jangan aktifkan atau deploy. Ruang operasi: server action sementara, helper media/binding existing, snapshot terenkripsi dan laporan verifikasi `.tmp/branding-2026/`, serta pembaruan dokumentasi. Berhenti bila backup/restore gagal, target host salah, izin operator produksi tidak cocok, binding existing berkonflik, atau ditemukan perubahan data lama yang tidak dijelaskan.

Otorisasi operator lanjutan: unggah kit terpetakan ke UploadThing proyek PAMOKA dan pasang 22 slot hanya pada `file:local.db`, edisi 2026 tetap draf. Aset 2025 tetap utuh; tanpa deploy atau remote database write. Operasi ini memakai server action sementara dengan izin CMS dan helper persistence/audit existing; halaman operasional dihapus setelah selesai. Backup sebelum operasi: `.tmp/branding-2026/before-upload.db`.

## Tujuan dan dependensi

Permintaan operator 2026-10-15: penggantian logo dan aset website melalui CMS per edisi Pasanggiri. Kit baru untuk 2026; data, binding, dan file existing 2025 tetap historis. Memakai pustaka UploadThing (Plan 006), konteks edisi (Plan 008), dan reader/pratinjau CMS (Plan 014). Tidak membuat kampanye voting baru.

## Cakupan

- Manifest, editor dan mutation binding aset; logo navbar/footer, ikon browser/aplikasi, serta gambar berbagi.
- Reader publik, layout, manifest browser, preview logo SVG, dan kebijakan SVG statis.
- Tes transaksi, konflik versi, isolasi 2025/2026, riwayat revisi, dan arsip hanya-baca.
- Mapping kit lokal 2026, panduan admin, runbook, registry plans, dan Project State.

## Drift dan kondisi berhenti

Drift terhadap baseline 3874ede diperiksa sebelum edit. Worktree berisi pekerjaan CMS/public sebelumnya; pertahankan seluruh perubahan itu. Tidak mengubah schema atau environment. Tahap source awal tidak menulis konten database atau mengunggah media. Otorisasi lanjutan di atas mencakup upload/binding 2026 pada target produksi yang disebut persis. Tetap berhenti sebelum mengganti file 2025, mengaktifkan 2026, melakukan migrasi, menulis target remote lain, atau deploy. Tes memakai database sementara. Pemilihan konteks edisi melalui UI lokal mencatat audit selector yang sudah tersedia.

## Penerimaan

Satu konteks edisi mengendalikan seluruh write aset. Form lama tidak dapat menyimpan ke edisi lain setelah selector berubah. Aset pengganti membuat binding/revisi tanpa menghapus media sebelumnya. Arsip menolak perubahan binding/identitas. Browser memakai prioritas aset CMS per slot sesuai Plan 014; data identitas yang terisolasi tetap dari edisi aktif/pratinjau. Hasil source dan operasi produksi telah dicatat. Sebanyak 98 tes DB/script, typecheck, lint dan build produksi lulus; lint memiliki satu warning TanStack existing. Build memakai binary Next lokal melalui Node bundled dan opsi `--webpack` karena shim Node host menghalangi Turbopack. Dua tes query navigasi aktual juga lulus.

## Hasil 2026-10-15

- Manifest 47 slot, 22 di antaranya identitas tahunan, memakai editor/picker yang sudah ada. Logo mempertahankan proporsi. Form membawa ID edisi dan versi binding; server menolak perubahan konteks, versi usang, MIME yang salah, media belum ready, serta edisi arsip.
- Penggantian menyimpan snapshot binding lama ke `contentRevision` dan audit dalam transaksi yang sama. File media dan binding edisi lain tidak diubah. Identitas edisi arsip juga ditolak pada server action.
- Navbar desktop/mobile, footer, favicon/Apple, manifest aplikasi, OG dan Twitter tersambung ke reader edisi aktif/pratinjau. Voting dan daftar peserta memakai OG Pasanggiri; sampul spesifik peserta/artikel tetap dipertahankan. URL media baru membedakan cache setiap edisi. Ikon kosong tidak mengambil ikon tahun sebelumnya.
- SVG statis diizinkan melalui UploadThing dengan cap gambar yang sama. Callback memverifikasi payload sebelum membuat media ready; skrip, processing instruction stylesheet, DTD/entity, style, elemen aktif, sumber eksternal, dan paint URL tersamarkan ditolak. SVG dirender sebagai image unoptimized, bukan HTML inline. OG dan ikon raster memiliki pembatas MIME sesuai peran.
- Kit lokal `.tmp/branding-2026/moka-website-kit.zip`, 54 file, dan mapping 22 slot pada `bindings.json` ditujukan hanya untuk 2026. Seluruh 24 SVG pada kit lolos validasi statis. Pada tahap source awal status prepared-not-uploaded; hasil operasi berizin tercatat di bawah. Favicon original dipindahkan ke `public/brand/2025/favicon.ico`; hash Git sama persis dengan original HEAD. Tidak ada overwrite asset 2025.
- 87 tes database/script lulus; tujuh tes fokus kembali lulus dan tiga tes keamanan/isolasi kembali lulus setelah hardening SVG. Next typegen, typecheck, lint dan production build lulus; lint hanya warning data-table existing. Launcher npm.cmd tidak menemukan Node global, sehingga binary package dari script yang sama dijalankan lewat Node bundled.
- Runtime production lokal memakai `.env` bertarget `file:local.db`. Sesi operator tersedia: editor 2025 menunjukkan 23 binding existing; pemilihan 2026 menampilkan 0/47 dan status Draf. Desktop 1440 px dan mobile 380 px tidak overflow. Picker 2026 terbuka dengan dataset kosong dan kontrol upload. Setelah keluar dari preview admin, situs biasa tetap memakai 2025 dan logo putih existing dari UploadThing.
- Tidak ada konten CMS, media, campaign voting, atau lifecycle edisi yang ditulis. Audit selector dan keluar preview mengikuti alur UI existing. Tidak ada schema, migrasi, remote write, atau deployment.

## Operasi berizin 2026-10-15

- Backup online SQLite tersimpan sebelum operasi. Upload browser awal mengalami pembatas jaringan server, sehingga operasi diselesaikan melalui SDK UploadThing dengan server action sementara, `requirePermission` untuk media/content, guard development, target `file:local.db`, konteks 2026 draf, dan helper persistence/binding existing. Halaman sementara dihapus setelah selesai.
- 18 media unik untuk 22 slot, memakai ulang empat aset identik. Seluruh URL diverifikasi byte demi byte terhadap berkas sumber. Folder `Kit identitas 2026` terikat pada edisi 2026.
- 22 binding baru memiliki alt khusus slot. Audit transaksi mencatat 18 `media.upload.complete` dan 22 `site_asset.bind`. Dua record edisi, seluruh 340 media dan 23 binding sebelumnya sama persis dengan snapshot sebelum operasi. Integrity check ok dan foreign key check nol error.
- Mapping `bindings.json` berstatus `uploaded-and-bound-local`; bukti lengkap di `.tmp/branding-2026/upload-result.json`. 2025 tetap aktif; 2026 tetap draf. Tidak ada database remote write, migrasi, atau deployment.
- Browser CMS menunjukkan 22/22 slot brand terpasang. Pratinjau 2026 memuat navbar desktop/mobile dan footer SVG serta OG/Twitter yang benar; viewport 380 px tanpa overflow. Setelah pratinjau ditutup, situs normal kembali menunjukkan 2025 dengan logo putih existing. Typegen, typecheck, tiga tes brand dan lint lulus; lint hanya warning TanStack existing. Production build tidak diulang pada tahap operasi data ini.

## Langkah operator yang tersisa

Jangan mengaktifkan 2026 sampai konten dan asetnya siap. Penggantian aset pada edisi aktif akan berlaku langsung; persiapan tahun berikutnya harus memakai edisi draf.
