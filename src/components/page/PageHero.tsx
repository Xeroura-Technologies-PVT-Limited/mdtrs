import { SiteLink as Link } from "@/components/site/SiteLink";
import type { EditorialPhoto } from "@/lib/care-photos";
import { addresses, resolveScene, scenes } from "@/lib/motion/scenes";
import { HeroPlate } from "./HeroPlate";

type Crumb = { href: string; label: string };

/** An editorial spread with consistent wayfinding for the inner pages. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  photo,
  children,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  photo?: EditorialPhoto;
  children?: React.ReactNode;
}) {
  const scene = resolveScene(crumbs?.at(-1)?.href ?? "/", "", addresses);
  return (
    <section key={scene} className="phero has-art" data-hero-scene={scene} data-entry={scenes[scene].entry}>
      <div className="wrap">
        {crumbs && (
          <nav className="crumbs mono" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            {crumbs.map((c, index) => (
              <span key={c.href}>
                <i aria-hidden="true">/</i>
                <Link href={c.href} aria-current={index === crumbs.length - 1 ? "page" : undefined}>{c.label}</Link>
              </span>
            ))}
          </nav>
        )}
        <div className="phero-in">
          <div className="phero-txt">
            <div>
              {eyebrow && <p className="eyebrow gap">{eyebrow}</p>}
              <h1>{title}</h1>
            </div>
            {lead && <p className="lead">{lead}</p>}
            {children && <div className="hero-cta">{children}</div>}
          </div>
          {photo ? (
            <div className="phero-art with-photo">
              <div className="art-mask"><img {...photo} alt={photo.alt}
                sizes="(max-width: 720px) min(94vw, 500px), (min-width: 1600px) 590px, 39vw" fetchPriority="high" /></div>
              <HeroPlate scene={scene} />
            </div>
          ) : <div className="phero-art drawn-hero"><HeroPlate scene={scene} /></div>}
        </div>
      </div>
    </section>
  );
}
