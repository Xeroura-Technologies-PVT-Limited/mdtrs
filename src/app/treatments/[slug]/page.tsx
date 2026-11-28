import type { Metadata } from "next";
import { SiteLink as Link } from "@/components/site/SiteLink";
import { SiteAccountLink } from "@/components/site/SiteAccountLinks";
import { notFound } from "next/navigation";
import { TREATMENTS } from "@/lib/site";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return TREATMENTS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const t = TREATMENTS.find((x) => x.slug === slug);
  if (!t) return {};
  return { title: `${t.name} treatment in India`, description: t.summary, alternates: { canonical: `/treatments/${t.slug}` } };
}

export default async function TreatmentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const i = TREATMENTS.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const t = TREATMENTS[i];
  const next = TREATMENTS[(i + 1) % TREATMENTS.length];
  const others = TREATMENTS.filter((x) => x.slug !== t.slug);

  return (
    <>
      <PageHero
        crumbs={[{ href: "/treatments", label: "Treatments" }, { href: `/treatments/${t.slug}`, label: t.name }]}
        eyebrow={`${t.group} · ${String(i + 1).padStart(2, "0")} of 06`}
        title={t.name}
        lead={t.summary}
        photo={t.photo}
      >
        <button className="btn btn-solid" data-open="enquire" data-care={t.name} type="button">Get a Treatment Quote</button>
        <SiteAccountLink doctor="patients" patient="intake" />
      </PageHero>

      <section className="band b-white pad">
        <div className="wrap">
          <p className="intro-text" data-reveal="">{t.intro}</p>
          <div className="sec-head" style={{ marginTop: "clamp(64px,8vw,120px)" }}>
            <h2>What we <em>treat</em></h2>
          </div>
          <div className="areas">
            {t.areas.map((a) => (
              <div className="area" key={a.name} data-reveal="">
                <h3>{a.name}</h3>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band b-peri pad">
        <div className="wrap split">
          <div>
            <p className="eyebrow gap">Arranged for you</p>
            <h2>What we <em>take care of</em></h2>
          </div>
          <div className="checks" data-reveal="">
            <ul>
              {t.arrange.map((a) => (
                <li key={a}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  {a}
                </li>
              ))}
            </ul>
            <div className="notes">
              {t.notes.map((n) => (
                <div key={n.title}>
                  <b>{n.title}</b>
                  <p>{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band b-paper pad-sm">
        <div className="wrap">
          <Link className="next-t" href={`/treatments/${next.slug}`}>
            <span className="mono">Next</span>
            <span className="nm">{next.name}</span>
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <ul className="other-t">
            {others.map((o) => (
              <li key={o.slug}><Link href={`/treatments/${o.slug}`}>{o.name}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand care={t.name} title={<>Plan your <em>{t.name.toLowerCase()}</em> care</>} />
    </>
  );
}
