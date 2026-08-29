import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function SponsorItem({
  title,
  src,
  size,
  className
}: {
  title: string,
  src: string,
  size?: "sm" | "md" | "lg" | "xl",
  className?: string
}) {
  return (
    <div className="p-4 backdrop-blur-lg bg-white/20 rounded-lg grid place-items-center">
      <Image
        className={cn(
          'object-contain',
          size === "sm" && "w-32 h-20",
          size === "md" && "w-48 h-32",
          size === "lg" && "md:w-56 md:h-36 w-32 h-20",
          size === "xl" && "w-72 h-48",
          className
        )}
        src={src}
        width={400}
        height={200}
        alt={title}
      />
    </div>
  )
}