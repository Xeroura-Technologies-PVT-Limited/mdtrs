import { SiteLink as Link } from "@/components/site/SiteLink";
import { TREATMENTS, type Treatment } from "@/lib/site";

export function TreatmentCards({ group }: { group: Treatment["group"] }) {
  return (
    <div className="tgrid">
      {TREATMENTS.filter((t) => t.group === group).map((t) => (
        <Link key={t.slug} className="tcard" href={`/treatments/${t.slug}`} data-reveal="">
          <div className="plate"><img className="art" {...t.photo} alt={t.photo.alt} sizes="(max-width: 560px) 94vw, (min-width: 1600px) 680px, 45vw" loading="lazy" /></div>
          <div className="tmeta">
            <h3>{t.name}</h3>
            <span className="arrow" aria-hidden="true">→</span>
          </div>
          <p>{t.summary}</p>
          <ul className="chips">{t.areas.slice(0, 4).map((a) => <li key={a.name}>{a.name}</li>)}</ul>
        </Link>
      ))}
    </div>
  );
}
