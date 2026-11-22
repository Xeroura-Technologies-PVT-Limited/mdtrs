"use client";

import { useRef } from "react";
import { SITE } from "@/lib/site";

export function Closing() {
  const slide = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: number; max: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  return (
    <section id="contact" className="atlas-closing" aria-labelledby="closing-title">
      <div className="wrap">
        <div>
          <p className="eyebrow">Begin</p>
          <h2 id="closing-title">Heal <em>with</em> experience</h2>
          <p className="lead">Share your reports today. A doctor reviews them and sends a plan and an itemised estimate within 48 hours.</p>
          <div className="quote-actions">
            <div className="quote-slide" ref={slide}>
              <span>Slide for a treatment quote</span>
              <button className="quote-knob" type="button" aria-label="Get a Treatment Quote"
                onPointerDown={(e) => {
                  if (e.button !== 0 || !slide.current) return;
                  drag.current = { start: e.clientX, moved: false, max: slide.current.clientWidth - e.currentTarget.offsetWidth - 8 };
                  suppressClick.current = false;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drag.current) return;
                  const position = Math.min(drag.current.max, Math.max(0, e.clientX - drag.current.start));
                  if (position > 4) drag.current.moved = true;
                  slide.current?.style.setProperty("--slide", position + "px");
                }}
                onPointerUp={(e) => {
                  const motion = drag.current;
                  if (!motion) return;
                  suppressClick.current = motion.moved;
                  if (motion.moved && e.clientX - motion.start > motion.max * .82) {
                    e.currentTarget.focus({ preventScroll: true });
                    window.dispatchEvent(new Event("mt:enquire"));
                  }
                  drag.current = null;
                  slide.current?.style.removeProperty("--slide");
                }}
                onPointerCancel={() => { drag.current = null; slide.current?.style.removeProperty("--slide"); }}
                onClick={(e) => {
                  if (!suppressClick.current || e.detail === 0) window.dispatchEvent(new Event("mt:enquire"));
                  suppressClick.current = false;
                }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#plane" transform="rotate(90 12 12)" fill="currentColor" /></svg>
              </button>
            </div>
            <a className="atlas-link" href="#journeys">Plan Your Medical Journey <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="quote-contact">
          <div><span className="atlas-meta">Call or WhatsApp</span><a href={SITE.phoneHref}>{SITE.phone}</a></div>
          <div><span className="atlas-meta">Email</span><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
        </div>
      </div>
    </section>
  );
}
