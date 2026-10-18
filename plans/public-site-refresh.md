# Plan 013: Penyegaran Visual dan Performa Situs Publik

Status: IN PROGRESS. Next route type generation dan TypeScript compiler lulus. ESLint lulus tanpa error dan menampilkan satu warning existing pada `src/components/data-table.tsx`. Pemilih kategori `/voting` diverifikasi di desktop dan 390 px; seluruh kategori bernavigasi, keyboard membuka popover, dan tidak ada overflow atau tumpang tindih dengan navbar.

## Tujuan

Rapikan pengalaman halaman publik PAMOKA Garut lewat perubahan kecil pada hierarki, responsivitas, copy, aksesibilitas kontrol, pemuatan gambar, dan render awal. Pertahankan aset, palet, bentuk organik, dan arah visual publik yang sudah ada.

## Batas perubahan

- Pada saat Plan 013 dimulai, konten publik masih hardcoded. Pemindahan konten tahunan ke CMS kemudian dikerjakan terpisah melalui Plan 014.
- Tidak menambah route, dependensi, tabel, variabel lingkungan, atau alur CMS.
- Tidak mengubah status kampanye, tally, atau tindakan voting 2025, termasuk pembayaran. Perbaikan terpisah pada 2026-10-03 menghapus gate route `/voting` yang memakai tenggat 2025 statis agar halaman CMS aktif dapat dibuka.
- `/monitor` dipensiunkan sebagai monitor legacy dan mengarah ke `/admin/voting`, yang memeriksa izin `voting.view`.
- Tidak melakukan migrasi database, upload, deployment, atau cutover Plan 010.
- Hanya ubah source yang diperlukan untuk temuan audit publik.

## File dalam cakupan

- `src/app/loading.module.css`

- `src/app/not-found.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`
- `src/components/custom/site-status.tsx`

- `src/components/custom/participant-profile.tsx`

- `src/components/footer.tsx`
- `src/app/page.tsx`
- `src/lib/metadata-fetcher.ts`
- `src/components/news-card.tsx`
- `src/components/custom/hero-video.tsx`
- `src/components/custom/section-header.tsx`
- `src/app/tentang/page.tsx`
- `src/app/galeri/page.tsx`
- `src/app/galeri/gallery-wall.tsx`
- `src/app/galeri/gallery-media.ts`
- `scripts/gallery-media.test.ts`
- `src/server/cms/public-readers.ts` (pemulihan lampiran PDF legalitas yang sudah terbit)
- `src/server/cms/public-document.ts`
- `scripts/public-document.test.ts`
- `src/app/rangkaian-kegiatan/[event]/page.tsx`
- `src/app/profil-finalis/[category]/hero-text.tsx`
- `src/app/profil-finalis/[category]/page.tsx`
- `src/app/profil-finalis/[category]/[name]/page.tsx`
- `src/app/profil-semifinalis/[category]/page.tsx`
- `src/app/profil-semifinalis/[category]/[name]/page.tsx`
- `src/hooks/use-search-param.ts`
- `src/app/voting/page.tsx` (header foto, judul kampanye, rentang waktu, grafik hasil sementara, dan dialog vote)
- `src/app/voting/voting-categories.tsx`
- `src/app/voting/voting-panel.tsx`
- `src/app/voting/[category]/page.tsx` (redirect ke `/voting?kategori=...`)
- `src/app/voting/hasil/[category]/page.tsx`
- `src/app/sitemap.ts`
- `plans/README.md`
- `AGENTS.md`
- `plans/public-site-refresh.md`

## Pemeriksaan

- Buka seluruh kategori finalis, semifinalis, hasil voting, dan kegiatan pada desktop, laptop, serta mobile.
- Periksa route beranda, Tentang, satu halaman detail tiap jenis profil, dan halaman terlindungi untuk memastikan perilaku tetap sesuai.
- Uji navigasi menu, tombol ekspansi profil, kontrol carousel, dialog unduhan, tautan dokumen, dan pemutar video di browser.
- Periksa lebar dokumen, gambar rusak, nama aksesibel kontrol, serta render awal berita beranda.
- Periksa tombol kategori pada `/voting`, persistensi query param `?kategori=`, grafik hasil sementara, serta dialog pencarian peserta dan unduh QR.
- Jalankan `npm.cmd run lint` dan `npm.cmd run typecheck`.

## Kondisi berhenti

- Permintaan operator 2026-10-15 mengizinkan Galeri menjadi dinding foto tanpa kartu, judul foto, atau caption, dengan counterflow desktop, hover, dan pembesaran foto. Anchor album dan media CMS tetap tersedia; mobile dan reduced motion memakai gerakan minimal.
- Hentikan perubahan bila temuan memerlukan perubahan fakta acara, status kampanye, nominal pembayaran, autentikasi, atau data CMS.
- Hentikan bila perbaikan memerlukan aset baru, dependensi baru, perubahan global design tokens, atau perubahan struktur besar.
- Permintaan operator 2026-10-15 menghapus label eyebrow pada seluruh route publik. Nilai CMS tetap tersimpan dan dapat diedit; UI admin tidak berubah.
- Permintaan operator 2026-10-15 menata ulang berita beranda agar banyak artikel tetap ringkas: grid responsif empat kolom maksimum dengan tinggi section mengikuti konten. Data CMS, cover, dan tujuan tautan tidak berubah.
- Permintaan operator 2026-10-15 mengizinkan penataan ulang bagian Tentang: visi/misi, foto pengurus, riwayat tanpa kartu, galeri tanpa kartu, dan pemulihan tautan PDF legalitas dari CMS. Tidak mengubah fakta, isi database, route lain, atau token global.
- Route voting publik membaca kategori edisi aktif. Tanpa kampanye terverifikasi, tampilkan status belum tersedia; jangan membuat transaksi, tally, atau status kampanye.

## Catatan verifikasi

Penataan ulang `/voting`, 2026-10-16: sesuai permintaan operator, tab kategori kini memakai hook `useSearchParam` berbasis query param `?kategori=` sehingga tetap bertahan saat halaman di-refresh. Di bawah tab kategori tampil judul kampanye, rentang waktu buka voting, grafik batang hasil sementara berbasis Recharts dan `ChartContainer` shadcn UI, serta tombol `Vote sekarang`. Saat tombol diklik, dialog minimal terbuka dengan kolom pencarian nama/nomor peserta; saat peserta dipilih, dialog menampilkan foto, nama, kode peserta, posisi, jumlah vote, dan QRIS dengan tombol `Unduh QR`. Halaman detail voting per peserta dihapus dan `/voting/[category]` dialihkan ke `/voting?kategori=<slug>`.

Koreksi loading, 2026-10-16: source selesai. Sesuai permintaan operator, loading diganti tiga titik 20 px pada mobile dan 24 px pada desktop, bergantian meloncat di tengah viewport. Tanpa teks terlihat, spinner, atau foto; status tetap memiliki label aksesibel. Animasi CSS scoped mengikuti reduced motion tanpa JavaScript tambahan. Opsi loading yang sudah tidak dipakai pada SiteStatus dihapus. Typegen, TypeScript, lint dengan warning TanStack existing, serta diff whitespace lulus memakai Node bawaan Codex karena shim sistem gagal. Browser dan build tidak dijalankan. Plan 013 tetap IN PROGRESS; tidak mengubah data, global tokens, autentikasi, atau deployment.

Verifikasi setelah integrasi paralel: typecheck lulus, render desktop/mobile kembali terang tanpa overflow atau gambar gagal. Lint seluruh repo kini menemukan error pada `src/app/global-error.tsx:20` (anchor internal ke `/`) dari perubahan lain, ditambah warning data-table existing. Error tersebut di luar cakupan koreksi Tentang; hasil lint sebelumnya mendahului perubahan file ini.

Integrasi perubahan paralel warna, 2026-10-15: saat QA terakhir globals telah beralih ke brand/highlight dan memuat typo `var(ring)` yang menghentikan render. Typo diperbaiki menjadi `var(--ring)` tanpa mengubah nilai token. Tentang, Section, Button, dan typography diselaraskan dengan nama token terbaru; Section tetap menerima alias overlay brand/highlight untuk kompatibilitas caller lama. Hero mint dan kegiatan krem kembali terverifikasi secara visual di browser. Perubahan lain pada pembaca kontak dan palette globals tidak ditimpa.

Halaman sistem, 2026-10-15: selesai dalam source lokal. Komponen bersama memakai Section, latar Babancong existing, wash mint, Montserrat, tombol publik, serta token brand/highlight terbaru. Error memakai API `retry` Next 16.3; global error membawa document, font, dan stylesheet sendiri tanpa pembaca CMS. Loading memiliki live status dan animasi motion-safe. Override heading terlokalisasi mengatasi aturan h1 global di luar CSS layer. Browser 1440 px dan 380 px tidak menemukan overflow. Tautan beranda 404, status loading, presentasi error, penyembunyian detail teknis, dan callback retry diverifikasi melalui fixture sementara yang sudah dihapus. Typegen, typecheck, dan lint lulus dengan warning data-table existing. Pemulihan root-layout dan siklus error server nyata belum diuji runtime. Build tidak diulang. Tidak ada perubahan data, autentikasi, upload, atau deployment. Drift baseline `3874ede` ditinjau sebelum edit; perubahan existing dipertahankan.

Verifikasi akhir koreksi warna Tentang: type generation, typecheck, dan lint lulus; lint hanya menunjukkan warning data-table existing. Diff whitespace lulus. Pratinjau desktop `tentang-light-desktop.jpg` tersimpan pada folder visualizations operator. Production build tidak diulang untuk koreksi presentasi ini.

Koreksi arah visual Tentang, 2026-10-15: operator menilai dua bagian awal terlalu gelap. Perbandingan browser dengan Beranda dan Voting menunjukkan ritme konten publik memakai mint/krem dan foto latar dengan wash terang. Hero Tentang kini memakai `Section` dengan latar CMS serta overlay `brand`; kegiatan memakai overlay `highlight`, teks hijau gelap, dan body typography publik. Susunan konten, tautan, roster, dan seluruh data tetap dipertahankan. Browser 1440 px dan 380 px tidak menemukan overflow atau gambar gagal. Lint/typecheck sedang diverifikasi. Tidak ada perubahan globals, navbar, data CMS, atau deployment.

Hasil akhir pass kritik Tentang 2026-10-15: Next type generation, TypeScript, lint, dan diff whitespace lulus. Lint menyisakan warning data-table existing. Self-check pengelompokan memastikan setiap orang tampil tepat sekali, termasuk label yang cocok dengan dua kelompok serta peran yang belum dikenali. Browser memverifikasi tautan kegiatan, tujuan email, dan potret mobile; tidak ditemukan gambar gagal pada pemeriksaan DOM. Build production tidak diulang untuk perubahan presentasi ini. Pratinjau desktop tersimpan di folder visualizations operator.

Penataan hierarki Tentang, 2026-10-15: satu foto kegiatan pada hero dengan bidang teks hijau gelap; identitas dan pengantar singkat menggantikan judul legacy generik. Judul dan isi hero terbit yang khusus tetap dipakai. Preview album dipindah setelah intro dan menyertakan deskripsi CMS. Pengurus dikelompokkan berdasarkan nama peran yang tersimpan, dengan kelompok tambahan untuk peran lain; seluruh anggota tetap tampil. Label peran 14 px, nama 16 px, periode dekat judul, dan heading arsip diperkecil. Kontak memakai email terbit atau Instagram dari pembaca identitas situs. Browser desktop 1440 px, mobile 380 px, serta pemeriksaan reflow 320 px tidak menemukan overflow. Lima misi, 16 pengurus, dan empat periode tetap tersedia. Tidak ada write CMS, upload, perubahan navbar/footer, atau deployment. Pemeriksaan compiler dan lint sedang berjalan.

Penataan hierarki Tentang, 2026-10-15: satu foto kegiatan pada hero dengan bidang teks hijau gelap; identitas dan pengantar singkat menggantikan judul legacy generik. Judul dan isi hero terbit yang khusus tetap dipakai. Preview album dipindah setelah intro dan menyertakan deskripsi CMS. Pengurus dikelompokkan berdasarkan nama peran yang tersimpan, dengan kelompok tambahan untuk peran lain; seluruh anggota tetap tampil. Label peran 14 px, nama 16 px, periode dekat judul, dan heading arsip diperkecil. Kontak memakai email terbit atau Instagram dari pembaca identitas situs. Browser desktop 1440 px, mobile 380 px, serta pemeriksaan reflow 320 px tidak menemukan overflow. Lima misi, 16 pengurus, dan empat periode tetap tersedia. Tidak ada write CMS, upload, perubahan navbar/footer, atau deployment. Pemeriksaan compiler dan lint sedang berjalan.

Pada 2026-10-15, Galeri ditata sebagai dinding foto kontinu tanpa kartu album, judul foto, caption, atau deskripsi pembuka. Tiga kolom desktop bergerak perlahan berlawanan arah, foto memiliki reveal ringan dan hover zoom, serta viewer menampilkan foto utuh dengan tombol, panah keyboard, Escape, dan pengembalian fokus ke pemicu. Mobile memakai satu kolom tanpa parallax; reduced motion mematikan transform scroll dan zoom. Seluruh 60 foto dan 9 video CMS tetap tersedia, termasuk cover unik dan anchor album dari Tentang. QA browser lokal pada 380/1366/1440 px tidak menemukan overflow; navigasi, wraparound, penutupan, dan fokus viewer lulus. Tes preservasi media, typecheck, serta lint lulus dengan warning existing pada data-table. Shim npm global menunjuk binary yang hilang; pemeriksaan memakai binary package lokal. Tidak ada write CMS, upload, deployment, atau perubahan token global.

Koreksi kontras profil pada 2026-10-15: kaca putih 50% diganti tint 10% dan lapisan hijau gelap di belakang teks, dengan gradasi yang lebih transparan ke foto desktop. Teks navigasi kembali dan instruksi QR memakai putih 90%. Perubahan berada pada komponen bersama finalis dan semifinalis; posisi QR dan fade foto dipertahankan. Typecheck dan lint lulus dengan warning tabel existing.

Pada 2026-10-15, profil finalis dan semifinalis memakai komponen bersama dengan QR voting langsung setelah identitas, sebelum foto dan bio pada mobile. Panel kaca, blur 2 px, dan fade foto dipertahankan. Browser memverifikasi Vina Faulina dan Arella Kireida Andriani pada desktop serta 380 px; QR termuat dan terlihat pada layar awal, tanpa overflow horizontal. Tautan kembali semifinalis memakai kategori semifinalis. Typecheck dan lint lulus dengan satu warning existing pada data-table. Tidak ada perubahan data atau deployment.

Penyempurnaan berikutnya pada 2026-10-15 merapatkan ritme Tentang: foto kegiatan masuk ke komposisi hero, visi memakai tipografi lebih tegas dengan foto pendukung, misi memakai dua kolom desktop, pengurus memakai enam kolom pada layar lebar, dan riwayat menjadi timeline empat kolom tanpa wadah kartu. Padding bagian diperkecil tanpa mengubah isi CMS, PDF, atau tujuan tautan. Lint dan typecheck lulus dengan satu warning tabel existing. Pemeriksaan visual desktop dan 380 px tidak menemukan overflow; 5 misi, 16 pengurus, dan 4 periode tetap tampil.

Estetika profil finalis dipulihkan sesuai koreksi operator: panel kaca putih transparan dengan blur 2 px, overlay asli, serta foto dengan fade horizontal di desktop dan vertikal di mobile. Hierarki teks dan blok QR terpisah dipertahankan. Pemeriksaan browser desktop dan 380 px tidak menemukan overflow; lint dan typecheck lulus dengan satu warning existing.

Pada 2026-10-15, halaman Tentang ditata ulang sesuai permintaan operator: visi dengan foto berukuran terukur, misi berupa daftar bernomor, 16 potret pengurus berukuran konsisten, empat periode riwayat dalam baris terbuka, dan tiga preview galeri berbasis foto tanpa kartu. PDF legalitas yang sebelumnya hanya tersimpan pada metadata kini ditampilkan dari media ready; respons HTTP 200 bertipe PDF dan byte identik dengan `public/pdf/SK_MOKA.pdf`. Browser lokal memverifikasi 380 px, 768 px, 1366 px, dan 1440 px tanpa overflow; semua 26 gambar halaman berhasil dimuat. Tautan PDF membuka aset terkait dan tautan Audisi membuka album yang sesuai. Dua tes document metadata/URL, typecheck, lint tanpa error baru, dan build production lulus. `npm.cmd` masih merujuk instalasi Node yang tidak ada; binary lokal digunakan tanpa mengubah tooling global. Tidak ada perubahan data atau deployment.

Pada 2026-10-15, profil detail finalis ditata menjadi identitas, bio tanpa nested scroll, prestasi, dan blok QR terpisah dengan tautan gambar untuk ponsel. Foto tetap dominan di kolom desktop dan berada setelah nama pada mobile. Browser lokal memverifikasi 1440 px, 1366 px, dan 380 px tanpa overflow horizontal; foto dan QR termuat. Lint dan typecheck lulus, dengan satu warning existing pada data-table. Tidak ada perubahan data CMS atau deployment.

Pada 2026-10-15, label eyebrow dihapus dari seluruh route publik. Nilai field CMS tetap tersimpan dan UI admin tidak berubah. Next route type generation, typecheck, dan lint lulus; lint menampilkan satu warning existing pada `src/components/data-table.tsx`.

Pada 2026-10-15, berita beranda ditampilkan dalam grid responsif dengan empat kolom maksimum, cover 16:9, ringkasan, dan tautan baca. Tinggi section mengikuti konten. Next route type generation, typecheck, dan lint lulus; ESLint menampilkan satu warning existing pada `src/components/data-table.tsx`. Browser belum diperiksa.

Pada 2026-10-15, footer diringkas dengan identitas dan deskripsi dalam satu kolom serta tautan Jelajahi, Rangkaian kegiatan, dan Profil finalis dalam kelompok terpisah. Pemeriksaan browser lokal pada 1440 px, 1366 px, dan 380 px tidak menemukan overflow horizontal; seluruh 12 tujuan tautan footer tetap tersedia. Navbar tidak diubah. Drift terhadap baseline `3874ede` diperiksa sebelum perubahan.

Browser Use sebelumnya memeriksa 24 route pada 390 px, 1366 px, dan 1440 px; tidak ditemukan overflow horizontal. Pada 2026-10-03, Next route typegen berhasil dijalankan dengan akses workspace, `tsc --noEmit --incremental false` lulus, dan ESLint lulus tanpa error dengan satu warning existing pada `src/components/data-table.tsx`. Chrome memverifikasi `/`, `/tentang`, `/galeri`, detail Audisi, indeks/kategori voting, daftar semifinalis, daftar/profil finalis, serta CMS peserta. Judul hero finalis yang sebelumnya tak terlihat kini tampak sejak render awal; foto dan tombol preview galeri Tentang tampil. Request gambar UploadThing yang sebelumnya timeout di optimizer lokal sekarang dilewatkan langsung dalam mode development; produksi tetap memakai optimasi gambar Next. `npm.cmd` tidak dapat dipakai karena shim integrity check gagal, sehingga pemeriksaan dijalankan dengan binary package lokal; toolchain global tidak diubah.

Pada 2026-10-03, build production lokal dan smoke check 25 route publik serta kompatibilitas lulus tanpa error server atau shell error. Route `/monitor` mengarah ke `/admin/voting`; tanpa sesi, halaman voting admin mengarah ke login. Smoke check ini tidak menggantikan QA visual terautentikasi maupun pemeriksaan setiap route pada tiga viewport. Request optimasi gambar UploadThing mengalami timeout saat production-mode lokal mencoba mengambil media eksternal; browser menampilkan sebagian media, sehingga delivery gambar di deployment harus diperiksa saat cutover.

## Kriteria penerimaan

- Identitas visual tetap konsisten dengan situs publik saat ini.
- Semua route yang diuji berfungsi pada lebar 390 px, 1366 px, dan 1440 px tanpa overflow horizontal atau gambar rusak.
- Kontrol yang tampak interaktif dapat digunakan dengan mouse dan memiliki nama aksesibel.
- `/voting` memakai tombol kategori shadcn yang selalu terlihat, dengan konten kategori pertama sejak render awal.
- Konten halaman voting pada 390 px dimulai di bawah navbar seluler.
- Gambar di luar hero tidak diprioritaskan untuk pemuatan awal.
- Beranda menampilkan konten utama tanpa menunggu metadata dari situs berita eksternal.
- Lint dan typecheck lulus tanpa error baru.

Pada 2026-10-15, indeks voting diganti sesuai permintaan operator: header foto dari poster kategori CMS, tombol kategori shadcn yang selalu terlihat, konten kategori pertama sejak render awal, informasi kampanye, serta tautan finalis pada status tanpa kampanye. Lint lulus dengan warning data-table existing. Server existing memakai localhost:3000. QA visual desktop dan 380 px lulus tanpa overflow; pergantian kategori dan aktivasi keyboard lulus. Typecheck lulus. Cabang kampanye aktif belum diperiksa runtime karena CMS lokal tidak memiliki kampanye aktif. Tidak ada database write atau deployment.

Pemeriksaan akhir halaman sistem 2026-10-15: typecheck sempat lulus, tetapi pengulangan setelah penghapusan fixture terblokir error TypeScript pada src/server/media/static-svg.ts yang berubah di luar cakupan pekerjaan ini. Tidak ada error pada file halaman sistem. Lint lulus dengan warning data-table existing; build dan pemulihan root-layout nyata belum diuji.


Pergantian font 2026-10-15: DONE untuk cakupan font lokal. Permintaan operator mengizinkan perubahan token font global menjadi Manrope untuk judul dan Inter untuk body/UI. Cakupan: src/style/font.ts, root/global-error layout, globals.css, seluruh caller font-montserrat/font-mono, typography, navbar/footer, dan panduan desain terkait. Dependensi: aturan proyek dan panduan next/font terpasang; tidak ada dependensi rencana tambahan untuk perubahan tipografi ini. Drift terhadap 3874ede diperiksa sebelum edit; pekerjaan existing dipertahankan. Berhenti sebelum perubahan CMS, aset, permission, schema, upload atau deployment. Verifikasi: lint, typecheck, build dan browser desktop/380 px.

Hasil pergantian font: hanya Manrope dan Inter dimuat melalui next/font. Judul publik/admin dan global error memakai Manrope; typography.p, navigasi dan UI memakai Inter. Tes referensi font pada color-policy diperbarui; lima tes lulus. ESLint nol error dengan satu warning TanStack existing; TypeScript dan build produksi webpack lulus. QA browser pada Beranda, Tentang dan /admin/login di 380 px serta desktop 1280/1440 px tidak menemukan overflow; computed font judul Manrope dan body Inter terverifikasi. npm.cmd host rusak, jadi pemeriksaan memakai bundled Node dan binary lokal. Build awal sandbox gagal pada DNS/font dan izin .next; build host yang diizinkan berhasil. Tidak ada write CMS, upload, aktivasi atau deployment.


Audit tipografi lanjutan 2026-10-15: IN PROGRESS. Operator meminta audit route publik dan admin pada desktop/mobile. Cakupan: font dasar heading, typography, CardTitle, field admin, wrapper/body yang masih memakai font judul, ukuran hero kategori/acara, serta caller kontrol terkait. Plan 013 dan dependensi UI Plan 015 dibaca; drift 3874ede dan worktree existing ditinjau. Berhenti sebelum data CMS, permission, schema, environment, upload, aktivasi atau deployment. Uji rendering route tersimpan dan formulir tanpa simpan, lint/typecheck serta tes token.


Hasil audit tipografi lanjutan 2026-10-15: DONE untuk cakupan font dan keterbacaan lokal. Heading dasar h1-h6 dan CardTitle memakai Manrope; h1 masuk CSS base layer agar ukuran responsif caller bekerja. Body/keterangan, tab, input dan tombol memakai Inter; angka statistik dan judul accordion tetap Manrope. Typography.p memakai leading-relaxed. Label field 14 px, field bersama 16 px pada mobile/14 px desktop, dan label/keterangan admin yang sebelumnya 9-11 px menjadi 12 px. Hero kategori/acara memakai 30 px mobile, dengan jarak baris nama semifinalis lebih longgar. Pemeriksaan 31 route admin dan 19 route publik pada 380/1440 px, total 100 sampel, tidak menemukan font heading keliru, overflow dokumen, atau main paragraph/label/input/textarea di bawah 12 px. Dialog media memakai Manrope/Inter, lebar 896/364 px; pendaftaran 2026 diperiksa melalui preview berizin pada dua ukuran dan accordion terbuka. Preview ditutup, konteks kembali 2025. Build produksi webpack, TypeScript, lint dengan satu warning TanStack existing, dan lima tes token lulus. Detail cakupan dan pengecualian: .tmp/font-audit-report.json. Tidak menguji perangkat fisik, lifecycle permintaan akses atau write/publikasi; artikel internal terbit tidak tersedia pada edisi lokal, source dan preview editor diperiksa. Tidak ada write konten CMS, upload, aktivasi atau deployment.


## Draf tiga halaman, 2026-10-18

Status: IN PROGRESS. Permintaan operator menerapkan draf Beranda, Tentang dan Pendaftaran dengan gaya existing dan foto CMS reusable. Dependensi: Plan 004/007/014/017/018. Drift terhadap baseline `3874ede` ditinjau; working tree bersih sebelum pekerjaan. Cakupan: ketiga route, komponen pendaftaran, registry teks CMS, reader, preset draf editor, tes dan panduan admin. STOP: fakta/status/biaya/tautan yang belum dipastikan, target remote, migrasi, upload dan deployment. Tidak ada aset baru atau perubahan token global.


Hasil 2026-10-18: source revisi selesai, sebelas draf perubahan tersimpan melalui CMS lokal (enam Beranda, tiga Tentang, satu FAQ dan satu Instagram), tanpa penerbitan atau aktivasi. QA pratinjau desktop dan 380 px mencakup tiga halaman, FAQ, kontak dan roster lengkap; tidak ada overflow horizontal. Lima tes CMS pendaftaran/editorial lulus. Typegen, TypeScript dan lint lulus dengan warning TanStack existing. Bukti visual di `.tmp/content-draft-20261018/`. Data/aset lokal tidak sama dengan produksi; pratinjau memakai fallback foto existing dan tidak menjadi bukti roster produksi. Status/jalur/langkah, biaya dan ketentuan berkas yang belum pasti tetap menunggu panitia. Tidak ada build produksi, upload, migrasi, write remote atau deployment. Status plan induk tetap IN PROGRESS; Plan 018 revisi source diterima, publikasi baru terpisah.

## Penyeimbangan Beranda dan Tentang, 2026-10-18

Status: IN PROGRESS. Cakupan: `src/app/page.tsx`, `src/app/tentang/page.tsx`, label slot CMS program, panduan admin dan registry. Program serta preview kegiatan dipindah ke Beranda dengan aset CMS yang sama; pengurus Tentang selalu tampil. Dependensi Plan 004/007/014 dan token Plan 017 tetap dipakai. Drift baseline `3874ede` diperiksa; perubahan sesi sebelumnya dipertahankan. STOP pada kebutuhan fakta baru, aset baru, perubahan data, autentikasi, migrasi atau deployment.


Hasil penyeimbangan 2026-10-18: DONE untuk revisi source lokal. Program PAMOKA dipindah ke Beranda setelah tautan peserta, dengan tiga foto kolase CMS dan enam nama/deskripsi program yang dipisah saat label legacy mengandung titik dua. Preview tiga album Kegiatan kami juga dipindah ke Beranda. Tentang berfokus pada profil, peran, visi/misi, nilai, legalitas dan seluruh pengurus yang tampil langsung. Ringkasan nama berulang serta accordion dihapus. Pemeriksaan DOM dataset 2025 memverifikasi 16 pengurus tanpa elemen tersembunyi atau tombol pembuka, enam program dan tiga album. Beranda/Tentang pada desktop dan 380 px tidak overflow. Pratinjau 2026 lokal belum memiliki periode pengurus; tidak ada perubahan data untuk mengisi kekosongan itu. TypeScript, lint dan diff whitespace diperiksa; warning TanStack existing tetap ada. Tidak ada write CMS, upload, migrasi, build produksi atau deployment dari penyeimbangan ini.

## Push dan penerapan konten produksi, 2026-10-18

Status: IN PROGRESS. Operator meminta push ke origin dan entry CMS nyata edisi 2026 diterapkan ke database produksi. Cakupan: seluruh perubahan tiga halaman pada sesi ini dan 11 slot copy yang dibandingkan per record. Target origin `soezyxstt/moka`, branch `main`; database `pamoka-soezyxstt.aws-ap-south-1.turso.io`, edisi 2026 aktif. Backup terenkripsi `.tmp/content-release-20261018/production-before.aesgcm` dan key DPAPI lulus restore 49 tabel/6.903 baris. Rencana `.tmp/content-release-20261018/plan.json`: lima insert, lima update, satu preserve. Tidak mengubah schema, aset, periode, peserta, voting atau edisi aktif. STOP bila target/versi/draf produksi berubah, izin operator tidak cocok, backup gagal atau data di luar cakupan perlu diubah. Gunakan server action berizin, transaksi serta revisi/audit existing; uji simulasi dan baca ulang produksi.

Hasil rilis konten riil 2026-10-18: DONE untuk cakupan ini. Source didorong ke origin/main pada `603d359`; 109 tes, typegen, TypeScript, lint (warning TanStack existing) dan build produksi webpack lulus. Produksi edisi 2026 menerima lima entry baru dan lima pembaruan terbit melalui server action berizin dengan 20 audit dan 10 revisi; home/hero dipertahankan. Semua sebelas slot dibaca ulang, riwayat audit/revisi existing serta halaman/draf lain utuh. Sebanyak 45 tabel dilindungi dengan fingerprint dalam transaksi, integrity ok dan nol FK error. Backup 49 tabel/6.903 baris terenkripsi AES-256-GCM/DPAPI lulus pemulihan; simulasi menguji rollback stale plan dan idempotensi. Tidak ada migrasi atau upload; route operasi lokal dihapus. Bukti `.tmp/content-release-20261018/production-verification.json`. Beranda publik telah menampilkan program, agenda, kegiatan dan berita hasil revisi melalui pipeline Git existing.

Revisi lanjutan 2026-10-18: IN PROGRESS. Cakupan source Beranda/Tentang, preset agenda, label CMS dan dokumentasi. Agenda hanya tanggal/nama; filosofi tema digabung dengan Nu Nyunda Tur Nyakola di Tentang; foto peserta memakai home.cta.image existing. Drift 3874ede ditinjau. STOP sebelum schema, aset baru, upload atau write database; tidak diperlukan untuk perubahan presentasi ini.

Hasil revisi lanjutan 2026-10-18: DONE untuk source. Agenda hanya tanggal dan nama, filosofi dipindah ke satu section Nu Nyunda Tur Nyakola di Tentang, dan foto profil peserta memakai binding CMS home.cta.image. TypeScript, lint (warning TanStack existing), lima tes CMS, QA desktop dan 380 px lulus tanpa overflow. Pratinjau memakai dataset lokal dengan aset 2025, sehingga foto 2026 dikonfirmasi terpisah melalui read-only produksi (pinilih rumaja). Bukti `.tmp/presentation-followup-20261018/`. Tidak ada perubahan schema, upload atau write database.
