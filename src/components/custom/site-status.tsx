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
    <main className="grid min-h-svh place-items-center bg-brand px-8 pb-16 pt-28 text-on-media md:px-20 md:pb-24 md:pt-36">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <typography.t1 className="rounded-md border border-highlight/35 bg-brand-900/45 px-3.5 py-1 text-xs font-bold tracking-widest text-highlight">
          {badge}
        </typography.t1>
        <h1 className="mt-5 text-balance font-manrope text-3xl font-bold tracking-tight text-on-media sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description ? (
          <typography.p className="mt-4 max-w-md font-inter text-base leading-relaxed text-on-media/80">
            {description}
          </typography.p>
        ) : null}
        {children ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      </div>
    </main>
  );
}
