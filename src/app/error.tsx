"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/custom/button";
import { SiteStatus } from "@/components/custom/site-status";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <SiteStatus
      badge="Kendala halaman"
      title="Halaman tidak dapat dimuat"
      description="Coba lagi atau kembali ke beranda."
    >
      <Button size="lg" className="bg-highlight font-semibold text-brand-950 hover:bg-highlight-300" onClick={() => retry()}>
        <RotateCcw className="mr-2 size-4" aria-hidden />Coba lagi
      </Button>
      <Button asChild variant="outline" size="lg" className="border-highlight/40 text-on-media hover:border-highlight hover:bg-highlight/15 hover:text-on-media">
        <Link href="/">Ke beranda</Link>
      </Button>
    </SiteStatus>
  );
}
