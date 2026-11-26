"use client";

import { useState } from "react";

const cities = [
  { name: "New Delhi", lon: 77.2, lat: 28.6, time: "3h 30m", specialties: "Cardiac · Transplant · Oncology", dx: 12, dy: -10 },
  { name: "Mumbai", lon: 72.9, lat: 19.1, time: "3h 05m", specialties: "Oncology · Orthopaedics · Neuro", dx: -12, dy: 1 },
  { name: "Hyderabad", lon: 78.5, lat: 17.4, time: "3h 50m", specialties: "Cardiac · Gastro & liver · Orthopaedics", dx: 13, dy: -3 },
  { name: "Bengaluru", lon: 77.6, lat: 12.97, time: "4h 05m", specialties: "Orthopaedics · Fertility · Neuro", dx: -12, dy: 4 },
  { name: "Chennai", lon: 80.3, lat: 13.1, time: "4h 10m", specialties: "Cardiac · Transplant · Eye care", dx: 12, dy: 6 },
  { name: "Kochi", lon: 76.3, lat: 9.9, time: "4h 00m", specialties: "Ayurveda · Rehabilitation", dx: -10, dy: 12 },
];
const origins = [
  { name: "Dubai", lon: 55.3, lat: 25.2, dx: -8, dy: -6 },
  { name: "Muscat", lon: 58.4, lat: 23.6, dx: 7, dy: 17 },
  { name: "Riyadh", lon: 46.7, lat: 24.7, dx: -8, dy: -7 },
  { name: "Nairobi", lon: 36.8, lat: -1.3, dx: 8, dy: 18 },
  { name: "Dar es Salaam", lon: 39.3, lat: -6.8, dx: 8, dy: 17 },
  { name: "Dhaka", lon: 90.4, lat: 23.8, dx: -6, dy: -12 },
];

const passage = [
  ["Wherever you are", "Guests come to us from across the world", "From the Gulf, Africa, Central and South Asia and Europe, families choose India for care they can't wait for at home."],
  ["One flight away", "A few hours to world-class care", "We plan every step: the hospital invitation letter, the e-Medical visa, flights for the guest and companions, and pickup at arrivals."],
  ["Into trusted hands", "Six medical cities. One team.", "NABH and JCI accredited hospitals in New Delhi, Mumbai, Hyderabad, Chennai, Bengaluru and Kochi, with a coordinator beside you throughout."],
];

// Schematic coastlines in geographical coordinates, projected with the same scale as the routes.
const coastline = "30,38 97,38 97,16.5 94.4,16 94.2,19 92.3,20.8 92,22.5 90.6,22.3 88.8,21.8 86.8,21.3 85,19.4 82.3,16.6 80.3,15.8 80,13.1 79.8,10.3 78.2,8.9 77.5,8.1 76.6,8.9 75.7,11.4 74.6,14.7 73.4,16.5 72.8,19.2 72.6,21.3 70.4,20.8 69,22.5 70,22.9 68.5,23.6 67.4,24.6 66.4,25.4 61.5,25.2 57.3,25.8 56.4,27.2 54.5,26.6 51.5,27.9 50.1,30.1 48,30 49.3,27.4 50.8,24.8 51.6,25.9 51.6,24.3 54,24.1 56.3,26.2 56.5,24.4 58.8,23.5 59.8,22.4 58.5,20.5 57.8,19 55.4,17.6 52.2,15.6 49.6,14.6 45.1,12.9 43.3,12.6 42.8,15 42.6,16.8 40.9,19.5 39.1,21.8 38.4,24 37,25.8 35.2,28 34.7,29.4 32.6,29.9 33.5,27 35.5,24 37,21 37.5,18.5 38.6,17.5 39.7,15.5 41.7,13.9 43.3,12.3 44.3,10.4 46.5,10.7 51.2,11.9 51,10.4 49.5,7 47.9,4.3 44,.5 41.5,-1.8 39.6,-4.7 38.9,-6.5 39.6,-8.7 40.5,-11 30,-11";
const x = (lon: number) => (lon - 30) * 14;
const y = (lat: number) => (38 - lat) * 11.5;

export function Cities() {
  const [city, setCity] = useState(cities[2]);
  return (
    <section id="cities" className="atlas-cities" aria-labelledby="cities-title">
      <div className="wrap">
        <div className="atlas-head">
          <div><p className="eyebrow">Where you'll be treated</p><h2 id="cities-title">Closer <em>than</em> you think</h2></div>
          <p className="lead">India's leading medical cities are a short direct flight from the Gulf, East Africa and South Asia. Choose a city.</p>
        </div>
        <div className="flight-board">
          <ul aria-label="Choose a medical city">
            {cities.map((c) => <li key={c.name}>
              <button type="button" aria-pressed={c === city} aria-controls="flight-map" onClick={() => setCity(c)}>
                <strong>{c.name}</strong><span>{c.time}</span><small>{c.specialties}</small>
              </button>
            </li>)}
          </ul>
          <figure className="flight-map" id="flight-map">
            <svg viewBox="0 0 924 552" role="group" aria-label="Flight routes from the Gulf, East Africa and Bangladesh to Indian medical cities">
              <defs>
                <pattern id="sea-grid" width="69" height="57" patternUnits="userSpaceOnUse"><path d="M69 0H0V57" fill="none" stroke="var(--line)" strokeWidth="1.3" /></pattern>
              </defs>
              <rect width="924" height="552" fill="var(--paper-tint)" />
              <g transform="matrix(14 0 0 -11.5 -420 437)" fill="var(--apricot)" stroke="var(--line-strong)" strokeWidth=".85" >
                <polygon points={coastline} vectorEffect="non-scaling-stroke" />
                <polygon points="79.9,9.8 80.7,9.2 81.8,7.4 81.7,6.6 80.8,6 80,6.3 79.8,7.7" vectorEffect="non-scaling-stroke" />
              </g>
              <rect width="924" height="552" fill="url(#sea-grid)" />
              <g className="map-sea" fill="var(--muted)" fontSize="17" fontFamily="Georgia,serif" fontStyle="italic" textAnchor="middle">
                <text x="445" y="318">Arabian Sea</text><text x="835" y="345">Bay of Bengal</text>
              </g>
              <text x="667" y="163" textAnchor="middle" fill="var(--muted)" fontSize="21" letterSpacing="5" fontFamily="Georgia,serif">INDIA</text>
              {origins.map((origin) => {
                const ox = x(origin.lon), oy = y(origin.lat), cx = x(city.lon), cy = y(city.lat);
                return <g key={origin.name} className="city-routes">
                  <path key={city.name} d={`M${ox} ${oy} Q${(ox + cx) / 2} ${(oy + cy) / 2 - Math.max(52, Math.abs(cx - ox) * .26)} ${cx} ${cy}`} fill="none" stroke="var(--accent)" strokeWidth="1.65" strokeDasharray="5 4" />
                  <circle cx={ox} cy={oy} r="4.5" fill="var(--aubergine)" />
                  <text className="map-place origin-label" x={ox + origin.dx} y={oy + origin.dy} textAnchor={origin.dx < 0 ? "end" : "start"}>{origin.name}</text>
                </g>;
              })}
              {cities.map((c) => <g className="city-marker" role="button" tabIndex={0} aria-label={c.name} aria-pressed={c === city} key={c.name}
                onClick={() => setCity(c)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCity(c); } }}>
                <circle cx={x(c.lon)} cy={y(c.lat)} r={c === city ? 8.5 : 5.25} />
                <text className="map-place" x={x(c.lon) + c.dx} y={y(c.lat) + c.dy} textAnchor={c.dx < 0 ? "end" : "start"}>{c.name}</text>
              </g>)}
            </svg>
            <figcaption><span>Approx. direct flight time from Dubai</span><strong aria-live="polite">{city.name} · {city.time}</strong></figcaption>
          </figure>
        </div>
        <div className="passage">
          {passage.map(([label, title, detail]) => <article key={label} data-reveal=""><span className="atlas-meta">{label}</span><h3>{title}</h3><p>{detail}</p></article>)}
        </div>
      </div>
    </section>
  );
}
