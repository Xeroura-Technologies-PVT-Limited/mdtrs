"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

/** Wraps each word in a mask so headings can rise into view. */
export function splitWords(el: Element) {
  const walk = (node: Node) =>
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (n.textContent || "").split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) return void frag.appendChild(document.createTextNode(p));
          const w = document.createElement("span");
          w.className = "w";
          const i = document.createElement("span");
          i.className = "wi";
          i.textContent = p;
          w.appendChild(i);
          frag.appendChild(w);
        });
        (n as ChildNode).replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  walk(el);
}

/** Motion shared by every page: rising headings, soft reveals, the footer wordmark and magnetic buttons. */
export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = prefersReducedMotion();
    document.querySelectorAll<HTMLElement>("[data-split-scroll]").forEach((h) => {
      if (h.dataset.splitDone) return;
      h.dataset.splitDone = "1";
      splitWords(h);
    });
    if (reduce) return;

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-split-scroll]").forEach((h) =>
        gsap.from(h.querySelectorAll(".wi"), {
          yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.06,
          scrollTrigger: { trigger: h, start: "top 88%" },
        }),
      );
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.closest(".hero")) return;
        gsap.from(el, { y: 40, opacity: 0.3, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.from(".ft .brand", {
        yPercent: 40, opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: ".ft .brand", start: "top bottom", end: "bottom bottom", scrub: true },
      });
    });

    // Magnetic buttons
    const offs: (() => void)[] = [];
    if (matchMedia("(pointer:fine)").matches) {
      document.querySelectorAll<HTMLElement>(".mag").forEach((b) => {
        const move = (e: PointerEvent) => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        };
        const leave = () => {
          b.style.transition = "transform .6s cubic-bezier(.22,.8,.2,1)";
          b.style.transform = "";
          setTimeout(() => (b.style.transition = ""), 600);
        };
        b.addEventListener("pointermove", move);
        b.addEventListener("pointerleave", leave);
        offs.push(() => {
          b.removeEventListener("pointermove", move);
          b.removeEventListener("pointerleave", leave);
        });
      });
    }

    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      offs.forEach((f) => f());
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
