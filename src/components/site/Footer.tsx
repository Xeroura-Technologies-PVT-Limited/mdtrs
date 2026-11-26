import { SiteLink as Link } from "@/components/site/SiteLink";
import { GUIDE_LINKS, SITE, TREATMENTS } from "@/lib/site";
import { LogoMark } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="grid">
          <div>
            <Link className="logo ft-logo" href="/">
              <LogoMark />
              <span>
                <b>Medtours</b>
                <small>HEAL WITH EXPERIENCE</small>
              </span>
              <span className="sr-only"> home</span>
            </Link>
            <p className="ft-intro">
              International medical travel to India, for guests and the companions who travel with them.
            </p>
          </div>
          <div>
            <h4>Care</h4>
            <ul>
              {TREATMENTS.map((t) => (
                <li key={t.slug}>
                  <Link href={`/treatments/${t.slug}`}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Plan</h4>
            <ul>
              <li><Link href="/#journeys">For guests</Link></li>
              <li><Link href="/#journeys">For companions</Link></li>
              <li><Link href="/#hospitals">Hospitals</Link></li>
              {GUIDE_LINKS.map(link => <li key={link.href}><Link href={link.href}>{link.label === "Hospitals" ? "Hospital network" : link.label}</Link></li>)}
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/faq">Questions</Link></li>
              <li>
                <button className="linklike" data-open="enquire" type="button">Get a quote</button>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li style={{ userSelect: "all" }}>{SITE.phone}</li>
              <li style={{ userSelect: "all" }}>{SITE.email}</li>
              <li><Link href="/contact">Contact page</Link></li>
              <li><a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="base">
          <span>© {year} Medtoursin.com · Heal With Experience · <Link href="/privacy">Privacy</Link></span>
          <span>Medical information here is general and not a substitute for advice from your doctor.</span>
        </div>
      </div>
    </footer>
  );
}
