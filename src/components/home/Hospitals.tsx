import { HospitalArrival } from "./HospitalArrival";

const standards = [
  { name: "NABH", title: "National standard", legend: "NATIONAL ACCREDITATION BOARD FOR HOSPITALS · INDIA · ", copy: "India's national hospital accreditation for patient safety and quality." },
  { name: "JCI", title: "International standard", legend: "JOINT COMMISSION INTERNATIONAL · GLOBAL STANDARD · ", copy: "Joint Commission International, recognised by guests and insurers worldwide." },
];

export function Hospitals({ contactHref = "#contact", showArrival = false }: { contactHref?: string; showArrival?: boolean }) {
  return (
    <section id="hospitals" className="atlas-hospitals" aria-labelledby="hospitals-title">
      <div className="wrap">
        <div className="atlas-head">
          <div><p className="eyebrow">Hospital accreditations</p><h2 id="hospitals-title">Accredited <em>care,</em> only</h2></div>
          <p className="lead">Every partner hospital meets recognised standards for patient safety, infection control and quality of care before we recommend it.</p>
        </div>
        <div className={showArrival ? "profile-standards hospital-feature" : "profile-standards"}>
          {showArrival && <HospitalArrival />}
          {standards.map((standard) => (
            <article className="profile-standard" key={standard.name} data-reveal="">
              <svg viewBox="0 0 160 160" role="img" aria-label={standard.name}>
                <defs><path id={`seal-${standard.name}`} d="M80 80m-65 0a65 65 0 1 1 130 0a65 65 0 1 1-130 0" /></defs>
                <circle cx="80" cy="80" r="76" fill="none" stroke="var(--accent)" />
                <circle cx="80" cy="80" r="55" fill="none" stroke="var(--accent)" strokeDasharray="2 3" />
                <text fontSize="9" fontFamily="sans-serif" letterSpacing="2" fill="var(--accent)">
                  <textPath href={`#seal-${standard.name}`} textLength="405">{standard.legend}</textPath>
                </text>
                <text x="80" y="86" fontSize="34" fontFamily="Georgia, serif" textAnchor="middle" fill="var(--ink)">{standard.name}</text>
                <path d="m76 103 4-4 4 4-4 4z" fill="var(--accent)" />
              </svg>
              <div><h3>{standard.title}</h3><p>{standard.copy}</p></div>
            </article>
          ))}
        </div>
        <div className="sample-profiles">
          {["NABH · JCI", "NABH", "Wellness"].map((type) => (
            <a className="sample-profile" href={contactHref} key={type}><span className="atlas-meta">Sample profile · {type}</span><strong>{type === "Wellness" ? "Wellness partner" : "Partner hospital"}</strong><span aria-hidden="true">↗</span></a>
          ))}
        </div>
      </div>
    </section>
  );
}
