import type { Metadata } from "next";
import { SiteLink as Link } from "@/components/site/SiteLink";
import { SiteAccountLink } from "@/components/site/SiteAccountLinks";
import { TreatmentCards } from "@/components/page/TreatmentCards";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";
import { carePhotos } from "@/lib/care-photos";

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
        photo={carePhotos.video}
      >
        <button className="btn btn-solid" data-open="enquire" type="button">Get a Treatment Quote</button>
        <SiteAccountLink doctor="hospitals" patient="journey">
          <Link className="btn btn-ghost" href="/#journey">How it works</Link>
        </SiteAccountLink>
      </PageHero>

      {GROUPS.map((g, gi) => (
        <section key={g.key} className={`band pad ${gi ? "b-white" : "b-paper"}`}>
          <div className="wrap">
            <div className="sec-head">
              <h2>{g.title}</h2>
              <p className="lead">{g.lead}</p>
            </div>
            <TreatmentCards group={g.key} />
          </div>
        </section>
      ))}

      <CtaBand />
    </>
  );
}
