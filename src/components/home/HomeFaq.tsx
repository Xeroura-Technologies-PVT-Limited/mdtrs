import { SiteLink as Link } from "@/components/site/SiteLink";
import { FAQ } from "@/lib/site";
import { FaqList } from "@/components/site/FaqList";

export function HomeFaq() {
  return (
    <section className="atlas-faq" id="faq" aria-labelledby="home-questions">
      <div className="wrap">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 id="home-questions">Good <em>to</em> know</h2>
          <p className="lead">Can't find your answer? Your coordinator replies within a working day.</p>
          <Link className="atlas-link" href="/faq">All questions <span aria-hidden="true">↗</span></Link>
        </div>
        <FaqList items={FAQ.slice(0, 6)} />
      </div>
    </section>
  );
}
