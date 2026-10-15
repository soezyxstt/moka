import { Section } from "@/components/custom/section";
import { getPublicGalleryAlbums, getPublicPageIntro } from "@/server/cms/public-readers";
import { getGalleryMedia } from "./gallery-media";
import GalleryWall from "./gallery-wall";

export const metadata = { title: "Galeri" };

export default async function GalleryPage() {
  const [albums, intro] = await Promise.all([getPublicGalleryAlbums(), getPublicPageIntro("galeri")]);
  return (
    <main className="min-h-screen bg-brand-50">
      <Section className="pt-28 pb-6 md:pt-32 md:pb-10" contentClassName="mx-auto max-w-[1440px]">
        <h1 className="font-manrope text-4xl font-semibold tracking-tight text-brand-900 md:text-6xl">{intro?.title || "Galeri"}</h1>
      </Section>
      <GalleryWall media={getGalleryMedia(albums)} />
    </main>
  );
}
