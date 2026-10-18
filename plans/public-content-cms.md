# Plan 014: CMS Dinamis untuk Konten Publik dan Siklus Tahunan

Foto roster resmi 70 semifinalis sudah lengkap di produksi pada 2026-10-16. Empat puluh portrait/closeup ditambahkan dari crop asli Patandang melalui UploadThing dan CMS berizin; 30 foto existing dipertahankan. Seluruh 70 URL/hash lulus verifikasi, konten/nomor/QR tetap sama. Cakupan dan bukti ada di `plans/annual-brand-assets.md` dan `.tmp/portraits-70/production-verification.json`. Catatan foto belum tersedia di bawah merupakan riwayat sebelum pelengkapan ini.

## Roster resmi 70 semifinalis, 2026-10-16

Sesuai permintaan operator, daftar resmi pada spreadsheet `1dWRPjxpnw-8or_nSeRMia6ZXYi13UxKFULTM7rZAwnI`, tab `Data Semifinalist `, menjadi acuan identitas dan nomor 2026. Produksi kini memiliki tepat 70 semifinalis aktif: JD 15, MD 15, JR 20, MR 20. Rahma MD-08, Sonya MD-20 dan M Kautsar JR-09 ditambahkan; Nadilla dikoreksi MR-21 ke MR-22 dan Nabila MR-27 ke MR-30 pada participant dan stage entry. Kuota tahap diselaraskan menjadi 70 dengan jumlah kategori tersebut. M Nur Ramdhani Hermawan tetap JR-13: tulisan JD-13 pada blok JR merupakan typo yang tidak mengganti identitas/category existing. Varian nama singkat/ejaan daftar dicocokkan dengan identitas terverifikasi; nama dan slug existing dipertahankan.

Rahma kini memiliki motivasi/CTA dan satu prestasi dari spreadsheet respons sebelumnya. Total 66 profil berisi bio dan 193 butir prestasi. Yoga Pratama, Muhamad Fachri, Sonya Anggun Oktoviani dan M Kautsar Raihan Nawaf tetap tanpa bio/prestasi karena sumber belum tersedia. Nomor telepon pada daftar tidak diimpor. Foto, QR, konten existing, semua record 2025 serta tabel tidak terkait tetap sama. Edisi 2026 tetap aktif, 2025 arsip, semifinal tetap aktif dan final tidak dibuka.

Backup baru AES-256-GCM/DPAPI memulihkan 49 tabel/6.002 baris dengan integrity ok dan nol FK error. Simulasi helper yang sama dan penolakan rencana stale lulus. Operasi produksi memakai server action berizin, validasi target/aktor/versi, satu transaksi, delapan audit dan lima revisi. Baca ulang memeriksa seluruh 70 mapping, keutuhan data baseline dan foreign key; bukti `.tmp/semifinal-70/production-verification.json`, simulasi `rehearsal.json`, backup `preflight/`. Operasi sementara dihapus setelah selesai. Tanpa upload, migrasi, deployment atau perubahan hasil seleksi. Catatan roster 67/Rahma tertunda di bawah adalah riwayat sebelum daftar resmi tersedia.

## Sinkronisasi arsip 2025, 2026-10-16

Sinkronisasi konten 2025 pada 2026-10-16 selesai di pamoka-soezyxstt.aws-ap-south-1.turso.io sesuai CMS local.db. Operator mempertahankan 2026 aktif dan 2025 arsip. Baca ulang memverifikasi seluruh 1.007 operasi dan 1.007 audit: 9 bagian terbit, 6 program, 23 binding aset, 60 peserta aktif dengan 104 entri tahap dan 164 prestasi, 6 acara, 7 album/69 item, 68 sponsor aktif dan 1 berita terbit. Sebanyak 104 record peserta lama dinonaktifkan dengan slug arsip; referensi voting dan seluruh riwayat tetap utuh. Berita tambahan menjadi draf, sponsor tambahan dan item galeri lama dinonaktifkan tanpa penghapusan. Periode dan identitas pengurus 2025 memakai snapshot terpisah agar periode 2026 sampai 2028 tetap sama. Seluruh record 2026, akun, hak akses, voting, media existing dan tabel tidak terkait lulus fingerprint perlindungan; integrity ok dan nol FK error.

Backup baru AES-256-GCM/DPAPI lulus pemulihan 49 tabel/3.596 baris. Simulasi, penolakan rencana stale, typecheck dan lint lulus dengan warning TanStack existing. Seluruh 350 URL media dan ukurannya cocok; 201 media hanya didaftarkan dari URL UploadThing existing, tanpa upload. Bukti .tmp/reconcile-2025/production-verification.json, rehearsal.json, media-check.json dan backup-v2/. Tier sponsor mengikuti lokal (pendukung), bukan klasifikasi baru yang terverifikasi. Halaman operasi sementara dihapus setelah selesai; tidak ada migrasi, deployment, aktivasi edisi atau perubahan konfigurasi login dari sinkronisasi ini.

## Hasil terbaru 2026-10-16

Pembaruan produksi 2026-10-16: operator mengotorisasi pembaruan database dan aktivasi 2026. Pada host `pamoka-soezyxstt.aws-ap-south-1.turso.io`, 2026 kini aktif dan 2025 arsip. Dari 68 respons spreadsheet (66 identitas unik), 65 profil selesai: 28 pembaruan, 37 peserta baru, 192 butir prestasi. Motivasi dan CTA menjadi dua paragraf bio; biodata pribadi tidak diimpor. Iqbal tetap JR-029 sesuai konfirmasi operator. Total 67 peserta: JD 15, MD 13, JR 19, MR 20. Rahma tertunda karena MD-08 dan MD-20 sama-sama kosong dan tidak ada nomor pada respons; foto Drive memerlukan akses. Jangan menebak nomor. Muhamad Fachri dan Yoga Pratama belum memiliki respons dan dipertahankan. Tahap semifinal aktif, final belum dibuka; timeline menyebut pengumuman finalis 25 Oktober 2026.

Backup AES-256-GCM/DPAPI baru lulus pemulihan 49 tabel/3.236 baris. Baca ulang memverifikasi 66 audit baru, 28 revisi, seluruh tabel tidak terkait sama, foto/QR existing terjaga, integrity ok dan nol FK error. Bukti `.tmp/semifinal-2026/verification.json`. Browser produksi mengonfirmasi navigasi semifinalis dan paragraf/prestasi; profil sampel 380 px tanpa overflow. Operasi sementara dihapus. Tidak ada upload, migrasi atau deployment. Guard reader tambahan pada source lokal menahan final saat tahap sebelumnya aktif atau roster final kosong; dua tes query nyata lulus, guard belum dideploy. Pernyataan 2025 aktif/2026 draf di bawah merupakan riwayat sebelum aktivasi ini.

Koreksi gambar terbaru: 32 WebP dari sumber asli memakai Pillow sudah diterapkan ke database produksi dan lulus verifikasi, dengan 62 revisi/94 audit baru serta 2025 tetap utuh. Hero menggabungkan dewasa dan rumaja transparan; potret Patandang dibersihkan dari bingkai/QR poster. Build produksi `--webpack`, typecheck, lint scoped dan QA ulang lulus; Plan 016 DONE untuk koreksi source/aset produksi/QA, deployment terpisah. Bukti `.tmp/edition-2026/refinement/production-final-verification.json`, rincian `plans/annual-brand-assets.md`. Catatan hasil sebelumnya di bawah tetap historis.

Status: IN PROGRESS (persiapan edisi 2026 bertahap).

## Hasil produksi 2026-10-15

Persiapan CMS 2026 selesai diterapkan pada database produksi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Verifikasi baca-saja 2026-10-15, 18:04 WIB lulus: 2025 tetap aktif, 2026 draf, integrity ok dan nol foreign-key error. Record 2025, 19 profil orang serta identitas/hak akses existing tetap sama. Tidak ada aktivasi, migrasi atau deployment.

Backup V3 `.tmp/edition-2026/production-preflight-v3/completion.json` mencakup 49 tabel, 2.648 baris dan 17 migrasi; enkripsi AES-256-GCM, key DPAPI dan pemulihan lokal terverifikasi.

Edisi 2026 memiliki 18 bagian terbit, yaitu 10 bagian inti dengan tema **Niti Harti, Nanjeur Bukti** beserta filosofi operator, tujuh bagian pendaftaran dan palet existing yang dipertahankan. Tersedia enam program, satu unit dan 16 membership pengurus dengan periode berakhir 2028; identitas/foto pengurus existing dipakai ulang. Empat kategori memiliki target semifinal sementara 20 per kategori, total 80. Peserta yang benar-benar dimasukkan hanya 30 identitas bersumber Patandang, 12 JD dan 18 JR, dengan 30 foto; MD/MR, bio, prestasi, QRIS pembayaran dan hasil final tidak dibuat tanpa sumber.

Sebanyak 35 WebP terpilih sudah diunggah melalui UploadThing dan diverifikasi hash/byte. Lima slot visual baru memakai pinilih dewasa, pinilih rumaja, Babancong dan gunung; sponsor dan carousel kegiatan tetap memakai sumber 2025. Kit identitas 18 media dipakai ulang dari UploadThing, termasuk 15 registrasi media produksi baru, untuk 22 slot brand. Logo edisi terpasang. Total 38 binding terdiri dari 16 slot umum dan 22 slot brand.

Operasi server action terautentikasi memeriksa permission, target host, konteks draf dan kecocokan operator lokal dengan super admin produksi aktif. Seluruh write memakai transaksi/audit; verifikasi mencatat 166 audit baru dibanding backup V3, seluruh media/revisi/audit existing terjaga dan tidak ada penghalang kesiapan inti. Kesiapan inti tidak menyatakan roster lengkap atau voting siap. Bukti: `.tmp/edition-2026/production-final-verification.json`.

Plan 016 DONE untuk source, aset produksi dan QA; Plan 014 tetap IN PROGRESS untuk rilis lebih luas. QA build produksi lokal dengan fixture data publik lulus; bukti `.tmp/edition-2026/browser-qa.json`, rincian pada `docs/cms-2026-readiness.md`. Aktivasi hanya pada fixture tanpa autentikasi. Produksi tetap 2025 aktif/2026 draf; source belum dideploy.

Verifikasi akhir: 98 tes DB/script, dua tes query navigasi aktual, typecheck dan build produksi lokal lulus. Lint nol error dengan satu warning TanStack existing. Build memakai Next `--webpack` melalui Node bundled karena shim Node host menghalangi Turbopack. Hero memakai grid normal dan gambar utuh untuk menjaga wajah/teks, CTA memakai wash token brand agar terbaca; navigasi dan footer mengikuti tahap final atau semifinal CMS.

## Permintaan lanjutan 2026-10-15

Operator meminta persiapan edisi 2026 melalui CMS dan kemudian mengotorisasi perubahan database produksi pada host `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Perilaku pewarisan berikut menggantikan aturan bagian kosong dari QA terdahulu. Aktivasi 2026 dan deployment belum dilakukan; catatan hasil terdahulu di bawah tetap merupakan bukti historis.

- Reader memeriksa edisi aktif atau pratinjau terlebih dahulu, lalu edisi bertahun lebih kecil dengan lifecycle aktif/arsip, dari tahun terbaru. Tidak ada tahun sumber yang ditanam di kode dan edisi draf lain tidak ikut diwarisi.
- Teks diwarisi per bagian utuh; bagian terbit yang berisi konten pada edisi sekarang menggantikan bagian lama tanpa mencampur field. Binding aset umum diwarisi per slot. Kontak dapat diwarisi. Identitas situs, tahun, slogan, pendaftaran, kategori, peserta beserta foto/QR, kampanye, tally dan hasil tetap berasal dari edisi sekarang.
- Program, sponsor dan berita memakai daftar pertama yang tidak kosong, bukan gabungan daftar beberapa tahun. Acara digabung menurut slug; identitas acara mengikuti sumber terbaru, sedangkan hero dan carousel dapat mengambil sumber tersedia masing-masing. Album galeri diganti per slug, tanpa menggabungkan item dua edisi untuk slug yang sama.
- Untuk awal 2026, sponsor dan carousel kegiatan dibiarkan memakai sumber sebelumnya. Pengurus tetap memakai periode yang sama, sesuai konfirmasi operator. Tema: `Niti Harti, Nanjeur Bukti`; filosofi yang diberikan operator menjadi sumber teks CMS, bukan literal route.
- Sebanyak 204 gambar sudah diperkecil menjadi WebP pada `.tmp/edition-2026/`, dengan pengurangan total byte 97,8 persen dan berkas asli tetap utuh. Foto Patandang dibatasi 1200 px, raster lain 1920 px pada sisi terpanjang, tanpa memperbesar sumber. Pemilihan, upload UploadThing dan binding tetap melalui CMS berizin.
- Sumber Patandang memverifikasi 30 nama/nomor: 12 JD dan 18 JR; MD/MR belum tersedia. Tahap sekarang semifinal berasal dari operator. Target sementara 20 per kategori adalah asumsi operasional yang diminta operator, bukan bukti roster lengkap atau hasil seleksi. Jangan membuat identitas yang belum diberikan atau mengambil peserta 2025 untuk melengkapi 2026.

### Cakupan dan kondisi berhenti

File dalam cakupan: reader/helper CMS publik, tes pewarisan dan tahap peserta, operasi CMS persiapan edisi melalui action berizin, aset olahan `.tmp/edition-2026/`, panduan admin, runbook, registry plans, dan Project State. Drift baseline `3874ede` ditinjau sebelum edit. Perubahan ini tidak memerlukan skema baru.

Baseline awal `.tmp/edition-2026/production-preflight/completion.json` mendahului pembuatan 2026 oleh operasi paralel. Backup sebelum write yang dipakai pada operasi selesai adalah V3 di atas. Seluruh 77 sponsor, 14 berita, enam acara dan 70 item galeri 2025 dipertahankan dan diverifikasi sama.

Penambahan 2026 dilakukan secara additive melalui CMS. Referensi media lama yang diperlukan didaftarkan, sedangkan 16 potret dan profil pengurus produksi tidak ditimpa. Hasil aktual inti, peserta, media dan kit brand tercatat di atas.

Hentikan write bila host berbeda, mapping sumber ambigu, versi konflik, atau operasi akan menghapus/mengganti data historis 2025 tanpa sumber yang ditinjau. Setiap perubahan domain tetap lewat permission, transaksi dan audit CMS; operasi sementara mengunci super-admin serta target lokal/remote yang diotorisasi. Jangan menyalin `local.db` ke Turso, menjalankan importer whole-edition, mengaktifkan 2026, atau deploy dalam persiapan ini. Hasil operasi produksi dan QA browser gabungan telah diverifikasi; deployment source tetap terpisah.

Plan 018 menambahkan halaman informasi pendaftaran per edisi mulai 2026 melalui tujuh slot tambahan pada editor teks yang sama. Kontrak, lingkup, batas dan QA dicatat di `plans/registration-page.md`. Konten berasal dari CMS; template materi 2026 hanya ada di editor admin dan tidak digunakan sebagai fallback publik.

## Tujuan

Memindahkan pengelolaan konten tahunan ke CMS yang sudah tersedia dan menyiapkan rilis publik berbasis CMS. Rilis pertama memakai edisi 2025; edisi 2026 tetap draf sampai kontennya diisi. Kepengurusan baru ditambahkan sebagai periode baru agar susunan dan foto periode terdahulu tetap menjadi riwayat.

## Cakupan

- Beranda: foto hero, copy, daftar program, dan media tiap bagian.
- Tentang: foto dan teks tetap, visi dan misi per periode, lampiran PDF legalitas terbit, anggota kepengurusan per periode, serta beberapa preview foto album dengan tautan `Lihat semua galeri`.
- Galeri: route `/galeri` yang mengelompokkan media berdasarkan album, termasuk album mandiri dan album acara.
- Acara: judul, deskripsi, hero, serta carousel berdasarkan item album terkait.
- Peserta: kategori, foto, bio, prestasi, QR peserta, dan video pada profil finalis.
- Panitia: pengelolaan admin per edisi saja; tidak ditampilkan pada public site untuk rilis ini.
- Seleksi: kuota stage dapat ditentukan untuk masing-masing kategori `JD`, `MD`, `JR`, dan `MR`.
- Kepengurusan: periode dapat ditambahkan. Riwayat periode lama tidak boleh terhapus atau berubah akibat perubahan profil orang yang dipakai ulang.
- Admin: editor teks memakai slot tetap dan primitive CMS yang ada. Perubahan yang menyentuh data wajib memakai permission, validasi, transaksi, audit, dan revalidasi.

## Batas implementasi route lokal

- File route: `src/app/page.tsx`, `src/app/tentang/page.tsx`, `src/app/galeri/page.tsx`, `src/app/rangkaian-kegiatan/[event]/page.tsx`, serta daftar dan profil pada `src/app/profil-finalis/` dan `src/app/profil-semifinalis/`.
- Reader publik: `src/server/cms/public-readers.ts` dan reader peserta lokal terpisah bila dibutuhkan.
- Public routes membaca CMS terbit dengan prioritas dan batas pewarisan di atas; tidak memakai fallback konten hardcoded.
- Seed lokal 2025 dan upload aset ke UploadThing dijalankan setelah target `file:local.db` diverifikasi dan backup valid tersedia.
- Untuk produksi, ikuti Plan 010 dan `docs/runbooks/cms-cutover.md`. Jangan jalankan write sampai host persis, snapshot beserta restore path, dan laporan reconcile yang tidak destruktif dikonfirmasi dan ditinjau.

## Kemajuan lokal per 2026-10-01

- Selesai pada source: editor teks untuk sembilan slot beranda dan Tentang; penguncian periode arsip; kuota seleksi per `JD`, `MD`, `JR`, dan `MR`; serta media video pada editor peserta.
- Migrasi additive `0015_cuddly_lucky_pierre.sql` dibuat dari schema dan `db:check` lulus. Setelah target `local.db` diverifikasi dan backup lolos `PRAGMA integrity_check`, migrasi diterapkan secara lokal. Pada 2026-10-03, migration `0016_faithful_edwin_jarvis.sql` menambah nomor dan urutan pada entry tahap; backup sebelum migrasi dan repair adalah `local.db-before-stage-numbering-20261001.db`. Database kini mencatat 17 migrasi. Tidak ada database remote yang ditulis.
- Operator mengotorisasi pada 2026-09-30 seed media/konten edisi 2025 dan pembacaan CMS pada runtime lokal `localhost:3001`. Public routes membaca CMS terbit untuk edisi aktif tanpa fallback hardcoded.
- Import media selesai 340 dari 340 file dan semua aset berstatus siap pada `local.db`. Custom ID `/sponsors/LAVIOSA.png` diberi versi stabil baru setelah reservation lama dihapus dan UploadThing tetap menolak ID sebelumnya.
- Otorisasi ini mencakup source lokal, penulisan `local.db`, upload aset 2025 ke UploadThing terkonfigurasi, dan inspeksi browser lokal. Tidak mencakup penulisan database remote, production cutover, atau deploy.
- Reader dan route lokal untuk beranda, Tentang, Galeri, detail kegiatan, daftar dan profil finalis, serta daftar dan profil semifinalis sudah tersambung ke CMS terbit; halaman menampilkan empty state sampai edisi aktif memiliki konten.
- Tentang menampilkan maksimal tiga preview foto album tanpa wadah kartu dan tautan **Lihat semua galeri** ke `/galeri`; setiap foto menautkan album terkait. Lampiran legalitas diselesaikan dari `documentMediaId` pada metadata section terbit dan hanya mengekspos aset PDF ready melalui HTTPS. Detail kegiatan membaca carousel dari item album, sedangkan profil finalis dan semifinalis membaca foto, bio, prestasi, QR, dan video profil jika medianya tersedia. Seed 2025 tidak berisi video profil individu.
- Import konten selesai. Edisi 2025 aktif, edisi 2026 menjadi draf. Hasil database: 9 page sections, 6 program, 23 binding aset situs, 5 periode kepengurusan dan 20 membership, 4 kategori, 2 tahap seleksi, 60 peserta dengan 44 finalis, 164 prestasi, 60 foto dan QR, 6 acara, 7 album, 69 item galeri, 1 artikel, dan 68 sponsor. `PRAGMA integrity_check` menghasilkan `ok`, pemeriksaan foreign key tidak menemukan masalah. Backup sebelum transaksi tersedia di `local.db-before-content-seed-20261001.db`.
- Browser memverifikasi konten beranda, Tentang, preview album dan tautan **Lihat lebih lengkap**, album Galeri, carousel Audisi, kategori/profil finalis, serta daftar semifinalis. Public routes membaca edisi aktif dari CMS.
- Aksi repair lokal berizin mengisi nomor dan urutan pada 104 entry peserta sumber semifinalis/finalis 2025. Audit dicatat dalam transaksi yang sama; tidak ada entry hilang atau duplikat dan integrity/foreign-key checks lulus. Perbaikan hanya dapat dijalankan pada `file:local.db` untuk edisi `2025`.
- Tiga label CMS yang masih berbahasa Inggris pada Beranda dan Tentang dikoreksi lalu diterbitkan melalui editor CMS. Slogan edisi yang sudah dikelola melalui Identitas Edisi tampil di halaman daftar finalis dan semifinalis.
- `/voting` dan route kategori membaca kategori edisi aktif dari CMS dan tidak lagi ditutup oleh tenggat 2025 yang tertanam di proxy. Karena sumber tidak memiliki kampanye atau tally terverifikasi, route kategori menampilkan pesan kampanye belum tersedia; tidak ada voting, tally, atau pembayaran yang dibuat.
- Data sumber tidak menyediakan jadwal/harga kampanye voting, tally yang dapat dipercaya, tier sponsor, atau video profil peserta. Belum ada voting campaign atau tally; seluruh sponsor memakai tier `pendukung` sementara. Admin dapat membuat campaign setelah jadwal dan harga diverifikasi. Tidak ada data placeholder yang dibuat untuk mengisi kekosongan sumber.

## Batas dan kondisi berhenti

- Target implementasi dan QA lokal adalah `localhost:3001` dengan database `file:local.db`. Operator meminta cutover produksi setelah lokal siap; lanjutkan melalui Plan 010 dengan target Turso dan deployment yang disebutkan persis, snapshot yang dapat dipulihkan, serta reconcile yang ditinjau.
- Import yang diotorisasi untuk seed lokal hanya menargetkan data sumber 2025 pada `file:local.db`. Jangan aktifkan edisi 2026 sebelum kontennya diisi, tampilkan panitia secara publik, atau ubah transaksi voting/pembayaran tanpa data terverifikasi.
- Jangan menghapus field compatibility maupun data historis. Perubahan skema harus additive dan dibuat melalui Drizzle dari `schema.ts`.
- Terapkan migrasi lokal hanya pada target yang teridentifikasi setelah backup diverifikasi. Migrasi production, jika diperlukan, dikelola melalui Plan 010 dan runbook cutover.
- Untuk operasi produksi lanjutan 2026, gunakan hanya host yang diotorisasi pada bagian terbaru di atas, setelah backup/preflight. Runtime remote dengan target lain tetap menghentikan write.
- Penulisan remote memerlukan target, snapshot, restore path dan dry-run yang ditinjau sesuai runbook. Otorisasi lanjutan mencakup persiapan CMS 2026 pada host tersebut serta media 2026 yang dipilih; deployment tetap terpisah.

## Verifikasi

- Review SQL hasil generator dan jalankan `npm.cmd run db:check` bila ada perubahan skema.
- Jalankan lint dan typecheck, tanpa mengubah atau menambah environment toolchain.
- Buka route relevan pada Chrome `localhost:3001`, periksa desktop dan mobile, serta pastikan tidak ada route yang menggunakan edisi atau periode lain.
- Catat fitur yang menunggu data CMS, migration lokal, atau otorisasi operator.

## Status cutover production per 2026-10-03

Operator meminta rilis production dengan edisi 2025 aktif. Vercel sudah menjalankan artifact CMS commit `6964998` pada `www.pamokagarut.com`; inspeksi live menemukan beranda tanpa hero/program dan Tentang hanya menampilkan misi serta preview galeri. Preflight read-only menemukan production masih di migration 0014 dan memiliki perbedaan konten besar dari seed lokal. Pekerjaan ini belum menulis database remote atau men-deploy perubahan lokal. Migration 0015 dan 0016, konfirmasi host Turso, backup beserta restore path, reconcile per-record, serta penyelesaian campaign lama harus dilakukan melalui Plan 010 dan runbook cutover. Jaga 2026 sebagai draf dan panitia admin-only. CMS public reader memperlakukan nilai campaign lama `public` sebagai tersembunyi.

## Penyelesaian kesiapan CMS 2026-10-15

Status: IN PROGRESS. Cakupan: identitas, kontak, metadata per edisi, teks Galeri dan Voting, PDF legalitas, latar profil, kategori baku otomatis, pratinjau berizin, pemeriksaan aktivasi server. Visi dan misi mengikuti periode terkait. Tidak menulis remote, upload, atau deploy.

- Editor Teks halaman mencakup 15 slot. Identitas menyimpan judul, baris identitas dan tagar, dan deskripsi pencarian. Kontak menerima email atau URL http(s) tanpa kredensial. Kontak dan tagar hanya berasal dari CMS edisi terkait; nilai kosong menyembunyikannya tanpa mengambil nilai 2025.
- Manifest awal memiliki 26 slot; Plan 016 memperluasnya menjadi 47 dengan 22 slot identitas tahunan. PDF legalitas dipilih dari pustaka dan divalidasi ulang saat terbit.
- Edisi baru membuat empat kategori tetap. Aktivasi hanya untuk draf dengan versi terkini. Server memeriksa logo/slogan, kategori, periode sesuai tahun, tiga teks inti terbit, dan dua gambar hero wajib. Peserta, sponsor, acara, dan voting boleh belum tersedia saat persiapan awal; pemeriksaan inti bukan bukti seluruh konten acara sudah lengkap.
- Pratinjau berlaku maksimal satu jam pada browser admin berizin `content.view`. Pembaca publik termasuk peserta memakai edisi pratinjau. Teks halaman menyertakan draf tersimpan; modul lain mengikuti status publikasinya sendiri. Banner menyediakan tombol keluar. Pengunjung biasa tetap membaca edisi aktif.
- Visi/misi mengikuti periode yang ditautkan, termasuk nilai kosong. Teks edisi lama tidak menimpa periode baru. Program unggulan membaca daftar program terkelola lebih dahulu daripada teks daftar lama.
- Sebelum profil orang berubah, identitas, foto, bio, dan sosial sebelumnya disalin sekali ke `contentRevision` per membership arsip, dalam transaksi perubahan profil. Snapshot pertama tidak ditimpa. Publik dan detail periode admin membaca identitas historis. Susunan arsip tetap hanya-baca; profil yang dirujuk arsip tidak dapat dihapus.
- Cakupan file: `src/server/cms/*`, `src/server/organization/profile-history.ts`, editor Pages/Edition settings/Editions, detail periode organisasi, layout/footer/latar publik, Galeri/Voting, tes DB, dan dokumentasi. Perubahan lama dipertahankan.
- Target `.env` terkonfirmasi `file:local.db`. Isi database tersebut tidak diubah; tes memakai database sementara. Tidak ada upload, perubahan akun, migrasi, remote write, atau deploy.

### Bukti verifikasi sesi ini

- Seluruh 79 tes DB/script lulus. Empat tes kesiapan mencakup kontak, prioritas visi/misi, siklus draf/PDF/revisi/audit, konflik versi, isolasi edisi, aset tidak siap, serta snapshot historis yang idempotent. Setelah perbaikan kompatibilitas PDF, empat tes tersebut kembali lulus.
- Next typegen, TypeScript, lint, dan production build lulus. Lint menyisakan satu warning existing pada `data-table.tsx`. Folder output sementara `.tmp` kini diabaikan ESLint agar bundle pratinjau dari pekerjaan UI lain tidak diperlakukan sebagai source.
- HTTP lokal pada Beranda, Tentang, Galeri, Voting, dan daftar finalis menghasilkan 200 tanpa halaman error. Cookie pratinjau palsu tetap membaca situs biasa dan tidak mengaktifkan pratinjau.
- Shim `npm.cmd` pada host mengarah ke instalasi Node yang tidak tersedia. Pemeriksaan menjalankan binary package lokal yang sama menggunakan Node bundled, tanpa mengubah toolchain global.
- QA lanjutan setelah operator login: build produksi lokal pada port 3002 memverifikasi pratinjau 2026 pada Beranda, Galeri, Voting, dan daftar finalis. Tidak ada gambar/peserta/teks tahun 2025 dan tidak ada overflow pada pemeriksaan 380, 1366, serta 1440 px yang relevan. Editor 15 slot kosong sesuai edisi dan tombol aktivasi terkunci. Pengisian lengkap, upload nyata, dan cutover production tetap belum dilakukan.
- Suite lanjutan lulus 88 tes secara serial. Tes graf impor AST memastikan route publik tidak membaca fixture historis atau konten literal tahun 2025/2026. Fixture lama tetap tersedia khusus importer. Reader voting menambahkan batas edisi pada peserta. Logo admin, latar login, tagar kartu, metadata, serta favicon tidak memakai fallback identitas tahun lama.
- Validasi kontak/PDF dan konflik draf mengembalikan pesan yang dapat ditampilkan pada build produksi, tanpa membocorkan error database. Percobaan alamat kontak tidak valid ditolak; pemeriksaan database tetap menunjukkan nol teks halaman 2026.
- Lihat `docs/cms-2026-readiness.md` untuk batas kesiapan source dan isi edisi.


## Draf tiga halaman, 2026-10-18

Status: IN PROGRESS. Permintaan operator menerapkan draf Beranda, Tentang dan Pendaftaran dengan gaya existing dan foto CMS reusable. Dependensi: Plan 004/007/014/017/018. Drift terhadap baseline `3874ede` ditinjau; working tree bersih sebelum pekerjaan. Cakupan: ketiga route, komponen pendaftaran, registry teks CMS, reader, preset draf editor, tes dan panduan admin. STOP: fakta/status/biaya/tautan yang belum dipastikan, target remote, migrasi, upload dan deployment. Tidak ada aset baru atau perubahan token global.


Hasil 2026-10-18: source revisi selesai, sebelas draf perubahan tersimpan melalui CMS lokal (enam Beranda, tiga Tentang, satu FAQ dan satu Instagram), tanpa penerbitan atau aktivasi. QA pratinjau desktop dan 380 px mencakup tiga halaman, FAQ, kontak dan roster lengkap; tidak ada overflow horizontal. Lima tes CMS pendaftaran/editorial lulus. Typegen, TypeScript dan lint lulus dengan warning TanStack existing. Bukti visual di `.tmp/content-draft-20261018/`. Data/aset lokal tidak sama dengan produksi; pratinjau memakai fallback foto existing dan tidak menjadi bukti roster produksi. Status/jalur/langkah, biaya dan ketentuan berkas yang belum pasti tetap menunggu panitia. Tidak ada build produksi, upload, migrasi, write remote atau deployment. Status plan induk tetap IN PROGRESS; Plan 018 revisi source diterima, publikasi baru terpisah.


Hasil penyeimbangan 2026-10-18: DONE untuk revisi source lokal. Program PAMOKA dipindah ke Beranda setelah tautan peserta, dengan tiga foto kolase CMS dan enam nama/deskripsi program yang dipisah saat label legacy mengandung titik dua. Preview tiga album Kegiatan kami juga dipindah ke Beranda. Tentang berfokus pada profil, peran, visi/misi, nilai, legalitas dan seluruh pengurus yang tampil langsung. Ringkasan nama berulang serta accordion dihapus. Pemeriksaan DOM dataset 2025 memverifikasi 16 pengurus tanpa elemen tersembunyi atau tombol pembuka, enam program dan tiga album. Beranda/Tentang pada desktop dan 380 px tidak overflow. Pratinjau 2026 lokal belum memiliki periode pengurus; tidak ada perubahan data untuk mengisi kekosongan itu. TypeScript, lint dan diff whitespace diperiksa; warning TanStack existing tetap ada. Tidak ada write CMS, upload, migrasi, build produksi atau deployment dari penyeimbangan ini.

Rilis konten editorial 2026-10-18: source `603d359` sudah di origin/main. Sebelas slot 2026 dikonfirmasi terbit di produksi (5 baru, 5 diperbarui, hero dipertahankan), seluruhnya tetap editable dari Teks halaman. Operasi berizin dan teraudit menghasilkan 20 audit/10 revisi; backup terenkripsi lulus restore, riwayat existing serta data lain utuh, integrity ok dan nol FK error. Tidak ada perubahan schema, migrasi atau upload. Detail bukti: `.tmp/content-release-20261018/production-verification.json` dan Plan 013.
