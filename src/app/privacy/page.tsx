import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { PageHero } from "@/components/page/PageHero";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How Medtours collects, uses and protects the personal and medical information you share with us.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero crumbs={[{ href: "/privacy", label: "Privacy" }]} eyebrow="Last updated November 2026" title="Privacy notice" />
      <section className="band b-white pad">
        <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
        <div className="wrap">
          <div className="prose">
            <p>
              This notice explains what information Medtours ({SITE.domain}) collects when you contact us, how we use it, and the choices you have.
              Because enquiries often include medical reports, we treat everything you share as confidential.
            </p>
            <h2>What we collect</h2>
            <ul>
              <li>Contact details: your name, country, phone or WhatsApp number and email address.</li>
              <li>Health information you choose to share: a description of your condition and any medical reports you attach.</li>
              <li>Travel details we need to arrange your visit, such as passport details for visa letters, collected only once you decide to go ahead.</li>
            </ul>
            <h2>How we use it</h2>
            <ul>
              <li>To review your case and prepare treatment options and an estimate.</li>
              <li>To share your reports with the hospitals and specialists we suggest, so they can advise on your treatment.</li>
              <li>To arrange visas, travel, accommodation and follow-up care that you ask us to arrange.</li>
            </ul>
            <p>We do not sell your information or use your medical details for marketing.</p>
            <h2>Who we share it with</h2>
            <p>
              Your information is shared only with the hospitals, doctors and travel providers involved in your care, and with service providers who
              help us run this website and our email, each bound to keep it confidential.
            </p>
            <h2>How long we keep it</h2>
            <p>We keep enquiry records for as long as needed to provide and follow up on your care, and then delete them or ask you before keeping them longer.</p>
            <h2>Your choices</h2>
            <p>
              You can ask us at any time to see, correct or delete the information we hold about you, or to stop contacting you. Write to{" "}
              <b style={{ userSelect: "all" }}>{SITE.email}</b> or call <b style={{ userSelect: "all" }}>{SITE.phone}</b>.
            </p>
            <h2>Medical disclaimer</h2>
            <p>Information on this website is general and is not a substitute for advice from your own doctor.</p>
          </div>
        </div>
      </section>
    </>
  );
}
