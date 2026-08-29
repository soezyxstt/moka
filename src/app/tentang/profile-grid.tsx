"use client";

import { ArrowRight } from 'lucide-react';
import { ProfileCard } from './profile-card';
import { useMediaQuery } from 'usehooks-ts';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ProfileGrid({ data, showOnDesktop = 6, showOnMobile = 3, isRight = false }: { data: { imageUrl: string, name: string, position: string }[], showOnMobile: number, showOnDesktop: number, isRight?: boolean }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showAll, setShowAll] = useState(false);

  const showedData = showAll ? data : data.slice(0, isMobile ? showOnMobile : showOnDesktop);

  const handleShowAll = () => {
    setShowAll(!showAll);
  }

  return (
    <>
      {
        data.length > 0 && (
          <>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-4">
              {showedData.map((item, i) => (
                <ProfileCard
                  key={i + '-profile-card-' + item.name}
                  imageUrl={item.imageUrl}
                  name={item.name}
                  position={item.position}
                  ornamentId={i} // Example id, replace with actual data
                />
              ))}
            </div>
            <p onClick={handleShowAll} className={cn("font-montserrat w-fit flex text-xl gap-2 isolate items-center font-medium group cursor-pointer hover:underline hover:text-dgb transition-all", isRight && "ml-auto place-self-end")}>
              {showAll ? "View less" : "View more"} <ArrowRight className={cn('w-6 h-6 group-hover:rotate-90 transition-transform', showAll && "group-hover:-rotate-90")} />
            </p>
          </>
        )}
      {
        data.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No profiles available</p>
          </div>
        )
      }

    </>
  )
}