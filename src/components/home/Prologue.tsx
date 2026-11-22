import { SITE } from "@/lib/site";

export function Prologue() {
  return (
    <section id="prologue" aria-label="A note from our founder">
      <div className="wrap founder-note">
        <figure data-reveal=""><img loading="lazy" decoding="async" src="/editorial/arrival.webp" alt="A warmly lit entrance and gardens at dusk" /></figure>
        <div data-reveal="">
          <p className="eyebrow">Prologue</p>
          <blockquote>“Distance should never stand between a person and the <em>care they need.</em> We bring you to the right doctor in India, and we look after the people who come with you, until everyone is home and well.”</blockquote>
          <div className="signature">
            <cite><b>{SITE.founder}</b>Founder, Medtours</cite>
            <button type="button" className="atlas-link" data-open="enquire">Speak to our team <span aria-hidden="true">↗</span></button>
          </div>
        </div>
      </div>
    </section>
  );
}
