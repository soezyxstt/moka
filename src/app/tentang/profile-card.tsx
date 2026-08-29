// src/components/ProfileCard.tsx (or your preferred path)
import Image from 'next/image';
import React,
{
  // useEffect,
  // useState,
  useMemo
} from 'react';

// --- Props Interface ---
export interface ProfileCardProps {
  imageUrl: string;
  name: string;
  position: string;
  // Optional unique key for stable ornament selection on re-renders if needed,
  // otherwise, it will be random on each mount.
  // If you pass the same id to multiple cards, they will have the same ornament.
  // Best to use a unique ID from your data, e.g., person.id
  ornamentId?: string | number;
}

// --- Ornament Types & Components ---
type OrnamentType = 'circles' | 'lines' | 'swirl' | 'diamonds' | 'dots';

const ornamentTypes: OrnamentType[] = ['circles', 'lines', 'swirl', 'diamonds', 'dots'];

interface OrnamentProps {
  type: OrnamentType;
  className?: string;
  color?: string; // e.g., 'text-dgb-300', 'text-gray-300'
}

const BackgroundOrnament: React.FC<OrnamentProps> = ({ type, className, color = "text-white/30" }) => {
  // Using a more subtle color for the ornaments, like a semi-transparent white or light gray
  // Or a lighter shade of dgb, e.g., text-dgb-100/50
  const baseClasses = `absolute inset-0 w-full h-full opacity-50 ${color} ${className || ''}`;

  switch (type) {
    case 'circles':
      return (
        <svg className={baseClasses} width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" opacity="1" />
          <circle cx="150" cy="50" r="20" stroke="currentColor" strokeWidth="2" opacity="1" />
          <circle cx="100" cy="150" r="30" stroke="currentColor" strokeWidth="2" opacity="1" />
          <circle cx="30" cy="170" r="15" stroke="currentColor" strokeWidth="2" opacity="1" />
          <circle cx="170" cy="130" r="25" stroke="currentColor" strokeWidth="2" opacity="15" />
        </svg>
      );
    case 'lines':
      return (
        <svg className={baseClasses} width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="20" x2="200" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <line x1="20" y1="0" x2="20" y2="200" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" opacity="1" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1" opacity="1" />
          <line x1="0" y1="180" x2="200" y2="180" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <line x1="180" y1="0" x2="180" y2="200" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <line x1="40" y1="40" x2="160" y2="160" stroke="currentColor" strokeWidth="1" opacity="1" />
          <line x1="160" y1="40" x2="40" y2="160" stroke="currentColor" strokeWidth="1" opacity="1" />
        </svg>
      );
    case 'swirl': // A simple swirl/wave pattern
      return (
        <svg className={baseClasses} width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 100 Q 50 20, 100 100 T 190 100" stroke="currentColor" strokeWidth="2" fill="none" opacity="1" />
          <path d="M10 120 Q 50 40, 100 120 T 190 120" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="1" />
          <path d="M10 80 Q 50 180, 100 80 T 190 80" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="1" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg className={baseClasses} width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 10 L140 50 L100 90 L60 50 Z" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <path d="M50 70 L90 110 L50 150 L10 110 Z" stroke="currentColor" strokeWidth="1.5" opacity="1" />
          <path d="M150 70 L190 110 L150 150 L110 110 Z" stroke="currentColor" strokeWidth="1.5" opacity="1" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={baseClasses} width="100%" height="100%" viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {[...Array(10)].map((_, i) =>
            [...Array(10)].map((_, j) => (
              <circle key={`${i}-${j}`} cx={15 + i * 20} cy={15 + j * 20} r="1.5" opacity={(i * j % 5 + 1) * 0.1} />
            ))
          )}
        </svg>
      );
    default:
      return null;
  }
};

// --- Main ProfileCard Component ---
export const ProfileCard: React.FC<ProfileCardProps> = ({ imageUrl, name, position, ornamentId }) => {
  // Memoize the selected ornament type to prevent it from changing on every re-render
  // unless ornamentId changes (or if ornamentId is not provided, it's random on mount).
  const selectedOrnamentType = useMemo(() => {
    if (typeof ornamentId !== 'undefined' && ornamentId !== null) {
      // Simple hashing function to get a somewhat consistent index based on id
      let hash = 0;
      const strId = String(ornamentId);
      for (let i = 0; i < strId.length; i++) {
        const char = strId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return ornamentTypes[Math.abs(hash) % ornamentTypes.length];
    }
    // Fallback to fully random if no id is provided
    return ornamentTypes[Math.floor(Math.random() * ornamentTypes.length)];
  }, [ornamentId]);


  return (
    <div className="rounded-lg p-4 sm:p-6 flex flex-col w-full max-w-xs mx-auto isolate font-montserrat">
      {/* Image container with ornament */}
      <div className="relative bg-[url(/organo-bg.png)] bg-cover w-full aspect-square mb-4 overflow-hidden">
        {/* Background Ornament */}
        <BackgroundOrnament type={selectedOrnamentType} color="text-white" />

        {/* Person's Image */}
        <div className="relative w-full h-full overflow-hidden z-10 md:p-6 p-4"> {/* Ensure image is above ornament */}
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover object-top" // Ensures the image covers the area, might crop
            sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 192px" // Adjust sizes based on your grid
          />
        </div>
      </div>

      {/* Name */}
      <h3 className="font-semibold mb-1 text-lg md:text-xl">
        {name}
      </h3>

      {/* Position */}
      <p className=" italic">
        {position}
      </p>
    </div>
  );
};
