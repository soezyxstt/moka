# Kesiapan CMS untuk edisi 2026

Roster resmi terbaru sudah lengkap 70 semifinalis aktif di produksi: JD 15, MD 15, JR 20, MR 20. Rahma MD-08 sudah terisi; empat peserta tanpa respons tetap kosong (Yoga, Fachri, Sonya dan Kautsar). Ada 66 bio dan 193 prestasi, dengan foto/QR existing dipertahankan. Semifinal aktif, final belum dibuka. Bukti `.tmp/semifinal-70/production-verification.json`, cakupan `plans/public-content-cms.md`. Status roster 67 atau Rahma tertunda berikut adalah riwayat sebelum rekonsiliasi daftar resmi.

## Hasil terbaru 2026-10-16

Pembaruan produksi 2026-10-16: operator mengotorisasi pembaruan database dan aktivasi 2026. Pada host `pamoka-soezyxstt.aws-ap-south-1.turso.io`, 2026 kini aktif dan 2025 arsip. Dari 68 respons spreadsheet (66 identitas unik), 65 profil selesai: 28 pembaruan, 37 peserta baru, 192 butir prestasi. Motivasi dan CTA menjadi dua paragraf bio; biodata pribadi tidak diimpor. Iqbal tetap JR-029 sesuai konfirmasi operator. Total 67 peserta: JD 15, MD 13, JR 19, MR 20. Rahma tertunda karena MD-08 dan MD-20 sama-sama kosong dan tidak ada nomor pada respons; foto Drive memerlukan akses. Jangan menebak nomor. Muhamad Fachri dan Yoga Pratama belum memiliki respons dan dipertahankan. Tahap semifinal aktif, final belum dibuka; timeline menyebut pengumuman finalis 25 Oktober 2026.

Backup AES-256-GCM/DPAPI baru lulus pemulihan 49 tabel/3.236 baris. Baca ulang memverifikasi 66 audit baru, 28 revisi, seluruh tabel tidak terkait sama, foto/QR existing terjaga, integrity ok dan nol FK error. Bukti `.tmp/semifinal-2026/verification.json`. Browser produksi mengonfirmasi navigasi semifinalis dan paragraf/prestasi; profil sampel 380 px tanpa overflow. Operasi sementara dihapus. Tidak ada upload, migrasi atau deployment. Guard reader tambahan pada source lokal menahan final saat tahap sebelumnya aktif atau roster final kosong; dua tes query nyata lulus, guard belum dideploy. Pernyataan 2025 aktif/2026 draf di bawah merupakan riwayat sebelum aktivasi ini.

Koreksi gambar 2026, 2026-10-15: sesuai persetujuan operator, olahan dibuat dari file asli dengan Pillow. Hero memakai empat pinilih dewasa dan rumaja dari sumber transparan, berukuran 1920 x 1019 px; ajakan memakai pasangan rumaja transparan 1133 x 1200 px. Tiga puluh potret Patandang dipotong menjadi 945 x 1200 px untuk membuang bingkai, judul/footer dan QR poster. Total 32 WebP sebesar 1.002.454 byte, maksimum 206.522 byte, 26,5 persen lebih kecil daripada 32 berkas sebelumnya. Hash sumber tetap sama dan referensi crop RGBA diverifikasi independen dengan Sharp. Varian generatif tidak dipakai.

Penerapan koreksi pada database produksi lulus verifikasi baca-saja `.tmp/edition-2026/refinement/production-final-verification.json`: 32 media baru, dua binding pengganti, 30 referensi potret peserta dan 30 closeup diperbarui, dengan 62 revisi dan 94 audit baru. Seluruh media lama tetap tersedia; data 2025 dan data lain di luar whitelist persis sama. Integrity ok, FK error nol dan penghalang kesiapan inti tetap kosong. Backup V4 `.tmp/edition-2026/production-preflight-v4/completion.json` mencakup 49 tabel, 3.048 baris dan 17 migrasi, terenkripsi/DPAPI serta pemulihan terverifikasi. Route operasi sementara telah diarsipkan dan dihapus dari source. Produksi tetap 2025 aktif dan 2026 draf, tanpa aktivasi, migrasi atau deployment.

Tiga tes khusus operasi koreksi CMS lulus, termasuk rollback transaksi nyata, idempotensi dan guard; typecheck serta lint scoped lulus. Suite 98 tes di bawah adalah hasil persiapan sebelumnya, bukan pengulangan pada koreksi ini. Build produksi `--webpack`, typecheck global dan lint scoped lulus. Sepuluh sampel browser pada 380/1440 px lulus tanpa overflow atau gambar teramati rusak; enam screenshot menampilkan empat pinilih hero transparan, dua pinilih ajakan transparan, serta kartu/profil tanpa bingkai, judul dan QR poster. Jumlah JD 12/JR 18 tetap sesuai. Bukti `.tmp/edition-2026/refinement/browser-qa.json` dan enam screenshot pada folder yang sama. Ini QA build produksi lokal dengan fixture data publik tanpa autentikasi, bukan aktivasi produksi. Plan 016 DONE untuk koreksi source, aset produksi dan QA; deployment tetap terpisah.

Catatan persiapan dan QA di bawah mendahului koreksi gambar terbaru.

Pembaruan pendaftaran produksi 2026-10-15: atas otorisasi operator, tujuh bagian 2026 kini published pada host `.env.prod` yang telah diverifikasi. Verifikasi mencatat 14 agenda, 14 audit, tujuh revisi, nol draf sisa dan nol foreign-key error. Record 2025 edition-scoped tetap sama; 2025 aktif, 2026 draf. Backup terenkripsi restore-verified tersedia, tanpa aktivasi atau deployment. Catatan draf lokal di bawah merupakan tahap sebelumnya. Lihat `plans/registration-page.md`.

Persiapan CMS 2026 selesai diterapkan pada database produksi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Verifikasi baca-saja 2026-10-15, 18:04 WIB lulus: 2025 tetap aktif, 2026 draf, integrity ok dan nol foreign-key error. Record 2025, 19 profil orang serta identitas/hak akses existing tetap sama. Tidak ada aktivasi, migrasi atau deployment. Backup V3 `.tmp/edition-2026/production-preflight-v3/completion.json` mencakup 49 tabel, 2.648 baris dan 17 migrasi; enkripsi AES-256-GCM, key DPAPI dan pemulihan lokal terverifikasi. Bukti: `.tmp/edition-2026/production-final-verification.json`.

## Perubahan cakupan terbaru

Permintaan operator menggantikan aturan lama yang selalu membiarkan bagian kosong. Konten CMS edisi aktif/pratinjau menimpa sumber dari edisi bertahun lebih kecil yang aktif/arsip. Teks diwarisi per bagian utuh; aset umum per slot; program, sponsor dan berita dari daftar pertama berisi data. Acara digabung menurut slug dengan hero/carousel terpisah; album galeri diganti per slug. Identitas, tahun, slogan, pendaftaran, kategori, peserta/foto/QR, kampanye, tally dan hasil tetap terisolasi. Kontak dapat diwarisi. Detail ada pada `plans/public-content-cms.md`.

Edisi 2026 memiliki 18 bagian terbit, yaitu 10 bagian inti dengan tema **Niti Harti, Nanjeur Bukti** beserta filosofi operator, tujuh bagian pendaftaran dan palet existing yang dipertahankan. Tersedia enam program, satu unit dan 16 membership pengurus dengan periode berakhir 2028; identitas/foto pengurus existing dipakai ulang. Empat kategori memiliki target semifinal sementara 20 per kategori, total 80. Peserta yang benar-benar dimasukkan hanya 30 identitas bersumber Patandang, 12 JD dan 18 JR, dengan 30 foto; MD/MR, bio, prestasi, QRIS pembayaran dan hasil final tidak dibuat tanpa sumber.

Sebanyak 35 WebP terpilih sudah diunggah melalui UploadThing dan diverifikasi hash/byte. Lima slot visual baru memakai pinilih dewasa, pinilih rumaja, Babancong dan gunung; sponsor dan carousel kegiatan tetap memakai sumber 2025. Kit identitas 18 media dipakai ulang dari UploadThing, termasuk 15 registrasi media produksi baru, untuk 22 slot brand. Logo edisi terpasang. Total 38 binding terdiri dari 16 slot umum dan 22 slot brand.

Operasi server action terautentikasi memeriksa permission, target host, konteks draf dan kecocokan operator lokal dengan super admin produksi aktif. Seluruh write memakai transaksi/audit; verifikasi mencatat 166 audit baru dibanding backup V3, seluruh media/revisi/audit existing terjaga dan tidak ada penghalang kesiapan inti. Kesiapan inti tidak menyatakan roster lengkap atau voting siap. Bukti: `.tmp/edition-2026/production-final-verification.json`.

Sebanyak 204 raster telah disiapkan menjadi WebP, total byte turun 97,8 persen dan sumber asli tetap utuh. Patandang maksimum 1200 px, raster lain 1920 px pada sisi terpanjang tanpa upscaling. Ketika belum ada tahap final, daftar semifinal hanya membaca tahap berslug `semifinal` atau `semifinalis` yang sudah aktif/tertutup; Audisi tidak dianggap semifinal dan daftar finalis tetap kosong. Sponsor, berita, acara, galeri dan voting 2025 terjaga.

Plan 016 DONE untuk source, persiapan aset produksi dan QA; Plan 014 tetap IN PROGRESS untuk cakupan rilis yang lebih luas. Build produksi lokal dengan salinan data publik produksi lulus 21 sampel route/viewport pada 380 dan 1440 px serta beranda 1366 px, tanpa overflow atau gambar teramati yang rusak. Menu semifinal desktop/mobile, 12 JD dan 18 JR, daftar MD/MR/finalis kosong, voting tanpa kampanye, 77 sponsor serta perpindahan carousel 10 foto 2025 terverifikasi. Fixture tidak menyalin data autentikasi; aktivasi 2026 hanya pada salinan lokal. Bukti `.tmp/edition-2026/browser-qa.json` dan screenshot pada folder yang sama. Source memerlukan deployment terpisah; database produksi tetap 2025 aktif dan 2026 draf.

## Model pengelolaan

| Unsur | Pengelolaan |
| --- | --- |
| Nama, tahun, slogan, logo, periode | Identitas edisi |
| Teks, metadata, tagar, kontak, PDF legalitas | Teks halaman, 15 slot umum dengan draf dan publikasi |
| Informasi pendaftaran mulai 2026 | Tujuh slot tambahan: pengantar, usia, syarat, kriteria, OTS, berkas dan timeline |
| Hero, video, poster, latar, logo, ikon, gambar sosial | Aset situs, 47 slot dan pustaka media |
| Program, berita, sponsor | Modul masing-masing, terikat edisi |
| Peserta, foto, bio, prestasi, tahap, gelar, QRIS | Peserta dan tahapan, terikat edisi |
| Acara, carousel, album, foto dan video | Acara dan galeri, terikat edisi |
| Pengurus, jabatan, visi dan misi | Periode organisasi yang ditautkan; dapat dipakai beberapa tahun |
| Kampanye, tanggal, harga, kandidat, tally dan hasil | Voting, terisolasi per edisi |

Label antarmuka, kode kategori baku JD/MD/JR/MR, dan tata letak merupakan definisi aplikasi. Pewarisan membaca record CMS, bukan fixture historis. Pembaruan profil pengurus menyimpan snapshot identitas untuk periode arsip.

## Verifikasi historis sebelum permintaan pewarisan

- 88 tes DB/script lulus secara serial, termasuk pemeriksaan graf impor publik terhadap fixture historis dan konten tahun literal.
- TypeScript, lint, dan production build lulus. Satu warning existing terdapat pada tabel TanStack.
- Browser admin memverifikasi editor kosong dan aktivasi terkunci. Pratinjau Beranda, Galeri, Voting, dan finalis 2026 tidak menampilkan konten/foto 2025. Pemeriksaan terkait pada 380, 1366, dan 1440 px tidak menemukan overflow horizontal.
- Tidak ada aktivasi, upload, migrasi, perubahan konten domain, penulisan remote, atau deployment. Percobaan kontak tidak valid ditolak.

## Snapshot konten lokal pada pemeriksaan awal

Pendaftaran, 2026-10-15: tujuh bagian materi operator disimpan sebagai draf pada `file:local.db` melalui sesi admin berizin dan server actions beraudit. Halaman `/pendaftaran` membaca edisi publik atau pratinjau berizin, tanpa fallback lintas edisi. Template 2026 hanya ada pada editor admin. Publik tetap memakai 2025; edisi 2026 tidak diaktifkan dan konten pendaftaran belum diterbitkan. URL formulir, biaya dan ketentuan pakaian spesifik belum ditambahkan. Instagram yang ditinjau menyebut sertifikat opsional dan registrasi tambahan 9 Oktober; materi draf tetap mengikuti naskah operator untuk ditinjau panitia.

Pada pemeriksaan awal, 2025 aktif dan 2026 draf. Edisi lokal 2026 memiliki dua kategori, JD dan MD. Teks halaman, program, binding aset, peserta, acara, album, berita, sponsor, dan kampanye masing-masing nol. Snapshot ini mendahului pemasangan kit lokal 22 slot dan persiapan produksi terbaru; jangan gunakan hitungan awal sebagai status database terkini.

Lengkapi empat kategori, logo/slogan, periode sesuai tahun, teks inti terbit, dan hero wajib sebelum aktivasi. Lengkapi modul lain sesuai jadwal. Pembukaan voting memerlukan kampanye serta kandidat yang benar; aktivasi situs tidak otomatis membuka voting.

Upload nyata dan penerapan data produksi telah diverifikasi pada hasil terbaru di atas. QA browser gabungan dengan salinan data publik produksi telah lulus. Pemeriksaan environment deployment dan rilis source terbaru masih terpisah. Ikuti `docs/runbooks/cms-cutover.md`.
