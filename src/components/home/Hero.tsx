import { ArrivalIllustration } from "./ArrivalIllustration";
import "@/styles/atlas-hero.css";

const assurances = [
  { title: "Doctor-led planning", note: "A physician reviews your reports", icon: <><path d="M5 4v6a5 5 0 0 0 10 0V4M4 4h3m6 0h3M10 15v2a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="11" r="2.5"/></> },
  { title: "Accredited hospitals", note: "NABH and JCI standards", icon: <><path d="m12 2 3 1.6 3.3.4 1.1 3.2 2.1 2.6-.8 3.2.1 3.4-2.8 1.9-1.7 2.8-3.3-.3-3.2.9-2.6-2.1-3.1-1.1-.5-3.3L2 12l1.7-2.9.5-3.3 3.1-1.1z"/><path d="m8.4 11.9 2.4 2.5 4.8-5"/></> },
  { title: "One care coordinator", note: "From visa to follow-up", icon: <><circle cx="12" cy="12" r="9"/><path d="m16.4 7.6-2.7 6.1-6.1 2.7 2.7-6.1zM12 2v2m0 16v2M2 12h2m16 0h2"/></> },
];

function Postmark() {
  return <svg className="postmark" viewBox="0 0 155 90" aria-hidden="true">
    <defs><path id="postmark-ring" d="M17 44a29 29 0 1 1 58 0" /></defs>
    <g fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="46" cy="45" r="39"/><circle cx="46" cy="45" r="34.5" strokeWidth=".8"/>
      <path d="M12 40h68M13 54h65M84 28c21-15 39 13 66-2m-66 10c21-15 39 13 66-2m-66 10c21-15 39 13 66-2m-66 10c21-15 39 13 66-2m-66 10c21-15 39 13 66-2"/>
      <path d="m46 59 1.3 3.6 3.6 1.1-3.6 1.3-1.3 3.6-1.3-3.6-3.6-1.3 3.6-1.1z"/>
    </g>
    <g fill="currentColor" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
      <text fontSize="8.6" letterSpacing="1.5"><textPath href="#postmark-ring" startOffset="50%">MEDTOURS</textPath></text>
      <text x="46" y="50.8" fontSize="9" letterSpacing="1.8">ARRIVAL</text>
    </g>
  </svg>;
}

export function Hero() {
  return (
    <>
      <section className="atlas-hero" id="hero" data-hero-scene="home" data-entry="flight" aria-labelledby="hero-title">
        <div className="wrap atlas-spread">
          <div className="atlas-intro">
            <p className="eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.8"/><ellipse cx="12" cy="12" rx="4" ry="8.8"/><path d="M3.5 12h17M5 7.5h14M5 16.5h14"/></svg>Medical travel to India</p>
            <h1 id="hero-title" aria-label="Heal With Experience">
              <span className="hero-line"><span>Heal With</span></span>{" "}
              <span className="hero-line"><span><em>Experience</em><span className="hero-period" aria-hidden="true">.</span></span></span>
            </h1>
            <p className="atlas-lead">World-class Indian hospitals, joined to thoughtful hospitality, for patients and the people who travel with them.</p>
            <div className="hero-cta">
              <button className="btn btn-solid" data-open="enquire" type="button">Get a Treatment Quote <span aria-hidden="true">↗</span></button>
              <a className="journey-link" href="#journeys">Plan Your Medical Journey <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="atlas-art">
            <svg className="atlas-grid" aria-hidden="true" viewBox="0 0 650 540" preserveAspectRatio="none">
              <defs><pattern id="atlas-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth=".6"/></pattern></defs>
              <path d="M0 0h650v540H0z" fill="url(#atlas-grid)"/>
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <ellipse cx="435" cy="237" rx="315" ry="247"/><ellipse cx="435" cy="237" rx="250" ry="247"/><ellipse cx="435" cy="237" rx="145" ry="247"/><path d="M112 236h650M165 111q255 70 545 9M165 367q255-70 545-9"/>
              </g>
            </svg>
            <div className="postage">
              <div className="stamp-back" aria-hidden="true"/>
              <figure className="stamp-face">
                <ArrivalIllustration />
                <figcaption><span>Medtours</span><i aria-hidden="true"/><span>Care &amp; hospitality</span><svg viewBox="0 0 24 16" aria-hidden="true"><path d="m2 13 8-4 1-7 2-1 1 7 7 3v2l-7-2-1 3 2 1v1l-4-1-3 1v-1l2-2v-3l-8 4z" fill="currentColor"/></svg></figcaption>
              </figure>
              <Postmark />
            </div>
          </div>
        </div>
      </section>
      <div className="care-assurance">
        <ul className="wrap">{assurances.map(({title,note,icon}) =>
          <li key={title}><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg><div><strong>{title}</strong><span>{note}</span></div></li>
        )}</ul>
      </div>
    </>
  );
}
