import { SITE } from "@/lib/site";

/** Closing call to action used at the foot of inner pages. */
export function CtaBand({ title, lead, care }: { title?: React.ReactNode; lead?: string; care?: string }) {
  return (
    <section className="band b-white pad cta cta-band">
      <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
      <div className="wrap">
        <h2 data-split-scroll="">{title ?? <>Heal <em>with</em> experience</>}</h2>
        <p className="lead">{lead ?? "Share your reports and receive a doctor-reviewed plan and an itemised estimate within 48 hours."}</p>
        <div className="ctas">
          <button className="btn btn-solid mag" data-open="enquire" data-care={care} type="button">
            <span className="dot" />
            Get a Treatment Quote
          </button>
          <a className="btn btn-ghost mag" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp {SITE.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
