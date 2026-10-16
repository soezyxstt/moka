'use client';
import { Suspense, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParam } from '@/hooks/use-search-param';

type CategoryTab = { slug: string; name: string; content: ReactNode };

export function VotingCategories({ categories }: { categories: CategoryTab[] }) {
  return (
    <Suspense fallback={<VotingCategoriesView categories={categories} selected={categories[0]?.slug ?? ''} onSelect={() => {}} />}>
      <VotingCategoriesQuery categories={categories} />
    </Suspense>
  );
}

function VotingCategoriesQuery({ categories }: { categories: CategoryTab[] }) {
  const fallback = categories[0]?.slug ?? '';
  const [param, setSelected] = useSearchParam('kategori', fallback);
  const selected = categories.some((category) => category.slug === param) ? param : fallback;
  return <VotingCategoriesView categories={categories} selected={selected} onSelect={setSelected} />;
}

function VotingCategoriesView({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryTab[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return <>
    <div aria-label="Kategori voting" className="grid grid-cols-4 gap-2 border-b border-brand-200 pb-4 sm:flex sm:gap-3">
      {categories.map((category) => <Button key={category.slug} variant="ghost" aria-pressed={selected === category.slug} aria-controls={`voting-${category.slug}`} onClick={() => onSelect(category.slug)} className="h-12 min-w-0 rounded-md border border-brand-200 px-3 font-inter text-base font-semibold text-brand-800 hover:bg-brand-100 aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-canvas sm:min-w-24">{category.name}</Button>)}
    </div>
    {categories.map((category) => <section key={category.slug} id={`voting-${category.slug}`} aria-label={`Voting ${category.name}`} hidden={selected !== category.slug}>{category.content}</section>)}
  </>;
}
