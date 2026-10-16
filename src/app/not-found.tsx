import Link from "next/link";
import { Button } from "@/components/custom/button";
import { ArrowRight } from "lucide-react";
import { SiteStatus } from "@/components/custom/site-status";

export const metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <SiteStatus
      badge="404"
      title="Halaman tidak ditemukan"
      description="Periksa alamat halaman atau kembali ke beranda."
    >
      <Button asChild size="lg">
        <Link href="/">Kembali ke beranda<ArrowRight className="ml-2 size-4" aria-hidden /></Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/galeri">Jelajahi galeri</Link>
      </Button>
    </SiteStatus>
  );
}
