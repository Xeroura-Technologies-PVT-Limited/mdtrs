import { createOrbitScene, type OrbitScene } from "./orbit-scene";
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
  let orbitSide: OrbitScene | null = null;
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
      if (el.dataset.progress === "hero") orbit?.setProgress(p);
      if (el.dataset.progress === "manifesto") orbitSide?.setProgress(p);
      if (el.dataset.progress === "globe") globe?.setProgress(p);
      if (el.dataset.progress === "journey") paintRoute(p);
    }
    for (const el of passing) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--v", clamp((vh - r.top) / (vh + r.height)).toFixed(4));
    }
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
        if (canvas.dataset.scene === "orbit" && !orbit) {
          orbit = createOrbitScene(canvas, reduced, { onFirstFrame: () => loader.mark("scene") });
          if (!orbit) loader.mark("scene");
        }
        if (canvas.dataset.scene === "orbit-side" && !orbitSide) orbitSide = createOrbitScene(canvas, reduced, { mode: "side" });
        if (canvas.dataset.scene === "globe" && !globe) {
          const cities = Array.from(root.querySelectorAll<HTMLElement>("[data-city]"));
          globe = createGlobeScene(canvas, reduced, idx => cities.forEach((c, i) => c.toggleAttribute("data-arrived", i <= idx)));
        }
        canvas.closest("[data-scene-wrap]")?.setAttribute("data-scene-on", "");
        lastY = -1;
      } catch (err) {
        console.warn("Medtours 3D scene unavailable", err);
        if (canvas.dataset.scene === "orbit") loader.mark("scene");
      }
    }
  }, { rootMargin: "300px 0px" });
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-scene]").forEach(c => lazy.observe(c));
  cleanups.push(() => { lazy.disconnect(); orbit?.destroy(); orbitSide?.destroy(); globe?.destroy(); });

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

  /* ---------- Patient / attender switch ---------- */
  const personaRoot = root.querySelector<HTMLElement>("[data-persona-root]");
  if (personaRoot) {
    const tabs = Array.from(personaRoot.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    const select = (tab: HTMLButtonElement, focus = false) => {
      const who = tab.dataset.persona!;
      personaRoot.dataset.active = who;
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls")!);
        if (panel) { panel.hidden = !on; }
      });
      if (focus) tab.focus();
    };
    const click = (e: Event) => {
      const tab = (e.target as Element).closest<HTMLButtonElement>("[role=tab]");
      if (tab) select(tab);
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
type Loader = { active: boolean; mark(name: "scene"): void };

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
    return { active: false, mark() {} };
  }
  html.classList.add("pm-loading");

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
    html.classList.remove("pm-loading"); // let the hero start rendering as the curtain opens
    window.setTimeout(onReveal, reduced ? 50 : 650);
    window.setTimeout(hide, reduced ? 350 : 1700);
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
  return { active: true, mark(name) { milestones[name] = true; } };
}
