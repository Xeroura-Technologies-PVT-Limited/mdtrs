import Link from "next/link";

export default function NotFound() {
  return (
    <section className="band b-peri phero nf">
      <div className="wrap">
        <p className="eyebrow gap">Page not found</p>
        <h1>Off <em>course</em></h1>
        <p className="lead">The page you were looking for has moved or doesn't exist.</p>
        <div className="hero-cta">
          <Link className="btn btn-solid" href="/"><span className="dot" />Back to home</Link>
          <Link className="btn btn-ghost" href="/contact">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
