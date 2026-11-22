import Link from "next/link";

const districts = [
  { label: "Healthcare", detail: "Explore treatments", href: "/treatments", x: 224, y: 135, mark: "M-7 0H7M0-7V7" },
  { label: "Hospitality", detail: "Stay and local support", href: "#stay", x: 465, y: 235, mark: "M-8 5V-5M-8 1H8V5M-8-2H-3V1M-3-2H5Q8-2 8 1" },
  { label: "Your journey", detail: "See every checkpoint", href: "#journey", x: 340, y: 332, mark: "M-8 5Q-2-9 8-5M3-9L8-5 4-1" },
];

export function DistrictMap() {
  return (
    <section className="district band pad" id="districts" aria-labelledby="district-title">
      <div className="wrap district-grid">
        <div>
          <p className="eyebrow gap">Explore the districts</p>
          <h2 id="district-title">Find your<br /><em>next stop.</em></h2>
          <ul className="district-links">
            {districts.map(({ label, detail, href }) => (
              <li key={label}>
                <Link href={href}><span><strong>{label}</strong><small>{detail}</small></span><span aria-hidden="true">↗</span></Link>
              </li>
            ))}
          </ul>
        </div>
        <figure className="district-chart">
          <svg viewBox="0 0 640 430" aria-label="Interactive fictional city map">
            <defs>
              <pattern id="district-water" width="25" height="18" patternUnits="userSpaceOnUse">
                <path d="M3 8h8m5 7h5" stroke="#62F5DA" opacity=".18" />
              </pattern>
            </defs>
            <path d="M0 0H640V430H0Z" fill="#191C39" />
            <path d="M0 0H640V430H0Z" fill="url(#district-water)" />
            <path d="M74 0H640V343l-88 37-125-13-110 38-113-60-43-78-20-89-59-61Z" fill="#342347" stroke="#9B719F" strokeWidth="2" />
            <g fill="#553758">
              <path d="M110 31h112v68h-80l-32-35ZM248 29h117v73H248ZM387 22h106v80H387ZM518 28h94v77h-94Z" />
              <path d="M155 123h92v80h-73ZM271 121h95v70h-95ZM394 123h91v72h-91ZM512 126h96v69h-96Z" />
              <path d="M180 225h88v88h-54ZM290 214h92v63h-92ZM410 216h78v76h-78ZM514 215h99v83h-99ZM269 333l57-34h61v56l-78 25ZM410 313h79v39h-79Z" />
            </g>
            <g fill="none" stroke="#A37D9E" strokeWidth="4" opacity=".6">
              <path d="M96 11L113 90 160 123l31 137 57 79 71 57 106-40 122 15 82-39" />
              <path d="M228 0l25 113 25 96 10 94 38 76M373 0l3 114 13 94 6 82 24 65M501 0v208l4 99 48 57M112 109l501 3M171 211l445-7M233 321l91-32 173 8 117 17" />
            </g>
            <path d="M224 135Q298 120 342 182T465 235Q474 283 420 303T340 332" fill="none" stroke="#62F5DA" strokeWidth="2" strokeDasharray="4 7" />
            {districts.map(({ label, href, x, y, mark }) => (
              <a key={label} href={href} aria-label={label} className="district-pin">
                <g transform={`translate(${x} ${y})`}>
                  <circle r="25" fill="#1B102B" stroke="#62F5DA" strokeWidth="2" />
                  <path d={mark} fill="none" stroke="#62F5DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="0" y="48" fill="#FFF2E1" textAnchor="middle" fontSize="18">{label}</text>
                </g>
              </a>
            ))}
          </svg>
          <figcaption>Fictional coastal city · schematic map</figcaption>
        </figure>
      </div>
    </section>
  );
}
