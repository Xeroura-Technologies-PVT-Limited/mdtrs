import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { TreatmentCards } from "@/components/page/TreatmentCards";
import { CtaBand } from "@/components/page/CtaBand";

export const metadata: Metadata = {
  title: "Wellness", description: "Explore longevity screening and holistic health programmes with physician oversight in India.",
  alternates: { canonical: "/wellness" },
};
export default function WellnessPage() {
  return <>
    <PageHero crumbs={[{ href: "/wellness", label: "Wellness" }]} eyebrow="Wellness in India"
      title={<>Time for <em>wellness</em></>} lead="Screening and restorative programmes for staying well, with physicians overseeing every plan." />
    <section className="band b-white pad"><div className="wrap"><div className="sec-head"><h2>Wellness <em>programmes</em></h2></div>
      <TreatmentCards group="Wellness" /></div></section><CtaBand />
  </>;
}
