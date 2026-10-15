import Image from "next/image";

export interface ProfileCardProps {
  imageUrl: string;
  name: string;
  position: string;
  ornamentId?: string | number;
  gender: "L" | "P";
}

type OrnamentType = "circles" | "lines" | "swirl" | "diamonds" | "dots";

const ornamentTypes: OrnamentType[] = ["circles", "lines", "swirl", "diamonds", "dots"];

function ornamentFor(value: string | number) {
  const hash = [...String(value)].reduce((total, char) => ((total << 5) - total) + char.charCodeAt(0), 0);
  return ornamentTypes[Math.abs(hash) % ornamentTypes.length];
}

function BackgroundOrnament({ type }: { type: OrnamentType }) {
  const className = "absolute inset-0 size-full text-canvas opacity-50";
  if (type === "circles") return <svg aria-hidden className={className} viewBox="0 0 200 200" fill="none"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" /><circle cx="150" cy="50" r="20" stroke="currentColor" strokeWidth="2" /><circle cx="100" cy="150" r="30" stroke="currentColor" strokeWidth="2" /><circle cx="30" cy="170" r="15" stroke="currentColor" strokeWidth="2" /><circle cx="170" cy="130" r="25" stroke="currentColor" strokeWidth="2" /></svg>;
  if (type === "lines") return <svg aria-hidden className={className} viewBox="0 0 200 200" fill="none"><path d="M0 20h200M20 0v200M0 100h200M100 0v200M0 180h200M180 0v200M40 40l120 120M160 40L40 160" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (type === "swirl") return <svg aria-hidden className={className} viewBox="0 0 200 200" fill="none"><path d="M10 100Q50 20 100 100t90 0M10 120Q50 40 100 120t90 0M10 80q40 100 90 0t90 0" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (type === "diamonds") return <svg aria-hidden className={className} viewBox="0 0 200 200" fill="none"><path d="m100 10 40 40-40 40-40-40ZM50 70l40 40-40 40-40-40ZM150 70l40 40-40 40-40-40Z" stroke="currentColor" strokeWidth="1.5" /></svg>;
  return <svg aria-hidden className={className} viewBox="0 0 200 200" fill="currentColor">{Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (__, column) => <circle key={`${row}-${column}`} cx={15 + row * 20} cy={15 + column * 20} r="1.5" opacity={((row * column) % 5 + 1) * 0.1} />))}</svg>;
}

export function ProfileCard({ imageUrl, name, position, ornamentId, gender }: ProfileCardProps) {
  const ornament = ornamentFor(ornamentId ?? `${name}-${position}`);

  return (
    <article className="group mx-auto flex w-full max-w-xs flex-col rounded-lg p-4 font-inter sm:p-6">
      <div className="relative mb-4 aspect-square w-full overflow-hidden bg-[url(/organo-bg.png)] bg-cover">
        <BackgroundOrnament type={ornament} />
        <Image src={imageUrl} alt={`${name}, ${position}`} fill className="relative z-10 object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width: 640px) 80vw, (max-width: 768px) 42vw, 24vw" />
      </div>
      <h3 className="mb-1 font-manrope text-lg font-semibold text-brand-900 md:text-xl">{gender === "L" ? "Kang" : "Teh"} {name}</h3>
      <p className="text-sm italic leading-6 text-body">{position}</p>
    </article>
  );
}
