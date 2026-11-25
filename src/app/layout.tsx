import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EnquiryModal } from "@/components/site/EnquiryModal";
import { SiteMotion } from "@/components/site/SiteMotion";
import { NavigationMotion } from "@/components/site/NavigationMotion";
import { SvgDefs } from "@/components/site/Logo";
import { MotionStage } from "@/components/site/MotionStage";
import { addresses, resolveScene } from "@/lib/motion/scenes";
import { loaderDisplayMs, startIntroduction } from "@/lib/motion/intro";
import "@/styles/site.css";
import "@/styles/pages.css";
import "@/styles/navigation-motion.css";
import "@/styles/destination-motion.css";

const editorial = localFont({
  src: [
    { path: "../fonts/cormorant-latin.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-italic-latin.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-editorial",
  display: "swap",
});
const humanist = localFont({
  src: "../fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-humanist",
  display: "swap",
});
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
  themeColor: "#12302c",
  colorScheme: "light",
  viewportFit: "cover",
};

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
    <html lang="en" className={`${editorial.variable} ${humanist.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if((location.pathname.replace(/\\/+$/,"")||"/")!=="/")(${startIntroduction.toString()})((${resolveScene.toString()})(location.pathname,location.hash,${JSON.stringify(addresses)}),${loaderDisplayMs});` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <SvgDefs />
        <MotionStage />
        <NavigationMotion />
        <div id="site-content" suppressHydrationWarning>
          <a className="skip-link" href="#top">Skip to content</a>
          <Header />
          <main id="top" tabIndex={-1}>{children}</main>
          <Footer />
          <EnquiryModal />
          <SiteMotion />
        </div>
      </body>
    </html>
  );
}
