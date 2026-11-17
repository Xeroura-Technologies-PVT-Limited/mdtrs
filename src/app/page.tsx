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
import { HomeMotion } from "@/components/home/HomeMotion";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Prologue />
      <PromiseSection />
      <Marquee />
      <Care />
      <Journeys />
      <Hospitals />
      <Journey />
      <Cities />
      <HomeFaq />
      <Closing />
      <HomeMotion />
    </>
  );
}
