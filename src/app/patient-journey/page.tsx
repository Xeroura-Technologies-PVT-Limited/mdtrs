import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";
import { JourneyTimeline } from "@/components/page/JourneyTimeline";
import { Journeys } from "@/components/home/Journeys";
import "@/styles/atlas-home.css";

export const metadata: Metadata = {
  title: "Patient journey", description: "Follow your medical journey to India from report review and a video consultation to arrival, treatment and recovery at home.",
  alternates: { canonical: "/patient-journey" },
};
export default function PatientJourneyPage() {
  return <>
    <PageHero crumbs={[{ href: "/patient-journey", label: "Patient journey" }]} eyebrow="Medical travel to India"
      title={<>Your patient <em>journey</em></>} lead="One coordinator follows every step, for the patient and the attender." />
    <JourneyTimeline /><div className="atlas-content"><Journeys /></div><CtaBand />
  </>;
}
