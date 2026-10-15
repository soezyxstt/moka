# Plan 015: Konsistensi UI dan kontrol seluruh halaman

Status: DONE untuk cakupan UI. Permintaan operator 2026-10-15 mencakup login, CMS, copy ringkas, dan audit kontrol seluruh route. Pekerjaan UI ini diotorisasi sebagai satu pass; checkpoint fungsional Plan 012 tidak dibuka kembali.

## Cakupan dan dependensi

- Referensi: AGENTS.md, Plan 012, Plan 013, Plan 014, token publik, dan panduan Image serta Link Next.js terpasang.
- Shell autentikasi, login, permintaan akses, shell admin, selector edisi, primitive admin dan seluruh caller CMS.
- Kontrol publik bersama: tombol, navbar, navigasi carousel, perluasan profil, scroll ke atas, dan penutup pratinjau.
- Semua route diaudit. Elemen konten semantik tetap HTML; kontrol interaktif memakai primitive shadcn lokal atau wrapper brand. Input hidden/file tetap native.
- GPT 6.1 Sol low mengaudit dan memperbaiki lane publik/CMS, primary mengintegrasikan desain dan verifikasi.

## Drift dan batas berhenti

Drift source terhadap 3874ede dan status worktree diperiksa sebelum edit. Perubahan CMS/public sebelumnya tetap dipertahankan. Berhenti bila perubahan memerlukan schema, data CMS, permission, autentikasi baru, upload, migrasi, deploy, atau overwrite pekerjaan lain. Tidak ada penulisan database atau perubahan environment.

## Penerimaan

Login bersih dengan satu aksi Google, state memuat dan error. CMS mengikuti Manrope, Inter, brand/highlight, permukaan terang, batas tipis, dan copy yang membantu tindakan. Kontrol keyboard dan FormData tetap bekerja. Jalankan npm.cmd run verify, scan seluruh route, serta QA browser desktop dan 380 px. Catat halaman admin yang tidak dapat diakses tanpa sesi dan jangan mengklaim runtime yang belum diperiksa.

## Hasil source dan verifikasi

- Audit mencakup 50 template halaman, global 404, loading/error, redirect kompatibilitas, dan seluruh komponen TSX. Login, CMS, serta kontrol publik bersama diperbaiki tanpa dependensi baru.
- Tombol brand membungkus Button shadcn. Navbar desktop memakai Popover; disclosure upload dan kampanye memakai Accordion. View switch memakai button group dengan aria-pressed. Lima link/button CMS dan CTA beranda memakai asChild agar tidak ada elemen interaktif bersarang.
- Label editor terhubung ke input. Dialog, Sheet dan AlertDialog memakai judul Manrope; tombol dan badge memakai brand/highlight, close label Bahasa Indonesia. Eyebrow CMS berulang dihapus dari API primitive dan caller.
- Select menjaga nilai FormData, label, validasi, serta fokus. Reset membersihkan pesan required dan mengembalikan nilai awal untuk kontrol uncontrolled.
- Input hidden/file serta progress native adalah elemen semantik yang dipertahankan. Aksi tetap memakai server action, permission dan audit lama.
- Login nyata diperiksa pada 1440x900 dan 380x820. Shell/primitive CMS diperiksa dalam fixture terisolasi `.tmp/ui-review`, memakai data contoh tanpa database atau handler server. Keyboard Select, error required, reset, payload FormData, Sheet, dan overflow lulus. Menu publik dibuka dengan Enter dan ditutup dengan Escape pada build lokal.
- Self-check login memverifikasi pending, error API, error jaringan, retry, dan callback Google tanpa melakukan OAuth nyata.
- Verifikasi akhir: 87 tes lulus, typecheck lulus, lint tanpa error dan satu warning TanStack Table existing, serta build production lulus. Script dijalankan lewat npm.cmd yang terpasang; launcher default tidak valid dan runner verify bersarang diblokir trust NVM, sehingga empat script dijalankan satu per satu.
- Screenshot disimpan di folder visualizations chat sebagai `login-desktop.png`, `login-mobile.png`, `cms-components-desktop.png`, dan `cms-components-mobile.png`. Screenshot CMS adalah preview komponen, bukan route admin autentikasi.

## QA autentikasi akhir

Operator masuk melalui Google, lalu 30 template CMS diperiksa dengan data asli pada 1440x900 dan 380x820. Semua hasil akhir tidak memiliki runtime error atau overflow pada dokumen maupun container utama CMS. Detail berita, peserta, album, acara, tahap seleksi dan periode kepengurusan mencakup sampel record tersimpan. Route baru dan empty state juga diperiksa.

Temuan mobile diperbaiki pada toolbar periode serta grid berita, peserta dan album; fieldset album diberi min-width nol agar tidak memaksa lebar intrinsik. Tabel seleksi tetap bergulir di container sendiri. Dialog media terautentikasi memiliki lebar 364 px dalam viewport 380 px tanpa overflow; pencarian memiliki nama aksesibel. Selected state view switch tersedia di seluruh editor terkait.

Hasil per-route tersedia sebagai `cms-route-qa.json` dalam folder visualizations chat. Screenshot autentikasi antara lain `cms-dashboard-desktop.png`, `cms-dashboard-mobile.png`, `cms-news-mobile.png`, dan `cms-profile-mobile.png`; screenshot `cms-components-*` tetap merupakan fixture data contoh.

Cakupan UI selesai. Upload, autosave/simpan nyata, publikasi, persetujuan akses, permission matrix lintas akun, dan operasi kampanye aktif tidak dijalankan. Kampanye lokal tidak tersedia. Tidak ada mutasi konten CMS, deployment, migrasi, atau perubahan permission dari pass UI ini.


Audit tipografi lanjutan 2026-10-15: IN PROGRESS. Operator meminta audit route publik dan admin pada desktop/mobile. Cakupan: font dasar heading, typography, CardTitle, field admin, wrapper/body yang masih memakai font judul, ukuran hero kategori/acara, serta caller kontrol terkait. Plan 013 dan dependensi UI Plan 015 dibaca; drift 3874ede dan worktree existing ditinjau. Berhenti sebelum data CMS, permission, schema, environment, upload, aktivasi atau deployment. Uji rendering route tersimpan dan formulir tanpa simpan, lint/typecheck serta tes token.


Hasil audit tipografi lanjutan 2026-10-15: DONE untuk cakupan font dan keterbacaan lokal. Heading dasar h1-h6 dan CardTitle memakai Manrope; h1 masuk CSS base layer agar ukuran responsif caller bekerja. Body/keterangan, tab, input dan tombol memakai Inter; angka statistik dan judul accordion tetap Manrope. Typography.p memakai leading-relaxed. Label field 14 px, field bersama 16 px pada mobile/14 px desktop, dan label/keterangan admin yang sebelumnya 9-11 px menjadi 12 px. Hero kategori/acara memakai 30 px mobile, dengan jarak baris nama semifinalis lebih longgar. Pemeriksaan 31 route admin dan 19 route publik pada 380/1440 px, total 100 sampel, tidak menemukan font heading keliru, overflow dokumen, atau main paragraph/label/input/textarea di bawah 12 px. Dialog media memakai Manrope/Inter, lebar 896/364 px; pendaftaran 2026 diperiksa melalui preview berizin pada dua ukuran dan accordion terbuka. Preview ditutup, konteks kembali 2025. Build produksi webpack, TypeScript, lint dengan satu warning TanStack existing, dan lima tes token lulus. Detail cakupan dan pengecualian: .tmp/font-audit-report.json. Tidak menguji perangkat fisik, lifecycle permintaan akses atau write/publikasi; artikel internal terbit tidak tersedia pada edisi lokal, source dan preview editor diperiksa. Tidak ada write konten CMS, upload, aktivasi atau deployment.
