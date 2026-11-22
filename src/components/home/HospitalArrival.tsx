import type { CSSProperties } from "react";

const approach = "M89 201C241 45 517 42 664 247";

export function HospitalArrival() {
  return (
    <figure className="hospital-arrival" data-reveal="">
      <div className="hospital-arrival-photo">
        <img
          src="/editorial/hospital-exterior.webp"
          srcSet="/motion/hospital-exterior.webp 720w, /editorial/hospital-exterior.webp 1536w"
          sizes="(max-width: 900px) 90vw, (max-width: 1584px) 53vw, 850px"
          width={1536}
          height={1024}
          loading="lazy"
          decoding="async"
          alt="A warmly lit hospital entrance at dusk, with an ambulance outside."
        />
        <svg viewBox="0 0 779 419" aria-hidden="true" focusable="false"
          style={{ "--hospital-route": `path('${approach}')` } as CSSProperties}>
          <path className="hospital-trail" d={approach} pathLength="1" strokeDasharray="1"
            fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="89" cy="201" r="4.6" fill="currentColor" stroke="var(--aubergine)" strokeWidth="2.2" />
          <circle cx="686" cy="257" r="18" fill="none" stroke="currentColor" strokeOpacity=".56" />
          <circle cx="686" cy="257" r="9" fill="var(--aubergine)" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="686" cy="257" r="3.4" fill="currentColor" />
          <g className="hospital-plane" transform="translate(664 247) rotate(54.4)">
            <path d="M18 0c-1-2-3-2.5-6-2.5H5L-7-15h-3l6.6 12.5h-8.2l-4.8-4.1h-2.1l2.7 6.6-2.7 6.6h2.1l4.8-4.1h8.2L-10 15h3L5 2.5h7c3 0 5-.5 6-2.5Z"
              fill="var(--apricot)" stroke="var(--aubergine)" strokeWidth="2.2" strokeLinejoin="round" paintOrder="stroke fill" />
          </g>
        </svg>
      </div>
      <figcaption><span>Illustrative hospital exterior</span><span>Destination: <b>India</b></span></figcaption>
    </figure>
  );
}
