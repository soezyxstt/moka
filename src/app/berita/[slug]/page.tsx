import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { TipTapRenderer } from '@/components/admin/tiptap-renderer';
import { getPublicNewsBySlug } from '@/server/cms/public-readers';

const getArticle = cache((slug: string) => getPublicNewsBySlug(slug));

type NewsPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article || article.kind !== 'internal') return { title: 'Berita' };

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: article.coverUrl ? { images: [article.coverUrl] } : undefined,
  };
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || article.kind !== 'internal') notFound();

  return (
    <main className="min-h-screen bg-background px-6 pb-16 pt-28 md:px-10 md:pt-36">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex text-sm font-medium text-dgb hover:underline">
          Kembali ke beranda
        </Link>
        <time
          dateTime={article.publishedAt.toISOString()}
          className="block text-sm text-muted-foreground"
        >
          {article.publishedAt.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
          })}
        </time>
        <h1 className="mt-2 font-montserrat text-3xl font-semibold text-dgb-900 md:text-5xl">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-4 font-inter text-lg leading-relaxed text-[#505050]">
            {article.excerpt}
          </p>
        ) : null}
        {article.coverUrl ? (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={article.coverUrl}
              alt={article.coverAlt || article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        {article.bodyJson || article.body ? (
          <div className="mt-8">
            <TipTapRenderer content={article.bodyJson} fallbackText={article.body} />
          </div>
        ) : null}
      </article>
    </main>
  );
}
