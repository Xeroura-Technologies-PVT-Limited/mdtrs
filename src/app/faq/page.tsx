import type { Metadata } from "next";
import { FAQ } from "@/lib/site";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/page/CtaBand";
import { FaqList } from "@/components/site/FaqList";

export const metadata: Metadata = {
  title: "Questions",
  description: "Answers about treatment plans, medical visas, companions, accreditation, payments and follow-up care with Medtours.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHero
        crumbs={[{ href: "/faq", label: "Questions" }]}
        eyebrow="Questions"
        title={<>Good <em>to</em> know</>}
        lead="Can't find your answer here? Your coordinator replies within a working day."
      />
      <section className="band b-paper pad faq">
        <div className="wrap faq-page">
          <FaqList items={FAQ} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
