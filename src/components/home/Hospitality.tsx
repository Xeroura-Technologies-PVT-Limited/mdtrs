import Image from "next/image";

export function Hospitality() {
  return (
    <section className="band stay-section pad" id="stay" aria-labelledby="stay-title">
      <div className="wrap stay-grid">
        <figure className="editorial-photo stay-photo">
          <div><Image src="/editorial/coastal-recovery.webp" alt="Illustration of a patient and companion in a hospital recovery room overlooking the coast at sunset" fill sizes="(max-width: 760px) 88vw, 44vw" /></div>
          <figcaption>Hospital recovery room · fictional coastal city</figcaption>
        </figure>
        <div className="stay-copy">
          <p className="eyebrow gap">Hospitality in India</p>
          <h2 id="stay-title">A place to <em>rest.</em></h2>
          <p className="lead">Comfortable rooms close to the hospital, sized to the length of treatment. We can help arrange pickup, meals, local transport, and an interpreter.</p>
          <a className="editorial-link" href="#journeys" data-journey-role="attender">Explore attender support <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
