import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { SiteAccountLink } from "@/components/site/SiteAccountLinks";
import { Hospitals } from "@/components/home/Hospitals";
import { CtaBand } from "@/components/page/CtaBand";
import "@/styles/atlas-home.css";

export const metadata: Metadata = {
  title: "Hospitals", description: "How Medtours selects accredited hospitals in India for your treatment plan.",
  alternates: { canonical: "/hospitals" },
};
export default function HospitalsPage() {
  return <>
    <PageHero crumbs={[{ href: "/hospitals", label: "Hospitals" }]} eyebrow="Our hospital network"
      title={<>Hospitals <em>in India</em></>} lead="A doctor on our team reviews your reports and shortlists accredited hospitals and senior specialists for your condition.">
      <SiteAccountLink doctor="doctors" patient="journey" />
    </PageHero>
    <div className="atlas-content"><Hospitals contactHref="/contact#contact-form" /></div><CtaBand />
  </>;
}
