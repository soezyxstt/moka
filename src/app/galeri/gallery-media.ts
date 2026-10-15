import type { PublicGalleryAlbum } from "@/server/cms/public-readers";

export type GalleryMedia = {
  id: string;
  imageUrl: string | null;
  youtubeId: string | null;
  alt: string;
  albumSlug?: string;
};

export function getGalleryMedia(albums: PublicGalleryAlbum[]): GalleryMedia[] {
  return albums.flatMap((album) => {
    const media: GalleryMedia[] = album.items.map((item) => ({
      id: item.id, imageUrl: item.imageUrl, youtubeId: item.youtubeId,
      alt: item.imageAlt ?? item.caption ?? album.title,
    }));
    if (album.coverUrl && !media.some((item) => item.imageUrl === album.coverUrl)) {
      media.unshift({ id: `${album.id}-cover`, imageUrl: album.coverUrl, youtubeId: null, alt: album.coverAlt ?? album.title });
    }
    if (media[0]) media[0].albumSlug = album.slug;
    return media;
  });
}
