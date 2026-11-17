import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";
import { LogoMark } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "About us",
  description: "Medtours is a doctor-led medical travel team helping international patients and their families get treatment in India.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  { t: <>Clinical <em>excellence</em></>, p: "We only suggest NABH or JCI accredited hospitals, and specialists chosen for your condition." },
  { t: <>Cost <em>transparency</em></>, p: "You get an itemised estimate before you travel. If the plan changes, you see the new figure first." },
  { t: <>Zero <em>wait times</em></>, p: "Consultations and treatment dates arranged in days, so you are not left waiting on a list." },
  { t: <>End-to-end <em>hospitality</em></>, p: "Visa letters, flights, airport pickup, a place to stay and an interpreter, for you and your family." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ href: "/about", label: "About us" }]}
        eyebrow="About Medtours"
        title={<>A doctor on <em>your</em> side</>}
        lead="Medtours helps people from the Gulf, Africa, Asia and beyond get treatment in India, and looks after the family members who travel with them."
      />

      <section className="band b-white pad">
        <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
        <div className="wrap founder">
          {/* Replace this plate with a portrait of Dr. Ravi Teja when available: <img className="art" src="/team/ravi-teja.jpg" alt="Dr. Ravi Teja" /> */}
          <div className="plate navy founder-art" data-reveal="">
            <LogoMark className="founder-mark" />
          </div>
          <div className="founder-txt">
            <p className="eyebrow gap">Who we are</p>
            <h2 data-split-scroll="">Led by {SITE.founder}</h2>
            <p className="lead">
              Medtours is led by {SITE.founder}. The idea behind it is simple: international patients should have a doctor guiding their choice of
              hospital and specialist, and a team that takes care of everything around the treatment.
            </p>
            <p className="lead">
              Every enquiry starts with your reports. A doctor on our team reviews them, shortlists accredited hospitals and senior specialists, and
              sends you an itemised estimate. From there, one coordinator stays with you from the visa application to your follow-up calls at home.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-ghost mag" href="/contact">Contact the team</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band b-paper pad promises">
        <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
        <div className="wrap">
          <div className="top">
            <div>
              <p className="eyebrow gap">How we work</p>
              <h2 data-split-scroll="">What we <em>promise</em></h2>
            </div>
            <p className="lead">Four commitments we hold to on every case, whatever the treatment.</p>
          </div>
          {PRINCIPLES.map((x, i) => (
            <div className="prow" key={i} data-reveal="">
              <h3>{x.t}</h3>
              <p>{x.p}</p>
              <span className="ic mono">{String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="band b-peri pad">
        <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
        <div className="wrap split">
          <div>
            <p className="eyebrow gap">Two journeys</p>
            <h2 data-split-scroll="">Patients <em>and</em> attenders</h2>
          </div>
          <div className="two-cards">
            <div className="icard" data-reveal="">
              <span className="mono">For the patient</span>
              <p>Treatment planning, second opinions, help with the e-Medical visa, and recovery support after you return home.</p>
            </div>
            <div className="icard" data-reveal="">
              <span className="mono">For the attender</span>
              <p>Flights, the attendant visa, a stay near the hospital, a local concierge and daily updates from the care team.</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
