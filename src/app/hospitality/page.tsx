import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { SiteLink } from "@/components/site/SiteLink";
import { CtaBand } from "@/components/page/CtaBand";

export const metadata: Metadata = {
  title: "Hospitality", description: "Accommodation, airport pickup, meals and interpreter support for guests and companions in India.",
  alternates: { canonical: "/hospitality" },
};
export default function HospitalityPage() {
  return <>
    <PageHero crumbs={[{ href: "/hospitality", label: "Hospitality" }]} eyebrow="Hospitality in India" title={<>A place to <em>rest</em></>}
      lead="Comfortable rooms close to the hospital, sized to the length of treatment. We can help arrange pickup, meals, local transport, and an interpreter." />
    <section className="band b-white pad"><div className="wrap founder">
      <figure className="founder-art" data-reveal=""><img src="/editorial/hospitality.webp" alt="A warm guest room with a window overlooking trees" width={1200} height={800} loading="lazy" /></figure>
      <div className="founder-txt"><p className="eyebrow gap">For family &amp; friends</p><h2>A stay <em>nearby</em></h2>
        <p className="lead">Flights, the e-Medical Attendant visa, a stay near the hospital, a local concierge and daily updates from the care team.</p>
        <div className="hero-cta"><SiteLink className="btn btn-ghost" href="/#journeys" journeyRole="attender">Explore companion support</SiteLink></div>
      </div></div></section><CtaBand />
  </>;
}
