"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHome } from "@/lib/motion/home";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

/** Mounts the homepage's scroll story and plays the hero entrance once the logo intro hands over. */
export function HomeMotion() {
  useEffect(() => {
    const home = initHome({ gsap, ScrollTrigger, reduce: prefersReducedMotion() });
    const play = () => home.pageIn();
    if (window.__mtIntro === "done") play();
    else window.addEventListener("mt:intro", play, { once: true });
    return () => {
      window.removeEventListener("mt:intro", play);
      home.destroy();
    };
  }, []);
  return null;
}
