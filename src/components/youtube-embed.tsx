'use client';

import LiteYouTubeEmbed from 'react-lite-youtube-embed';

export default function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <LiteYouTubeEmbed
      id={id}
      title={title}
      iframeClass="rounded-lg"
      // wrapperClass="w-full max-w-3xl my-8"
      // params="modestbranding=1&rel=0&showinfo=0"
    />
  );
}