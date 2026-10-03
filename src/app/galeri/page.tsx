import Image from "next/image";
import { Images } from "lucide-react";

import { typography } from "@/components/custom/typography";
import YouTubeEmbed from "@/components/youtube-embed";
import { getPublicGalleryAlbums } from "@/server/cms/public-readers";

export const metadata = { title: "Galeri" };

export default async function GalleryPage() {
  const albums = await getPublicGalleryAlbums();

  return (
    <main className="relative min-h-screen bg-dgb-50 px-8 py-14 md:px-20 md:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dgb-50/90" />
      <div className="relative mx-auto max-w-7xl">
        <typography.t1>Dokumentasi</typography.t1>
        <h1 className="mt-2 text-4xl font-semibold font-montserrat text-dgb-900">Galeri</h1>

        {albums.length ? (
          <div className="mt-10 space-y-12">
            {albums.map((album) => {
              const coverIsItem = album.coverUrl && album.items.some((item) => item.imageUrl === album.coverUrl);
              return (
                <section key={album.id} id={album.slug} className="scroll-mt-24 rounded-xl border border-dgb-100 bg-white/70 p-5 md:p-8">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="font-inter text-xs font-semibold uppercase tracking-wide text-fb-500">{album.ownerType === "event" ? "Album kegiatan" : "Album PAMOKA"}</p>
                      <h2 className="mt-1 font-montserrat text-2xl font-semibold text-dgb-900">{album.title}</h2>
                    </div>
                    {album.description ? <p className="max-w-2xl font-inter text-sm leading-6 text-[#505050]">{album.description}</p> : null}
                  </div>
                  {album.coverUrl && !coverIsItem ? (
                    <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-lg">
                      <Image src={album.coverUrl} alt={album.coverAlt ?? album.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 1200px" />
                    </div>
                  ) : null}
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {album.items.map((item) => item.imageUrl ? (
                      <figure key={item.id} className="overflow-hidden rounded-lg bg-white">
                        <div className="relative aspect-[4/3]">
                          <Image src={item.imageUrl} alt={item.imageAlt ?? item.caption ?? album.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                        </div>
                        {item.caption ? <figcaption className="p-3 font-inter text-sm text-[#505050]">{item.caption}</figcaption> : null}
                      </figure>
                    ) : item.youtubeId ? (
                      <div key={item.id} className="overflow-hidden rounded-lg bg-white">
                        <YouTubeEmbed id={item.youtubeId} title={item.caption ?? album.title} />
                        {item.caption ? <p className="p-3 font-inter text-sm text-[#505050]">{item.caption}</p> : null}
                      </div>
                    ) : null)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="mt-10 rounded-xl border border-dgb-100 bg-white/70 p-5 md:p-8">
            <div className="flex items-center gap-3">
              <Images className="size-5 text-fb-500" aria-hidden="true" />
              <h2 className="font-montserrat text-xl font-semibold text-dgb-900">Belum ada album terbit untuk edisi ini.</h2>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
