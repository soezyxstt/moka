# Plan 018: Informasi pendaftaran per edisi

Status: DONE (source, QA lokal dan konten database produksi; deployment terpisah).

## Tujuan dan dependensi

Halaman `/pendaftaran` untuk edisi mulai 2026, memakai fondasi CMS Plan 004/007/014, primitive publik Plan 013 dan token Plan 017. Konten berasal dari page sections edisi terkait dengan alur draf, terbit, revisi dan audit yang ada. Template operator 2026 tidak menjadi fallback runtime publik.

## Cakupan

- `src/server/cms/page-sections.ts`, kontrak pendaftaran, public readers.
- Editor dan actions `src/app/admin/content/pages/`.
- `src/app/pendaftaran/`, layout, navbar, footer, sitemap bila tersedia.
- Template admin 2026, tes kontrak dan transaksi, dokumentasi admin/readiness.
- Syarat, kriteria, OTS, berkas, timeline dan tautan opsional. Ornamen brand/highlight, motion/react reduced motion, accordion shadcn dan responsivitas 380 px.

## Batas dan STOP

Tidak mengubah skema, environment, aktivasi edisi, voting, pembayaran atau data historis. Tidak menulis remote, upload atau deploy. Template tidak menambah biaya, formulir URL atau spesifikasi pakaian yang tidak diberikan. Target QA hanya lokal; hentikan write bila target remote. Edisi berikutnya tidak mewarisi konten 2026.

## Drift dan verifikasi

Drift terhadap `3874ede` telah diperiksa sebelum implementasi; workspace berisi perubahan CMS dan UI terdahulu yang dipertahankan. Jalankan tes database sementara, lint, typecheck, build dan browser desktop/mobile. Tautan dan route publik memakai kebijakan kelayakan edisi dan konten terbit yang sama; pratinjau draf memerlukan izin existing.

## Hasil 2026-10-15

### Penerapan database produksi

Operator kemudian mengotorisasi penerapan langsung ke `.env.prod`. Host terverifikasi `pamoka-soezyxstt.aws-ap-south-1.turso.io`. Backup terbaru memakai AES-256-GCM, key DPAPI CurrentUser dan lolos restore verification. Ketujuh bagian pendaftaran edisi 2026 ditambahkan dan diterbitkan melalui server action terautentikasi, pemeriksaan izin lokal serta akun super admin aktif pada database tujuan, lalu service draf/terbit transaksional existing. Halaman operasi sementara dihapus setelah selesai.

Verifikasi read-only mencocokkan seluruh judul/isi dengan materi operator: tujuh bagian published versi 2, 14 agenda, 14 audit, tujuh revisi, nol draf sisa dan nol foreign-key error. Seluruh record 2025 yang memiliki editionId pada snapshot serta record edisinya tidak berubah, termasuk 104 peserta, 77 sponsor, 14 berita, enam acara dan enam album. Aktivasi dan deployment tidak dilakukan; 2025 aktif dan 2026 draf.

Bukti privat di `.tmp/registration-prod-before-20261015.aesgcm`, `.key.dpapi`, `.manifest.json` dan `.tmp/registration-prod-result-20261015.json`. Penghapusan artefak sementara diblokir kebijakan eksekusi; snapshot awal `.json` dan database restore `.db` kemudian dienkripsi di tempat dengan envelope AES-256-GCM yang lossless dan key DPAPI yang sama. Kedua nama tersebut kini berisi ciphertext, bukan JSON/database mentah. Verifikasi dekripsi byte-identik lulus. Pembaruan data produksi tidak berarti route source terbaru sudah dideploy.

### Implementasi dan QA lokal sebelumnya

- 93 tes database/script lulus secara serial, termasuk empat tes baru pendaftaran dan guard graf impor publik. Typecheck, lint tanpa error, serta production build lulus; lint menyisakan warning TanStack existing.
- Tujuh bagian materi tersimpan sebagai draf pada `file:local.db`, melalui CMS terautentikasi dan audited actions. Tidak diterbitkan, tidak mengaktifkan edisi. Edisi publik tetap 2025.
- Pratinjau admin 2026 memuat kedua kategori usia, seluruh syarat/kriteria, OTS, berkas dan 14 agenda. Desktop 1440 px dan mobile/tablet 380/768/1024 px tidak overflow horizontal. Menu mobile dan accordion OTS dibuka lewat keyboard.
- HTTP tanpa cookie pratinjau tidak menampilkan menu, isi pendaftaran atau entri sitemap pada 2025. Route menjalankan notFound; Next dapat mengirim status HTTP 200 saat respons sudah streaming.
- Referensi Instagram ditinjau pada tab Chrome operator: latar terang, bidang putih, bagian gelap dan ornamen melengkung. Ornamen halaman memakai geometri dekoratif; tidak menyalin foto edisi lama.
- Motion menghormati reduced motion melalui hook dan media query scoped. Mode OS reduced motion dan perangkat fisik belum diuji.
- URL formulir, nominal pembayaran dan detail raksukan tidak diisi karena belum diberikan. Perbedaan sumber Instagram tentang sertifikat opsional dan registrasi tambahan 9 Oktober dicatat untuk tinjauan; template mengikuti naskah operator.
- Tidak ada perubahan skema, migrasi, upload, write remote, aktivasi atau deployment. Publikasi serta kesiapan seluruh edisi tetap terpisah dari penerimaan source halaman ini.


## Draf tiga halaman, 2026-10-18

Status: IN PROGRESS. Permintaan operator menerapkan draf Beranda, Tentang dan Pendaftaran dengan gaya existing dan foto CMS reusable. Dependensi: Plan 004/007/014/017/018. Drift terhadap baseline `3874ede` ditinjau; working tree bersih sebelum pekerjaan. Cakupan: ketiga route, komponen pendaftaran, registry teks CMS, reader, preset draf editor, tes dan panduan admin. STOP: fakta/status/biaya/tautan yang belum dipastikan, target remote, migrasi, upload dan deployment. Tidak ada aset baru atau perubahan token global.


Hasil 2026-10-18: source revisi selesai, sebelas draf perubahan tersimpan melalui CMS lokal (enam Beranda, tiga Tentang, satu FAQ dan satu Instagram), tanpa penerbitan atau aktivasi. QA pratinjau desktop dan 380 px mencakup tiga halaman, FAQ, kontak dan roster lengkap; tidak ada overflow horizontal. Lima tes CMS pendaftaran/editorial lulus. Typegen, TypeScript dan lint lulus dengan warning TanStack existing. Bukti visual di `.tmp/content-draft-20261018/`. Data/aset lokal tidak sama dengan produksi; pratinjau memakai fallback foto existing dan tidak menjadi bukti roster produksi. Status/jalur/langkah, biaya dan ketentuan berkas yang belum pasti tetap menunggu panitia. Tidak ada build produksi, upload, migrasi, write remote atau deployment. Status plan induk tetap IN PROGRESS; Plan 018 revisi source diterima, publikasi baru terpisah.

Konten editorial 2026 sudah terbit di database produksi pada 2026-10-18: FAQ domisili berasal dari draf riil operator, editable melalui Teks halaman. Field status/jalur/langkah yang belum ditetapkan tidak diisi dengan perkiraan. Source ketiga halaman di origin/main `603d359`; detail audit/backup pada Plan 013 dan `.tmp/content-release-20261018/production-verification.json`.
