import { SITE } from "@/lib/site";

/** Closing call to action used at the foot of inner pages. */
export function CtaBand({ title, lead, care }: { title?: React.ReactNode; lead?: string; care?: string }) {
  return (
    <section className="pad cta-band">
      <div className="wrap cta-band-in">
        <h2>{title ?? <>Heal <em>with</em> experience</>}</h2>
        <div>
          <p className="lead">{lead ?? "Share your reports and receive a doctor-reviewed plan and an itemised estimate within 48 hours."}</p>
          <div className="ctas">
            <button className="btn btn-solid" data-open="enquire" data-care={care} type="button">
              Get a Treatment Quote
            </button>
            <a className="btn btn-ghost" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              WhatsApp {SITE.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
