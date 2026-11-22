import { SiteLink as Link } from "@/components/site/SiteLink";
import { TREATMENTS, treatmentSources } from "@/lib/site";

const specialties: Record<string, string[]> = {
  medical: ["Cardiology", "Oncology", "Neurology", "Second opinion"],
  surgical: ["Cardiac surgery", "Joint replacement", "Spine", "Transplant"],
  dental: ["Implants", "Crowns & veneers", "Full-mouth rehab"],
  rehabilitation: ["Post-op physio", "Neuro rehab", "Sports injury"],
  longevity: ["Executive health check", "Cardiac risk screening", "Personal health plan"],
  "holistic-health": ["Ayurveda", "Yoga & meditation", "Recovery retreats"],
};

export function Care() {
  return (
    <section id="care" aria-labelledby="care-title">
      <div className="wrap">
        <div className="care-index-head">
          <div>
            <p className="eyebrow">Medical &amp; wellness</p>
            <h2 id="care-title">The care <em>we arrange</em></h2>
            <p className="lead">Four clinical services and two wellness programmes, each with its own specialists.</p>
          </div>
          <Link className="atlas-link" href="/treatments">All treatments <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="care-index">
          {TREATMENTS.map((t) => (
            <article className="care-card" key={t.slug} data-reveal="">
              <div className="care-cover">
                <img loading="lazy" decoding="async" src={t.render} srcSet={treatmentSources(t.render)} sizes="(max-width: 700px) 90vw, (max-width: 900px) 44vw, 29vw" alt={t.alt} />
                <span className="atlas-meta">{t.group}</span>
              </div>
              <h3>{t.name}</h3>
              <p>{t.summary}</p>
              <ul>{specialties[t.slug].map((s) => <li key={s}>{s}</li>)}</ul>
              <Link className="atlas-link" href={`/treatments/${t.slug}`}>{t.name} in detail <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
