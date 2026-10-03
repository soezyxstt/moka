import { getPublicVotingResults } from '@/server/cms/public-readers';

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: slug } = await params;
  const results = await getPublicVotingResults(slug);
  if (!results) return { title: "Hasil voting" };
  return {
    title: `Hasil voting ${results.categoryName} ${results.editionYear}`,
    description: results.visible
      ? `Hasil voting kategori ${results.categoryName} untuk edisi ${results.editionYear}.`
      : `Informasi hasil voting kategori ${results.categoryName} untuk edisi ${results.editionYear}.`,
  };
}

export default function HasilLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
