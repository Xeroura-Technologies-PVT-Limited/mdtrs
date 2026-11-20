import { SiteLink as Link } from "@/components/site/SiteLink";
import { TREATMENTS } from "@/lib/site";

export function Marquee() {
  return (
    <nav className="care-directory wrap" aria-label="Treatment directory">
      {TREATMENTS.map((t) => <Link href={`/treatments/${t.slug}`} key={t.slug}>{t.name}</Link>)}
    </nav>
  );
}
