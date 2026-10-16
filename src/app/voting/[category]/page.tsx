import { redirect } from 'next/navigation';

export default async function VotingCategoryRedirect({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category } = await params;
  redirect(`/voting?kategori=${encodeURIComponent(category)}`);
}
