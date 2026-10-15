# Mengganti palet tahunan

Palet CMS tersimpan per edisi pada `pageSection` dengan `pageKey=site`, `sectionKey=palette`, dan `presentationJson={dark,light}`. Buka **Identitas edisi**, isi **Warna gelap** dan **Warna terang**, lalu **Simpan palet**. Penyimpanan memerlukan `content.edit` dan `content.publish`, menolak edisi arsip dan konflik versi, serta mencatat revisi dan audit pada transaksi yang sama. Tidak memerlukan migrasi. Menyimpan palet tidak mengaktifkan edisi.

Root layout membaca palet terbit dari edisi publik aktif atau pratinjau berizin dan memasang dua CSS custom properties pada root dokumen. Palet tidak dipinjam dari edisi lain. Selector konteks kerja admin saja tidak mengganti palet publik; gunakan tombol Pratinjau situs edisi 2026 untuk mencoba set 2026 tanpa aktivasi. Seluruh shade, gradient, overlay, ring dan grafik mengikuti kedua input melalui `color-mix`. `src/app/globals.css` tetap menyediakan fallback 2025 dan set 2026 bila record tidak tersedia atau tidak valid. Input CMS hanya menerima hex enam digit dengan urutan dan kontras yang tervalidasi; konten CSS bebas ditolak.

Database lokal dan produksi terpisah. Simpan pada database target yang benar; `.env.prod` tidak dimuat otomatis oleh Next. Operasi produksi memerlukan otorisasi operator, host terverifikasi, backup terenkripsi, restore verification, sesi operator sah dan audit. Record produksi baru memengaruhi situs setelah reader ini di-deploy dan edisinya dipakai oleh publik/pratinjau. Deployment dan aktivasi memerlukan otorisasi tersendiri.

## Token yang dipakai

| Kebutuhan | Token / utility |
|---|---|
| Identitas utama | `brand`, `brand-50` sampai `brand-950` |
| Identitas terang | `highlight`, `highlight-50` sampai `highlight-950` |
| Aksi utama | `bg-primary text-primary-foreground` |
| Teks | `text-foreground`, `text-body`, `text-muted-foreground` |
| Teks pada media gelap | `text-on-media`, opacity bila perlu |
| Permukaan | `bg-background`, `bg-card`, `bg-muted`, `bg-popover` |
| Netral tetap | `neutral-50` sampai `neutral-950`, `canvas`, `ink` |
| Status | `success`, `danger`, `warning`, `info`, masing-masing dengan shade |
| Grafik | `var(--chart-1)` sampai `var(--chart-5)` |
| Mask foto | `--portrait-mask-mobile`, `--portrait-mask-desktop` |

Warna netral dan status tidak mengikuti palet tahunan. `canvas` dan `ink` merupakan ujung netral tetap, juga dipakai pada QR dan pemutar video. Logo Google memakai token provider tetap. Media UploadThing, foto, video, poster, serta logo raster mempertahankan warna di file sumber. Player YouTube dalam iframe mengikuti tampilan providernya; facade lokal memakai token aplikasi.

## Pemeriksaan sebelum rilis

1. Gunakan format hex enam digit untuk kedua input, lalu jalankan `npm.cmd run verify`. Tes `scripts/color-policy.test.ts` berjalan dalam `test:db`, memeriksa urutan gelap/terang dan kontras solid, serta menolak warna literal, utility palet Tailwind bawaan dan nama palet lama di seluruh source, termasuk route legacy dan CSS modules. Literal dasar hanya boleh di deklarasi custom property pusat.
2. Periksa beranda, Tentang, Galeri, profil, voting, login, dan CMS dengan sesi sah pada desktop serta 380 px. Periksa juga focus, hover, disabled, feedback, dan dark mode.
3. Periksa kontras teks normal minimal 4.5:1 dan teks besar minimal 3:1. Teks di foto harus dinilai bersama overlay dan foto aktual. Gradient tidak menjamin kontras di setiap posisi.
4. Warna primary dibatasi lightness-nya untuk membantu keterbacaan label putih. Jangan mengandalkan dua warna sembarang otomatis lolos aksesibilitas; periksa pasangan baru sebelum rilis, terutama highlight pada permukaan terang dan teks di footer.

Gunakan token sesuai fungsi. Jangan menambah utility `text-red-700`, `bg-white`, warna hex, RGB, HSL atau warna SVG langsung pada komponen. `transparent`, `currentColor`, dan `none` memiliki makna struktural dan tetap diperbolehkan. Hanya pembaca palet tervalidasi yang boleh memasang dua input CMS pada root style.
