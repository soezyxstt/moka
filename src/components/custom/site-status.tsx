import type { ReactNode } from "react";

import { typography } from "@/components/custom/typography";

type SiteStatusProps = {
  badge: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function SiteStatus({ badge, title, description, children }: SiteStatusProps) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-highlight-50 px-8 pb-16 pt-28 text-brand-900 md:px-20 md:pb-24 md:pt-36">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <typography.t1 className="rounded-md border border-brand-200/80 bg-highlight-100/70 px-3.5 py-1 text-xs font-bold tracking-widest text-brand">
          {badge}
        </typography.t1>
        <h1 className="mt-5 text-balance font-manrope text-3xl! font-semibold tracking-tight text-brand-800 sm:text-4xl! md:text-5xl!">
          {title}
        </h1>
        {description ? (
          <typography.p className="mt-4 max-w-md font-inter text-base leading-relaxed text-body">
            {description}
          </typography.p>
        ) : null}
        {children ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      </div>
    </main>
  );
}
