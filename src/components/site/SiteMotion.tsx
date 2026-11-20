"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SiteMotion() {
  const path = usePathname();
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      if (media.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(entries => {
        const groups = new Map<Element, number>();
        for (const {target, isIntersecting} of entries) {
          if (!isIntersecting || !(target instanceof HTMLElement)) continue;
          // Stagger siblings entering together, including responsive rows of cards.
          const group = target.parentElement;
          if (group) {
            const index = groups.get(group) ?? 0;
            target.style.setProperty("--reveal-lag", Math.min(index, 3) * 45 + "ms");
            groups.set(group, index + 1);
          }
          target.classList.add("reveal-once");
          observer?.unobserve(target);
        }
      });
      document.querySelectorAll(":is([data-reveal],.atlas-head,.care-index-head,.sec-head):not(.reveal-once)").forEach(el => {
        observer?.observe(el);
      });
    };
    observe();
    window.addEventListener("mt:locationchange", observe);
    media.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      window.removeEventListener("mt:locationchange", observe);
      media.removeEventListener("change", observe);
    };
  }, [path]);

  useEffect(() => {
    const pointer = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let button: HTMLElement | null = null;
    let box: DOMRect | undefined;
    let plate: HTMLElement | null = null;
    let plateBox: DOMRect | undefined;
    let frame = 0;
    let x = 0, y = 0;
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      button?.style.removeProperty("--magnet-x");
      button?.style.removeProperty("--magnet-y");
      plate?.removeAttribute("data-pointing");
      plate = null;
      plateBox = undefined;
      button = null;
      box = undefined;
    }
    function paint() {
      frame = 0;
      if (plate && plateBox) {
        plate.style.setProperty("--cursor-x", (x - plateBox.left) + "px");
        plate.style.setProperty("--cursor-y", (y - plateBox.top) + "px");
        plate.dataset.pointing = "";
      }
      if (!button || !box) return;
      const offset = (position: number, start: number, size: number) =>
        Math.min(1, Math.max(-1, (position - start) / size * 2 - 1));
      button.style.setProperty("--magnet-x", (offset(x, box.left, box.width) * 4).toFixed(2) + "px");
      button.style.setProperty("--magnet-y", (offset(y, box.top, box.height) * 2.5).toFixed(2) + "px");
    }
    function move(event: PointerEvent) {
      const next = event.target instanceof Element ? event.target.closest<HTMLElement>(".btn:not(:disabled)") : null;
      const nextPlate = event.target instanceof Element ? event.target.closest<HTMLElement>(".tcard .plate") : null;
      if (button !== next || plate !== nextPlate) {
        reset();
        button = next;
        box = next?.getBoundingClientRect();
        plate = nextPlate;
        plateBox = nextPlate?.getBoundingClientRect();
      }
      if ((!button && !plate) || event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function listen() {
      reset();
      document.removeEventListener("pointermove", move);
      if (pointer.matches) document.addEventListener("pointermove", move, { passive: true });
    }
    listen();
    pointer.addEventListener("change", listen);
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("mt:locationchange", reset);
    return () => {
      reset();
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      pointer.removeEventListener("change", listen);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("mt:locationchange", reset);
    };
  }, []);
  return null;
}
