import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicRegistration, getPublicSiteIdentity } from "@/server/cms/public-readers";
import { RegistrationHelp, RegistrationPage } from "./registration-page";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicRegistration();
  return {
    title: content?.sections.hero?.title || "Pendaftaran",
    description: content?.sections.hero?.body || undefined,
    alternates: { canonical: '/pendaftaran' },
  };
}

export default async function Page() {
  const content = await getPublicRegistration();
  if (!content) notFound();
  return <RegistrationPage sections={content.sections} help={<Suspense fallback={<HelpSkeleton />}><Help sections={content.sections} /></Suspense>} />;
}

async function Help({ sections }: { sections: NonNullable<Awaited<ReturnType<typeof getPublicRegistration>>>["sections"] }) {
  const identity = await getPublicSiteIdentity();
  const contact = identity.contacts.find((item) => item.kind === "instagram");
  return <RegistrationHelp sections={sections} contact={contact} />;
}

function HelpSkeleton() {
  return <section role="status" aria-label="Memuat bantuan pendaftaran" className="bg-background px-8 py-12 md:px-20 md:py-20"><div aria-hidden="true" className="mx-auto max-w-6xl motion-safe:animate-pulse"><div className="h-9 w-56 rounded-md bg-muted" /><div className="mt-6 divide-y divide-border border-y border-border">{[0, 1, 2].map((item) => <div key={item} className="py-6"><div className="h-6 w-3/4 rounded-md bg-muted" /></div>)}</div><div className="mt-10 h-20 w-full max-w-lg rounded-md bg-muted" /></div></section>;
}
