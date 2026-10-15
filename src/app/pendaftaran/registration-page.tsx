"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight, Check, ClipboardList, FileCheck2, MapPin, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Section } from "@/components/custom/section";
import { typography } from "@/components/custom/typography";
import { Button } from "@/components/custom/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { registrationLines, registrationRows } from "@/server/cms/registration";
import type { PublicPageSection } from "@/server/cms/public-readers";

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div initial={false} whileInView={reduced ? undefined : { y: [16, 0], opacity: [0.65, 1] }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55, ease: "easeOut" }} className={className}>{children}</motion.div>;
}

function Ornament({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute aspect-square ${className}`}>
    <div className="absolute inset-[18%] rounded-full border border-current opacity-40" />
    {Array.from({ length: 8 }, (_, index) => <span key={index} className="absolute left-[35%] top-[6%] h-[44%] w-[30%] origin-bottom rounded-full border border-current" style={{ transform: `rotate(${index * 45}deg)` }} />)}
    <div className="absolute inset-[38%] rounded-full border border-current bg-highlight-200" />
  </div>;
}

function CopyList({ body, numbered = false }: { body: string | null | undefined; numbered?: boolean }) {
  return <ul className="space-y-5">{registrationLines(body).map((line, index) => <li key={`${index}-${line}`} className="flex items-start gap-4">
    <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-brand-200 text-xs font-semibold text-brand-700">{numbered ? String(index + 1).padStart(2, "0") : <Check className="size-3.5" />}</span>
    <typography.p className="min-w-0 break-words text-sm leading-7 md:text-base">{line}</typography.p>
  </li>)}</ul>;
}

export function RegistrationPage({ year, sections }: { year: number; sections: Record<string, PublicPageSection> }) {
  const reduced = useReducedMotion();
  const ages = registrationRows(sections.usia?.body);
  const agenda = registrationRows(sections.timeline?.body);
  const hero = sections.hero;
  return <main className="overflow-hidden bg-background text-foreground">
    <Section className="overflow-hidden bg-highlight-50 pt-32 md:pt-40" contentClassName="mx-auto max-w-6xl">
      <div aria-hidden="true" className="pointer-events-none absolute -right-64 -top-56 size-[42rem] rounded-full border border-highlight-300/55" />
      <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="relative z-10">
          <h1 className="max-w-3xl font-manrope text-[clamp(2.5rem,6vw,5.5rem)]! leading-[1.08]! font-semibold! tracking-tight! text-brand-900!">{hero?.title}</h1>
          <typography.p className="mt-6 max-w-xl leading-8">{hero?.body}</typography.p>
          <div className="mt-8 flex flex-wrap gap-3">
            {hero?.actionHref && hero.actionLabel ? <Button asChild size="lg" className="h-auto min-h-10 max-w-full whitespace-normal break-words"><Link href={hero.actionHref}>{hero.actionLabel}<ArrowUpRight aria-hidden="true" className="ml-3 size-4 shrink-0" /></Link></Button> : null}
            {sections.syarat ? <Button asChild variant={hero?.actionHref ? "outline" : "default"} size="lg"><Link href="#syarat">Lihat syarat<ArrowDown aria-hidden="true" className="ml-3 size-4" /></Link></Button> : null}
            {agenda.length ? <Button asChild variant="outline" size="lg"><Link href="#timeline">Lihat jadwal<CalendarDays aria-hidden="true" className="ml-3 size-4" /></Link></Button> : null}
          </div>
        </Reveal>
        <motion.div aria-hidden="true" initial={false} whileInView={reduced ? undefined : { rotate: [-8, 0], scale: [0.95, 1] }} viewport={{ once: true }} transition={{ duration: 1.1 }} className="relative mx-auto flex aspect-square w-full max-w-80 items-center justify-center lg:max-w-md">
          <Ornament className="absolute inset-0 text-brand-700/45" />
          <span className="relative font-manrope text-7xl font-semibold tracking-tighter text-brand-900 md:text-8xl">{year}</span>
          <span className="absolute inset-5 rounded-full border border-dashed border-brand-300/60" />
        </motion.div>
      </div>
      {ages.length ? <Reveal className="mt-10 md:mt-14">
        {sections.usia?.title ? <h2 className="mb-5 font-manrope text-lg font-semibold text-brand-900">{sections.usia.title}</h2> : null}
        <div className="grid gap-4 sm:grid-cols-2">
        {ages.map((age) => <div key={age.label} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200/70 bg-background/70 px-6 py-5">
          <div><h2 className="font-manrope text-lg font-semibold text-brand-900">{age.label}</h2>{age.detail ? <p className="mt-1 text-sm text-muted-foreground">{age.detail}</p> : null}</div>
          <p className="font-manrope text-2xl font-semibold tracking-tight text-brand-800 md:text-3xl">{age.title}</p>
        </div>)}</div>
      </Reveal> : null}
    </Section>

    {sections.syarat || sections.kriteria ? <Section id="syarat" className="scroll-mt-20 bg-background" contentClassName="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20">
      {sections.syarat ? <Reveal>
        <MapPin aria-hidden="true" className="mb-5 size-7 text-brand-600" />
        <typography.h1 className="mb-8 text-3xl text-brand-900">{sections.syarat.title}</typography.h1>
        <CopyList body={sections.syarat.body} />
      </Reveal> : null}
      {sections.kriteria ? <Reveal>
        <ClipboardList aria-hidden="true" className="mb-5 size-7 text-brand-600" />
        <typography.h1 className="mb-8 text-3xl text-brand-900">{sections.kriteria.title}</typography.h1>
        <CopyList body={sections.kriteria.body} numbered />
      </Reveal> : null}
    </Section> : null}

    {sections.ots || sections.berkas ? <Section className="overflow-hidden bg-brand-950" contentClassName="mx-auto max-w-6xl">
      <Ornament className="absolute -bottom-36 -right-32 w-96 text-highlight-400/25" />
      <Reveal className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div className="text-on-media"><FileCheck2 aria-hidden="true" className="mb-5 size-8 text-highlight-300" /><typography.h1 className="text-3xl leading-tight md:text-4xl">Persiapan registrasi</typography.h1></div>
        <Accordion type="multiple" defaultValue={["berkas"]} className="rounded-xl bg-background px-6 md:px-8 motion-reduce:[&_[data-slot=accordion-content]]:animate-none motion-reduce:[&_svg]:transition-none">
          {(["ots", "berkas"] as const).map((key) => sections[key] ? <AccordionItem key={key} value={key} className="border-border last:border-0">
            <AccordionTrigger className="gap-4 py-6 text-left font-manrope text-xl font-semibold text-brand-900 hover:no-underline">{sections[key].title}</AccordionTrigger>
            <AccordionContent className="pb-8"><CopyList body={sections[key].body} /></AccordionContent>
          </AccordionItem> : null)}
        </Accordion>
      </Reveal>
    </Section> : null}

    {agenda.length ? <Section id="timeline" className="scroll-mt-20 bg-highlight-50" contentClassName="mx-auto max-w-6xl">
      <Reveal className="mb-12 flex items-end justify-between gap-6 md:mb-16">
        <typography.h1 className="max-w-lg text-3xl leading-tight text-brand-900 md:text-5xl">{sections.timeline?.title}</typography.h1>
        <CalendarDays aria-hidden="true" className="hidden size-12 shrink-0 text-brand-600 sm:block" />
      </Reveal>
      <div className="relative">
        <div aria-hidden="true" className="absolute bottom-0 left-[7px] top-3 w-px bg-brand-200 md:left-[calc(30%+7px)]" />
        <motion.div aria-hidden="true" initial={false} whileInView={reduced ? undefined : { scaleY: [0, 1] }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="absolute bottom-0 left-[7px] top-3 w-px origin-top bg-brand-700 md:left-[calc(30%+7px)]" />
      <ol className="relative">
        {agenda.map((item, index) => <li key={`${index}-${item.label}`} className="relative pb-8 pl-9 last:pb-0 md:pl-0">
          <Reveal className="group grid gap-3 md:grid-cols-[30%_1fr] md:gap-0">
            <div className="pr-8"><p className="font-manrope text-sm font-semibold text-brand-700 md:text-lg">{item.label}</p></div>
            <div className="relative md:pl-10">
              <span aria-hidden="true" className="absolute -left-9 top-1.5 size-[15px] rounded-full border-[3px] border-highlight-50 bg-brand-600 ring-1 ring-brand-300 md:left-0" />
              <motion.div whileHover={reduced ? undefined : { x: 4 }} className="pb-4">
                <h3 className="font-manrope text-xl font-semibold text-brand-900 md:text-2xl">{item.title}</h3>
                {item.detail ? <typography.p className="mt-3 max-w-xl text-sm leading-7">{item.detail}</typography.p> : null}
              </motion.div>
              {index < agenda.length - 1 ? <Separator className="mt-3 bg-brand-200/70" /> : null}
            </div>
          </Reveal>
        </li>)}
      </ol>
      </div>
    </Section> : null}
  </main>;
}
