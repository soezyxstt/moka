import Image from 'next/image';
import Link from 'next/link';

type FinalistCardProps = {
  signature?: string;
  src: string;
  name: string;
  no: string;
  catt: string;
  href: string;
};

export function FinalistCard({ src, name, catt, no, href, signature }: FinalistCardProps) {
  const [firstName, ...restName] = name.split(' ');
  return (
    <Link href={href} data-reveal="" className="group relative aspect-square overflow-hidden rounded-md">
      <Image
        src={src}
        alt={name}
        width={300}
        height={400}
        priority
        className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-102"
      />
      <div className="absolute bottom-0 w-full text-canvas transition-all duration-500 group-hover:opacity-0">
        <div className="leading-tight bg-gradient-to-t from-ink/90 to-transparent p-6">
          <div className="flex justify-between text-2xl font-bold">
            <p>{catt}</p>
            <p>{firstName}</p>
          </div>
          <div className="flex justify-between text-2xl">
            <p>{no}</p>
            <p>{restName.join(' ')}</p>
          </div>
        </div>
        {signature ? <div className="min-h-6 w-full bg-gradient-to-r from-highlight via-highlight-200 to-highlight px-4 py-1 text-center text-[10px] leading-4 text-ink"><p>{signature}</p></div> : null}
      </div>
    </Link>
  );
}
