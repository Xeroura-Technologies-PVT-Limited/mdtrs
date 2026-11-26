import { SiteLink as Link } from "@/components/site/SiteLink";
import { FAQ, SITE, TREATMENTS, treatmentSources } from "@/lib/site";
import { ORIGINS } from "@/lib/premium/globe-scene";
import { PremiumMotion } from "./PremiumMotion";
import { PremiumLoader } from "./PremiumLoader";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pm-arrow"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Plane = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><use href="#plane" /></svg>
);
const stats = [
  { n: 48, unit: "hrs", label: "Usual time to a treatment plan after we receive your reports" },
  { n: 2, unit: "", label: "Attenders who can travel with you on India's e-Medical Attendant visa" },
  { n: 1, unit: "", label: "Coordinator from the first call to your last follow-up" },
  { n: 6, unit: "", label: "Specialties across clinical care and wellness" },
];

const personas = {
  patient: {
    label: "I'm the patient",
    line: <>Care planned around <em>you</em>, before you fly.</>,
    items: [
      { t: "Treatment planning", d: "A doctor on our team reads your reports and sends hospital options with an itemised estimate, usually within 48 hours.", img: "/editorial/hospital-consultation.webp", alt: "A doctor talking a patient through his plan" },
      { t: "Second opinions", d: "A senior specialist reviews the plan you were given at home and tells you plainly what they would recommend.", img: "/editorial/treatments/medical.webp", alt: "A doctor and patient reviewing a tablet together" },
      { t: "Medical visa", d: "Your hospital issues the invitation letter, and we help you complete the e-Medical visa application.", img: "/editorial/ink-arrival.webp", alt: "An accredited hospital entrance at night" },
      { t: "Post-op recovery", d: "Rehabilitation, a fit-to-fly review and teleconsult follow-ups once you are home.", img: "/editorial/treatments/rehabilitation.webp", alt: "A physiotherapist supporting a patient at parallel bars" },
    ],
  },
  attender: {
    label: "I'm travelling with them",
    line: <>The person who cares is <em>cared for</em> too.</>,
    items: [
      { t: "Travel logistics", d: "Visa letters for up to two attenders, and flights planned to match the patient's dates.", img: "/editorial/arrival.webp", alt: "A hospital entrance in warm evening light" },
      { t: "Accommodation", d: "A stay close to the hospital, chosen for rest, with room to extend if recovery takes longer.", img: "/editorial/hospitality.webp", alt: "A calm hotel room with warm light and a carved wooden screen" },
      { t: "Local concierge", d: "Airport pickup, transfers and an interpreter when you need one, arranged by your coordinator.", img: "/editorial/ink-care.webp", alt: "A bright hospital reception and lobby" },
      { t: "Hospitality", d: "Thoughtful comfort around the hospital, so the days between appointments feel calm.", img: "/editorial/recovery.webp", alt: "A quiet hospital suite with an armchair beside the bed" },
    ],
  },
} as const;
type PersonaKey = keyof typeof personas;
const personaKeys = Object.keys(personas) as PersonaKey[];

const steps = [
  { t: "Share your reports", d: "Send scans and reports through the enquiry form or WhatsApp." },
  { t: "Doctor review", d: "A physician on our team reads them and shortlists hospitals." },
  { t: "Plan & estimate", d: "An itemised estimate and specialist video consult before you decide." },
  { t: "Visa & travel", d: "Invitation letter, e-Medical visa help, flights and a stay nearby." },
  { t: "Arrival", d: "Met at the airport and taken to your stay or straight to admission." },
  { t: "Treatment & recovery", d: "Your coordinator stays in touch through treatment and recovery." },
  { t: "Home & follow-up", d: "Complete records, a follow-up schedule and teleconsults from home." },
];

const usps = ["Clinical excellence", "Cost transparency", "Zero wait times", "End-to-end hospitality"];

export function PremiumHome() {
  const faqs = FAQ.slice(0, 5);
  return (
    <div id="pm-home" className="pm">
      <PremiumLoader />
      <PremiumMotion />
      {/* One emblem for the whole page: it starts in the loader, lands in the hero and glides on to the promise. */}
      <div className="pm-orbit-layer" aria-hidden="true">
        <div className="pm-orbit-halo" />
        <canvas className="pm-orbit-canvas" data-orbit-canvas />
      </div>

      {/* 1 · Hero: the Care Orbit emblem in 3D */}
      <section className="pm-hero" data-progress="hero" aria-labelledby="pm-hero-title">
        <div className="pm-sticky">
          <div className="pm-hero-art" data-orbit-anchor="hero" data-cursor="drag" data-cursor-label="Drag">
            <span className="sr-only">The Medtours Care Orbit emblem: a medical cross circled by a flight path.</span>
          </div>
          <div className="pm-hero-copy pm-quiet-hero">
            <h1 id="pm-hero-title" className="pm-hero-title" aria-label="Heal With Experience.">
              <span className="pm-line" data-split aria-hidden="true">Heal With</span>
              <span className="pm-line" data-split aria-hidden="true">Experience.</span>
            </h1>
            <div className="pm-quiet-foot">
              <p>Specialist care in India, with someone by your side from the first consultation to the journey home.</p>
              <button type="button" className="pm-quiet-link" data-open="enquire">Get a treatment quote <Arrow /></button>
            </div>
          </div>
          <div className="pm-scrollcue" aria-hidden="true"><span>Scroll</span><i /></div>

        </div>
      </section>

      {/* 2 · Manifesto: words light up as you read */}
      <section className="pm-manifesto" data-progress="manifesto" aria-labelledby="pm-manifesto-title">
        <div className="pm-sticky">
          <div className="pm-manifesto-art" data-orbit-anchor="side" data-cursor="drag" data-cursor-label="Drag" aria-hidden="true" />
          <div className="wrap pm-manifesto-copy">
            <p className="pm-eyebrow" id="pm-manifesto-title">Our promise</p>
            <p className="pm-manifesto-text" data-words>
              Choosing care abroad is a big decision. We make everything around it simple: a doctor reads your reports, accredited hospitals send an itemised plan, and <em>one coordinator</em> looks after you, and the people who travel with you, from visa to recovery.
            </p>
            <div className="pm-sign">
              <span>{SITE.founder}</span>
              <small>Founder, Medtours</small>
            </div>
          </div>
        </div>
      </section>

      {/* 3 · Scroll-to-expand hospital arrival with counters */}
      <section className="pm-expand" data-progress="expand" aria-labelledby="pm-expand-title">
        <div className="pm-sticky">
          <figure className="pm-expand-media">
            <img src="/editorial/hospital-exterior.webp" alt="An accredited hospital entrance in India at dusk" loading="lazy" decoding="async" />
          </figure>
          <div className="wrap pm-expand-copy">
            <h2 id="pm-expand-title">Accredited hospitals.<br /><em>Hospitality</em> that feels like home.</h2>
          </div>
          <ul className="wrap pm-stats">
            {stats.map(s => (
              <li key={s.label}>
                <b><span data-count={s.n}>{s.n}</span>{s.unit && <small>{s.unit}</small>}</b>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4 · Globe: routes from around the world converge on India */}
      <section className="pm-globe" id="routes" data-progress="globe" aria-labelledby="pm-globe-title">
        <div className="pm-sticky">
          <div className="wrap pm-globe-grid">
            <div className="pm-globe-copy">
              <p className="pm-eyebrow">One destination, every direction</p>
              <h2 id="pm-globe-title">Wherever home is, the route ends <em>at the same door.</em></h2>
              <p className="pm-body">Your coordinator plans the journey from your city to the hospital and back, with your flights, visa and stay arranged around the treatment dates.</p>
              <ul className="pm-cities" aria-label="Example arrival cities">
                {ORIGINS.map(o => <li key={o.name} data-city><Plane />{o.name}</li>)}
              </ul>
              <p className="pm-fine">Cities shown are examples. We plan arrivals from anywhere.</p>
            </div>
            <div className="pm-globe-art" data-scene-wrap>
              <canvas className="pm-canvas" data-scene="globe" data-cursor="drag" data-cursor-label="Spin" role="img" aria-label="A dotted globe with flight paths from cities around the world arriving in India." />
              <span className="pm-globe-pin" aria-hidden="true">India</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · Treatments on a horizontal rail */}
      <section className="pm-rail" data-rail data-progress="rail" aria-labelledby="pm-rail-title">
        <div className="pm-sticky">
          <div className="pm-rail-track" data-rail-track>
            <header className="pm-rail-head">
              <p className="pm-eyebrow">Treatments</p>
              <h2 id="pm-rail-title">Six ways <em>we care.</em></h2>
              <p className="pm-body">Four clinical specialties and two wellness programmes, each planned by a doctor before you travel.</p>
              <Link className="pm-textlink" href="/treatments">All treatments <Arrow /></Link>
            </header>
            {TREATMENTS.map((t, i) => (
              <Link key={t.slug} href={`/treatments/${t.slug}`} className="pm-card" data-tilt data-cursor="view" data-cursor-label="View">
                <span className="pm-card-media">
                  <img src={t.render} srcSet={treatmentSources(t.render)} sizes="(max-width: 900px) 80vw, 30vw" alt={t.alt} loading="lazy" decoding="async" />
                </span>
                <span className="pm-card-glare" aria-hidden="true" />
                <span className="pm-card-top"><span>{String(i + 1).padStart(2, "0")}</span><span>{t.group}</span></span>
                <span className="pm-card-body">
                  <strong>{t.name}</strong>
                  <span>{t.summary}</span>
                  <span className="pm-card-go">Explore <Arrow /></span>
                </span>
              </Link>
            ))}
            <div className="pm-card pm-card-cta">
              <p>Not sure which specialty fits?</p>
              <strong>Send your reports and a doctor will tell you.</strong>
              <button className="pm-btn pm-btn-solid" data-open="enquire" type="button">Ask a doctor <Arrow /></button>
            </div>
          </div>
          <div className="pm-rail-bar" aria-hidden="true"><i /></div>
        </div>
      </section>

      {/* 6 · Patient and attender journeys: a pinned photo that follows the step being read */}
      <section className="pm-persona" id="journeys" aria-labelledby="pm-persona-title">
        <div className="wrap" data-persona-root data-active="patient">
          <div className="pm-persona-head" data-pm-reveal>
            <p className="pm-eyebrow">Patients &amp; attenders</p>
            <h2 id="pm-persona-title">Two journeys, <em>planned as one.</em></h2>
            <p className="pm-body">Every plan covers the patient and the people who travel with them. Choose a journey, then scroll through what we arrange.</p>
          </div>
          <div className="pm-persona-grid">
            <div className="pm-persona-side">
              <div className="pm-switch" role="tablist" aria-label="Choose your journey">
                <span className="pm-switch-pill" aria-hidden="true" />
                {personaKeys.map((key, i) => (
                  <button key={key} role="tab" type="button" id={`pm-tab-${key}`} aria-controls={`pm-panel-${key}`} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} data-persona={key}>
                    {personas[key].label}
                  </button>
                ))}
              </div>
              <figure className="pm-stage" data-tilt data-cursor="view" data-cursor-label="Scroll">
                {personaKeys.flatMap(key => personas[key].items.map((it, j) => (
                  <img key={`${key}-${j}`} src={it.img} alt={it.alt} loading="lazy" decoding="async" data-shot={`${key}-${j}`} {...(key === "patient" && j === 0 ? { "data-current": "" } : {})} />
                )))}
                <span className="pm-stage-veil" aria-hidden="true" />
                <span className="pm-stage-bars" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} data-bar={i} />)}</span>
                <figcaption aria-hidden="true">
                  <span className="pm-stage-count"><b data-shot-num>01</b> / 04</span>
                  <strong data-shot-title>{personas.patient.items[0].t}</strong>
                </figcaption>
              </figure>
              <p className="pm-persona-line" aria-live="polite">
                {personaKeys.map(key => <span key={key} data-line={key}>{personas[key].line}</span>)}
              </p>
            </div>
            <div className="pm-persona-lists">
              {personaKeys.map((key, i) => (
                <ol key={key} className="pm-steps-list" role="tabpanel" id={`pm-panel-${key}`} aria-labelledby={`pm-tab-${key}`} hidden={i !== 0}>
                  {personas[key].items.map((it, j) => (
                    <li key={it.t} data-step={j} data-shot-key={`${key}-${j}`} style={{ ["--j" as string]: j }} {...(j === 0 ? { "data-active": "" } : {})}>
                      <span className="pm-step-num">{String(j + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{it.t}</strong>
                        <p>{it.d}</p>
                      </div>
                      <span className="pm-step-rule" aria-hidden="true"><i /></span>
                    </li>
                  ))}
                </ol>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7 · The journey, drawn as a flight path */}
      <section className="pm-journey" id="journey" data-progress="journey" aria-labelledby="pm-journey-title">
        <div className="pm-sticky">
          <div className="wrap pm-journey-head">
            <div>
              <p className="pm-eyebrow">Your journey</p>
              <h2 id="pm-journey-title">Seven steps. <em>One person beside you.</em></h2>
            </div>
            <p className="pm-counter" aria-hidden="true"><span data-step-count>01</span> / {String(steps.length).padStart(2, "0")}</p>
          </div>
          <div className="pm-route" aria-hidden="true">
            <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid meet">
              <path className="pm-route-base" d="M30 200 C 170 205, 190 70, 330 80 S 510 215, 630 160 S 820 50, 940 95 S 1100 195, 1170 110" />
              <path className="pm-route-line" data-route pathLength="1" d="M30 200 C 170 205, 190 70, 330 80 S 510 215, 630 160 S 820 50, 940 95 S 1100 195, 1170 110" />
              {steps.map(s => <circle key={s.t} className="pm-route-dot" data-stop-dot r="7" cx="0" cy="0" />)}
              <g data-route-plane transform="translate(30 200)">
                <circle r="26" className="pm-plane-halo" />
                <g transform="scale(1.5) translate(-12 -12)"><use href="#plane" className="pm-plane" /></g>
              </g>
            </svg>
          </div>
          <ol className="wrap pm-steps">
            {steps.map((s, i) => (
              <li key={s.t} data-stop>
                <span className="pm-num">{String(i + 1).padStart(2, "0")}</span>
                <strong>{s.t}</strong>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8 · Accreditation seals and USP marquee */}
      <section className="pm-trust" id="hospitals" data-view aria-labelledby="pm-trust-title">
        <div className="pm-marquee" aria-hidden="true">
          <div className="pm-marquee-track" data-marquee>
            {[0, 1].map(k => (
              <span key={k} className="pm-marquee-set">
                {usps.map(u => <span key={u}>{u}<i>✦</i></span>)}
              </span>
            ))}
          </div>
        </div>
        <div className="wrap pm-trust-grid">
          <div className="pm-trust-copy" data-pm-reveal>
            <p className="pm-eyebrow">Accredited hospitals</p>
            <h2 id="pm-trust-title">Held to national and <em>international</em> standards.</h2>
            <p className="pm-body">We work with hospitals accredited by NABH, India&apos;s national hospital accreditation, and JCI, an international accreditation. Both assess patient safety, infection control and the quality of care.</p>
            <Link className="pm-textlink" href="/hospitals">Meet the hospital network <Arrow /></Link>
          </div>
          <div className="pm-seals">
            {[
              { k: "NABH", name: "National Accreditation Board for Hospitals & Healthcare Providers", back: "India's national standard for hospital quality and patient safety." },
              { k: "JCI", name: "Joint Commission International", back: "An international accreditation recognised by hospitals worldwide." },
            ].map((s, i) => (
              <button key={s.k} type="button" className={`pm-seal pm-seal-${i + 1}`} aria-label={`${s.k}: ${s.name}. ${s.back}`} data-cursor="view" data-cursor-label="Flip">
                <span className="pm-seal-inner">
                  <span className="pm-seal-face">
                    <svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id={`seal-ring-${i}`} d="M100 100 m-80 0 a80 80 0 1 1 160 0 a80 80 0 1 1 -160 0" /></defs><text><textPath href={`#seal-ring-${i}`}>{`${s.name.toUpperCase()} · `}</textPath></text></svg>
                    <b>{s.k}</b><small>Accredited</small>
                  </span>
                  <span className="pm-seal-face pm-seal-back"><span>{s.back}</span></span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · Questions */}
      <section className="pm-faq" aria-labelledby="pm-faq-title">
        <div className="wrap pm-faq-grid">
          <div data-pm-reveal>
            <p className="pm-eyebrow">Questions</p>
            <h2 id="pm-faq-title">Before you <em>decide.</em></h2>
            <Link className="pm-textlink" href="/faq">All questions <Arrow /></Link>
          </div>
          <div className="pm-faq-list">
            {faqs.map(([q, a]) => (
              <details key={q} data-pm-reveal>
                <summary><span>{q}</span><i aria-hidden="true" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10 · Closing call to action */}
      <section className="pm-close" data-view aria-labelledby="pm-close-title">
        <div className="wrap">
          <p className="pm-eyebrow">Begin</p>
          <h2 id="pm-close-title" className="pm-close-title">
            <span>Your journey starts</span>
            <span>with <em>one message.</em></span>
          </h2>
          <div className="pm-close-row">
            <button type="button" className="pm-orb" data-open="enquire" data-magnetic="0.35">
              <span>Get a<br />Treatment Quote</span>
            </button>
            <ul className="pm-contact">
              <li><a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp <Arrow /></a></li>
              <li><a href={SITE.phoneHref}>{SITE.phone} <Arrow /></a></li>
              <li><a href={`mailto:${SITE.email}`}>Email us <Arrow /></a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
