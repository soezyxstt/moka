import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicRegistration } from "@/server/cms/public-readers";
import { RegistrationPage } from "./registration-page";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicRegistration();
  return { title: content?.sections.hero?.title || "Pendaftaran", description: content?.sections.hero?.body || undefined };
}

export default async function Page() {
  const content = await getPublicRegistration();
  if (!content) notFound();
  return <RegistrationPage year={content.edition.year} sections={content.sections} />;
}
