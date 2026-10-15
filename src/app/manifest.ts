import type { MetadataRoute } from "next";
import { brandManifestIcons } from "@/server/cms/brand-assets";
import { getPublicSiteIdentity } from "@/server/cms/public-readers";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const identity = await getPublicSiteIdentity();
  return { id: "/", name: identity.title, short_name: "MOKA Garut", description: identity.description, lang: "id", start_url: "/", display: "standalone", icons: brandManifestIcons(identity.assets) };
}
