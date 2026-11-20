/** Care Orbit mark: rounded cross, an orbit arc and a plane at its end.
 *  Colours come from CSS variables so the header can switch them when the menu opens. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <rect className="ink" x="80" y="44" width="40" height="112" rx="12" />
      <rect className="ink" x="44" y="80" width="112" height="40" rx="12" />
      <path className="cut" d="M38 150 C 14 104, 52 44, 128 40" fill="none" strokeWidth="16" strokeLinecap="round" />
      <path className="acc" pathLength="1" d="M38 150 C 14 104, 52 44, 128 40" fill="none" strokeWidth="7" strokeLinecap="round" />
      <use className="accf" href="#plane" transform="translate(146 39) rotate(86) scale(1.6) translate(-12 -12)" />
    </svg>
  );
}

export function LogoLockup() {
  return (
    <>
      <LogoMark />
      <span>
        <b>Medtours</b>
        <small>HEAL WITH EXPERIENCE</small>
      </span>
    </>
  );
}

/** Shared SVG symbols. Rendered once in the root layout. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <path
          id="plane"
          d="M12 2c.8 0 1.2 1 1.2 2v5.5L21 14v2l-7.8-2.5v5l2.3 1.8V22L12 21l-3.5 1v-1.7l2.3-1.8v-5L3 16v-2l7.8-4.5V4c0-1 .4-2 1.2-2z"
        />
      </defs>
    </svg>
  );
}
