import ParticipantProfile from '@/components/custom/participant-profile';
import { getPublicParticipantBySlug } from '@/server/cms/public-participant-readers';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ name: string, category: string }> }>) {
  const { name: name_, category: catt } = await params;
  const participant = await getPublicParticipantBySlug(catt, name_, 'finalis');
  if (!participant) {
    return {
      title: "Profil Finalis Tidak Ditemukan",
      description: "Profil finalis yang Anda cari tidak ditemukan pada edisi aktif.",
    };
  }

  return {
    title: `Profil ${participant.name} - ${participant.categoryName} ${participant.editionYear}`,
    ...(participant.imageUrl ? { openGraph: { images: [participant.imageUrl] } } : {}),
    description: `Profil finalis ${participant.name} pada kategori ${participant.categoryName} di Pasanggiri Mojang Jajaka Kabupaten Garut ${participant.editionYear}.`,
  };
}

export default async function DetailProfilPage({
  params,
}: Readonly<{
  params: Promise<{ name: string, category: string }>;
}>) {

  const { name, category: catt } = await params;
  const cmsParticipant = await getPublicParticipantBySlug(catt, name, 'finalis');
  if (!cmsParticipant) notFound();

  return <ParticipantProfile participant={cmsParticipant} kind="finalis" />;
}
