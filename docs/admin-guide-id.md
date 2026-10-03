# Panduan Lengkap PAMOKA CMS

Panduan operasional sistem manajemen konten (CMS) resmi **Paguyuban Mojang Jajaka Kabupaten Garut (PAMOKA Garut)**.

---

## 1. Masuk dan Manajemen Akses

1. Akses halaman login di `/admin/login` dan lakukan autentikasi dengan akun Google.
2. Pengguna baru otomatis berstatus **Pending**. Buka menu **Minta akses**, jelaskan tugas operasional Anda, dan pilih modul yang diperlukan.
3. Administrator dengan izin `access.approve` akan meninjau dan menyetujui permintaan dari menu **Pengguna** (`/admin/users`).
4. Satu pengguna dapat memegang kombinasi role (misalnya: *Content Editor*, *Media Manager*, *Voting Operator*).
5. Super admin di-bootstrap manual melalui Turso database sesuai runbook; tidak ada bootstrap otomatis.

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
3. **Pintas Navigasi Cepat**: Tautan langsung ke modul yang belum lengkap beserta bar persentase kesiapan.
4. **Log Audit Terkini**: Ringkasan aktivitas transaksional admin dalam zona waktu Indonesia Barat (`Asia/Jakarta`).

---

## 4. Identitas Edisi & Program Unggulan

Menu **Identitas Edisi** (`/admin/content/edition-settings`) mengelola brand dan agenda resmi edisi aktif:
1. **Logo Resmi**: Unggah atau pilih logo berlatar transparan (PNG/WebP, rasio 1:1).
2. **Slogan Edisi**: Masukkan tagline resmi edisi (misal: *Nu Nyunda Tur Nyakola*).
3. **Program Unggulan**: Kelola daftar program kerja edisi dengan judul, deskripsi, status aktif, dan tombol pemindah urutan (naik/turun).
4. **Pembaruan Transaksional**: Setiap perubahan dicatat di audit log dengan penguncian versi optimistik (`version`).

---

## 5. Aset Situs Tetap

Menu **Aset Situs Tetap** (`/admin/content/site-assets`) mengelola penempatan media pada 24 slot visual tetap untuk Beranda, Tentang, dan halaman kategori:
1. Buka kelompok halaman yang ingin diubah. Hanya satu kelompok ditampilkan agar halaman tetap ringkas.
2. Setiap kartu slot menampilkan nama bagian, jenis media, rasio, status keterisian, dan pratinjau.
3. Gunakan tombol **Pilih media** untuk memilih dari pustaka atau mengunggah file baru.
4. Anda dapat menyesuaikan **Alt text khusus slot** dan titik fokus gambar (Fokus X dan Y dalam persentase 0 hingga 100).
5. Tombol **Lepas media** mengosongkan slot terpilih tanpa menghapus file asli dari pustaka media.
6. Tidak tersedia tombol penambahan slot sembarangan guna menjaga integritas desain situs publik.

---

Editor **Teks halaman** (`/admin/content/pages`) menyediakan slot tetap untuk beranda dan Tentang: hero, program, berita, ajakan, visi, misi, legalitas, dan organisasi. Simpan perubahan sebagai draf, lalu terbitkan dengan izin penerbitan. Riwayat revisi dan audit dicatat per edisi. Tulis satu misi per baris. Pada slot **home/ajakan**, isi opsional **Label tombol** dan **Tautan tombol**. Tautan harus berupa path situs seperti `/pendaftaran` atau URL penuh `http(s)`; jika tautan diisi, label tombol wajib diisi. Tombol hanya tampil setelah draf diterbitkan. Halaman publik lokal `localhost:3001` membaca konten CMS terbit pada edisi aktif; bagian tanpa konten akan dikosongkan. Produksi tetap menunggu otorisasi cutover Plan 010.

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
7. **Riwayat Periode**: Periode arsip hanya dapat dilihat. Periode aktif dan arsip tidak dapat dihapus. Profil orang, unit, dan penugasan yang terhubung ke periode arsip tidak dapat diubah atau dihapus.

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
   - **Halaman profil publik**: Foto, bio, prestasi, QR, dan video yang siap tampil dibaca dari peserta yang mencapai tahap semifinal atau final pada edisi aktif.
10. **Live Preview**: Pratinjau kartu peserta secara langsung saat mengedit.

---

## 11. Acara dan galeri

Menu **Rangkaian acara** (`/admin/content/events`) mengelola nama, slug, deskripsi, foto hero, status, dan urutan acara pada edisi aktif. Buka detail acara untuk melihat album terkait atau membuat album baru yang langsung terhubung.

Menu **Galeri** (`/admin/content/galleries`) menyediakan dua tipe album:

1. **Umum**: album tidak terkait acara.
2. **Terkait acara**: album hanya dapat memilih acara dari edisi aktif.

Di dalam album, admin dapat memilih beberapa foto dari Pustaka Media, menambahkan video YouTube, mengubah keterangan, dan mengatur urutan. Setiap item hanya memiliki satu sumber. Pratinjau menampilkan indeks album dan susunan medianya.

Album terbit ditampilkan pada `/galeri`. Bagian Galeri di `/tentang` menampilkan maksimal tiga preview. Item album acara menjadi carousel pada detail kegiatan. Runtime lokal memakai konten bawaan sebagai fallback jika belum ada konten CMS terbit; produksi belum dialihkan.

---

## 12. Operasional Voting Manual

Menu **Voting** (`/admin/voting`) mengelola kampanye voting kameumeut:
1. **Buat Kampanye**: Pilih tahap sumber dari edisi aktif. Tahap final dipilih otomatis bila tersedia.
2. **Mulai Manual**: Ketik nama kampanye dan alasan. Sistem membekukan daftar peserta tahap sebagai snapshot.
3. **Siapkan QRIS**: Unggah atau pilih gambar QRIS eksternal pada profil peserta. PDF dan media yang belum siap tidak dapat menerima tally.
4. **Catat Tally**: Pilih peserta snapshot dan tanggal, lalu masukkan akumulasi pemasukan harian dari dashboard merchant QRIS.
5. **Tampilkan Hasil**: Ubah visibilitas dengan alasan. Kampanye draf belum dapat ditampilkan.
6. **Tutup Manual**: Tutup kampanye dengan nama dan alasan. Tally terkunci setelah kampanye ditutup.

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

**Hasil lokal 1 Oktober 2026:** import selesai pada `local.db` dengan 340 aset siap. Edisi 2025 aktif dan edisi 2026 menjadi draf. Browser sudah memuat data beranda, Tentang, Galeri, carousel acara, daftar semifinalis, dan profil finalis dari CMS. Sumber tidak menyediakan jadwal dan harga kampanye voting, tally terverifikasi, tier sponsor, atau video profil individu. Belum ada campaign voting 2025; buat melalui **Voting** setelah jadwal dan harga dipastikan. Seluruh 68 sponsor saat ini bertier `pendukung` dan perlu dipetakan sebelum digunakan sebagai klasifikasi final.
