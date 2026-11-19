# Loading publik bertahap

## Cache publik dan navigasi, 2026-11-17

Reader publik memakai Next Data Cache untuk edisi aktif dan fallback, teks dan aset terbit, program, kegiatan, album, sponsor, data Tentang, berita, dan kategori profil peserta. Kunci dan tag mencakup hash URL database agar target berbeda tidak berbagi data. Interval revalidasi adalah 24 jam; saat data kedaluwarsa Next dapat menyajikan versi lama sambil memperbaruinya. Kegagalan pembaruan dapat memperpanjang masa data lama. Mekanisme cache dan pembagian antar-instance bergantung pada adapter dan penyedia deployment.

Server action CMS yang mengubah data publik membatalkan tag setelah transaksi, selain mempertahankan `revalidatePath` yang sudah ada. Penyimpanan draf teks halaman dan pengelolaan folder media tidak membatalkan cache publik. Penyimpanan berita tetap membatalkan cache karena implementasi editor dapat memperbarui artikel yang sudah terbit. Perubahan database di luar action aplikasi tidak membatalkan tag; verifikasi atau invalidasi terpisah diperlukan setelah operasi tersebut. Pratinjau berizin melewati cache bersama. Kampanye, status, kandidat, harga, QR, tally, visibilitas hasil, dan perhitungan voting tetap dibaca langsung. Identitas edisi serta teks dan aset CMS yang dipakai bersama halaman voting tetap memakai cache konten publik.

Tautan publik pada navbar dan footer melakukan prefetch halaman lengkap kecuali Voting, admin dan pratinjau. Next menggunakan batas satu jam untuk hasil prefetch lengkap, halaman statis, dan loading boundary; halaman dinamis yang tidak diprefetch lengkap memakai batas dinamis bawaan Next. Back dan forward memiliki perilaku cache tersendiri. Tab lain yang telah melakukan prefetch dapat sementara menampilkan versi lama setelah publikasi. Prefetch belum selesai, navigasi melalui tautan lain, cache browser yang kedaluwarsa, dan navigasi Voting tetap dapat menampilkan fallback. Cache server tidak berarti gambar sudah terunduh di browser.

Beranda membaca album langsung tanpa menunggu data organisasi. Hero Tentang mengambil teks dan referensi aset secara terpisah dari data organisasi, sehingga dapat di-stream lebih awal. Root tetap menunggu identitas, palet dan konteks preview. Perubahan tidak membuktikan bahwa gambar pernah menjadi penyebab hambatan sebelumnya.

Untuk penerimaan runtime setelah deployment terpisah, ukur kunjungan pertama dan Beranda ke Pendaftaran ke Beranda pada desktop dan mobile. Periksa request RSC, skeleton yang terlihat, konten setelah publikasi dari sesi lain, refresh, masuk dan keluar preview, serta perubahan visibilitas dan tally Voting. Uji cache antar-instance pada penyedia yang dipilih; jangan memakai data produksi untuk fixture. `scripts/public-cache.test.ts` menguji query SQLite dengan implementasi cache Next dan penyimpanan uji, bukan jaringan browser atau backend cache penyedia.

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

- Review PR menambahkan observer rejection pada promise detail Voting agar kegagalan awal tetap tertangani ketika consumer menunggu base. Promise asli tetap diteruskan ke consumer untuk error handling. `node --test scripts/public-loading.test.mjs` memeriksa rejection awal dan hasil sukses tanpa dependensi aplikasi.
- `.tmp/loading-geometry/parent-rendered.json`: perbandingan produksi dengan markup skeleton representatif yang dirender sementara, dengan CSS utility tambahan bila diperlukan.
- `.tmp/loading-geometry/profiles-voting.json`: ukuran produksi kategori, profil dan voting; perbandingan lane ini hanya terhadap source. Revisi reservasi profil/grafik berikutnya dicatat pada bukti parent dan source.
- `.tmp/loading-geometry/news-gallery-events.json`: ukuran produksi berita, artikel, galeri dan kegiatan; bukan render skeleton atau uji streaming.
- Self-check ringan memeriksa 23 file source, 57 import lokal, tag skeleton, whitespace, reduced motion, JSON bukti, penghapusan CSS titik serta kesamaan blok kalkulasi voting.
- Tidak ada install dependensi, tsc, typecheck, build, server lokal, perubahan CMS atau deployment. Penerimaan runtime lokal, CLS nyata dan seluruh variasi konten tetap OPEN.

Referensi: [Next.js loading convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading).
