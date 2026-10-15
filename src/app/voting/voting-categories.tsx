'use client';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function VotingCategories({ categories }: { categories: { slug: string; name: string; content: ReactNode }[] }) {
  const [selected, setSelected] = useState(categories[0]?.slug);
  return <>
    <div aria-label="Kategori voting" className="grid grid-cols-4 gap-2 border-b border-brand-200 pb-4 sm:flex sm:gap-3">
      {categories.map((category) => <Button key={category.slug} variant="ghost" aria-pressed={selected === category.slug} aria-controls={`voting-${category.slug}`} onClick={() => setSelected(category.slug)} className="h-12 min-w-0 rounded-md border border-brand-200 px-3 font-inter text-base font-semibold text-brand-800 hover:bg-brand-100 aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-canvas sm:min-w-24">{category.name}</Button>)}
    </div>
    {categories.map((category) => <section key={category.slug} id={`voting-${category.slug}`} aria-label={`Voting ${category.name}`} hidden={selected !== category.slug}>{category.content}</section>)}
  </>;
}
