import Image from 'next/image';
import { getPublicSiteIdentity } from '@/server/cms/public-readers';

export default async function BG({src}: {src?: string}) {
  const image = src ?? (await getPublicSiteIdentity()).assets['site.profile.bg']?.url;
  return (
    <div className="fixed w-full h-[100lvh] top-0 left-0 -z-1 bg-brand-900">
      {image ? <Image src={image} alt='' fill className="object-cover" /> : null}
    </div>
  );
}
