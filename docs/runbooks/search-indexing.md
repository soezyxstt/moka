# Pemeriksaan indeks pencarian

## Batas patch 2026-10-22

Patch source Plan 019 mengatur canonical per halaman, `metadataBase`, sitemap, robots admin, metadata acara, serta redirect hasil voting lama. Patch tidak mengubah isi CMS, edisi aktif, sesi, izin, atau kebijakan arsip. Source lokal bukan bukti perubahan sudah sampai ke produksi atau diterima Google.

`BASE_URL` harus berisi origin publik yang menjadi tujuan akhir redirect domain, saat audit `https://www.pamokagarut.com`. Root metadata dan sitemap menggunakan origin tersebut. Jangan memakai URL deployment preview atau localhost pada konfigurasi produksi. Tidak ada variabel lingkungan baru.

## Perilaku yang diharapkan

| Jenis URL | Canonical dan indeks |
| --- | --- |
| Beranda | Canonical beranda, tanpa `noindex` bagi pengunjung anonim |
| Halaman publik lain | Canonical path masing-masing, pada origin yang sama |
| `/voting?kategori=...` | Canonical `/voting`; parameter hanya memilih tab |
| Kategori peserta kosong | Halaman tetap dapat dibuka sesuai perilaku existing, tetapi tidak masuk sitemap |
| Kategori/profil berisi peserta publik | Masuk sitemap dan canonical sesuai path |
| `/berita` dan berita internal terbit | Masuk sitemap; berita eksternal tidak dibuat sebagai URL artikel lokal |
| `/admin/*`, termasuk login | `noindex,nofollow`; pemeriksaan sesi dan izin tetap berlaku |
| Halaman dalam pratinjau berizin | Tetap `noindex,nofollow` dari root, tanpa `index:true` pada metadata anak |
| Sitemap dalam pratinjau berizin | Daftar URL kosong; reader isi tidak dipanggil |
| URL yang tidak ada pada pembaca publik | Tetap memakai `notFound()` dan proteksi bawaan Next; jangan memaksa indeks |
| `/voting/hasil` dan turunannya | HTTP 308 ke `/voting`, parameter query dipertahankan |

`robots.txt` mengizinkan crawl agar bot dapat membaca `noindex` pada login dan halaman lain. Ini tidak membuka data admin; autentikasi dan otorisasi tetap menjadi batas akses. Sitemap tidak memuat admin atau preview. `lastmod` dihilangkan sampai setiap jenis konten menyediakan waktu perubahan yang benar, bukan waktu pembacaan sitemap.

## Uji lokal sebelum rilis

```sh
npm run typecheck
npm run lint
npm run test:seo
git diff --check
```

Tes terarah memanggil fungsi route nyata dengan fixture CMS/request, tanpa database atau jaringan. Resolver metadata Next versi terpasang menggabungkan root, layout antara dan page untuk 12 jenis halaman publik dalam keadaan biasa dan preview, ditambah admin/login. Uji sitemap mencakup daftar kosong, publikasi peserta, pendaftaran tersembunyi, berita internal/eksternal, dan preview yang tidak membaca isi. Uji redirect memakai matcher `next.config` dari Next, termasuk preservasi query, batas route, dan tujuan yang tidak berulang.

`npm run verify` juga menjalankan `test:seo` sebelum typecheck, lint dan build. Tes ini tidak menggantikan respons HTTP dari aplikasi utuh. Ia tidak menguji sesi preview sungguhan, konfigurasi cache/CDN, nilai environment produksi, atau keputusan pengindeksan Google.

Pada 2026-10-22, `npm run build -- --webpack` lulus penuh pada environment uji terisolasi tanpa data atau kredensial produksi. Jalur webpack dipakai setelah build default Turbopack pada runner gagal mengambil font lalu membuka cache persistence internal. Build webpack tidak membuktikan build Turbopack pada runner tersebut lulus. Rilis tetap mengikuti gate build lingkungan tujuan.

## Uji HTTP setelah rilis yang diotorisasi

1. Ambil HTML anonim dengan cookie kosong untuk beranda, Tentang, Galeri, Pendaftaran yang terbit, Berita, satu artikel, Voting, satu kegiatan, kategori semifinal, dan satu profil yang ada. Catat tanggal, status, redirect, `X-Robots-Tag`, semua meta robots, dan canonical. HTML untuk bot dapat berbeda posisi metadatanya dari respons browser karena streaming; periksa dokumen utuh.
2. Ulangi contoh dengan user agent Googlebot. Perbedaan tidak otomatis berarti Google benar-benar melakukan crawl; ini hanya memeriksa cabang respons server.
3. Canonical harus tepat satu URL utama halaman, tanpa query tab/tracking atau fragmen. Halaman Tentang tidak boleh canonical ke beranda. URL canonical harus menghasilkan halaman yang sesuai dan tidak memiliki `noindex` ketika anonim.
4. Ambil sitemap dua kali. Tidak boleh ada timestamp baru hanya karena request baru. Setiap URL harus menjadi halaman publik yang sah; kategori tanpa peserta, admin, preview, redirect dan artikel eksternal tidak masuk. Indeks Berita harus ada.
5. Ambil `/robots.txt`. Pastikan tipe teks, sitemap pada origin yang benar, dan tidak ada larangan crawl untuk halaman yang perlu memperlihatkan `noindex`.
6. Buka `/admin/login` secara anonim. Pastikan `noindex,nofollow`. Halaman admin berizin tetap membutuhkan sesi dan hak akses yang benar.
7. Melalui sesi admin yang sudah sah dan izin `content.view`, aktifkan preview yang dipilih operator. Verifikasi `noindex,nofollow` pada halaman publik contoh, sitemap kosong dan cache tidak menyajikan preview kepada permintaan anonim. Tutup preview, lalu ulangi permintaan anonim. Jangan memalsukan sesi atau mencatat cookie/token dalam laporan.
8. Periksa `/voting/hasil` dan satu turunannya, dengan dan tanpa query. Status pertama 308, tujuan `/voting`, tanpa loop. Redirect login tetap mengikuti kode autentikasi existing.

## Mencocokkan Search Console

Ekspor atau catat contoh URL, alasan, waktu crawl terakhir, waktu validasi, canonical pilihan pengguna/Google, serta hasil fetch dan izin indeks dari URL Inspection. Cocokkan setiap URL dengan keadaan HTTP saat ini dan versi source yang berjalan. Laporan lama bisa masih mencerminkan edisi sebelumnya.

`Excluded by noindex` pada admin, preview atau halaman yang memang tidak ada dapat benar. `Crawled - currently not indexed` tidak menyatakan akar masalah tertentu dan tidak menjamin setiap halaman perlu perubahan kode. Jangan menghapus semua `noindex`, mengalihkan semua URL lama ke beranda, atau menyatakan masalah selesai hanya karena HTML kini valid.

Reader peserta tetap membatasi edisi aktif. Reader berita tetap memakai daftar edisi pertama yang tidak kosong. Bila URL lama perlu bertahan sebagai arsip, rancang path dan lookup edisi publik secara terpisah, lalu buat pemetaan redirect tepat. Jangan mencampur peserta tahun lama ke edisi aktif untuk menutup laporan indeks.

Permintaan indeks ulang, validasi GSC, deploy, dan perubahan CMS berada di luar patch ini. Lakukan hanya pada target dan URL yang sudah ditinjau setelah rilis yang diotorisasi.
