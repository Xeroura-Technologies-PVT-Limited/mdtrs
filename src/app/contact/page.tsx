import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { SiteLink } from "@/components/site/SiteLink";
import { ContactPortalCard } from "@/components/site/SiteAccountLinks";
import { PageHero } from "@/components/page/PageHero";
import { EnquiryForm } from "@/components/site/EnquiryForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send your reports for a doctor-reviewed plan and an itemised estimate, or call or WhatsApp the Medtours team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ href: "/contact", label: "Contact" }]}
        eyebrow="Talk to us"
        title={<>Start with <em>your</em> reports</>}
        lead="Tell us what you need and attach any reports you have. A doctor on our team reviews them and replies with hospital options and an itemised estimate, usually within 48 hours."
      ><SiteLink className="btn btn-ghost" href="#contact-form">Write to the team <span aria-hidden="true">↓</span></SiteLink></PageHero>
      <section className="band b-white pad">
        <div className="wrap contact-grid">
          <div className="contact-ways">
            <ContactPortalCard />
            <div className="way" data-reveal="">
              <span className="mono">Call or WhatsApp</span>
              <b style={{ userSelect: "all" }}>{SITE.phone}</b>
              <div className="way-links">
                <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
                <a href={SITE.phoneHref}>Call</a>
              </div>
            </div>
            <div className="way" data-reveal="">
              <span className="mono">Email</span>
              <b style={{ userSelect: "all" }}>{SITE.email}</b>
              <div className="way-links">
                <a href={`mailto:${SITE.email}`}>Write an email</a>
              </div>
            </div>
            <div className="way" data-reveal="">
              <span className="mono">What happens next</span>
              <ol className="next-steps">
                <li>A doctor reviews your reports.</li>
                <li>You receive hospital options and an itemised estimate.</li>
                <li>You can speak with the specialist by video before deciding.</li>
              </ol>
            </div>
          </div>
          <div className="form-card" id="contact-form" data-reveal="">
            <p className="eyebrow" style={{ marginBottom: 12 }}>Treatment quote</p>
            <h2 className="form-title">Tell us what you need</h2>
            <EnquiryForm idPrefix="c" />
          </div>
        </div>
      </section>
    </>
  );
}
