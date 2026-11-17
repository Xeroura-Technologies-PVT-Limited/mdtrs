import Link from "next/link";
import { FAQ } from "@/lib/site";
import { FaqList } from "@/components/site/FaqList";

export function HomeFaq() {
  return (
    <section className="band b-paper pad faq" id="faq">
      <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z" /></svg>
      <div className="wrap grid">
        <div>
          <p className="eyebrow gap">Questions</p>
          <h2 data-split-scroll="">Good <em>to</em> know</h2>
          <p className="lead" style={{ marginTop: 24 }}>Can't find your answer? Your coordinator replies within a working day.</p>
          <Link className="btn btn-ghost" href="/faq" style={{ marginTop: 28 }}>All questions</Link>
        </div>
        <FaqList items={FAQ.slice(0, 6)} />
      </div>
    </section>
  );
}
