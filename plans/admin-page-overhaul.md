# Plan Admin CMS PAMOKA Berbasis Edisi

## Ringkasan dan batas pekerjaan

Tujuan plan ini adalah menjadikan admin sebagai ruang kerja CMS yang mudah dipakai admin nonteknis, berbasis edisi, memiliki akses langsung ke setiap modul, serta siap menjadi sumber data public site pada pekerjaan terpisah.

Kriteria keberhasilan utama:

- Sponsor, media, berita, galeri, peserta, acara, panitia, dan kepengurusan dapat dibuka langsung dari sidebar, maksimal 2 klik.
- Grup `Konten` pada sidebar dapat dibuka dan ditutup, dengan status tersimpan.
- Satu selector edisi di header mengatur Dashboard, identitas edisi, aset situs, berita, sponsor, peserta, acara, galeri, panitia, dan voting.
- Tidak ada lagi field `Edisi` pada form di modul tersebut.
- `Kepengurusan` tetap global dan tidak berubah ketika selector edisi diganti.
- Halaman, hero, dan section tidak dapat dibuat bebas. Admin hanya dapat mengisi teks atau media pada slot yang sudah didefinisikan aplikasi.
- Semua pemilihan gambar memakai reusable media picker yang dapat memilih aset lama atau mengunggah aset baru melalui UploadThing.
- Public routes, halaman `/galeri`, public reader, upload aset hardcoded, import data 2025, dan cutover public tidak termasuk plan ini. Bagian tersebut harus dikerjakan langsung oleh primary GPT dalam plan terpisah.

Audit menemukan `plans/README.md` dan dokumen Plan 007 sampai 011 tidak tersedia di worktree, walaupun `AGENTS.md` mewajibkannya. Implementasi tidak boleh dimulai sebelum sumber plan tersebut dipulihkan. AGY juga tidak dapat dijalankan karena pembatasan profil dan jaringan host; user telah memberi fallback eksplisit agar audit plan dilanjutkan oleh GPT.

## Protokol wajib untuk eksekutor

Setiap checkpoint dikerjakan satu per satu. Eksekutor dilarang mulai checkpoint berikutnya secara otomatis.

Setelah setiap checkpoint, eksekutor wajib:

1. Menyebutkan seluruh file yang berubah dan alasan perubahannya.
2. Menjelaskan perubahan skema, permission, route, dan perilaku UI.
3. Melaporkan hasil test, lint, typecheck, build, dan pemeriksaan migration yang dijalankan.
4. Menyertakan screenshot desktop dan 380 px jika checkpoint mengubah UI.
5. Menyebutkan pekerjaan yang belum diverifikasi, termasuk runtime UploadThing atau database remote.
6. Memastikan tidak ada upload, deploy, migration remote, atau public cutover.
7. Berhenti dan bertanya secara eksplisit apakah boleh lanjut ke checkpoint berikutnya.

Aturan teknis yang tidak dapat dinegosiasikan:

- Baca penuh `AGENTS.md`, plan aktif beserta dependensinya, `src/server/db/schema.ts`, `src/env.js`, dan dokumentasi Next.js 16.3 yang relevan sebelum mengedit.
- Pertahankan dirty worktree dan perubahan manual. Jangan melakukan reset, checkout, atau rewrite terhadap pekerjaan yang tidak termasuk checkpoint.
- Gunakan `AdminPage`, `AdminCard`, `AdminField`, `AdminButton`, `AdminBadge`, `AdminEmptyState`, dan primitive admin yang sudah ada.
- Komponen baru harus reusable. Jangan membuat media selector, filter, form shell, atau entity list khusus per halaman.
- Gunakan `Sheet`, `Dialog`, `AlertDialog`, `Select`, `Input`, `Textarea`, `ScrollArea`, `Table`, dan primitive yang sudah tersedia.
- Heading menggunakan Montserrat; body dan kontrol menggunakan Inter; gunakan `dgb`, `fb`, dan semantic tokens. Jangan meniru tampilan admin lama yang slate-heavy.
- UI Bahasa Indonesia, sentence case, tanpa tanda seru, tanpa em dash atau en dash.
- Semua gambar menggunakan `next/image`.
- Upload hanya melalui UploadThing. Tidak boleh ada R2, S3, local blob, atau endpoint upload tanpa autentikasi.
- Setiap write wajib memakai permission server, validasi server, transaksi Drizzle, `appendAuditLog`, optimistic version jika mengubah record, dan `revalidatePath`.
- Schema hanya diedit melalui `src/server/db/schema.ts`. Jalankan `npm.cmd run db:generate`, periksa SQL yang dihasilkan, lalu `npm.cmd run db:check`. Jangan mengedit SQL migration secara manual.
- Migration production, upload massal, perubahan Turso remote, deploy, dan cutover memerlukan izin terpisah yang menyebut hostname dan migration.
- Setelah setiap checkpoint minimal jalankan focused DB tests, `npm.cmd run lint`, dan `npm.cmd run typecheck`. Jalankan `npm.cmd run verify` pada checkpoint final.

## Arsitektur navigasi dan daftar halaman

Sidebar akhir:

| Grup | Item | Route |
|---|---|---|
| Ringkasan | Dashboard | `/admin` |
| Konteks | Kelola edisi | `/admin/content/editions` |
| Konten, collapsible | Identitas edisi | `/admin/content/edition-settings` |
| Konten, collapsible | Aset situs | `/admin/content/site-assets` |
| Konten, collapsible | Berita | `/admin/content/news` |
| Konten, collapsible | Sponsor | `/admin/content/sponsors` |
| Konten, collapsible | Mojang Jajaka | `/admin/content/participants` |
| Konten, collapsible | Acara | `/admin/content/events` |
| Konten, collapsible | Galeri | `/admin/content/galleries` |
| Konten, collapsible | Panitia | `/admin/content/committee` |
| Umum | Kepengurusan | `/admin/organization` |
| Studio | Pustaka media | `/admin/media` |
| Operasional | Voting | `/admin/voting` |
| Operasional | Pengguna | `/admin/users` |
| Operasional | Audit log | `/admin/audit` |
| Akun | Profil | `/admin/profile` |

Ketentuan route:

- `/admin/content` tetap ada sebagai overview ringkas, tetapi bukan satu-satunya akses ke modul.
- `/admin/content/pages` dihentikan sebagai editor bebas dan diarahkan ke `/admin/content/site-assets`.
- `/admin/content/people` diarahkan ke `/admin/organization`.
- Route list memakai filter, pencarian, status, tombol tambah pada header, dan pagination jika data melebihi 50 record.
- Form kompleks menggunakan halaman detail atau `Sheet`, bukan kolom form permanen yang menyisakan ruang kosong.

## Interface dan model data utama

### Konteks edisi

Tambahkan kontrak `AdminEditionContext` berisi `id`, `year`, `slug`, `name`, dan `lifecycle`.

- Selector header menyimpan `pamoka_admin_edition_id` melalui server action dalam cookie `httpOnly`, `sameSite=lax`, `path=/admin`, masa berlaku 30 hari.
- Fallback adalah edisi aktif, kemudian edisi terbaru jika belum ada yang aktif.
- Semua loader dan action edition-scoped memanggil `getAdminEditionContext()`.
- Action tidak menerima `editionId` dari form.
- ID kategori, peserta, acara, galeri, sponsor, dan kampanye selalu diverifikasi milik edisi context sebelum write.
- Dashboard menghitung berita, sponsor, peserta, acara, galeri, panitia, dan voting hanya untuk edisi terpilih.

### Media picker bersama

Tambahkan reusable:

- `AdminMediaPicker`
- `AdminMediaField`
- `AdminMediaPreview`
- `AdminEntityList`
- `AdminFilterBar`
- `AdminFormSheet`
- `AdminEditionSelector`
- `AdminNavGroup`

`AdminMediaPicker` wajib mendukung:

- Mode single dan multiple.
- Filter gambar, video, atau PDF berdasarkan kebutuhan field.
- Pencarian filename dan alt.
- Folder browser yang memakai struktur `MediaExplorer`.
- Preview thumbnail, filename, MIME, ukuran, alt, dan status.
- Pilih aset lama tanpa membutuhkan `media.manage`.
- Upload inline hanya jika user memiliki `media.manage`.
- Setelah upload selesai, aset langsung terpilih.
- Validasi server bahwa aset ada, `lifecycle=ready`, dan MIME sesuai.
- Tombol lepas media dengan konfirmasi jika field sebelumnya terisi.

Media tetap global dan reusable. Tambahkan `mediaFolder.editionId` nullable agar folder dapat diberi konteks edisi. Picker menampilkan folder edisi aktif dan folder global secara default, dengan opsi `Semua media`.

### Skema baru dan perubahan

- `editions`: tambah `organizationPeriodId`, `logoMediaId`, `slogan`, dan `version`.
- `editionPrograms`: `editionId`, `title`, `description`, `displayOrder`, `active`.
- `siteAssetBindings`: `editionId`, `slotKey`, `mediaId`, `altOverride`, `focalX`, `focalY`, `version`; unique pada `(editionId, slotKey)`.
- `organizationPeriods`: label, startYear, endYear, vision, missionJson, lifecycle, version.
- `organizationUnits`: periodId, parentId, name, displayOrder, active.
- `organizationMemberships`: periodId, unitId, personId, title, displayOrder, active, version.
- `personSocialLinks`: personId, platform, label nullable, url, displayOrder.
- `committeeUnits`: editionId, parentId, name, displayOrder, active.
- `committeeAssignments`: editionId, unitId, personId, title, displayOrder, active, version.
- `participantSocialLinks`: participantId, platform, label nullable, url, displayOrder.
- `participantMedia`: participantId, role, mediaId, caption, displayOrder, active.
- `selectionStages`: editionId, name, slug, displayOrder, targetParticipantCount, lifecycle, finalStage, version. Urutan stage membentuk satu alur linear per edisi.
- `participantStageEntries`: participantId, stageId, decision, decidedAt, decidedByUserId, reason nullable, version. Decision hanya `pending`, `advanced`, atau `eliminated`.
- `editionTitles`: editionId, name, description nullable, capacity, displayOrder, active, version.
- `participantTitleAssignments`: editionTitleId, participantId, assignedAt, assignedByUserId. Satu peserta dapat memiliki beberapa gelar, tetapi satu gelar yang sama tidak boleh diberikan dua kali kepada peserta yang sama.
- `votingCampaignParticipants`: campaignId, participantId, sourceStageId, addedAt. Tabel ini adalah snapshot daftar peserta saat kampanye dimulai; kesiapan QRIS tetap membaca binding QRIS peserta terbaru.
- `participants`: tambah `currentStageId`, `selectionStatus`, dan pertahankan `stage` lama sebagai compatibility field read-only sampai public cutover.
- `votingCampaigns`: tambah `eligibilityStageId`, `startedAt`, `closedAt`, dan versioned lifecycle manual. Tanggal rencana tetap boleh disimpan sebagai informasi, tetapi tidak memulai atau menutup kampanye otomatis.
- `newsArticles`: tambah `bodyJson`; pertahankan `body` lama sebagai compatibility field sampai public cutover.
- `galleries`: tambah slug, description, coverMediaId, displayOrder, status, active; owner dapat berupa `standalone` atau `event`.
- `galleryItems`: pertahankan gambar atau YouTube, caption, displayOrder, active, serta validasi tepat satu sumber.
- `mediaFolders`: tambah `editionId` nullable.

Platform sosial yang didukung: Instagram, LinkedIn, TikTok, YouTube, Facebook, X, website, dan lainnya. Platform `lainnya` wajib memiliki label. Semua URL harus valid dan menggunakan `https`.

Role media peserta:

- `closeup`
- `full_body`
- `detail`
- `karantina`
- `other`

Record `portraitMediaId` lama tidak langsung dihapus. Data tersebut dibackfill menjadi `participantMedia.role=closeup`, lalu kolom lama tetap dipertahankan read-only sampai public plan selesai.

Kolom `participants.stage` lama dipetakan ke stage buatan per edisi saat migration lokal. Nilai unik yang ada menjadi stage berurutan untuk ditinjau admin. Kolom `paymentUrl` tidak digunakan pada alur baru dan dipertahankan read-only sampai public cutover agar data lama tidak hilang.

### Model alur Pasanggiri

- Pendaftaran dilakukan di Google Form di luar sistem. Admin memasukkan pendaftar secara manual; import spreadsheet dan public registration form tidak termasuk plan ini.
- Satu peserta tetap memakai record yang sama sejak pendaftaran sampai penyematan gelar.
- Admin membuat stage sebanyak kebutuhan edisi. Stage selalu linear dan urutannya eksplisit.
- Stage pertama menerima seluruh pendaftar baru. Stage berikutnya hanya menerima peserta yang diputuskan `advanced` dari stage sebelumnya.
- Satu peserta hanya memiliki satu entry pada satu stage. Entry, stage, peserta, gelar, dan kampanye yang dihubungkan wajib berasal dari edisi yang sama.
- `targetParticipantCount` berlaku sebagai satu batas total stage, tidak dibagi per kategori `JD`, `MD`, `JR`, atau `MR`.
- Sistem tidak menyimpan nilai tes, kriteria, ranking, atau lembar penilaian. Sistem hanya menyimpan keputusan lolos atau tidak lolos.
- Stage tidak dapat dihapus atau dipindah setelah memiliki entry peserta. Koreksi dilakukan melalui rollback yang diaudit.
- Rollback keputusan hanya diizinkan jika peserta belum memiliki keputusan pada stage berikutnya, belum masuk snapshot voting aktif, dan belum menerima gelar.
- Tepat satu stage per edisi dapat ditandai sebagai tahap final. Penandaan ini dapat diubah selama belum dipakai oleh gelar atau kampanye voting.
- Setiap peserta pada tahap final harus menerima minimal satu gelar sebelum kesiapan penyematan dinyatakan lengkap. Peserta dapat menerima beberapa gelar.
- Gelar tidak dibatasi kategori. Capacity adalah jumlah maksimum penerima gelar tersebut untuk seluruh kategori.
- QRIS dibuat di luar website. Admin hanya mengunggah atau memilih gambar ready dari UploadThing melalui media picker. Website tidak menyediakan generator QRIS atau field tautan pembayaran baru.
- Kampanye voting dibuat per edisi, memilih satu stage sebagai sumber eligibility, lalu dimulai dan ditutup manual.
- Saat kampanye dimulai, sistem membuat snapshot peserta aktif dari stage sumber. Perubahan stage setelah itu tidak mengubah daftar peserta voting kampanye tersebut.
- Kampanye tidak dapat dimulai tanpa peserta. Peserta tanpa QRIS tetap masuk snapshot, tetapi ditandai belum siap dan tidak dapat menerima tally sampai gambar QRIS dipasang.

Skema legacy `pageSections` dan `organizationAssignments` juga tidak dihapus pada plan admin. Data lama harus muncul sebagai `Perlu dipetakan` sampai admin memilih period, unit, atau slot yang sesuai.

## Checkpoint implementasi

### Checkpoint 0: Pulihkan baseline plan dan kunci ruang lingkup

- Pulihkan `plans/README.md` serta Plan 007 sampai 011 dari sumber authoritative. Jangan merekonstruksi isinya dari tebakan.
- Buat plan admin ini memakai nomor berikutnya yang tersedia setelah plan lama dipulihkan.
- Catat `git status`, diff terhadap baseline `3874ede`, file yang sudah dirty, dan overlap dengan plan aktif.
- Restate bahwa public routes, import aset, upload massal, dan cutover tidak termasuk.
- STOP jika plan lama tidak dapat dipulihkan atau perubahan aktif menyentuh file yang sama tanpa ownership jelas.

Acceptance:

- Semua dependensi plan terbaca.
- Tidak ada file produk yang berubah.
- Laporan overlap dan STOP conditions disetujui user.

### Checkpoint 1: Selector edisi dan sidebar collapsible

- Implementasikan `getAdminEditionContext`, action pemilih edisi, cookie, selector header, dan fallback.
- Ubah sidebar agar `Konten` dapat dibuka dan ditutup pada desktop dan mobile.
- Simpan status collapsible di local storage, tetapi active child selalu membuat grup terbuka.
- Tampilkan anak menu hanya jika permission modul tersedia.
- Ubah dashboard agar statistik dan quick action mengikuti edisi terpilih.
- Hilangkan pemilihan edisi dari voting dan seluruh form edition-scoped, tetapi pertahankan pemeriksaan server.

Acceptance:

- Mengganti edisi memperbarui seluruh route admin edition-scoped.
- Refresh mempertahankan pilihan.
- Cookie dengan ID edisi tidak valid kembali ke fallback.
- Request yang mencoba memakai entity dari edisi lain ditolak.
- Kepengurusan dan media global tidak berubah saat edisi diganti.

### Checkpoint 2: Media picker dan folder edisi

- Ekstrak browser dan uploader dari `MediaExplorer` agar dapat dipakai dalam dialog.
- Tambahkan metadata edisi pada folder, bukan pada aset.
- Tambahkan edit alt dan decorative pada detail aset, dengan permission dan audit.
- Ganti select filename mentah pada QRIS dengan media picker.
- Sediakan aspect-ratio hint dan validasi MIME per field.
- Jangan memberi `media.manage` otomatis kepada role yang sebelumnya tidak memilikinya.

Acceptance:

- User dengan `media.view` dapat bind aset lama tetapi tidak melihat upload.
- User dengan `media.manage` dapat upload dan bind tanpa meninggalkan form.
- Aset dapat dipakai ulang oleh beberapa edisi.
- Semua upload tetap menghasilkan `mediaAsset` dan audit log.

### Checkpoint 3: Identitas edisi dan aset situs tetap

Halaman `/admin/content/edition-settings` berisi:

- Logo edisi.
- Slogan.
- Daftar program unggulan dengan judul, deskripsi, status, dan urutan.
- Ringkasan kelengkapan identitas.

Halaman `/admin/content/site-assets` tidak memiliki tombol `Tambah halaman`, `Tambah hero`, atau `Tambah section`. Slot ditentukan melalui manifest kode dengan label, route, jenis media, rasio, dan required state.

Slot awal yang wajib disediakan:

- Beranda: hero background, hero foreground, hero placeholder, background program, 4 gambar kolase program, background berita, background ajakan bergabung, gambar ajakan bergabung.
- Tentang: hero, background visi misi, gambar pengantar, gambar visi, background galeri.
- Halaman kategori: poster hero dan video hero per kategori.
- Aset entity seperti event hero, participant, berita, sponsor, dan galeri tetap dikelola di entity masing-masing.
- Logo navbar, footer, logogram, texture, dan elemen brand global tidak menjadi slot editable.

Setiap slot menampilkan thumbnail, status kosong/siap, kebutuhan rasio, alt, focal point, tombol pilih/ganti, dan preview.

Acceptance:

- Admin tidak dapat membuat pageKey atau sectionKey baru.
- Semua foto konten publik yang terkonfirmasi saat ini memiliki slot atau entity media.
- Penyimpanan aset situs belum mengubah public route mana pun.

### Checkpoint 4: Sponsor

Halaman list `/admin/content/sponsors`:

- Header dengan tombol `Tambah sponsor`.
- Search nama.
- Filter tier dan status.
- Daftar full-width berisi thumbnail logo, nama, tier, website, urutan, status, dan action.
- Tidak ada kolom form permanen yang membuat ruang kosong.

Form tambah dan edit menggunakan `Sheet`:

- Nama.
- Tier: utama, pendukung, pendamping, pelengkap.
- Logo melalui media picker.
- Website opsional.
- Urutan.
- Aktif/nonaktif.
- Preview kartu sponsor.

Record baru disimpan nonaktif sampai user dengan `content.publish` mengaktifkannya.

Acceptance:

- Logo dapat dipilih atau diunggah.
- Logo harus berupa gambar ready.
- List langsung memperlihatkan hasil binding.
- Create, update, reorder, activate, dan deactivate tercatat di audit.
- Tidak ada field edisi dalam form.

### Checkpoint 5: Berita WYSIWYG dan live preview

Tambahkan TipTap sebagai editor, dengan penyimpanan JSON terstruktur. Toolbar hanya berisi:

- Paragraf.
- Heading 2 dan Heading 3; Heading 1 tetap milik judul artikel.
- Bold dan italic.
- Link.
- Bullet list dan numbered list.
- Quote.
- Gambar dari media picker.
- Undo dan redo.

Halaman:

- `/admin/content/news`: search, filter status, tanggal, cover, judul, excerpt, action.
- `/admin/content/news/new`: editor artikel baru.
- `/admin/content/news/[id]`: edit, preview, revision, publish.

Workspace editor:

- Metadata dan cover di panel atas.
- Editor dan preview berdampingan pada desktop.
- Toggle `Editor`, `Preview`, dan `Keduanya`.
- Preview mobile dan desktop.
- Autosave draft dengan debounce 1,5 detik.
- Indikator `Belum disimpan`, `Menyimpan`, `Tersimpan`, dan error.
- Slug dibuat dari judul tetapi masih dapat diedit.
- Navigasi keluar saat ada perubahan gagal tersimpan memunculkan konfirmasi.
- Publish membutuhkan `content.publish`, versi terbaru, cover, judul, excerpt, dan body valid.

Acceptance:

- Admin dapat membuat heading tanpa menulis HTML atau Markdown.
- JSON yang tidak sesuai schema ditolak.
- Node gambar menyimpan `mediaAssetId`, bukan raw URL.
- Preview memakai renderer yang sama dengan renderer public yang akan digunakan nanti.
- Draft, publish, unpublish, dan conflict menghasilkan revision dan audit.

### Checkpoint 6: Kepengurusan global dan direktori profil

Halaman `/admin/organization` memiliki tab:

- `Periode kepengurusan`
- `Direktori profil`
- `Perlu dipetakan`

Halaman detail periode `/admin/organization/periods/[id]` berisi:

- Label dan rentang tahun.
- Visi.
- Daftar misi yang dapat diurutkan.
- Daftar edisi Pasanggiri yang terhubung.
- Tree unit kepengurusan maksimal 4 level.
- Penugasan profil ke unit, jabatan, dan urutan.
- Preview struktur.

Profil orang disimpan sekali dan dapat dipakai ulang untuk kepengurusan serta panitia. Detail profil berisi nama, slug, bio, portrait melalui media picker, dan sosial media opsional.

Aturan:

- Unit memakai `parentId`; level diturunkan dari posisi pada tree.
- Cycle dan parent lintas periode ditolak.
- Satu edisi hanya terhubung ke satu periode kepengurusan.
- Legacy assignment tidak dipindahkan otomatis jika period atau unit tidak dapat ditentukan.

Acceptance:

- Periode dapat memiliki beberapa edisi.
- Profil yang sama dapat memiliki jabatan berbeda pada periode berbeda.
- Mengganti portrait memperbarui profil tanpa menduplikasi orang.
- Visi dan misi dapat diperbarui per periode.
- Tree tetap dapat dioperasikan dengan keyboard.

### Checkpoint 7: Panitia per edisi

Halaman `/admin/content/committee` mengikuti selector edisi dan berisi:

- Ringkasan edisi terpilih.
- Tree unit panitia maksimal 4 level.
- Pilih orang dari direktori profil.
- Buat profil baru melalui dialog tanpa keluar dari halaman.
- Jabatan, unit, urutan, aktif/nonaktif.
- Search nama dan filter unit.
- Preview struktur panitia.

Panitia tidak memakai assignment kepengurusan. Keduanya hanya berbagi `person`.

Acceptance:

- Panitia edisi A tidak muncul pada edisi B.
- Satu orang dapat menjadi pengurus umum dan panitia beberapa edisi.
- Cross-edition unit atau assignment ditolak server.
- Semua perubahan diaudit.

### Checkpoint 8A: Fondasi alur seleksi dinamis

- Tambahkan tabel stage, entry stage, gelar, assignment gelar, dan snapshot peserta voting.
- Tambahkan current stage dan selection status pada peserta tanpa menghapus compatibility field lama.
- Backfill nilai `participants.stage` menjadi stage per edisi dan tandai hasilnya `Perlu ditinjau`.
- Pertahankan `qrisMediaId` sebagai binding gambar. Hentikan penggunaan `paymentUrl` pada UI baru tanpa menghapus kolom lama.
- Semua foreign key harus memverifikasi satu edisi yang sama pada service/action layer.
- Tahap tidak dapat dihapus selama masih menjadi current stage peserta atau eligibility stage kampanye. Admin harus melepas keterkaitan tersebut terlebih dahulu.
- Backfill bersifat idempotent, mempertahankan `participants.stage` dan `paymentUrl`, serta menandai entry hasil migrasi sebagai `pending` dengan catatan `Perlu ditinjau`.

Acceptance:

- Jumlah dan nama stage tidak hardcoded.
- Stage tersusun linear dan tidak dapat memiliki cabang.
- Migration lokal dapat dijalankan ulang pada database uji tanpa menggandakan stage atau entry.
- Data stage, QRIS, dan payment URL lama tidak hilang.
- Tidak ada perubahan public reader atau public route.

### Checkpoint 8B: Pendaftar dan pengaturan tahap

Status: **SOURCE ACCEPTED, RUNTIME VISUAL 380px OPEN**.

Status: **SOURCE ACCEPTED, RUNTIME VISUAL 380px OPEN**.

Halaman dan route:

- `/admin/content/participants`: daftar seluruh pendaftar dan peserta edisi aktif.
- `/admin/content/participants/new`: input pendaftar manual dari hasil Google Form.
- `/admin/content/participants/stages`: daftar stage linear, target peserta, status, dan urutan.
- `/admin/content/participants/stages/[id]`: workspace keputusan satu stage.

Form pendaftar manual minimal berisi nama, nomor pendaftaran, kategori, slug, dan bio opsional. Pendaftar baru otomatis masuk stage pertama sebagai `pending`; tidak ada field stage bebas. Pembuatan peserta diblokir bila stage pertama belum tersedia.

Pengaturan stage mendukung tambah, ubah nama, target jumlah peserta, urutkan, tandai tahap final, buka, dan tutup. Stage yang sudah dipakai tidak dapat dihapus atau dipindahkan.

Workspace seleksi menampilkan pencarian, filter kategori, jumlah pending, jumlah dipilih, target total, dan daftar peserta. Admin dapat memilih peserta satu per satu atau banyak sekaligus, kemudian menetapkan `Lolos` atau `Tidak lolos` dengan konfirmasi. Menutup stage membuat entry `pending` pada stage berikutnya untuk seluruh peserta yang lolos.

Acceptance:

- Input peserta hanya manual dan selalu masuk stage pertama.
- Keputusan massal tidak dapat melampaui target peserta stage berikutnya.
- Admin boleh menutup dengan jumlah lebih sedikit setelah konfirmasi dan alasan.
- Peserta yang tidak lolos tidak muncul pada stage berikutnya.
- Semua keputusan, rollback, buka, tutup, dan perubahan target memakai permission, optimistic version, transaksi, serta audit.
- Tidak ada perhitungan nilai atau ranking.

Verifikasi source: typecheck, lint delapan file route, scan aturan desain, dan 11 focused tests peserta serta seleksi lulus. Migrasi dan backfill CP8A diterapkan ke database prod operator pada 2026-09-14 dengan hasil 1 edisi, 2 stage, 104 peserta, dan 104 entry pending. Runtime visual belum diverifikasi dengan sesi admin terautentikasi.

### Checkpoint 8C: Profil peserta, media, QRIS, dan gelar

Status: **SOURCE ACCEPTED, RUNTIME VISUAL 380px OPEN**.

Halaman list `/admin/content/participants`:

- Search nama atau nomor.
- Filter kategori, stage dinamis, keputusan, kelengkapan foto, gelar, dan QRIS.
- Thumbnail closeup.
- Badge kelengkapan profil.
- Tombol tambah pada header.

Halaman `/admin/content/participants/[id]` memiliki bagian:

- Identitas: nama, slug, nomor, kategori, current stage read-only, dan bio.
- Prestasi: tambah, edit, hapus, urutkan.
- Sosial media opsional.
- Media: closeup, full body, detail, karantina, lainnya.
- QRIS berupa gambar upload atau binding dari pustaka media.
- Preview profil.
- Status aktif/nonaktif.

Media karantina dan lainnya dapat berisi beberapa aset. Closeup hanya satu primary item.

Halaman `/admin/content/participants/titles` berisi daftar gelar edisi, capacity, jumlah terisi, status, dan urutan. Form gelar memakai Sheet. Workspace penyematan menampilkan peserta tahap final dan mendukung beberapa gelar per peserta dengan indikator capacity real time.

Acceptance:

- Kategori yang dapat dipilih hanya kategori edisi aktif.
- Setiap media divalidasi sebagai gambar ready.
- Existing `portraitMediaId` tampil sebagai closeup setelah backfill.
- Binding atau penggantian QRIS memakai gambar ready dan tidak membuat QRIS di website.
- Satu peserta tahap final dapat menerima beberapa gelar.
- Gelar tidak memiliki pembatas kategori dan jumlah assignment tidak dapat melampaui capacity.
- Gelar hanya dapat diberikan kepada peserta yang berada pada stage yang ditandai final.
- Kesiapan penyematan belum lengkap selama ada peserta tahap final tanpa gelar.
- Semua mutation memakai optimistic version dan audit.

Verifikasi source: typecheck, lint file perubahan, scan aturan desain, dan 14 focused tests peserta, seleksi, serta gelar lulus. Migrasi dan backfill CP8A diterapkan ke database prod operator pada 2026-09-14. Runtime visual belum diverifikasi dengan sesi admin terautentikasi.

### Checkpoint 9: Acara dan dedicated gallery workspace

Status: SOURCE ACCEPTED, RUNTIME VISUAL 380px OPEN.

Halaman acara:

- `/admin/content/events`: list event edisi aktif.
- `/admin/content/events/new`: event baru.
- `/admin/content/events/[id]`: nama, slug, deskripsi, hero media, urutan, status, dan daftar galeri terkait.

Editor galeri tidak lagi ditanam sebagai form kecil pada setiap row acara.

Halaman galeri:

- `/admin/content/galleries`: album standalone dan album milik event, search, filter owner/status, cover, jumlah item, urutan.
- `/admin/content/galleries/new`: buat album.
- `/admin/content/galleries/[id]`: metadata, cover, item, urutan, preview, publish.

Konsep screenshot diterjemahkan ke kebutuhan authoring:

- Satu edisi memiliki beberapa album.
- Album memiliki nomor urut, judul, deskripsi, cover, dan daftar media.
- Preview menampilkan indeks album di kiri dan section album terurut di kanan.
- Indeks dan nomor diturunkan otomatis dari `displayOrder`.
- Admin dapat memilih banyak gambar sekaligus melalui media picker.
- Reorder wajib memiliki tombol naik dan turun yang keyboard-accessible.
- Gambar dan YouTube tetap didukung, tetapi satu item hanya boleh memiliki satu sumber.

Perbaiki perilaku saat ini yang membuat gallery baru setiap kali item ditambahkan. Item baru harus masuk ke gallery yang sedang diedit.

Acceptance:

- Dedicated gallery page dapat membuat, mengedit, mengurutkan, dan menonaktifkan album.
- Album standalone tidak membutuhkan event.
- Album event hanya dapat terhubung ke event pada edisi yang sama.
- Tidak ada gallery duplikat akibat menambah item.
- Preview desktop dan 380 px dapat digunakan tanpa overflow.

Implementasi source menyediakan direktori acara per edisi, halaman buat dan detail acara, relasi album tanpa editor tertanam, direktori album, form album yang dapat dipraisi dari acara, serta workspace item foto dan YouTube. Semua mutation memakai permission server, transaksi dan audit, isolasi edisi aktif, serta optimistic version. Perubahan item diserialisasi per album agar caption, urutan, dan hapus tidak saling menimpa. Constraint `gallery_item_exactly_one_source` memastikan setiap item memiliki tepat satu sumber.

Verifikasi source: `db:check`, typecheck, lint file CP9 tanpa error, dan 6 focused tests acara, galeri, sumber item, YouTube, serta reorder lulus. Review kritis ditindaklanjuti untuk duplicate reorder, state lintas edisi, mode hanya-baca, konflik mutation, kelengkapan audit, dan race relasi acara-album. Migrasi `0014_burly_sprite.sql` diterapkan ke database prod operator pada 2026-09-14. Runtime visual desktop dan 380 px belum diverifikasi dengan sesi admin terautentikasi.

### Checkpoint 10: Voting dan dashboard edition-scoped

Status: SOURCE ACCEPTED, RUNTIME VISUAL 380px OPEN.

- Hapus selector edisi dari form pembuatan kampanye.
- Kampanye memilih satu stage edisi aktif sebagai sumber peserta. Default UI adalah stage yang ditandai final, tetapi server tidak bergantung pada nama stage.
- Tambahkan action `Mulai voting` dan `Tutup voting` yang eksplisit, memakai konfirmasi, reason, version, transaksi, dan audit.
- Saat mulai, buat snapshot `votingCampaignParticipants`. Snapshot tidak berubah karena promosi, eliminasi, atau rename stage setelah kampanye berjalan.
- Filter campaign, peserta snapshot, QRIS readiness, ranking, dan tally berdasarkan context.
- Pertahankan validasi WIB, harga per vote, kategori, optimistic tally version, dan reason.
- Tally hanya menerima participant yang ada pada snapshot kampanye dan sudah memiliki gambar QRIS.
- Hapus asumsi eligibility `participant.stage === "finalis"` dari helper dan action voting.
- Dashboard menampilkan readiness per modul untuk edisi aktif: identitas, program, aset wajib, berita, sponsor, peserta, acara, galeri, panitia, dan voting.
- Tambahkan tautan langsung dari setiap readiness item ke editor terkait.
- Kepengurusan ditampilkan sebagai informasi periode terkait, bukan statistik edition-scoped yang dapat diedit dari dashboard.

Acceptance:

- Tidak ada data voting silang edisi di response server maupun UI.
- Kampanye baru otomatis memakai edisi context.
- Kampanye draft dapat memilih stage, kampanye aktif tidak dapat mengganti stage atau peserta snapshot.
- Kampanye hanya berubah ke aktif atau ditutup melalui action manual, bukan otomatis karena jam server.
- QRIS hanya diunggah atau dibind sebagai gambar; website tidak menghasilkan QRIS.
- Dashboard tidak menghitung record edisi lain.
- Perubahan selector memperbarui dashboard dan voting secara konsisten.

Implementasi sumber memakai kampanye per edisi dengan tahap sumber dinamis, lifecycle manual, snapshot peserta saat mulai, validasi gambar QRIS siap pakai, tally berbasis snapshot, serta visibilitas hasil yang diaudit. Dashboard memakai 10 indikator kesiapan edisi dan menampilkan periode kepengurusan sebagai informasi global.

Verifikasi sumber: 5 focused tests voting lulus, termasuk snapshot immutable, stale version, QRIS kosong atau PDF, tanggal lokal tidak sah, tally setelah tutup, dan isolasi edisi. Typecheck serta lint file CP10 lulus. Runtime visual desktop, true FormData, dataset browser nonempty, dan viewport 380 px belum diverifikasi dengan sesi admin terautentikasi.

### Checkpoint 11: Cleanup, dokumentasi, dan final verification

Status: SOURCE ACCEPTED, RUNTIME QA OPEN.

- Jadikan `/admin/content/pages` redirect ke asset editor.
- Jadikan `/admin/content/people` redirect ke kepengurusan.
- Hapus cards lama sebagai jalur navigasi utama, tetapi pertahankan overview konten yang ringkas.
- Jangan drop `pageSections`, `organizationAssignments`, `body`, atau `portraitMediaId`.
- Update `docs/admin-guide-id.md` dengan langkah operasional field per field.
- Tambahkan runbook pemilihan edisi, pemetaan data legacy, dan persiapan cutover public.
- Update plan status dan `AGENTS.md` hanya sesuai hasil yang benar-benar terverifikasi.
- Scan seluruh `docs/` dan plan untuk instruksi yang sudah tidak akurat.

Final verification:

- `npm.cmd run db:check`
- Focused database and authorization tests.
- `npm.cmd run verify`
- `git diff --check`
- Browser QA desktop dan viewport 380 px.
- Keyboard QA sidebar, selector edisi, Sheet, media picker, WYSIWYG, tree unit, dan reorder gallery.
- Permission matrix untuk viewer, content editor, publisher, media manager, voting operator, dan super admin.
- Konfirmasi public site masih memakai sumber lama dan tidak berubah.

Implementasi sumber mempertahankan redirect kompatibilitas untuk Pages dan People, mengganti kartu overview Konten dengan daftar ringkas, serta menghapus lima komponen atau action legacy tanpa caller. Runbook cutover kini mencakup pemilihan edisi dan pemetaan data lama tanpa menghapus field kompatibilitas.

Verifikasi akhir sumber: `db:check`, 72 tests, typecheck, lint tanpa error baru, production build 36 halaman, scan aturan copy admin dan file perubahan, serta `git diff --check` lulus. Public route tidak diubah. Browser QA terautentikasi, viewport 380 px, keyboard QA lengkap, true FormData, upload nyata, dan permission matrix runtime masih terbuka.

## Acceptance lintas sistem

Plan admin dinyatakan selesai hanya jika:

- Semua route edition-scoped memakai satu context server yang sama.
- Tidak ada form edition-scoped yang menerima `editionId` bebas dari browser.
- Semua gambar konten dapat dibind ke `mediaAsset`.
- Tidak ada upload di luar UploadThing.
- Tidak ada entity mutation tanpa permission, transaksi, dan audit.
- Semua UI dapat dipakai pada 380 px dan desktop.
- Berita dapat ditulis lengkap tanpa HTML atau Markdown.
- Kepengurusan memiliki periode dan unit bertingkat.
- Panitia terpisah per edisi tetapi memakai direktori profil yang sama.
- Peserta memiliki sosial media dan beberapa peran foto.
- Tahap seleksi dibuat admin, linear, dan keputusan lolos tercatat per peserta.
- Gelar dibuat per edisi dengan capacity dan mendukung beberapa gelar untuk satu peserta.
- Voting memakai snapshot stage dan lifecycle mulai atau tutup manual.
- Sponsor memiliki logo, tier, website, urutan, dan status.
- Galeri memiliki dedicated authoring workspace.
- Public route CMS-only dan import aset 2025 berada di luar Plan 012 dan ditangani oleh Plan 014 serta Plan 010. Import lokal sudah diotorisasi dan sedang berlangsung; production cutover tetap menunggu otorisasi target.

## Asumsi yang dikunci

- Media global dengan folder yang dapat diberi konteks edisi.
- Satu profil orang dipakai ulang untuk kepengurusan dan panitia.
- Struktur organisasi dan panitia memakai unit induk-anak, maksimal 4 level.
- Sponsor hanya membutuhkan satu logo, bukan cover atau galeri sponsor.
- Editor berita menggunakan WYSIWYG TipTap dengan JSON terstruktur dan live preview.
- Brand chrome seperti logo navbar, footer, dan texture tidak editable; seluruh foto, video, cover, hero, event, peserta, berita, sponsor, dan galeri editable melalui slot atau entity media.
- Tidak ada migration remote, upload massal, deployment, atau public cutover dalam plan ini.
- Pendaftaran tetap dilakukan melalui Google Form; CMS hanya menerima input admin manual.
- Kuota stage adalah total lintas kategori.
- Sistem seleksi hanya menyimpan keputusan lolos atau tidak lolos, bukan nilai atau ranking.
