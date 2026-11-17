"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/scroll";

/** The opening moment: the Care Orbit mark draws itself in the middle of the screen,
 *  then settles into the header while the page opens beneath it.
 *  Plays on every full page load (including refresh), not on client-side navigation. */
export function Intro() {
  const veil = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const finish = () => {
      html.classList.remove("js-intro");
      window.__mtIntro = "done";
      window.dispatchEvent(new Event("mt:intro"));
    };
    if (window.__mtIntro === "done" || !html.classList.contains("js-intro") || prefersReducedMotion()) {
      finish();
      return;
    }
    clearTimeout((window as unknown as { __introFail?: number }).__introFail);
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      const vl = logo.current!, hl = document.querySelector<HTMLElement>(".hdr .logo");
      const arc = vl.querySelector<SVGPathElement>("#vArc")!, cut = vl.querySelector<SVGPathElement>("#vCut")!;
      const plane = vl.querySelector<SVGUseElement>("#vPlane")!;
      if (!hl) return finish();
      const r = hl.getBoundingClientRect();
      Object.assign(vl.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", display: "flex" });
      const S = Math.min(3, (innerWidth * 0.66) / r.width);
      gsap.set(vl, { x: (innerWidth - r.width * S) / 2 - r.left, y: (innerHeight - r.height * S) / 2 - r.top, scale: S });
      const L = arc.getTotalLength();
      [arc, cut].forEach((p) => {
        p.style.strokeDasharray = String(L);
        p.style.strokeDashoffset = String(L);
      });
      const mix = (a: number, b: number, k: number) => a + (b - a) * k;
      // The plane rides the arc, then glides to its resting place in the mark.
      const place = (t: number) => {
        const a = Math.min(1, t / 0.86);
        const q = arc.getPointAtLength(L * a), q2 = arc.getPointAtLength(Math.min(L, L * a + 1)), q0 = arc.getPointAtLength(Math.max(0, L * a - 1));
        let ang = (Math.atan2(q2.y - q0.y, q2.x - q0.x) * 180) / Math.PI + 90, x = q.x, y = q.y;
        if (t > 0.86) {
          const k = (t - 0.86) / 0.14;
          x = mix(q.x, 146, k);
          y = mix(q.y, 39, k);
          ang = mix(ang, 86, k);
        }
        plane.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(2)}) scale(1.6) translate(-12 -12)`);
      };
      const pp = { t: 0 };
      place(0);
      gsap.set(plane, { opacity: 0 });
      tl = gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from(vl.querySelector("#vCross"), { scale: 0.55, opacity: 0, duration: 1.1, svgOrigin: "100 100" }, 0)
        .to(plane, { opacity: 1, duration: 0.3, ease: "none" }, 0.35)
        .to([arc, cut], { strokeDashoffset: 0, duration: 1.15, ease: "power2.inOut" }, 0.35)
        .to(pp, { t: 1, duration: 1.15, ease: "power2.inOut", onUpdate: () => place(pp.t) }, 0.35)
        .from(vl.querySelectorAll("b span"), { yPercent: 110, duration: 1.1 }, 1.05)
        .from(vl.querySelectorAll("small span"), { yPercent: 120, opacity: 0, duration: 1.1 }, 1.2)
        .to(vl, { x: 0, y: 0, scale: 1, duration: 1.15, ease: "expo.inOut" }, 2.15)
        .to(veil.current, { backgroundColor: "rgba(238,242,249,0)", duration: 0.9, ease: "power2.out" }, 2.75)
        .add(() => {
          finish();
          gsap.from(".menu-btn", { y: -10, opacity: 0, duration: 1.2, ease: "expo.out" });
        }, 3.25);
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(run));
    return () => {
      cancelled = true;
      tl?.kill();
    };
  }, []);

  return (
    <div className="veil" ref={veil} aria-hidden="true">
      <span className="logo" ref={logo}>
        <svg viewBox="0 0 200 200">
          <g id="vCross">
            <rect className="ink" x="80" y="44" width="40" height="112" rx="12" />
            <rect className="ink" x="44" y="80" width="112" height="40" rx="12" />
          </g>
          <path className="cut" id="vCut" d="M38 150 C 14 104, 52 44, 128 40" fill="none" strokeWidth="16" strokeLinecap="round" />
          <path className="acc" id="vArc" d="M38 150 C 14 104, 52 44, 128 40" fill="none" strokeWidth="7" strokeLinecap="round" />
          <use className="accf" id="vPlane" href="#plane" />
        </svg>
        <span>
          <b><span>Medtours</span></b>
          <small><span>HEAL WITH EXPERIENCE</span></small>
        </span>
      </span>
    </div>
  );
}
