import { SiteLink as Link } from "@/components/site/SiteLink";

import { HeroPlate } from "@/components/page/HeroPlate";

export default function NotFound() {
  return (
    <section className="band b-peri phero nf" data-hero-scene="missing" data-entry="compass">
      <div className="wrap">
        <div>
          <p className="eyebrow gap">Page not found</p>
          <h1>Off <em>course</em></h1>
          <p className="lead">The page you were looking for has moved or doesn't exist.</p>
          <div className="hero-cta">
            <Link className="btn btn-solid" href="/">Back to home</Link>
            <Link className="btn btn-ghost" href="/contact">Contact us</Link>
          </div>
        </div>
        <div className="nf-plate"><HeroPlate scene="missing" /><span className="nf-stamp" aria-label="Error 404">404</span></div>
      </div>
    </section>
  );
}
