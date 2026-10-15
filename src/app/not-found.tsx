import Link from "next/link";
import { Button } from "@/components/custom/button";
import { ArrowRight } from "lucide-react";
import { SiteStatus } from "@/components/custom/site-status";

export const metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <SiteStatus
      visual={<span>4<span className="text-highlight-700">0</span>4</span>}
      title="Halaman tidak ditemukan"
      description="Periksa alamat halaman atau kembali ke beranda."
    >
      <Button asChild size="lg"><Link href="/">Kembali ke beranda<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button>
      <Link href="/galeri" className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Jelajahi galeri</Link>
    </SiteStatus>
  );
}
