import ParticipantProfile from '@/components/custom/participant-profile';
import { getPublicParticipantBySlug } from '@/server/cms/public-participant-readers';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ name: string, category: string }> }>) {
  const { name: name_, category: catt } = await params;
  const participant = await getPublicParticipantBySlug(catt, name_, 'semifinalis');
  if (!participant) {
    return {
      title: "Profil Semifinalis Tidak Ditemukan",
      description: "Profil semifinalis yang Anda cari tidak ditemukan pada edisi aktif.",
    };
  }

  return {
    title: `Profil ${participant.name} - ${participant.categoryName} ${participant.editionYear}`,
    alternates: { canonical: `/profil-semifinalis/${encodeURIComponent(participant.categorySlug)}/${encodeURIComponent(participant.slug)}` },
    ...(participant.imageUrl ? { openGraph: { images: [participant.imageUrl] } } : {}),
    description: `Profil semifinalis ${participant.name} pada kategori ${participant.categoryName} di Pasanggiri Mojang Jajaka Kabupaten Garut ${participant.editionYear}.`,
  };
}

export default async function DetailProfilPage({
  params,
}: Readonly<{
  params: Promise<{ name: string, category: string }>;
}>) {

  const { name, category: catt } = await params;
  const cmsParticipant = await getPublicParticipantBySlug(catt, name, 'semifinalis');
  if (!cmsParticipant) notFound();

  return <ParticipantProfile participant={cmsParticipant} kind="semifinalis" />;
}
