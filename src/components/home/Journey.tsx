import { itinerary } from "@/lib/itinerary";
import { carePhotos } from "@/lib/care-photos";

export function Journey() {
  return (
    <section id="journey" className="atlas-journey" aria-labelledby="itinerary-title">
      <div className="wrap itinerary">
        <div>
          <p className="eyebrow">Your medical journey</p>
          <h2 id="itinerary-title">From first <em>message</em> to home</h2>
          <p className="lead">One coordinator follows every step, for the guest and the companion.</p>
          <img loading="lazy" decoding="async" {...carePhotos.medical} alt={carePhotos.medical.alt} sizes="(max-width: 760px) 94vw, 40vw" />
        </div>
        <ol className="journey-stops">
          {itinerary.map(([time, title, copy], i) => (
            <li key={title} data-reveal="">
              <span aria-hidden="true" className="journey-number">{i + 1}</span>
              <div><span className="atlas-meta">{time}</span><h3>{title}</h3><p>{copy}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
