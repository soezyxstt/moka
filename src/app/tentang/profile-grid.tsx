"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ProfileCard } from "./profile-card";
import { Button } from "@/components/ui/button";

type Profile = {
  imageUrl: string;
  name: string;
  position: string;
  gender: "L" | "P";
};

export default function ProfileGrid({
  data,
  showOnDesktop = 6,
  showOnMobile = 3,
  isRight = false,
}: {
  data: Profile[];
  showOnMobile: number;
  showOnDesktop: number;
  isRight?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const canExpand = data.length > Math.min(showOnMobile, showOnDesktop);

  if (!data.length) {
    return <p className="relative rounded-xl border border-dashed border-brand-200 bg-canvas/55 px-6 py-10 text-center font-inter text-sm text-body">Belum ada profil yang ditampilkan.</p>;
  }

  return (
    <div className="relative">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
        {data.map((item, index) => (
          <div
            key={`${item.name}-${item.position}`}
            className={cn(
              !showAll && index >= showOnMobile && "max-md:hidden",
              !showAll && index >= showOnDesktop && "md:hidden",
            )}
          >
            <ProfileCard {...item} ornamentId={item.name} />
          </div>
        ))}
      </div>
      {canExpand ? (
        <Button
          variant="link"
          type="button"
          onClick={() => setShowAll((current) => !current)}
          aria-expanded={showAll}
          className={cn("group mt-4 flex h-auto w-fit items-center gap-2 p-0 font-inter text-base font-semibold text-brand transition-colors hover:text-brand-700 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-400 focus-visible:ring-offset-4", isRight && "ml-auto")}
        >
          {showAll ? "Tampilkan lebih sedikit" : "Lihat semua"}
          <ArrowRight className={cn("size-5 transition-transform", showAll ? "-rotate-90" : "group-hover:translate-x-1")} />
        </Button>
      ) : null}
    </div>
  );
}
