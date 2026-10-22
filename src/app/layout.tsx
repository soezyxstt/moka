import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Navbar } from '@/components/navbar';
import Footer from '@/components/footer';
import { inter, manrope } from '@/style/font';
import { ScrollToTopButton } from '@/components/scroll-to-top';
import Lenis from '@/components/lenis';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { Toaster } from '@/components/ui/sonner';
import Script from "next/script";
import { SiteChrome } from '@/components/site-chrome';
import { getPreviewEditionId } from '@/server/cms/preview';
import { stopPreviewAction } from '@/app/admin/content/editions/preview-actions';
import { Button } from '@/components/custom/button';
import { getPublicNavigation, getPublicSiteIdentity } from '@/server/cms/public-readers';
import { brandMetadata, resolveBrandLogos } from '@/server/cms/brand-assets';
import { AdminBrandProvider } from '@/components/admin/branding';
import { env } from '@/env';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getPublicSiteIdentity();
  const branding = brandMetadata(identity.assets);
  return {
  ...branding,
  metadataBase: new URL(new URL(env.BASE_URL).origin),
  ...(await getPreviewEditionId() ? { robots: { index: false, follow: false } } : {}),
  title: {
    default: identity.title,
    template: "%s | MOKA Garut",
  },
  description: identity.description,
  openGraph: { ...branding.openGraph, title: identity.title, description: identity.description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navigation = await getPublicNavigation();
  const identity = await getPublicSiteIdentity();
  const logos = resolveBrandLogos(identity.assets, identity.edition);

  return (
    <html lang="id" data-edition-year={navigation.edition.year} style={identity.palette ? { '--palette-dark': identity.palette.dark, '--palette-light': identity.palette.light } as CSSProperties : undefined} suppressHydrationWarning>
      {/* Google Analytics Tag */}
      <Script
        async
        strategy='afterInteractive'
        src="https://www.googletagmanager.com/gtag/js?id=G-SW6MQS7GD4"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SW6MQS7GD4');
          `,
        }}
      />
      <body
        className={`${manrope.variable} ${inter.variable} antialiased font-inter`}
      >
        {await getPreviewEditionId() ? <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-4 bg-brand-900 p-3 text-sm text-canvas"><span>Pratinjau edisi {navigation.edition.year}, hanya untuk admin</span><form action={stopPreviewAction}><Button type="submit" size="sm">Tutup pratinjau</Button></form></div> : null}
        <AdminBrandProvider value={{ title: identity.title, slogan: navigation.edition.slogan, logo: logos.mobile, background: identity.assets['site.profile.bg']?.url ?? null }}>
        <SiteChrome
          top={
            <>
              <Navbar participantKind={navigation.participantKind} registrationVisible={navigation.registrationVisible} categories={navigation.categories} events={navigation.events} resultsVisible={navigation.resultsVisible} edition={navigation.edition} desktopLogo={logos.desktop} mobileLogo={logos.mobile} />
              <Lenis />
            </>
          }
          bottom={
            <>
              <ScrollToTopButton />
              <Footer participantKind={navigation.participantKind} registrationVisible={navigation.registrationVisible} categories={navigation.categories} events={navigation.events} edition={navigation.edition} logo={logos.footer} aboutDescription={navigation.aboutDescription} resultsVisible={navigation.resultsVisible} contacts={identity.contacts} signature={identity.signature} />
            </>
          }
        >
          {children}
        </SiteChrome>
        </AdminBrandProvider>
        <Toaster />
      </body>
    </html>
  );
}
