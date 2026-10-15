# Panduan Lengkap PAMOKA CMS

## Persiapan Pasanggiri tahunan

1. Buka **Kelola edisi**, isi tahun dan nama. Sistem membuat draf beserta kategori JD, MD, JR, MR otomatis. Pilih edisi tersebut pada header sebelum mengisi modul lain.
2. Isi **Identitas edisi**, termasuk nama, logo dan slogan. Isi program unggulan di menu yang sama.
3. Di **Kepengurusan**, hubungkan edisi dengan periode yang sesuai. Satu periode dapat dipakai untuk beberapa Pasanggiri, misalnya tiga tahun. Visi dan misi publik mengikuti periode ini; edit di metadata periode.
4. Di **Teks halaman > Identitas dan kontak**, isi judul situs, deskripsi pencarian, baris identitas dan tagar, email dan tautan sosial. Gunakan kolom Nama tautan serta Alamat email atau Tautan lengkap untuk kontak. Simpan draf, lalu terbitkan. Identitas dan tagar mengikuti edisi terpilih; bagian kontak yang belum tersedia dapat memakai edisi sebelumnya.
5. Isi teks Beranda, Tentang, Galeri, dan Voting. Pilih PDF di Legalitas organisasi. Di **Aset situs**, atur gambar halaman, poster/video kategori, latar profil, dan gambar pratinjau tautan.
6. Isi acara, album dan item carousel, sponsor, berita, peserta dan medianya sesuai jadwal. Data setiap modul mengikuti edisi pada header.
7. Dari **Kelola edisi**, buka **Pratinjau situs edisi**. Pratinjau hanya terlihat pada browser admin berizin, termasuk draf teks tersimpan. Modul lain mengikuti status publikasinya sendiri. Tutup melalui banner pratinjau.
8. Lengkapi daftar kesiapan lalu aktifkan dengan alasan. Server menolak aktivasi jika kategori, logo/slogan, periode, teks inti, atau gambar hero wajib belum siap. Peserta atau voting tidak diwajibkan tersedia sejak hari pertama.

Pengurus lama tetap tersimpan. Pembaruan foto atau identitas orang tidak mengubah identitas pada periode arsip. Buat periode baru sesuai pergantian organisasi, kemudian tautkan edisi tahunan yang dinaunginya.

### Pembaruan bertahap mulai edisi 2026

Edisi baru dapat disiapkan sedikit demi sedikit. Situs mendahulukan konten edisi aktif/pratinjau, kemudian mencari tahun lebih lama yang berstatus aktif atau arsip. Draf tahun lain tidak menjadi sumber. Admin tetap mengedit data tahun yang dipilih; pewarisan hanya terjadi saat situs membaca konten, tanpa menyalin atau mengubah data tahun sebelumnya.

- **Teks halaman:** satu bagian berisi konten mengganti bagian lama secara utuh. Lengkapi seluruh bagian yang akan diterbitkan; field kosong di dalamnya tidak diisi satu per satu dari tahun lama.
- **Aset umum:** penggantian berlaku per slot. Melepas media dapat menampilkan media edisi sebelumnya kembali. Siapkan file WebP yang diperkecil sebelum upload melalui pustaka.
- **Program, sponsor, berita:** daftar tahun pertama yang berisi data dipakai seluruhnya. Satu sponsor aktif 2026 sudah menggantikan daftar sponsor lama; lengkapi daftar pengganti sebelum menerbitkannya.
- **Acara:** slug yang sama mengganti informasi acara. Hero dan carousel memakai sumber yang tersedia secara terpisah. Carousel 2026 yang belum diisi dapat tetap memakai carousel lama.
- **Galeri:** album terbit mengganti album lama dengan slug yang sama. Item dari dua tahun tidak dicampur untuk album tersebut.
- **Data khusus tahun:** identitas, tahun, slogan, pendaftaran, kategori, peserta/foto/QR, kampanye voting dan hasil hanya memakai edisi terpilih. Peserta 2025 tidak mengisi daftar 2026.

Persiapan database produksi 2026 telah diterapkan melalui CMS: tema **Niti Harti, Nanjeur Bukti**, pengurus tetap hingga 2028, enam program, 35 WebP terpilih dan kit identitas 22 slot. Edisi 2026 tetap draf, 2025 tetap aktif. Source pewarisan memerlukan deployment terpisah. Sponsor dan carousel kegiatan tetap memakai sumber sebelumnya. Peserta terdaftar baru 30, yaitu 12 JD dan 18 JR; MD/MR serta profil lain belum lengkap. Target sementara 20 per kategori tidak berarti seluruh peserta sudah terdaftar. Potret terbaru sudah dipotong dari sumber asli untuk membuang bingkai dan QR poster. Hero memakai gabungan pinilih dewasa dan rumaja transparan, sedangkan ajakan memakai pasangan rumaja. Semua penggantian tersimpan pada CMS produksi; media lama tetap tersedia. Tampilan koreksi sudah diperiksa pada 380/1440 px melalui build produksi lokal dengan salinan data publik, tanpa overflow atau gambar teramati rusak. Deployment source tetap terpisah.

Navigasi dan footer mengikuti tahap CMS: Finalis saat tahap final tersedia dan bukan draf, selain itu Semifinalis saat tahap semifinal tersedia dan bukan draf. Tanpa tahap final, daftar semifinal memakai tahap berslug `semifinal` atau `semifinalis` yang sudah aktif/tertutup pada edisi tersebut. Tahap Audisi tidak dianggap semifinal. Daftar finalis tetap kosong sampai tahap final tersedia dan dibuka. Penutupan tahap tetap memerlukan keputusan seleksi sesuai alur CMS; memasang foto tidak menetapkan kelolosan.

Panduan operasional sistem manajemen konten (CMS) resmi **Paguyuban Mojang Jajaka Kabupaten Garut (PAMOKA Garut)**.

---

## 1. Masuk dan Manajemen Akses

1. Buka `/admin/login` dan pilih **Lanjut dengan Google**. Tombol menampilkan status menghubungkan; jika gagal, pesan muncul dan Anda dapat mencoba lagi.
2. Pengguna baru berstatus **Menunggu**. Pada halaman **Minta akses**, jelaskan kebutuhan Anda dan pilih area yang diperlukan.
3. Administrator dengan izin `access.approve` akan meninjau dan menyetujui permintaan dari menu **Pengguna** (`/admin/users`).
4. Satu pengguna dapat memegang kombinasi role (misalnya: *Content Editor*, *Media Manager*, *Voting Operator*).
5. Super admin di-bootstrap manual melalui Turso database sesuai runbook; tidak ada bootstrap otomatis.

Navigasi desktop memakai sidebar terang; pada ponsel, buka menu di kiri atas. Menu **Konten** dapat dibuka atau ditutup. Pilihan edisi berada di header. Dialog, pilihan, tombol, formulir, dan disclosure memakai primitive lokal dengan warna serta font situs publik. Nama kolom dan label dibuat ringkas; batas input, alasan perubahan, serta peringatan penghapusan tetap ditampilkan.

Pada situs publik, menu kategori desktop dibuka dengan klik atau Enter, lalu ditutup dengan Escape atau klik di luar. Kontrol formulir Select mempertahankan nilai saat submit dan kembali ke nilai awal saat reset; reset juga membersihkan pesan pilihan wajib.

---

## 2. Selector Edisi & Isolasi Data Tahunan

Bar atas (header) admin dilengkapi dengan **Selector Edisi Aktif**:
- Memilih edisi di header akan mengisolasi ruang kerja admin ke tahun yang dipilih (misal: *Pasanggiri MOKA 2025* atau *2026*).
- Modul-modul berbasis edisi (Identitas, Aset Situs, Sponsor, Berita, Panitia, Mojang Jajaka, Acara, Galeri, dan Voting) otomatis menyesuaikan data dengan edisi aktif.
- Modul global yang berlaku lintas tahun: **Kepengurusan Organisasi** (`/admin/organization`), **Pustaka Media** (`/admin/media`), **Manajemen Pengguna** (`/admin/users`), dan **Audit Log** (`/admin/audit`).
- Pilihan di formulir memakai kontrol Select yang dapat dinavigasi dengan keyboard; nilai kosong tetap dikirim sebagai nilai kosong.

---

## 3. Dashboard & Kesiapan Konten Edisi (Readiness Checklist)

Halaman utama dashboard (`/admin`) menyediakan ikhtisar terpadu:
1. **Statistik Utama**: Menampilkan edisi terpilih, jumlah peserta aktif, berita, dan sponsor.
2. **Panel Kesiapan Konten (Readiness Checklist)**: Memantau 10 indikator kesiapan sebelum peluncuran edisi:
   - **Identitas Edisi**: Kelengkapan logo resmi (1:1) dan slogan Pasanggiri.
   - **Program Unggulan**: Program yang ditampilkan untuk edisi aktif.
   - **Aset Situs Tetap**: Keterisian seluruh slot wajib pada manifest aset.
   - **Struktur Panitia**: Susunan panitia pelaksana edisi.
   - **Peserta Pasanggiri**: Peserta aktif dan kesiapan tahap seleksi edisi.
   - **Rangkaian Acara**: Agenda kegiatan edisi aktif.
   - **Kampanye Voting**: Kampanye voting kameumeut edisi aktif.
   - **Sponsor & Mitra**: Partner pendukung edisi.
   - **Berita Editorial**: Artikel yang telah dipublikasikan.
   - **Galeri Dokumentasi**: Album dokumentasi foto dan video.
   - **Panitia**: Pengelolaan internal admin; tidak ditampilkan pada public site untuk rilis 2025.
3. **Pintas Navigasi Cepat**: Tautan langsung ke modul yang belum lengkap beserta bar persentase kesiapan.
4. **Log Audit Terkini**: Ringkasan aktivitas transaksional admin dalam zona waktu Indonesia Barat (`Asia/Jakarta`).

---

## 4. Identitas Edisi & Program Unggulan

Menu **Identitas Edisi** (`/admin/content/edition-settings`) mengelola brand dan agenda resmi edisi aktif:
1. **Logo Resmi**: Pilih logo utama dari pustaka, termasuk SVG statis atau PNG transparan. Logo ini menjadi pengganti bila varian navbar/footer pada Aset situs belum diisi.
2. **Slogan Edisi**: Masukkan tagline resmi edisi (misal: *Nu Nyunda Tur Nyakola*).
3. **Program Unggulan**: Kelola daftar program kerja edisi dengan judul, deskripsi, status aktif, dan tombol pemindah urutan (naik/turun).
4. **Pembaruan Transaksional**: Setiap perubahan dicatat di audit log dengan penguncian versi optimistik (`version`).

---

## 5. Aset Situs Tetap

Menu **Aset Situs Tetap** (`/admin/content/site-assets`) mengelola 47 slot visual per edisi, termasuk 22 slot logo, ikon dan gambar berbagi:
1. Buka kelompok halaman yang ingin diubah. Hanya satu kelompok ditampilkan agar halaman tetap ringkas.
2. Setiap kartu slot menampilkan nama bagian, jenis media, rasio, status keterisian, dan pratinjau.
3. Gunakan tombol **Pilih media** untuk memilih dari pustaka atau mengunggah file baru.
4. Anda dapat menyesuaikan **Alt text khusus slot** dan titik fokus foto. Logo dan ikon mempertahankan proporsi serta tidak memiliki kontrol crop.
5. Tombol **Lepas media** mengosongkan slot terpilih tanpa menghapus file asli dari pustaka media.
6. Tidak tersedia tombol penambahan slot sembarangan guna menjaga integritas desain situs publik. Slot umum yang belum terisi dapat menampilkan media tahun sebelumnya sesuai aturan pembaruan bertahap.

### Penggantian aset Pasanggiri tahunan

1. Pilih edisi yang dituju, misalnya **2026 Draf**, di header. Pilihan ini tidak mengaktifkan edisi publik.
2. Buka **Logo dan identitas tahunan**. Isi logo organisasi, gabungan, Pasanggiri, simbol, dan monogram sesuai varian terang/gelap. Override navbar desktop, navbar seluler, dan footer bersifat opsional; situs memakai varian logo edisi yang sama bila override kosong.
3. Pilih atau unggah aset melalui pustaka UploadThing. SVG hanya menerima bentuk/teks statis, tanpa skrip, CSS, gambar tertanam, atau sumber eksternal. Gambar OG harus PNG/JPEG/WebP; ikon Apple dan aplikasi harus PNG sesuai dimensi yang tertulis pada slot.
4. Simpan tiap slot. Penggantian menyimpan binding sebelumnya pada revisi dan audit tanpa menghapus file media. Form dengan versi lama atau konteks edisi yang berubah ditolak.
5. Pratinjau edisi dari **Kelola edisi** sebelum aktivasi. Navbar/footer, ikon, manifest aplikasi, OG dan Twitter membaca edisi aktif atau pratinjau berizin. Gambar Pasanggiri digunakan pada Voting dan daftar peserta; gambar sampul peserta/artikel yang spesifik tetap dapat mengalahkan gambar umum.
6. Edisi arsip hanya dapat dibaca pada editor aset dan identitas. Untuk tahun baru, pilih edisi baru dan unggah media baru; jangan mengganti binding tahun sebelumnya. File serta binding 2025 tetap historis. Kit 2026 sudah diunggah ke UploadThing dan dipasang pada 22 slot di `local.db`, memakai 18 media unik dalam folder `Kit identitas 2026`. Edisi 2026 tetap draf dan 2025 tetap aktif. Mapping lokal berada di `.tmp/branding-2026/bindings.json`; laporan verifikasi di `upload-result.json` pada folder yang sama. Kit juga sudah dipasang melalui CMS pada database produksi, dengan logo edisi dan 22 slot brand terverifikasi. Hasil produksi lengkap ada di `.tmp/edition-2026/production-final-verification.json`. Deployment source tetap terpisah.

Perubahan pada edisi publik aktif berlaku saat slot disimpan. Edisi draf tetap tidak terlihat oleh pengunjung biasa. Ikon yang sudah terpasang di perangkat dan gambar sosial dapat tersimpan pada cache browser/platform; gunakan file baru agar URL berbeda. Avatar, monogram, dan OG alternatif disimpan sebagai aset kampanye yang dapat digunakan ulang, tanpa dipaksakan tampil pada setiap halaman.

---

Editor **Teks halaman** (`/admin/content/pages`) menyediakan 15 slot untuk identitas/kontak, Beranda, Tentang, pengantar Galeri, dan pengantar Voting. Simpan draf, lalu terbitkan dengan izin penerbitan. Revisi dan audit dicatat per edisi. Bila periode kepengurusan ditautkan, isi visi/misi dikelola melalui Kepengurusan; editor halaman tetap mengatur judul bagiannya. Pada Ajakan bergabung, label tombol dan tautan bersifat opsional; tautan memakai path situs atau URL http(s) lengkap dan memerlukan label. Pratinjau dari Kelola edisi menampilkan draf teks tanpa mengganti edisi aktif. Production tetap mengikuti rekonsiliasi dan runbook cutover.

## 6. Sponsor & Mitra

Menu **Sponsor** (`/admin/content/sponsors`) mengelola partner pendukung acara:
1. **Tingkatan Tier**: Kelola sponsor berdasarkan kategori (`Utama`, `Pendukung`, `Pendamping`, `Pelengkap`).
2. **Pencarian & Filter**: Saring berdasarkan nama, tier, atau status aktif/nonaktif.
3. **Logo & Pratinjau**: Pilih logo sponsor dan lihat simulasi kartu mini secara live.
4. **Urutan Tampil**: Atur nomor urut penampilan (display order) untuk menentukan posisi di situs publik.
5. **Penerbitan**: Sponsor baru selalu disimpan nonaktif. Pengguna dengan izin penerbitan dapat mengaktifkannya setelah data diperiksa.

---

## 7. Berita dan Editorial

Menu **Berita** (`/admin/content/news`) menyediakan studio penulisan cerita dan dokumentasi resmi:
1. **Tulis berita**: Isi judul, alamat berita, ringkasan, dan foto sampul.
2. **Atur isi**: Gunakan paragraf, heading 2 atau 3, tebal, miring, tautan, daftar, kutipan, dan gambar.
3. **Pilih media**: Gunakan gambar dari Pustaka Media. Pengguna dengan izin pengelolaan media juga dapat mengunggah aset baru.
4. **Simpan otomatis**: Draft disimpan setelah perubahan berhenti sejenak. Indikator di bagian atas menunjukkan status penyimpanan.
5. **Periksa tampilan**: Pilih Editor, Keduanya, atau Pratinjau. Pratinjau tersedia dalam simulasi desktop dan 380 px.
6. **Terbitkan**: Foto sampul, ringkasan, dan isi wajib lengkap. Riwayat revisi tetap tersedia untuk pemulihan.

---

## 8. Kepengurusan Organisasi (Global)

Menu **Kepengurusan** (`/admin/organization`) mengelola struktur kepengurusan PAMOKA lintas periode:

1. **Multi-Tab**: Terbagi menjadi tab *Periode Kepengurusan*, *Direktori Profil*, dan *Perlu Dipetakan*.
2. **Struktur Organisasi Bertingkat (Tree)**: Kelola unit organisasi hierarkis (hingga 4 level kedalaman: Dewan Pembina, Pengurus Harian, Bidang, Divisi).
3. **Penugasan Pengurus**: Hubungkan orang dari Direktori Profil ke unit organisasi dengan jabatan tertentu.
4. **Direktori Orang Bersama**: Profil orang (nama, bio, media sosial, foto) dapat digunakan kembali untuk kepengurusan berbagai periode maupun kepanitiaan edisi.
5. **Edisi Terhubung**: Buka detail periode lalu pilih **Atur** pada bagian Edisi terhubung. Satu periode dapat memiliki beberapa edisi. Jika edisi masih terhubung ke periode lain, centang konfirmasi pemindahan sebelum menyimpan.
6. **Visi dan Misi**: Buka **Edit metadata periode** untuk memperbarui visi serta menambah, menghapus, atau mengurutkan poin misi.
7. **Riwayat periode**: Susunan periode arsip hanya dapat dilihat. Periode aktif dan arsip tidak dapat dihapus. Profil orang terbaru boleh diperbarui; sebelum perubahan pertama, sistem menyimpan salinan identitas sebelumnya untuk setiap keanggotaan arsip. Nama dan foto pada riwayat tidak ikut berubah. Profil yang masih dirujuk arsip tidak dapat dihapus.

---

## 9. Panitia Pelaksana Edisi

Menu **Panitia** (`/admin/content/committee`) mengelola susunan panitia pelaksana khusus edisi aktif:
1. **Isolasi Edisi**: Struktur panitia terikat secara ketat pada edisi yang dipilih di header.
2. **Pohon Hierarki Panitia**: Bangun hierarki kepanitiaan (Steering Committee, Organizing Committee, Divisi Acara, Divisi Logistik, dll.).
3. **Tambah Orang Cepat**: Modal pembuatan profil baru instan jika orang yang ditugaskan belum ada di direktori global.

---

## 10. Mojang Jajaka dan Seleksi

Menu **Mojang Jajaka** (`/admin/content/participants`) mengelola peserta Pasanggiri:
1. **Atur Tahap**: Buka `/admin/content/participants/stages`, buat alur dari tahap pertama sampai tahap final, lalu buka tahap pertama.
2. **Input Manual**: Buka `/admin/content/participants/new` untuk memasukkan pendaftar dari Google Form. Pendaftar otomatis masuk ke tahap pertama.
3. **Workspace Seleksi**: Buka satu tahap untuk menetapkan `Lolos` atau `Tidak lolos`. Semua peserta harus memiliki keputusan sebelum tahap ditutup.
4. **Pemulihan**: Keputusan dapat di-rollback dengan alasan. Tahap tertutup dapat dibuka kembali hanya jika tahap berikutnya belum diproses.
5. **Kategori Standar**: Peserta memakai kategori baku `JD`, `MD`, `JR`, atau `MR`.
6. **Kuota Tahap**: Atur target untuk tiap kategori `JD`, `MD`, `JR`, dan `MR`; jumlah total dihitung otomatis. Tahap lama tanpa kuota per kategori tetap memakai target total. Jika jumlah peserta yang lolos di bawah kuota, konfirmasi dan alasan diperlukan.
7. **Tahap Final dan Gelar**: Buka `/admin/content/participants/titles` untuk membuat gelar, mengatur jumlah slot, dan menyematkannya kepada peserta tahap final. Satu peserta dapat menerima beberapa gelar.
8. **Penghapusan Tahap**: Tahap yang masih dipakai peserta atau voting tidak dapat dihapus.
9. **Editor Detail Peserta** (`/admin/content/participants/[id]`):
   - **Identitas & Kategori**: Nomor urut, nama lengkap, slug profil, dan bio ringkas.
   - **Prestasi**: Daftar capaian dan prestasi dengan tombol pengurut naik/turun.
   - **Sosial Media**: Tautan akun Instagram, TikTok, YouTube, LinkedIn, dll.
   - **Media Profil**: Foto dikelompokkan berdasarkan peran (`Closeup`, `Full Body`, `Detail Busana`, `Karantina`, `Lainnya`). Foto Closeup otomatis tersinkronisasi ke foto utama. Profil dapat memiliki satu video aktif berformat MP4 atau WebM.
   - **QRIS dan Voting**: QRIS dibuat di luar sistem, lalu gambarnya diunggah atau dipilih dari Pustaka Media.
   - **Halaman profil publik**: Foto, bio, prestasi, QR, dan video yang siap tampil dibaca dari peserta yang mencapai tahap semifinal atau final pada edisi aktif. Slogan pada daftar peserta mengikuti nilai di Identitas Edisi.
10. **Live Preview**: Pratinjau kartu peserta secara langsung saat mengedit.

---

## 11. Acara dan galeri

Menu **Rangkaian acara** (`/admin/content/events`) mengelola nama, slug, deskripsi, foto hero, status, dan urutan acara pada edisi aktif. Buka detail acara untuk melihat album terkait atau membuat album baru yang langsung terhubung.

Menu **Galeri** (`/admin/content/galleries`) menyediakan dua tipe album:

1. **Umum**: album tidak terkait acara.
2. **Terkait acara**: album hanya dapat memilih acara dari edisi aktif.

Di dalam album, admin dapat memilih beberapa foto dari Pustaka Media, menambahkan video YouTube, mengubah keterangan, dan mengatur urutan. Setiap item hanya memiliki satu sumber. Pratinjau menampilkan indeks album dan susunan medianya.

Halaman publik Galeri memakai dinding foto tanpa kartu, judul foto, atau keterangan terlihat. Keterangan tetap tersimpan dan dipakai sebagai deskripsi aksesibel bila alt belum tersedia. Foto dapat diperbesar dan dinavigasi dengan tombol atau panah keyboard; video tersedia setelah foto.

Album terbit ditampilkan pada `/galeri`. Bagian Kegiatan kami di `/tentang` berada setelah pengantar dan menampilkan maksimal tiga preview foto tanpa wadah kartu, deskripsi album bila tersedia, dan tautan ke album terkait. Kontak di akhir halaman mengikuti email atau Instagram pada Teks halaman dengan prioritas tahun yang dijelaskan di atas. Judul legacy Kenali Kami Lebih Dekat ditampilkan sebagai PAMOKA Garut dengan pengantar ringkas berdasarkan misi; judul khusus dan isi hero yang diterbitkan tetap dipakai. Item album acara menjadi carousel pada detail kegiatan. Public site membaca CMS terbit dengan pewarisan sesuai jenis konten, tanpa tahun fallback yang tertanam. Perilaku source terbaru belum menjadi bukti perilaku deployment pada `www.pamokagarut.com`. Lihat `docs/runbooks/cms-cutover.md` untuk persiapan produksi dan batas rilis.

Lampiran legalitas dipilih melalui **Teks halaman > Legalitas organisasi > Dokumen legalitas**. Pilih PDF dari pustaka media, isi nama dokumen, simpan draf, lalu terbitkan. Untuk melepas lampiran, hapus pilihan media lalu simpan dan terbitkan. Sistem memeriksa kembali status siap, tipe PDF, dan URL HTTPS saat publikasi. Riwayat menampilkan anggota periode arsip dengan identitas historis yang dipertahankan.

---

## 12. Operasional Voting Manual

Menu **Voting** (`/admin/voting`) mengelola kampanye voting kameumeut:
1. **Buat Kampanye**: Pilih tahap sumber dari edisi aktif. Tahap final dipilih otomatis bila tersedia.
2. **Mulai Manual**: Ketik nama kampanye dan alasan. Sistem membekukan daftar peserta tahap sebagai snapshot.
3. **Siapkan QRIS**: Unggah atau pilih gambar QRIS eksternal pada profil peserta. PDF dan media yang belum siap tidak dapat menerima tally.
4. **Catat Tally**: Pilih peserta snapshot dan tanggal, lalu masukkan akumulasi pemasukan harian dari dashboard merchant QRIS.
5. **Tampilkan Hasil**: Ubah visibilitas dengan alasan. Kampanye draf belum dapat ditampilkan. Nilai legacy yang tidak dikenal dianggap tersembunyi; gunakan **Tetapkan hasil ke tersembunyi** untuk menormalkan nilai itu melalui action audited.
6. **Tutup Manual**: Tutup kampanye dengan nama dan alasan. Tally terkunci setelah kampanye ditutup.

Halaman publik `/voting` dan route kategori selalu dapat dibuka dan membaca kategori edisi aktif. Jika kampanye belum dibuat dengan jadwal dan harga yang terverifikasi, halaman kategori menampilkan status **Kampanye belum tersedia**. Seed lokal 2025 tidak memuat kampanye atau tally karena sumber tidak menyediakan data terverifikasi. Route lama `/monitor` dialihkan ke `/admin/voting`; halaman admin memeriksa izin `voting.view`.

---

## 13. Pustaka Media & Folder Edisi

Menu **Pustaka Media** (`/admin/media`):
1. **Folder Edisi & Global**: Buat folder khusus edisi untuk mengelompokkan aset tahunan atau folder global untuk aset bersama.
2. **Upload Berbasis UploadThing**: Mendukung unggahan gambar (hingga 20 MB), video (hingga 512 MB), dan PDF (hingga 64 MB).
3. **Manajemen Aset**: Edit alt text, tandai gambar dekoratif, salin URL, atau pindahkan file antar folder tanpa merusak referensi tautan.

---

## 14. Audit Log & Keamanan

Menu **Audit** (`/admin/audit`):
1. Setiap operasi penambahan, perubahan, penghapusan, dan pengunggahan dicatat secara otomatis dalam transaksi database yang sama.
2. Mencatat waktu WIB (`Asia/Jakarta`), identitas operator, jenis sumber daya, aksi, serta rincian sebelum (*before*) dan sesudah (*after*) perubahan.
3. Menjamin transparansi dan akuntabilitas penuh pada seluruh data CMS dan operasional voting.

---

## 15. Import data edisi 2025 di lingkungan lokal

Import satu kali ini hanya tersedia saat aplikasi memakai `NODE_ENV` nonproduction dan `TURSO_DATABASE_URL=file:local.db`.

1. Buka **Pustaka Media** (`/admin/media`) dan jalankan **Import media 2025**. Proses mengunggah aset ke akun UploadThing yang dikonfigurasi dan menyimpan referensinya ke database lokal.
2. Tunggu sampai status **Import selesai**. Jika UploadThing masih memproses file, gunakan **Periksa status lagi**. Jika koneksi terputus, lanjutkan dari batch yang belum selesai.
3. Setelah media selesai, buka **Konten** (`/admin/content`) dan jalankan **Import konten 2025**. Transaksi mengaktifkan edisi 2025 dan memindahkan edisi aktif yang lebih baru ke draf tanpa menghapus datanya.
4. Import konten menolak edisi 2025 yang sudah ada agar perubahan CMS tidak tertimpa. Kelola perubahan berikutnya melalui halaman CMS terkait.

Prosedur ini tidak menulis database Turso remote, tidak melakukan production cutover, dan tidak men-deploy aplikasi.

**Hasil lokal 3 Oktober 2026:** import selesai pada `local.db` dengan 340 aset siap. Edisi 2025 aktif dan edisi 2026 menjadi draf. Browser sebelumnya memuat data beranda, Tentang, Galeri, carousel acara, daftar semifinalis, dan profil finalis dari CMS. Migrasi `0016_faithful_edwin_jarvis.sql` menambah nomor dan urutan per tahap; repair lokal yang diaudit melengkapi 104 entry 2025 tanpa entry hilang atau duplikat. Tiga label CMS berbahasa Inggris pada Beranda dan Tentang sudah dikoreksi. Sumber tidak menyediakan jadwal dan harga kampanye voting, tally terverifikasi, tier sponsor, atau video profil individu. Route voting dan kategori tersedia, tetapi belum ada kampanye 2025; buat melalui **Voting** setelah jadwal dan harga dipastikan. Seluruh 68 sponsor saat ini bertier `pendukung` dan perlu dipetakan sebelum digunakan sebagai klasifikasi final.

Preflight production pada 3 Oktober 2026 hanya membaca database. Production sudah memiliki edisi 2025 aktif, tetapi belum memiliki seluruh schema dan konten lokal. Campaign lama dan 572 tally tetap tidak terverifikasi; tinjau visibilitas hasil sesuai runbook sebelum public cutover. Jangan jalankan importer legacy `cms:apply:2025`; command tersebut telah dipensiunkan.
## Palet warna tahunan

Pilih edisi admin, buka **Konten > Identitas edisi**, lalu isi **Warna gelap** dan **Warna terang** pada bagian Palet. Gunakan kode hex enam digit. **Simpan palet** memerlukan izin edit dan publikasi konten, mencatat revisi/audit, dan tidak mengaktifkan edisi. Edisi arsip hanya dapat dibaca. Jika ada konflik versi, muat ulang sebelum menyimpan. Palet mengikuti edisi publik aktif atau pratinjau berizin. Untuk mencoba 2026, gunakan **Pratinjau situs edisi 2026** di Kelola edisi; selector konteks kerja admin saja tidak mengganti palet publik. Tim teknis mengikuti `docs/runbooks/annual-color-palette.md`; data lokal dan produksi terpisah, dan source reader baru memerlukan deployment. Warna status dan netral tetap konsisten; foto dan logo tersimpan tidak diwarnai ulang.
## Informasi pendaftaran

Pada edisi mulai 2026, buka **Konten > Teks halaman > Pendaftaran**. Tersedia pengantar, kategori usia, syarat, kriteria, OTS, berkas dan timeline. Edisi lama tidak menampilkan kelompok ini. Edisi arsip hanya dapat dibaca.

- **Isi materi 2026** mengisi formulir kosong dari materi operator, tanpa menimpa isian yang ada. Simpan setiap bagian sebagai draf. Template hanya tersedia untuk 2026; edisi berikutnya mulai kosong.
- Daftar syarat, kriteria, OTS dan berkas memakai satu poin per baris.
- Kategori usia memakai `kategori | rentang usia | keterangan opsional`, satu kategori per baris.
- Timeline memakai `tanggal | agenda | keterangan opsional`, satu agenda per baris, maksimal 50 agenda. Urutan baris adalah urutan publik; tanggal ditampilkan sebagaimana ditulis, tanpa konversi zona waktu.
- Pengantar memiliki tombol opsional. Gunakan label singkat dan path situs atau URL http(s) lengkap. Kosongkan tautan bila formulir belum tersedia.
- Gunakan **Kelola edisi > Pratinjau situs edisi** untuk melihat draf tersimpan, lalu buka `/pendaftaran`. Pratinjau tidak mengaktifkan edisi.
- Terbitkan setiap bagian setelah ditinjau. Menu publik, footer dan sitemap menampilkan Pendaftaran ketika pengantar edisi terkait sudah terbit dan memiliki judul serta isi. Menerbitkan isian pengantar kosong menyembunyikan halaman dari publik.

Materi awal 2026 mengikuti naskah operator. Cocokkan perubahan jadwal, status sertifikat prestasi, raksukan, biaya dan tautan formulir dengan keputusan panitia sebelum publikasi. Halaman ini menyajikan informasi; data pendaftar tetap dikelola melalui alur existing.
