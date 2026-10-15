"use client";

import "./globals.css";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/custom/button";
import { SiteStatus } from "@/components/custom/site-status";
import { inter, manrope } from "@/style/font";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body className={`${manrope.variable} ${inter.variable} font-inter antialiased`}>
        <title>Terjadi kendala | MOKA Garut</title>
        <SiteStatus
          visual={<CircleAlert strokeWidth={0.75} className="size-32 text-highlight-700 md:size-48" />}
          title="Situs tidak dapat dimuat"
          description="Coba lagi atau kembali ke beranda."
        >
          <Button size="lg" onClick={() => retry()}><RotateCcw className="mr-2 size-4" aria-hidden />Coba lagi</Button>
          <Button asChild variant="outline" size="lg" className="text-brand">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Recovery must work without the root router. */}
            <a href="/">Ke beranda</a>
          </Button>
        </SiteStatus>
      </body>
    </html>
  );
}
