import { Hero } from "@/components/home/Hero";
import { Prologue } from "@/components/home/Prologue";
import { Promise as PromiseSection } from "@/components/home/Promise";
import { Marquee } from "@/components/home/Marquee";
import { Care } from "@/components/home/Care";
import { Journeys } from "@/components/home/Journeys";
import { Hospitals } from "@/components/home/Hospitals";
import { Journey } from "@/components/home/Journey";
import { Cities } from "@/components/home/Cities";
import { HomeFaq } from "@/components/home/HomeFaq";
import { Closing } from "@/components/home/Closing";
import "@/styles/atlas-home.css";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="atlas-content">
        <Care />
        <Prologue />
        <Journeys />
        <PromiseSection />
        <Hospitals showArrival />
        <Journey />
        <Cities />
        <HomeFaq />
        <Marquee />
        <Closing />
      </div>
    </>
  );
}
