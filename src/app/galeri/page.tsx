import { getPublicGalleryAlbums, getPublicPageIntro } from "@/server/cms/public-readers";
import { getGalleryMedia } from "./gallery-media";
import GalleryWall from "./gallery-wall";

export const metadata = { title: "Galeri", alternates: { canonical: '/galeri' } };

export default async function GalleryPage() {
  const [albums, intro] = await Promise.all([getPublicGalleryAlbums(), getPublicPageIntro("galeri")]);
  return (
    <main className="min-h-screen bg-brand-50 text-foreground selection:bg-brand-900 selection:text-brand-50">
      <GalleryWall media={getGalleryMedia(albums)} albums={albums} intro={intro} />
    </main>
  );
}
