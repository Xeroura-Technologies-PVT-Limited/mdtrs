import type { CSSProperties } from "react";
import "@/styles/arrival-illustration.css";

const route = "M27 125C74 128 98 69 148 53C215 30 242 84 208 92C175 100 170 57 213 54C259 50 304 88 339 130";

export function ArrivalIllustration() {
  return (
    <div className="arrival-landscape">
      <img
        src="/illustrations/india-waterfront.svg"
        alt="A flight arrives in India above a hospital and a domed palace hotel on the waterfront."
        width={600}
        height={425}
        loading="eager"
        fetchPriority="high"
      />
      <svg
        className="arrival-print"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 425"
        aria-hidden="true"
        focusable="false"
        style={{ "--arrival-route": `path('${route}')` } as CSSProperties}
      >
        <defs>
          <mask id="arrival-flight-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="205">
            <path className="arrival-print__reveal" d={route} fill="none" stroke="white" strokeWidth="7" pathLength="1" strokeDasharray="1" />
          </mask>
          <path id="arrival-airliner" d="M19 0c-1-2-3-2.8-6-2.8L5-3l-12-13-4-.3 7 13-8 .3-5-4h-2l2.2 6.6-2.2 6.5h2l5-4 8 .4-7 13 4-.3L5 3l8-.3c3-.2 5-1.1 6-2.7Z" />
        </defs>
        <path d={route} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="4 5.5" mask="url(#arrival-flight-mask)" />
        <circle cx="27" cy="125" r="3.5" fill="var(--apricot)" stroke="var(--aubergine)" strokeWidth="1.5" />
        <g fill="none" stroke="var(--accent)" className="arrival-print__halo">
          <circle cx="339" cy="130" r="18" strokeWidth="1.5" />
          <circle cx="339" cy="130" r="22" strokeWidth=".8" />
        </g>
        <g className="arrival-print__plane" transform="translate(339 130) rotate(50.2)">
          <use href="#arrival-airliner" fill="var(--aubergine)" stroke="var(--apricot)" strokeWidth="1.7" strokeLinejoin="round" paintOrder="stroke fill" />
          <path d="M-10 .15H12" fill="none" stroke="var(--apricot)" strokeWidth=".7" />
        </g>
      </svg>
    </div>
  );
}
