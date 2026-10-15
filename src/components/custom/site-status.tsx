import type { ReactNode } from "react";

import { Section } from "@/components/custom/section";
import { typography } from "@/components/custom/typography";

type SiteStatusProps = {
  visual: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  loading?: boolean;
};

export function SiteStatus({ visual, title, description, children, loading = false }: SiteStatusProps) {
  return (
    <main className="bg-brand-50 text-brand-900">
      <Section
        className="flex min-h-svh items-center overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40"
        background="/babancong.webp"
        overlay="brand"
        contentClassName="mx-auto w-full max-w-6xl"
      >
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div aria-hidden="true" className="flex min-h-40 items-center justify-center font-manrope text-[clamp(8rem,24vw,19rem)] font-semibold leading-none tracking-tighter md:min-h-72">
            {visual}
          </div>
          <div className="border-t border-brand-900/20 pt-8 md:border-l md:border-t-0 md:py-4 md:pl-12" role={loading ? "status" : undefined} aria-live={loading ? "polite" : undefined}>
            <h1 className="max-w-md text-balance font-manrope text-3xl! font-semibold leading-tight md:text-4xl! lg:text-5xl!">{title}</h1>
            {description ? <typography.p className="mt-5 max-w-md leading-7">{description}</typography.p> : null}
            {children ? <div className="mt-8 flex flex-wrap items-center gap-4">{children}</div> : null}
          </div>
        </div>
      </Section>
    </main>
  );
}
