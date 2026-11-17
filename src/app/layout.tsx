import type { Metadata, Viewport } from "next";
import { Cormorant, DM_Mono, Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EnquiryModal } from "@/components/site/EnquiryModal";
import { Intro } from "@/components/site/Intro";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { SiteMotion } from "@/components/site/SiteMotion";
import { SvgDefs } from "@/components/site/Logo";
import "@/styles/site.css";
import "@/styles/pages.css";

const cormorant = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-jakarta", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Medtours · Medical travel to India", template: "%s · Medtours" },
  description: SITE.description,
  applicationName: "Medtours",
  openGraph: {
    type: "website",
    siteName: "Medtours",
    title: "Medtours · Heal With Experience",
    description: SITE.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Medtours · Heal With Experience" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F7F9FD",
  colorScheme: "light",
  viewportFit: "cover",
};

// Runs before paint: hides the opening screen until the logo intro plays, so nothing flashes.
const introBoot = `(function(){try{if('scrollRestoration' in history)history.scrollRestoration='manual';if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.classList.add('js-intro');window.__introFail=setTimeout(function(){document.documentElement.classList.remove('js-intro')},7000);}catch(e){}})();`;

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Medtours",
  slogan: SITE.tagline,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${instrument.variable} ${jakarta.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introBoot }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <SvgDefs />
        <Intro />
        <Header />
        <main id="top">{children}</main>
        <Footer />
        <EnquiryModal />
        <SmoothScroll />
        <SiteMotion />
      </body>
    </html>
  );
}
