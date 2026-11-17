import Link from "next/link";

type Crumb = { href: string; label: string };

/** Opening band for inner pages: breadcrumb, a rising headline, a lead and an optional render. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  art,
  artAlt = "",
  children,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  art?: string;
  artAlt?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={`band b-peri phero${art ? " has-art" : ""}`}>
      <div className="wrap phero-in">
        <div className="phero-txt">
          {crumbs && (
            <nav className="crumbs mono" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              {crumbs.map((c) => (
                <span key={c.href}>
                  <i aria-hidden="true">/</i>
                  <Link href={c.href}>{c.label}</Link>
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <p className="eyebrow gap">{eyebrow}</p>}
          <h1 data-split-scroll="">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children && <div className="hero-cta">{children}</div>}
        </div>
        {art && (
          <div className="phero-art plate render">
            <img className="art" src={art} alt={artAlt} />
          </div>
        )}
      </div>
    </section>
  );
}
