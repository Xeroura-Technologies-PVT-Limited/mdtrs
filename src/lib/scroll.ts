/** Small bridge to the Lenis instance created in <SmoothScroll />. */
import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis | null;
    __mtIntro?: "done";
  }
}

export const getLenis = () => (typeof window === "undefined" ? null : window.__lenis ?? null);

export function scrollToTarget(target: HTMLElement | null, immediate = false) {
  if (!target) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.6, immediate });
  else target.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
