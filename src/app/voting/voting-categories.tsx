'use client';
import { Suspense, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParam } from '@/hooks/use-search-param';
import { VoteDialog, type VotingPanelCandidate } from './voting-panel';

export type CategoryTab = {
  slug: string;
  name: string;
  open: boolean;
  ended: boolean;
  pricePerVote: number;
  candidates: VotingPanelCandidate[];
  resultsVisible: boolean;
  candidateNumberOffset?: number;
  content: ReactNode;
};

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
  const activeCategory = categories.find((category) => category.slug === selected) ?? categories[0];

  return <>
    <div className="flex flex-col gap-4 border-b border-brand-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div aria-label="Kategori voting" className="grid grid-cols-4 gap-2 sm:flex sm:gap-3">
        {categories.map((category) => (
          <Button
            key={category.slug}
            variant="ghost"
            aria-pressed={selected === category.slug}
            aria-controls={`voting-${category.slug}`}
            onClick={() => onSelect(category.slug)}
            className="h-10 min-w-0 rounded-md border border-brand-200 px-3 font-inter text-sm font-semibold text-brand-800 hover:bg-brand-100 aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-canvas sm:h-11 sm:min-w-20 sm:text-base"
          >
            {category.name}
          </Button>
        ))}
      </div>
      {activeCategory && !activeCategory.ended ? (
        <VoteDialog
          open={activeCategory.open}
          pricePerVote={activeCategory.pricePerVote}
          candidates={activeCategory.candidates}
          resultsVisible={activeCategory.resultsVisible}
          candidateNumberOffset={activeCategory.candidateNumberOffset}
        />
      ) : null}
    </div>
    {categories.map((category) => (
      <section
        key={category.slug}
        id={`voting-${category.slug}`}
        aria-label={`Voting ${category.name}`}
        hidden={selected !== category.slug}
      >
        {category.content}
      </section>
    ))}
  </>;
}
