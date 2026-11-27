import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";
import { JourneyTimeline } from "@/components/page/JourneyTimeline";
import { Journeys } from "@/components/home/Journeys";
import { SiteLink } from "@/components/site/SiteLink";
import { SiteAccountLink } from "@/components/site/SiteAccountLinks";
import "@/styles/atlas-home.css";

export const metadata: Metadata = {
  title: "Care journey", description: "Follow your medical journey to India from report review and a video consultation to arrival, treatment and recovery at home.",
  alternates: { canonical: "/patient-journey" },
};
export default function PatientJourneyPage() {
  return <>
    <PageHero crumbs={[{ href: "/patient-journey", label: "Care journey" }]} eyebrow="Medical travel to India"
      title={<>Your care <em>journey</em></>} lead="One coordinator follows every step, for the guest and the companion.">
      <SiteAccountLink doctor="patients" patient="intake">
        <SiteLink className="btn btn-ghost" href="/login/patient">Patient login</SiteLink>
      </SiteAccountLink>
    </PageHero>
    <JourneyTimeline /><div className="atlas-content"><Journeys /></div><CtaBand />
  </>;
}
