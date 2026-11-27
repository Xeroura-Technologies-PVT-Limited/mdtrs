import { createOrbitScene, type OrbitPose, type OrbitScene } from "./orbit-scene";
import { createOrbitMesh } from "./orbit-mesh";
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
    if (!html.dataset.intro) {
      const frame = requestAnimationFrame(ready);
      cleanups.push(() => cancelAnimationFrame(frame));
    } else {
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
      rail.style.height = `${dist + VH * 1.1}px`;
    }
  };

  /* ---------- Scroll-linked progress ---------- */
  const pinned = Array.from(root.querySelectorAll<HTMLElement>("[data-progress]"));
  const passing = Array.from(root.querySelectorAll<HTMLElement>("[data-view]"));
  const personaEl = root.querySelector<HTMLElement>("[data-persona-root]");
  const progressBar = document.querySelector<HTMLElement>(".pm-progress");
  let orbit: OrbitScene | null = null;
  let globe: GlobeScene | null = null;
  const route = root.querySelector<SVGPathElement>("[data-route]");
  const plane = root.querySelector<SVGGElement>("[data-route-plane]");
  const stops = Array.from(root.querySelectorAll<HTMLElement>("[data-stop]"));
  const routeLength = route?.getTotalLength() ?? 0;

  /* ---------- Stable geometry ----------
     On phones the address bar collapses on the first swipe, which changes innerHeight and
     fires resize mid-gesture. Everything scroll-linked therefore uses a viewport height that
     never changes (the small viewport, which is also what the pinned panels are sized to), and
     section positions are measured once and cached. Nothing reads layout while scrolling. */
  const lowPower = innerWidth < 900 || matchMedia("(pointer: coarse)").matches;
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  cleanups.push(() => probe.remove());
  let VH = innerHeight;
  type Span = { top: number; height: number };
  type AnchorBox = { left: number; width: number; height: number; docTop: number; dy: number; stickyTop: number; pinned: boolean };
  const spans = new Map<Element, Span>();
  const anchorBoxes = new Map<Element, AnchorBox>();
  const span = (el: Element): Span => {
    let v = spans.get(el);
    if (!v) { const r = el.getBoundingClientRect(); v = { top: r.top + window.scrollY, height: r.height }; spans.set(el, v); }
    return v;
  };
  const anchorBox = (el: HTMLElement): AnchorBox => {
    let v = anchorBoxes.get(el);
    if (!v) {
      const sy = window.scrollY, r = el.getBoundingClientRect();
      const sticky = el.closest<HTMLElement>(".pm-sticky");
      const sr = sticky?.getBoundingClientRect();
      v = {
        left: r.left, width: r.width, height: r.height, docTop: r.top + sy,
        dy: sr ? r.top - sr.top : 0, stickyTop: sticky ? parseFloat(getComputedStyle(sticky).top) || 0 : 0, pinned: !!sticky && !reduced,
      };
      anchorBoxes.set(el, v);
    }
    return v;
  };
  let lastWidth = innerWidth;

  /* On touch screens scroll positions arrive unevenly (finger samples and momentum steps don't
     line up with frames). The emblem and the pinned text beside it follow one softly damped copy
     of the scroll position, computed once per frame, so they move together and glide. */
  const smoothing = lowPower && !reduced;
  let smoothY = window.scrollY, smoothKey = -1, smoothLast = -1;
  const smoothScroll = () => {
    const y = window.scrollY;
    if (!smoothing || loader.phase !== "done") { smoothKey = -1; return (smoothY = y); }
    const now = Number(document.timeline.currentTime ?? performance.now());
    if (now === smoothKey) return smoothY;
    const dt = smoothLast < 0 ? 0 : clamp((now - smoothLast) / 1000, 0, 0.1);
    smoothKey = smoothLast = now;
    smoothY += (y - smoothY) * (1 - Math.exp(-dt / 0.11));
    if (Math.abs(y - smoothY) < 0.1) smoothY = y;
    return smoothY;
  };
  const refresh = () => {
    VH = probe.offsetHeight || innerHeight;
    spans.clear(); anchorBoxes.clear();
    lastY = -1;
  };
  const stopDots = Array.from(root.querySelectorAll<SVGCircleElement>("[data-stop-dot]"));
  if (route) stopDots.forEach((d, i) => {
    const pt = route.getPointAtLength(i / Math.max(1, stopDots.length - 1) * routeLength);
    d.setAttribute("cx", pt.x.toFixed(1));
    d.setAttribute("cy", pt.y.toFixed(1));
  });
  let lastY = -1, lastH = -1, lastScroll = window.scrollY, velocity = 0;

  const written = new WeakMap<HTMLElement, string>();
  const write = (el: HTMLElement, name: string, value: string) => {
    if (written.get(el) === value) return;
    written.set(el, value);
    el.style.setProperty(name, value);
  };
  const progressOf = (el: Element, y: number) => {
    const b = span(el), vh = VH, top = b.top - y, room = b.height - vh;
    return room > 0 ? clamp(-top / room) : clamp((vh - top) / (vh + b.height));
  };
  // Pinned sections whose text sits beside the emblem take the damped position too.
  const glides = new Set(pinned.filter(el => el.dataset.progress === "hero" || el.dataset.progress === "manifesto"));
  const measure = () => {
    const vh = VH, y = window.scrollY, sy = smoothScroll();
    for (const el of pinned) {
      const p = progressOf(el, glides.has(el) ? sy : y);
      write(el, "--p", p.toFixed(4));
      if (el.dataset.progress === "globe") globe?.setProgress(p);
      if (el.dataset.progress === "journey") paintRoute(p);
    }
    for (const el of passing) {
      const b = span(el), top = b.top - y;
      write(el, "--v", clamp((vh - top) / (vh + b.height)).toFixed(4));
    }
    // The journey steps measure their own rows, so only run them while they are near the screen.
    if (personaEl) {
      const b = span(personaEl);
      if (b.top - y < vh * 1.5 && b.top + b.height - y > -vh * 0.5) paintPersona();
    }
    const docMax = document.documentElement.scrollHeight - vh;
    if (progressBar) write(progressBar, "--scroll", docMax > 0 ? (y / docMax).toFixed(4) : "0");
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
  const marquees = Array.from(root.querySelectorAll<HTMLElement>("[data-marquee]")).map(el => ({ el, x: 0, dir: 1, seen: false, w: 0 }));
  const marqueeSeen = new IntersectionObserver(entries => {
    for (const e of entries) { const m = marquees.find(q => q.el === e.target); if (m) m.seen = e.isIntersecting; }
  }, { rootMargin: "200px 0px" });
  marquees.forEach(m => marqueeSeen.observe(m.el));
  cleanups.push(() => marqueeSeen.disconnect());

  let tick = 0, lastT = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const y = window.scrollY, h = document.documentElement.scrollHeight;
    if (y !== lastY || h !== lastH || (smoothing && smoothScroll() !== y)) { measure(); lastY = y; lastH = h; }
    velocity += ((y - lastScroll) / Math.max(dt, 0.001) - velocity) * 0.12;
    lastScroll = y;
    if (!reduced) {
      for (const m of marquees) {
        if (Math.abs(velocity) > 30) m.dir = velocity > 0 ? 1 : -1;
        if (!m.seen) continue;
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
  const onResize = () => {
    if (lowPower && innerWidth === lastWidth) return; // address bar showing or hiding: nothing moved
    lastWidth = innerWidth;
    sizeRails(); refresh();
  };
  on(window, "resize", onResize);
  // The router may have already positioned a fragment before the rail grows.
  const fragment = document.getElementById(location.hash.slice(1));
  const fragmentTop = fragment?.getBoundingClientRect().top;
  sizeRails();
  if (fragment && fragmentTop !== undefined && fragmentTop >= 0 && fragmentTop < innerHeight) {
    const shift = fragment.getBoundingClientRect().top - fragmentTop;
    if (shift) window.scrollBy({ top: shift, behavior: "instant" });
  }
  refresh();
  let refreshQueued = 0;
  const queueRefresh = () => { if (!refreshQueued) refreshQueued = requestAnimationFrame(() => { refreshQueued = 0; refresh(); }); };
  const ro = new ResizeObserver(queueRefresh);
  ro.observe(root);
  document.fonts?.ready.then(queueRefresh).catch(() => {});
  cleanups.push(() => { ro.disconnect(); cancelAnimationFrame(refreshQueued); });

  /* ---------- 3D scenes (created lazily as they approach) ---------- */
  const startScene = (canvas: HTMLCanvasElement) => {
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
  };
  const lazy = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) startScene(e.target as HTMLCanvasElement);
  }, { rootMargin: "300px 0px" });
  const sceneCanvases = Array.from(root.querySelectorAll<HTMLCanvasElement>("canvas[data-scene]"));
  sceneCanvases.forEach(c => lazy.observe(c));
  // Shader compilation is the single most expensive step; do it now, while the loader is up,
  // so it never lands in the middle of a swipe. The scene only draws once it is on screen.
  if (loader.active && !reduced) sceneCanvases.forEach(startScene);
  // Likewise fetch and decode the first photos down the page now, not during the first swipe.
  if (loader.active) {
    for (const img of Array.from(root.querySelectorAll<HTMLImageElement>(".pm-expand img"))) {
      img.loading = "eager";
      img.decode?.().catch(() => {});
    }
  }
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
  const pinnedBox = (el: HTMLElement, y: number) => {
    const a = anchorBox(el);
    return { left: a.left, top: a.pinned ? a.stickyTop + a.dy : a.docTop - y, width: a.width, height: a.height };
  };
  const heroPose = (t: number, heroP: number, y: number): Pose => {
    const b = heroAnchor ? pinnedBox(heroAnchor, y) : { left: innerWidth * 0.45, top: 0, width: innerWidth * 0.55, height: VH };
    const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.18;
    const size = Math.min(b.width, b.height) * 0.74 * (1 - heroP * 0.18);
    const bob = reduced ? 0 : Math.sin(t * 0.9) * size * 0.02;
    return {
      x: b.left + b.width / 2, y: b.top + b.height / 2 - heroP * VH * 0.05 + bob, ringPx: size,
      yaw: idle + heroP * Math.PI * 0.9 - 0.42, pitch: 0.06 - heroP * 0.25,
      ringRy: 0.55 + heroP * 0.5, ringRx: 0.32 + heroP * 0.9, ringK: 1, shadow: 1, interactive: true, visible: true,
    };
  };
  const sidePose = (t: number, sideP: number, y: number): Pose => {
    // Aim at where the anchor sits once its section is pinned, so the emblem glides straight
    // there instead of chasing the section up from the bottom of the screen. It only moves
    // up again when the section itself scrolls away.
    const box = pinnedBox(sideAnchor!, y);
    // Leaving is attached to the page itself, so it follows the real scroll position.
    const sy = window.scrollY;
    const leave = reduced || !sideSection ? 0 : Math.min(0, span(sideSection).top + span(sideSection).height - sy - VH);
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
    const y = smoothScroll();
    const heroSection = heroAnchor?.closest<HTMLElement>("section") ?? null;
    const heroP = heroSection ? progressOf(heroSection, y) : 0;
    const sideP = sideSection ? progressOf(sideSection, y) : 0;
    if (loader.phase === "loading") pose = loaderPose(t);
    else if (loader.phase === "flying") {
      const f = ease((performance.now() - loader.flyStart) / (reduced ? 300 : FLIGHT_MS));
      pose = mixPose(loaderPose(t), heroPose(t, heroP, y), f);
      pose.yaw += Math.sin(Math.PI * f) * 0.9;
      pose.ringK = clamp(f * 1.3 - 0.15);
    } else if (sideAnchor && sideSection) {
      const sideTop = span(sideSection).top;
      const stickyTop = anchorBox(sideAnchor).stickyTop;
      // Start the glide halfway through the hero and finish as the promise pins, so the
      // emblem drifts across over a long stretch of scroll rather than snapping.
      let w: number;
      if (heroSection && !reduced) {
        const hs = span(heroSection);
        const start = hs.top + (hs.height - VH) * 0.5;
        const end = sideTop - stickyTop;
        w = clamp((y - start) / Math.max(1, end - start));
      } else w = clamp((VH - (sideTop - y)) / Math.max(1, VH - stickyTop));
      const smooth = 0.5 - Math.cos(Math.PI * w) / 2;
      pose = mixPose(heroPose(t, heroP, y), sidePose(t, sideP, y), smooth);
      // One continuous turn for the whole journey: the rotation keeps the speed it had in the
      // hero, through the glide and on through the promise, instead of settling at each stop.
      if (heroSection && !reduced) {
        const hs = span(heroSection);
        const u = Math.max(0, (y - hs.top) / Math.max(1, hs.height - VH));
        const idle = Math.sin(t * 0.25) * 0.18;
        pose.yaw = idle - 0.42 + u * Math.PI * 0.9;
        pose.ringRy = 0.55 + u * 0.5;
        pose.ringRx = 0.32 + u * 0.9;
        pose.pitch = 0.06 - Math.sin(Math.min(u, 1) * Math.PI / 2) * 0.25;
      }
    } else pose = heroPose(t, heroP, y);
    pose.visible = pose.y + pose.ringPx > -40 && pose.y - pose.ringPx < innerHeight + 40;
    if (halo) {
      const glow = loader.phase === "loading" ? 0 : loader.phase === "flying" ? clamp((performance.now() - loader.flyStart) / FLIGHT_MS) : 1;
      halo.style.transform = `translate3d(${pose.x.toFixed(1)}px, ${pose.y.toFixed(1)}px, 0) scale(${(pose.ringPx * 1.25 / 100).toFixed(3)})`;
      halo.style.opacity = String(pose.visible ? glow : 0);
    }
    return pose;
  };
  if (orbitCanvas) {
    const onContextLost = () => {
      html.classList.remove("pm-gl");
      orbit?.destroy();
      orbit = null;
      loader.mark("scene");
    };
    orbitCanvas.addEventListener("webglcontextlost", onContextLost);
    cleanups.push(() => orbitCanvas.removeEventListener("webglcontextlost", onContextLost));
    try {
      // Phones and tablets draw the emblem as anti-aliased meshes; desktops raymarch it.
      const make = lowPower ? createOrbitMesh : createOrbitScene;
      orbit = make(orbitCanvas, reduced, {
        getPose,
        onFirstFrame() {
          html.classList.add("pm-gl");
          loader.mark("scene");
        },
      });
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
    if (location.hash === "#journeys") {
      const requested = tabs.find(tab => tab.dataset.persona === html.dataset.persona);
      if (requested) select(requested);
    }
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
  const el = root.querySelector<HTMLElement & { __pmLoadStart?: number }>("#pm-loader");
  const hide = () => {
    html.classList.remove("pm-loading");
    html.classList.add("pm-loaded");
    el?.setAttribute("hidden", "");
  };
  // Only a full page load of the homepage plays it; client-side navigation goes straight in.
  if (!el || el.hidden || el.__pmLoadStart === undefined) {
    hide();
    return { active: false, phase: "done", lp: 1, flyStart: 0, mark() {} };
  }
  html.classList.add("pm-loading");
  const api: Loader = { active: true, phase: "loading", lp: 0, flyStart: 0, mark(name) { milestones[name] = true; } };

  const milestones = { fonts: false, load: false, scene: false };
  const total = Object.keys(milestones).length;
  const minTime = reduced ? 500 : 2600;
  const maxTime = 7000;
  const start = el.__pmLoadStart;
  const count = el.querySelector<HTMLElement>("[data-loader-count]");
  const steps = Array.from(el.querySelectorAll<HTMLElement>("[data-loader-step]"));
  const outside = Array.from(document.querySelectorAll<HTMLElement>("#site-content > header, #site-content > footer, #pm-home > section"));
  outside.forEach(n => { n.inert = true; });

  let shown = 0, raf = 0, finished = false, last = performance.now();
  let finishTimer = 0, revealTimer = 0, hideTimer = 0;
  const done = () => Object.values(milestones).filter(Boolean).length;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
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
    revealTimer = window.setTimeout(onReveal, reduced ? 50 : flight * 0.45);
    hideTimer = window.setTimeout(() => { api.phase = "done"; hide(); }, flight);
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
    if (shown >= 1) { finishTimer = window.setTimeout(finish, reduced ? 0 : 380); return; }
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
    window.clearTimeout(finishTimer);
    window.clearTimeout(revealTimer);
    window.clearTimeout(hideTimer);
    el.removeEventListener("click", skip);
    window.removeEventListener("keydown", skip);
    outside.forEach(n => { n.inert = false; });
    // Leaving mid-load (or React re-running effects in development): release the page, keep the markup.
    html.classList.remove("pm-loading");
  });

  raf = requestAnimationFrame(tick);
  return api;
}
