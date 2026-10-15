'use client';

import Image from 'next/image';
import { useMediaQuery } from 'usehooks-ts';

type ImageMaskFadeProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  imgClassName?: string;
};

export default function ImageMaskFade({ src, alt, width, height, fill, className, imgClassName, ...props }: ImageMaskFadeProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const maskStyle: React.CSSProperties = isMobile
    ? {
        maskImage: 'var(--portrait-mask-mobile)',
        WebkitMaskImage: 'var(--portrait-mask-mobile)',
      }
    : {
        maskImage: 'var(--portrait-mask-desktop)',
        WebkitMaskImage: 'var(--portrait-mask-desktop)',
      };

  return (
    <div className={`relative z-0 ${className || ''}`}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        style={maskStyle}
        className={`block ${imgClassName || ''}`}
        {...props}
      />
    </div>
  );
}
