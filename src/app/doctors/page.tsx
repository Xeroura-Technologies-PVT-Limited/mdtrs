import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { SiteLink } from "@/components/site/SiteLink";
import { SiteAccountLink } from "@/components/site/SiteAccountLinks";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";

export const metadata: Metadata = {
  title: "Doctors", description: "Meet the doctor-led approach behind your report review, specialist consultation and follow-up care.",
  alternates: { canonical: "/doctors" },
};
export default function DoctorsPage() {
  return <>
    <PageHero crumbs={[{ href: "/doctors", label: "Doctors" }]} eyebrow="Doctor-led planning"
      title={<>A doctor for <em>your journey</em></>} lead="A physician reads your reports before a hospital is suggested. You can speak with your treating specialist by video before you decide.">
      <SiteAccountLink doctor="patients" patient="reports">
        <SiteLink className="btn btn-ghost" href="/login/doctor">Doctor login</SiteLink>
      </SiteAccountLink>
    </PageHero>
    <section className="band b-white pad"><div className="wrap founder">
      <figure className="founder-art" data-reveal=""><img src="/editorial/consultation.webp" alt="A light-filled consultation room ready for a guest visit" width={1200} height={800} loading="lazy" /></figure>
      <div className="founder-txt"><p className="eyebrow gap" data-reveal="">Founder, Medtours</p><h2 data-reveal="">{SITE.founder}</h2>
        <p className="lead">Medtours is led by {SITE.founder}. A doctor on the team reviews your history and shortlists hospitals and senior specialists for your condition.</p>
        <div className="hero-cta"><SiteLink className="btn btn-ghost" href="/about">About Medtours</SiteLink></div>
      </div></div></section><CtaBand />
  </>;
}
