import { createOrbitScene, type OrbitPose, type OrbitScene } from "./orbit-scene";
import { createGlobeScene, type GlobeScene } from "./globe-scene";

/** Motion engine for the premium homepage.
 *  Scroll position is turned into CSS custom properties (--p for pinned
 *  sections, --v for elements passing through the viewport) so most effects
 *  live in CSS. Everything is torn down by the returned function. */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function initPremium(root: HTMLElement): () => void {
  const html = document.documentElement;
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const fineQuery = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = reducedQuery.matches;
  const fine = fineQuery.matches;
  const cleanups: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };

  html.classList.add("pm-js");
  if (reduced) html.classList.add("pm-reduced");

  /* ---------- Start the hero once the loader (or the site introduction) has lifted ---------- */
  const ready = () => html.classList.add("pm-ready");
  const loader = runLoader(root, reduced, ready, cleanups);
  if (!loader.active) {
    if (!html.dataset.intro) requestAnimationFrame(ready);
    else {
      const mo = new MutationObserver(() => { if (!html.dataset.intro) { ready(); mo.disconnect(); } });
      mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
      cleanups.push(() => mo.disconnect());
    }
  }

  /* ---------- Split text into characters / words ---------- */
  root.querySelectorAll<HTMLElement>("[data-split]").forEach(el => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    let i = 0;
    const walk = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const word of (child.textContent || "").split(/(\s+)/)) {
            if (!word) continue;
            if (/^\s+$/.test(word)) { frag.append(word); continue; }
            const w = document.createElement("span");
            w.className = "pm-w";
            for (const ch of word) {
              const c = document.createElement("span");
              c.className = "pm-c";
              c.style.setProperty("--i", String(i++));
              c.textContent = ch;
              w.append(c);
            }
            frag.append(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      }
    };
    walk(el);
  });

  root.querySelectorAll<HTMLElement>("[data-words]").forEach(el => {
    if (el.dataset.wordsDone) return;
    el.dataset.wordsDone = "1";
    let i = 0;
    const walk = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const part of (child.textContent || "").split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(part); continue; }
            const w = document.createElement("span");
            w.className = "pm-word";
            w.style.setProperty("--i", String(i++));
            w.textContent = part;
            frag.append(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      }
    };
    walk(el);
    el.style.setProperty("--n", String(i));
  });

  /* ---------- Smooth wheel scrolling (desktop only) ---------- */
  if (fine && !reduced) {
    let target = window.scrollY, current = window.scrollY, animating = false, raf = 0;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const step = () => {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.5) { current = target; animating = false; }
      window.scrollTo(0, current);
      raf = animating ? requestAnimationFrame(step) : 0;
    };
    const blocked = (e: WheelEvent) =>
      e.ctrlKey || html.dataset.intro || html.classList.contains("pm-loading") || document.body.style.overflow === "hidden" ||
      (e.target instanceof Element && e.target.closest("dialog, [data-no-smooth], .mobile-menu, textarea, select")) ||
      Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const wheel = (e: WheelEvent) => {
      if (blocked(e)) return;
      e.preventDefault();
      if (!animating) { current = target = window.scrollY; }
      const unit = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? innerHeight : 1;
      target = clamp(target + e.deltaY * unit, 0, max());
      if (!animating) { animating = true; raf = requestAnimationFrame(step); }
    };
    const native = () => { if (!animating) current = target = window.scrollY; };
    const stop = () => { animating = false; cancelAnimationFrame(raf); current = target = window.scrollY; };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("scroll", native, { passive: true });
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop);
    window.addEventListener("mt:locationchange", stop);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", native);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("mt:locationchange", stop);
    });
  }

  /* ---------- Horizontal treatments track ---------- */
  const rails = Array.from(root.querySelectorAll<HTMLElement>("[data-rail]"));
  const sizeRails = () => {
    for (const rail of rails) {
      const track = rail.querySelector<HTMLElement>("[data-rail-track]");
      if (!track) continue;
      const pinned = innerWidth > 900 && !reduced;
      rail.toggleAttribute("data-pinned", pinned);
      if (!pinned) { rail.style.removeProperty("height"); rail.style.removeProperty("--dist"); continue; }
      const dist = Math.max(0, track.scrollWidth - innerWidth);
      rail.style.setProperty("--dist", String(dist));
      rail.style.height = `${dist + innerHeight * 1.1}px`;
    }
  };

  /* ---------- Scroll-linked progress ---------- */
  const pinned = Array.from(root.querySelectorAll<HTMLElement>("[data-progress]"));
  const passing = Array.from(root.querySelectorAll<HTMLElement>("[data-view]"));
  const progressBar = document.querySelector<HTMLElement>(".pm-progress");
  let orbit: OrbitScene | null = null;
  let heroP = 0, sideP = 0;
  let globe: GlobeScene | null = null;
  const route = root.querySelector<SVGPathElement>("[data-route]");
  const plane = root.querySelector<SVGGElement>("[data-route-plane]");
  const stops = Array.from(root.querySelectorAll<HTMLElement>("[data-stop]"));
  const routeLength = route?.getTotalLength() ?? 0;
  const stopDots = Array.from(root.querySelectorAll<SVGCircleElement>("[data-stop-dot]"));
  if (route) stopDots.forEach((d, i) => {
    const pt = route.getPointAtLength(i / Math.max(1, stopDots.length - 1) * routeLength);
    d.setAttribute("cx", pt.x.toFixed(1));
    d.setAttribute("cy", pt.y.toFixed(1));
  });
  let lastY = -1, lastH = -1, lastScroll = window.scrollY, velocity = 0;

  const measure = () => {
    const vh = innerHeight;
    for (const el of pinned) {
      const r = el.getBoundingClientRect();
      const span = r.height - vh;
      const p = span > 0 ? clamp(-r.top / span) : clamp((vh - r.top) / (vh + r.height));
      el.style.setProperty("--p", p.toFixed(4));
      if (el.dataset.progress === "hero") heroP = p;
      if (el.dataset.progress === "manifesto") sideP = p;
      if (el.dataset.progress === "globe") globe?.setProgress(p);
      if (el.dataset.progress === "journey") paintRoute(p);
    }
    for (const el of passing) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--v", clamp((vh - r.top) / (vh + r.height)).toFixed(4));
    }
    paintPersona();
    const docMax = document.documentElement.scrollHeight - vh;
    progressBar?.style.setProperty("--scroll", docMax > 0 ? (window.scrollY / docMax).toFixed(4) : "0");
    html.classList.toggle("pm-scrolled", window.scrollY > 40);
  };

  function paintRoute(p: number) {
    if (!route || !plane) return;
    const t = clamp((p - 0.06) / 0.86);
    route.style.strokeDashoffset = String(1 - t);
    const at = route.getPointAtLength(t * routeLength);
    const ahead = route.getPointAtLength(Math.min(routeLength, t * routeLength + 2));
    const angle = Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180 / Math.PI;
    plane.setAttribute("transform", `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) rotate(${(angle + 90).toFixed(1)})`);
    const active = Math.min(stops.length - 1, Math.floor(t * (stops.length - 1) + 0.02));
    stops.forEach((s, i) => {
      s.toggleAttribute("data-active", i === active);
      s.toggleAttribute("data-done", i < active);
    });
    stopDots.forEach((d, i) => d.toggleAttribute("data-done", i <= active));
    root.querySelector<HTMLElement>("[data-step-count]")?.replaceChildren(String(active + 1).padStart(2, "0"));
  }

  /* ---------- Marquee driven by time and scroll velocity ---------- */
  const marquees = Array.from(root.querySelectorAll<HTMLElement>("[data-marquee]")).map(el => ({ el, x: 0, dir: 1 }));

  let tick = 0, lastT = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const y = window.scrollY, h = document.documentElement.scrollHeight;
    if (y !== lastY || h !== lastH) { measure(); lastY = y; lastH = h; }
    velocity += ((y - lastScroll) / Math.max(dt, 0.001) - velocity) * 0.12;
    lastScroll = y;
    if (!reduced) {
      for (const m of marquees) {
        if (Math.abs(velocity) > 30) m.dir = velocity > 0 ? 1 : -1;
        const speed = 40 + Math.min(900, Math.abs(velocity) * 0.35);
        const w = m.el.scrollWidth / 2 || 1;
        m.x = (m.x - m.dir * speed * dt) % w;
        if (m.x > 0) m.x -= w;
        m.el.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
        m.el.style.setProperty("--skew", `${clamp(velocity / 3000, -1, 1) * -6}deg`);
      }
    }
    tick = requestAnimationFrame(loop);
  };
  const onResize = () => { sizeRails(); lastY = -1; };
  on(window, "resize", onResize);
  sizeRails();

  /* ---------- 3D scenes (created lazily as they approach) ---------- */
  const lazy = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const canvas = e.target as HTMLCanvasElement;
      lazy.unobserve(canvas);
      try {

        if (canvas.dataset.scene === "globe" && !globe) {
          const cities = Array.from(root.querySelectorAll<HTMLElement>("[data-city]"));
          globe = createGlobeScene(canvas, reduced, idx => cities.forEach((c, i) => c.toggleAttribute("data-arrived", i <= idx)));
        }
        canvas.closest("[data-scene-wrap]")?.setAttribute("data-scene-on", "");
        lastY = -1;
      } catch (err) {
        console.warn("Medtours 3D scene unavailable", err);
      }
    }
  }, { rootMargin: "300px 0px" });
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-scene]").forEach(c => lazy.observe(c));
  cleanups.push(() => { lazy.disconnect(); orbit?.destroy(); globe?.destroy(); });

  /* ---------- The single Care Orbit emblem ----------
     One fixed, full-viewport canvas. Its pose is blended between anchors:
     the loader mark, the hero (while it is pinned), and the promise section,
     so the same object travels through the page. */
  const orbitCanvas = root.querySelector<HTMLCanvasElement>("[data-orbit-canvas]");
  const halo = root.querySelector<HTMLElement>(".pm-orbit-halo");
  const heroAnchor = root.querySelector<HTMLElement>('[data-orbit-anchor="hero"]');
  const sideAnchor = root.querySelector<HTMLElement>('[data-orbit-anchor="side"]');
  const sideSection = sideAnchor?.closest<HTMLElement>("section") ?? null;
  const loaderMark = root.querySelector<SVGElement>(".pm-loader-mark");
  type Pose = OrbitPose;
  const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const mixPose = (a: Pose, b: Pose, k: number): Pose => ({
    x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, ringPx: a.ringPx + (b.ringPx - a.ringPx) * k,
    yaw: a.yaw + (b.yaw - a.yaw) * k, pitch: a.pitch + (b.pitch - a.pitch) * k,
    ringRy: a.ringRy + (b.ringRy - a.ringRy) * k, ringRx: a.ringRx + (b.ringRx - a.ringRx) * k,
    ringK: a.ringK + (b.ringK - a.ringK) * k, shadow: a.shadow + (b.shadow - a.shadow) * k,
    interactive: k > 0.5 ? b.interactive : a.interactive, visible: true,
  });
  /** An anchor's box where it sits while its section is pinned (or where it is now, if nothing pins). */
  const pinnedBox = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const sticky = el.closest<HTMLElement>(".pm-sticky");
    if (!sticky || reduced) return r;
    const sr = sticky.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    return { left: r.left, top: top + (r.top - sr.top), width: r.width, height: r.height } as DOMRect;
  };
  const heroPose = (t: number): Pose => {
    const b = heroAnchor ? pinnedBox(heroAnchor) : ({ left: innerWidth * 0.45, top: 0, width: innerWidth * 0.55, height: innerHeight } as DOMRect);
    const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.18;
    const size = Math.min(b.width, b.height) * 0.74 * (1 - heroP * 0.18);
    const bob = reduced ? 0 : Math.sin(t * 0.9) * size * 0.02;
    return {
      x: b.left + b.width / 2, y: b.top + b.height / 2 - heroP * innerHeight * 0.05 + bob, ringPx: size,
      yaw: idle + heroP * Math.PI * 0.9 - 0.42, pitch: 0.06 - heroP * 0.25,
      ringRy: 0.55 + heroP * 0.5, ringRx: 0.32 + heroP * 0.9, ringK: 1, shadow: 1, interactive: true, visible: true,
    };
  };
  const sidePose = (t: number): Pose => {
    // Aim at where the anchor sits once its section is pinned, so the emblem glides straight
    // there instead of chasing the section up from the bottom of the screen. It only moves
    // up again when the section itself scrolls away.
    const box = pinnedBox(sideAnchor!);
    const leave = reduced || !sideSection ? 0 : Math.min(0, sideSection.getBoundingClientRect().bottom - innerHeight);
    const r = { left: box.left, top: box.top + leave, width: box.width, height: box.height };
    const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.18;
    const size = Math.min(r.width, r.height) * 0.66;
    const bob = reduced ? 0 : Math.sin(t * 0.9) * size * 0.02;
    return {
      x: r.left + r.width / 2, y: r.top + r.height / 2 + bob, ringPx: size,
      // Continues the hero's turn rather than starting over.
      yaw: idle + Math.PI * 0.9 - 0.42 + sideP * Math.PI * 1.4, pitch: -0.19 + Math.sin(sideP * Math.PI) * 0.3,
      ringRy: 1.05 - sideP * 0.8, ringRx: 1.22 - sideP * 1.05, ringK: 1, shadow: 1, interactive: true, visible: true,
    };
  };
  // The loader's mark is measured while it is still; the flight starts from that spot.
  let markBox: DOMRect | null = null;
  const loaderPose = (t: number): Pose => {
    if (loader.phase === "loading" || !markBox) {
      const box = loaderMark?.getBoundingClientRect();
      if (box && box.width > 0) markBox = box;
    }
    const r = markBox;
    const size = r ? r.width : 220;
    const lp = loader.lp;
    const pop = 1 - Math.pow(1 - clamp(lp * 2.2), 3);
    return {
      x: r ? r.left + r.width / 2 : innerWidth / 2, y: r ? r.top + r.height / 2 : innerHeight / 2,
      // The 3D cross fills the drawn ring; the orbit ring itself is folded away until the flight.
      ringPx: size * 0.86 * pop,
      yaw: -0.42 + (lp - 1) * Math.PI * 2 + (reduced ? 0 : Math.sin(t * 0.8) * 0.05), pitch: 0.06 + (1 - lp) * 0.3,
      ringRy: 0.55, ringRx: 0.32, ringK: 0, shadow: 0, interactive: false, visible: true,
    };
  };
  const getPose = (t: number): Pose => {
    let pose: Pose;
    if (loader.phase === "loading") pose = loaderPose(t);
    else if (loader.phase === "flying") {
      const f = ease((performance.now() - loader.flyStart) / (reduced ? 300 : FLIGHT_MS));
      pose = mixPose(loaderPose(t), heroPose(t), f);
      pose.yaw += Math.sin(Math.PI * f) * 0.9;
      pose.ringK = clamp(f * 1.3 - 0.15);
    } else if (sideAnchor && sideSection) {
      const top = sideSection.getBoundingClientRect().top;
      const stickyTop = parseFloat(getComputedStyle(sideAnchor.closest(".pm-sticky") ?? sideSection).top) || 0;
      const w = clamp((innerHeight - top) / Math.max(1, innerHeight - stickyTop));
      pose = mixPose(heroPose(t), sidePose(t), ease(w));
    } else pose = heroPose(t);
    pose.visible = pose.y + pose.ringPx > -40 && pose.y - pose.ringPx < innerHeight + 40;
    if (halo) {
      const glow = loader.phase === "loading" ? 0 : loader.phase === "flying" ? clamp((performance.now() - loader.flyStart) / FLIGHT_MS) : 1;
      halo.style.transform = `translate3d(${pose.x.toFixed(1)}px, ${pose.y.toFixed(1)}px, 0) scale(${(pose.ringPx * 1.25 / 100).toFixed(3)})`;
      halo.style.opacity = String(pose.visible ? glow : 0);
    }
    return pose;
  };
  if (orbitCanvas) {
    try {
      orbit = createOrbitScene(orbitCanvas, reduced, { getPose, onFirstFrame: () => loader.mark("scene") });
      if (orbit) html.classList.add("pm-gl");
    } catch (err) {
      console.warn("Medtours 3D emblem unavailable", err);
    }
  }
  if (!orbit) loader.mark("scene");
  cleanups.push(() => html.classList.remove("pm-gl"));

  tick = requestAnimationFrame(loop);
  cleanups.push(() => cancelAnimationFrame(tick));

  /* ---------- Reveal on enter ---------- */
  const revealer = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("pm-in"); revealer.unobserve(e.target); }
  }, { rootMargin: "0px 0px -12% 0px" });
  root.querySelectorAll("[data-pm-reveal]").forEach(el => revealer.observe(el));
  cleanups.push(() => revealer.disconnect());

  /* ---------- Counters ---------- */
  const counter = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const el = e.target as HTMLElement;
      const end = Number(el.dataset.count);
      if (reduced) { el.textContent = String(end); continue; }
      const start = performance.now(), dur = 1400;
      const run = (now: number) => {
        const k = clamp((now - start) / dur);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }
  }, { threshold: 0.6 });
  root.querySelectorAll("[data-count]").forEach(el => counter.observe(el));
  cleanups.push(() => counter.disconnect());

  /* ---------- Patient / attender journeys ----------
     The tabs swap the list; scrolling through the list picks the step, and
     the pinned photo wipes to the shot for that step. */
  const personaRoot = root.querySelector<HTMLElement>("[data-persona-root]");
  let paintPersona = () => {};
  if (personaRoot) {
    const tabs = Array.from(personaRoot.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    const shots = new Map(Array.from(personaRoot.querySelectorAll<HTMLImageElement>("[data-shot]")).map(img => [img.dataset.shot!, img]));
    const num = personaRoot.querySelector<HTMLElement>("[data-shot-num]");
    const title = personaRoot.querySelector<HTMLElement>("[data-shot-title]");
    const caption = title?.closest("figcaption");
    const bars = Array.from(personaRoot.querySelectorAll<HTMLElement>("[data-bar]"));
    let current = "patient-0";
    let step = 0;

    const showShot = (key: string, label: string, index: number) => {
      bars.forEach((b, i) => { b.toggleAttribute("data-done", i < index); b.toggleAttribute("data-on", i === index); });
      if (key === current) return;
      shots.forEach(img => { img.removeAttribute("data-prev"); });
      const prev = shots.get(current);
      if (prev) { prev.removeAttribute("data-current"); prev.setAttribute("data-prev", ""); }
      const next = shots.get(key);
      if (next) { next.removeAttribute("data-current"); void next.offsetWidth; next.setAttribute("data-current", ""); }
      current = key;
      if (num) num.textContent = String(index + 1).padStart(2, "0");
      if (title) title.textContent = label;
      if (caption) { caption.classList.remove("pm-swap"); void (caption as HTMLElement).offsetWidth; caption.classList.add("pm-swap"); }
    };

    const items = () => Array.from(personaRoot.querySelectorAll<HTMLElement>(".pm-steps-list:not([hidden]) [data-step]"));
    const side = personaRoot.querySelector<HTMLElement>(".pm-persona-side");
    // Where a step counts as "being read": 45% down the screen, or just under the pinned photo on phones.
    const readLine = () => innerWidth <= 900 && side
      ? Math.min(innerHeight * 0.8, side.getBoundingClientRect().bottom + 70)
      : innerHeight * 0.45;
    const setStep = (index: number) => {
      const list = items();
      const li = list[index];
      if (!li) return;
      step = index;
      list.forEach((el, i) => { el.toggleAttribute("data-active", i === index); el.toggleAttribute("data-done", i < index); });
      showShot(li.dataset.shotKey!, li.querySelector("strong")?.textContent ?? "", index);
    };

    // Called from the scroll loop: the step whose box crosses 45% of the viewport is active.
    paintPersona = () => {
      const list = items();
      if (!list.length) return;
      const line = readLine();
      let index = 0;
      list.forEach((el, i) => { if (el.getBoundingClientRect().top < line) index = i; });
      const r = list[index].getBoundingClientRect();
      const fill = clamp((line - r.top) / Math.max(1, r.height));
      list[index].style.setProperty("--fill", fill.toFixed(3));
      bars[index]?.style.setProperty("--fill", fill.toFixed(3));
      if (index !== step || !list[index].hasAttribute("data-active")) setStep(index);
    };

    const select = (tab: HTMLButtonElement, focus = false) => {
      const who = tab.dataset.persona!;
      if (personaRoot.dataset.active === who) return;
      personaRoot.dataset.active = who;
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls")!);
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      // Keep the same step in the other journey, then let the scroll loop take over again.
      step = -1;
      setStep(Math.max(0, Math.min(3, items().findIndex(el => el.getBoundingClientRect().top >= 0))));
      lastY = -1;
    };
    // Hero entry links choose a journey before scrolling to it.
    const go = (e: Event) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>("[data-persona-go]");
      if (!link) return;
      const tab = tabs.find(t => t.dataset.persona === link.dataset.personaGo);
      if (tab) select(tab);
    };
    root.addEventListener("click", go);
    cleanups.push(() => root.removeEventListener("click", go));
    const click = (e: Event) => {
      const target = e.target as Element;
      const tab = target.closest<HTMLButtonElement>("[role=tab]");
      if (tab) { select(tab); return; }
      const li = target.closest<HTMLElement>("[data-step]");
      if (li) {
        const r = li.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - readLine() + 40, behavior: reduced ? "auto" : "smooth" });
      }
    };
    const key = (e: KeyboardEvent) => {
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[next], true);
    };
    personaRoot.addEventListener("click", click);
    personaRoot.addEventListener("keydown", key);
    cleanups.push(() => { personaRoot.removeEventListener("click", click); personaRoot.removeEventListener("keydown", key); });
  }

  /* ---------- Accreditation seals flip on click or tap ---------- */
  const flip = (e: Event) => {
    const seal = (e.target as Element).closest<HTMLElement>(".pm-seal");
    if (!seal || !root.contains(seal)) return;
    seal.toggleAttribute("data-flipped");
    seal.setAttribute("aria-pressed", String(seal.hasAttribute("data-flipped")));
  };
  root.addEventListener("click", flip);
  cleanups.push(() => root.removeEventListener("click", flip));

  /* ---------- Pointer effects: tilt, magnet, parallax, cursor ---------- */
  if (fine && !reduced) {
    const cursor = document.createElement("div");
    cursor.className = "pm-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="pm-cursor-dot"></span><span class="pm-cursor-ring"><b></b></span>';
    document.body.append(cursor);
    const label = cursor.querySelector("b")!;
    let cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy, craf = 0;
    let tiltEl: HTMLElement | null = null, magEl: HTMLElement | null = null;

    const follow = () => {
      rx += (cx - rx) * 0.16; ry += (cy - ry) * 0.16;
      cursor.style.setProperty("--x", cx + "px"); cursor.style.setProperty("--y", cy + "px");
      cursor.style.setProperty("--rx", rx + "px"); cursor.style.setProperty("--ry", ry + "px");
      craf = Math.abs(cx - rx) + Math.abs(cy - ry) > 0.3 ? requestAnimationFrame(follow) : 0;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cx = e.clientX; cy = e.clientY;
      cursor.dataset.on = "";
      if (!craf) craf = requestAnimationFrame(follow);
      const target = e.target instanceof Element ? e.target : null;

      const hint = target?.closest<HTMLElement>("[data-cursor]");
      const interactive = target?.closest("a, button, summary, [role=tab], label, input, select, textarea");
      cursor.dataset.state = hint ? hint.dataset.cursor! : interactive ? "link" : "";
      label.textContent = hint?.dataset.cursorLabel ?? "";

      // Hero parallax for the floating notes.
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      root.style.setProperty("--px", nx.toFixed(3));
      root.style.setProperty("--py", ny.toFixed(3));

      const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (tiltEl && tiltEl !== tilt) { tiltEl.style.removeProperty("--rx"); tiltEl.style.removeProperty("--ry"); delete tiltEl.dataset.tilting; }
      tiltEl = tilt;
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        tilt.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
        tilt.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        tilt.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
        tilt.dataset.tilting = "";
      }

      const mag = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magEl && magEl !== mag) { magEl.style.removeProperty("--mx"); magEl.style.removeProperty("--my"); }
      magEl = mag;
      if (mag) {
        const r = mag.getBoundingClientRect();
        const strength = Number(mag.dataset.magnetic) || 0.3;
        mag.style.setProperty("--mx", ((e.clientX - (r.left + r.width / 2)) * strength).toFixed(1) + "px");
        mag.style.setProperty("--my", ((e.clientY - (r.top + r.height / 2)) * strength).toFixed(1) + "px");
      }
    };
    const leave = () => { delete cursor.dataset.on; };
    const press = () => cursor.toggleAttribute("data-press", true);
    const release = () => cursor.toggleAttribute("data-press", false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    html.classList.add("pm-cursor-on");
    cleanups.push(() => {
      cancelAnimationFrame(craf);
      cursor.remove();
      html.classList.remove("pm-cursor-on");
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    });
  }

  const onReducedChange = () => location.reload();
  reducedQuery.addEventListener("change", onReducedChange);
  cleanups.push(() => reducedQuery.removeEventListener("change", onReducedChange));

  return () => {
    cleanups.reverse().forEach(fn => fn());
    html.classList.remove("pm-js", "pm-reduced", "pm-ready", "pm-scrolled");
  };
}

/* ---------- First-visit loader ----------
   Progress follows real milestones (fonts, page load, the hero's first 3D
   frame) but never runs faster than a short minimum, so the sequence reads. */
type Loader = { active: boolean; phase: "loading" | "flying" | "done"; lp: number; flyStart: number; mark(name: "scene"): void };
export const FLIGHT_MS = 1400;

function runLoader(root: HTMLElement, reduced: boolean, onReveal: () => void, cleanups: (() => void)[]): Loader {
  const html = document.documentElement;
  const el = root.querySelector<HTMLElement>("#pm-loader");
  const w = window as Window & { __pmLoadStart?: number; __pmLoaderDone?: boolean };
  const hide = () => {
    html.classList.remove("pm-loading");
    html.classList.add("pm-loaded");
    el?.setAttribute("hidden", "");
  };
  // Only a full page load of the homepage plays it; client-side navigation goes straight in.
  if (!el || el.hidden || !w.__pmLoadStart || w.__pmLoaderDone) {
    hide();
    return { active: false, phase: "done", lp: 1, flyStart: 0, mark() {} };
  }
  html.classList.add("pm-loading");
  const api: Loader = { active: true, phase: "loading", lp: 0, flyStart: 0, mark(name) { milestones[name] = true; } };

  const milestones = { fonts: false, load: false, scene: false };
  const total = Object.keys(milestones).length;
  const minTime = reduced ? 500 : 2600;
  const maxTime = 7000;
  const start = w.__pmLoadStart;
  const count = el.querySelector<HTMLElement>("[data-loader-count]");
  const steps = Array.from(el.querySelectorAll<HTMLElement>("[data-loader-step]"));
  const outside = Array.from(document.querySelectorAll<HTMLElement>("#site-content > header, #site-content > footer, #pm-home > section"));
  outside.forEach(n => { n.inert = true; });

  let shown = 0, raf = 0, finished = false, last = performance.now();
  const done = () => Object.values(milestones).filter(Boolean).length;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    w.__pmLoaderDone = true;
    el.style.setProperty("--lp", "1");
    if (count) count.textContent = "100";
    steps.forEach((s, i) => s.toggleAttribute("data-active", i === steps.length - 1));
    outside.forEach(n => { n.inert = false; });
    el.dataset.state = "exit";
    // The emblem now flies from the loader into the hero while the curtain opens.
    api.lp = 1;
    api.phase = "flying";
    api.flyStart = performance.now();
    const flight = reduced ? 300 : FLIGHT_MS;
    window.setTimeout(onReveal, reduced ? 50 : flight * 0.45);
    window.setTimeout(() => { api.phase = "done"; hide(); }, flight);
  };

  const tick = (now: number) => {
    const elapsed = now - start;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const byTime = Math.min(1, elapsed / minTime);
    const byWork = done() === total ? 1 : (done() + 0.8 * (1 - Math.exp(-elapsed / 1400))) / total;
    const target = elapsed > maxTime ? 1 : Math.min(byTime, byWork);
    shown += (target - shown) * (1 - Math.exp(-dt / (reduced ? 0.05 : 0.22)));
    if (target === 1 && shown > 0.985) shown = 1;
    el.style.setProperty("--lp", shown.toFixed(4));
    api.lp = shown;
    const pct = Math.floor(shown * 100);
    if (count && count.textContent !== String(pct)) count.textContent = String(pct);
    const step = shown >= 1 ? steps.length - 1 : Math.min(steps.length - 2, Math.floor(shown * (steps.length - 1)));
    steps.forEach((s, i) => { s.toggleAttribute("data-active", i === step); s.toggleAttribute("data-done", i < step); });
    if (shown >= 1) { window.setTimeout(finish, reduced ? 0 : 380); return; }
    raf = requestAnimationFrame(tick);
  };

  document.fonts?.ready.then(() => { milestones.fonts = true; }, () => { milestones.fonts = true; });
  if (document.readyState === "complete") milestones.load = true;
  else window.addEventListener("load", () => { milestones.load = true; }, { once: true });

  const skip = (e: Event) => {
    if (e instanceof KeyboardEvent && e.key !== "Escape") return;
    if (e.type === "click" && !(e.target instanceof Element && e.target.closest("[data-loader-skip]"))) return;
    finish();
  };
  el.addEventListener("click", skip);
  window.addEventListener("keydown", skip);
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    el.removeEventListener("click", skip);
    window.removeEventListener("keydown", skip);
    outside.forEach(n => { n.inert = false; });
    // Leaving mid-load (or React re-running effects in development): release the page, keep the markup.
    if (!finished) html.classList.remove("pm-loading");
  });

  raf = requestAnimationFrame(tick);
  return api;
}
