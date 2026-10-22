import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicRegistration, getPublicSiteIdentity } from "@/server/cms/public-readers";
import { RegistrationPage } from "./registration-page";

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
  const identity = await getPublicSiteIdentity();
  const contact = identity.contacts.find((item) => item.kind === "instagram");
  return <RegistrationPage sections={content.sections} contact={contact} />;
}
