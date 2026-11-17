import type { Metadata } from "next";
import Link from "next/link";
import { TREATMENTS } from "@/lib/site";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";

export const metadata: Metadata = {
  title: "Treatments",
  description: "Medical, surgical, dental and rehabilitation care, plus longevity and holistic wellness programmes, at accredited hospitals in India.",
  alternates: { canonical: "/treatments" },
};

const GROUPS = [
  { key: "Clinical", title: "Clinical care", lead: "Diagnosis, surgery, dental work and recovery, with senior specialists at NABH and JCI accredited hospitals." },
  { key: "Wellness", title: "Wellness", lead: "Screening and restorative programmes for staying well, with physicians overseeing every plan." },
] as const;

export default function TreatmentsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ href: "/treatments", label: "Treatments" }]}
        eyebrow="Medical & wellness"
        title={<>The care <em>we</em> arrange</>}
        lead="Four clinical services and two wellness programmes. Whatever brings you to India, a doctor on our team reads your reports first and suggests where to go."
        art="/renders/care-orbit.jpg"
        artAlt="A soft white medical cross circled by an orbit"
      >
        <button className="btn btn-solid mag" data-open="enquire" type="button"><span className="dot" />Get a Treatment Quote</button>
        <Link className="btn btn-ghost mag" href="/#journey">How it works</Link>
      </PageHero>

      {GROUPS.map((g, gi) => (
        <section key={g.key} className={`band pad ${gi ? "b-white" : "b-paper"}`}>
          <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
          <div className="wrap">
            <div className="sec-head">
              <h2 data-split-scroll="">{g.title}</h2>
              <p className="lead">{g.lead}</p>
            </div>
            <div className="tgrid">
              {TREATMENTS.filter((t) => t.group === g.key).map((t) => (
                <Link key={t.slug} className="tcard" href={`/treatments/${t.slug}`} data-reveal="">
                  <div className="plate render"><img className="art" src={t.render} alt={t.alt} /></div>
                  <div className="tmeta">
                    <h3>{t.name}</h3>
                    <span className="arrow" aria-hidden="true">→</span>
                  </div>
                  <p>{t.summary}</p>
                  <ul className="chips">{t.areas.slice(0, 4).map((a) => <li key={a.name}>{a.name}</li>)}</ul>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      <CtaBand />
    </>
  );
}
