# Loading publik bertahap

Source 2026-11-13 mengganti fallback tiga titik dengan skeleton sesuai route. Navbar/footer tetap dimiliki shared layout. Root harus memperoleh identitas, palet dan konteks preview sebelum merender; reader tersebut dimulai paralel. Ini masih menjadi gerbang awal.

Suspense memisahkan berita dan album Beranda, filosofi dan kontak Tentang, bantuan Pendaftaran, daftar Berita, sponsor kegiatan, serta header dan konten Voting. Data yang diperlukan untuk validitas route, notFound, isolasi edisi, kandidat dan perhitungan pembayaran tetap dibaca melalui reader existing.

## Menyesuaikan skeleton

1. Buka route produksi yang sesuai dengan edisi, kategori dan status kampanye pembanding. Catat URL, viewport CSS sebenarnya, judul serta kondisi konten. Jangan memakai konten tersembunyi pada container stream sebagai ukuran halaman yang terlihat.
2. Ukur padding, lebar container, grid, rasio media serta tinggi teks dan bagian utama pada desktop dan 380 px. Perhatikan teks panjang, tidak adanya gambar, daftar kosong, reduced motion dan visibilitas hasil voting.
3. Render markup skeleton pada viewport yang sama dan lihat screenshot langsung. Bundle produksi bisa belum memiliki utility baru; CSS utility setara dapat membantu perbandingan geometri, tetapi harus dicatat sebagai simulasi, bukan build source atau penerimaan runtime aplikasi.
4. Sesuaikan file loading.tsx atau helper skeleton dalam folder route. Gunakan token existing, aria-label pada status, aria-hidden untuk bentuk dekoratif, serta motion-safe:animate-pulse. Jangan mengubah konten CMS untuk menyesuaikan placeholder.
5. Bila runtime lokal tersedia dan sumber daya cukup, periksa transisi loading dengan reader lambat, navigasi antarrute, kondisi kosong/error serta layout shift. Suspense yang telah memulai streaming dapat membuat respons notFound berikutnya berstatus HTTP 200. Pemeriksaan source tidak membuktikan perilaku HTTP tersebut.

Reservasi berita/album/profil mengikuti sampel konten produksi dan masih dapat berbeda saat panjang teks atau jumlah item berubah. Grafik voting memakai reservasi 600 px saat visibilitas kampanye aktif diketahui visible; jumlah hasil dan kondisi tanpa suara tetap bisa berbeda. Sebelum konteks kampanye tersedia, fallback ringkas tidak mengasumsikan grafik tampil.

## Bukti dan batas pemeriksaan 2026-11-13

- `.tmp/loading-geometry/parent-rendered.json`: perbandingan produksi dengan markup skeleton representatif yang dirender sementara, dengan CSS utility tambahan bila diperlukan.
- `.tmp/loading-geometry/profiles-voting.json`: ukuran produksi kategori, profil dan voting; perbandingan lane ini hanya terhadap source. Revisi reservasi profil/grafik berikutnya dicatat pada bukti parent dan source.
- `.tmp/loading-geometry/news-gallery-events.json`: ukuran produksi berita, artikel, galeri dan kegiatan; bukan render skeleton atau uji streaming.
- Self-check ringan memeriksa 23 file source, 57 import lokal, tag skeleton, whitespace, reduced motion, JSON bukti, penghapusan CSS titik serta kesamaan blok kalkulasi voting.
- Tidak ada install dependensi, tsc, typecheck, build, server lokal, perubahan CMS atau deployment. Penerimaan runtime lokal, CLS nyata dan seluruh variasi konten tetap OPEN.

Referensi: [Next.js loading convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading).
