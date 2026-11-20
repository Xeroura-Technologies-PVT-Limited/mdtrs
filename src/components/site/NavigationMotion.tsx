"use client";

import { Suspense, useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { navigationEvent, type LinkDestination } from "./SiteLink";
import { addresses, resolveScene, scenes, type SceneId } from "@/lib/motion/scenes";
import { loaderDisplayMs } from "@/lib/motion/intro";
import { paintStage, scenePlate } from "@/lib/motion/plate";
import { sharePlate, transitionFrames } from "@/lib/motion/transitions";

const samePage = (a: URL, b: URL) => a.pathname === b.pathname && a.search === b.search;
const sceneOf = (url: URL) => resolveScene(url.pathname, url.hash, addresses);
const destinationName = (url: URL) => scenes[sceneOf(url)].title;

function targetOf(url: URL) {
  let id = url.hash.slice(1);
  try { id = decodeURIComponent(id); } catch { /* IDs may contain a literal %. */ }
  return id ? document.getElementById(id) : null;
}

function RouteCommit() {
  const path = usePathname();
  const query = useSearchParams();
  useLayoutEffect(() => { window.dispatchEvent(new Event("mt:route-commit")); }, [path, query]);
  return null;
}

type Trip = {
  scene: SceneId;
  started: number;
  revisit: boolean;
  drawing?: Element;
  destination: URL;
  perform?: () => void;
  scroll: boolean;
  sent: boolean;
  ready: boolean;
};

export function NavigationMotion() {
  const router = useRouter();
  useEffect(() => {
    const sheet = document.querySelector<HTMLElement>(".motion-sheet")!;
    const status = document.querySelector<HTMLElement>(".route-status")!;
    const root = document.documentElement;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let last = new URL(location.href);
    let pageEntry = { url: last, state: history.state };
    let active: Trip | null = null;
    let background: Trip | null = null;
    let curtain: Animation | undefined;
    let heading: Animation | undefined;
    let outgoing: Animation | undefined;
    let releasePlate: (() => void) | undefined;
    let readingTimer = 0;
    let announce = 0;
    const canAnimate = () => !media.matches && !!sheet.animate && !root.dataset.intro;

    function clear() {
      window.clearTimeout(announce);
      window.clearTimeout(readingTimer);
      releasePlate?.();
      releasePlate = undefined;
      curtain?.cancel();
      outgoing?.cancel();
      curtain = undefined;
      active = null;
      background = null;
      delete root.dataset.travel;
      delete root.dataset.transitWait;
      status.textContent = "";
    }

    function glide(trip: Trip, opening: boolean, duration: number, done: () => void) {
      curtain?.cancel();
      const animation = sheet.animate(transitionFrames(scenes[trip.scene].cut, opening), {
        duration, easing: opening ? "cubic-bezier(.58,.02,.27,1)" : "cubic-bezier(.28,.02,.22,1)", fill: "both",
        id: `${trip.scene}-${opening ? "uncover" : "cover"}`,
      });
      curtain = animation;
      void animation.finished.then(() => { if (curtain === animation) done(); }, () => {});
    }

    function accent(url: URL) {
      const target = targetOf(url);
      const title = target?.matches("h1,h2,h3") ? target : target?.querySelector("h1,h2,h3");
      if (!title || !canAnimate()) return;
      const bounds = title.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      heading?.cancel();
      heading = title.animate([{ translate: "0 12px", opacity: .55 }, { translate: "0 0", opacity: 1 }],
        { duration: 410, easing: "cubic-bezier(.19,.76,.27,1)", id: "landmark-arrival" });
    }

    function rewindHero() {
      const hero = document.querySelector<HTMLElement>("main [data-hero-scene]");
      if (!hero) return;
      const bounds = hero.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      // Same-document links can return to a hero whose CSS animations have finished.
      hero.dataset.rewind = "";
      const first = hero.querySelector(".hero-line span,.phero-txt > div,.nf-stamp");
      if (first) void getComputedStyle(first).animationName;
      delete hero.dataset.rewind;
    }

    function reveal(trip: Trip) {
      if (active !== trip) return;
      window.clearTimeout(announce);
      status.textContent = "";
      root.dataset.travel = "reveal";
      if (trip.ready && trip.revisit) rewindHero();
      const elapsed = performance.now() - trip.started;
      paintStage(trip.scene, scenes[trip.scene], scenePlate, trip.drawing, elapsed);
      const duration = trip.scene === "hospitality" || trip.scene === "wellness" ? 390 : 335;
      if (trip.ready && !trip.destination.hash) releasePlate = sharePlate(trip.scene, duration, elapsed);
      glide(trip, true, duration, () => {
        if (!trip.ready) { bypass(); return; }
        clear();
        accent(trip.destination);
      });
    }

    function hold(trip: Trip) {
      root.dataset.travel = "hold";
      const remaining = loaderDisplayMs - (performance.now() - trip.started);
      readingTimer = window.setTimeout(() => reveal(trip), Math.max(0, remaining));
    }

    function accept(url: URL) {
      const trip = active;
      const inBackground = background?.destination.href === url.href;
      const changed = last.href !== url.href;
      const revisit = last.pathname === url.pathname && !url.hash;
      if (background && (inBackground || changed)) clear();
      last = url;
      if (changed || trip) window.dispatchEvent(new Event("mt:locationchange"));
      if (trip && trip.destination.href === url.href) {
        trip.ready = true;
        window.clearTimeout(announce);
        status.textContent = "";
        paintStage(trip.scene, scenes[trip.scene], scenePlate, trip.drawing, performance.now() - trip.started);
      } else if (changed && !trip && !inBackground) {
        if (canAnimate()) showCommitted(url, revisit);
        else accent(url);
      }
    }

    function send(trip: Trip) {
      if (trip.sent) return;
      trip.sent = true;
      trip.perform?.();
    }

    function begin(destination: URL, scroll: boolean, perform?: () => void) {
      const spread = document.elementFromPoint(innerWidth * .4, innerHeight * .45)
        ?.closest("main section, footer")?.querySelector<HTMLElement>(":scope > .wrap");
      clear();
      heading?.cancel();
      const trip: Trip = { scene: sceneOf(destination), started: performance.now(), revisit: last.pathname === destination.pathname && !destination.hash, destination, scroll, perform, sent: !perform, ready: false };
      active = trip;
      trip.drawing = paintStage(trip.scene, scenes[trip.scene], scenePlate);
      root.dataset.travel = "cover";
      outgoing = spread?.animate([{ translate: "0 0", opacity: 1 }, { translate: "0 -7px", opacity: .83 }],
        { duration: 205, easing: "ease-in", fill: "both", id: "page-departure" });
      glide(trip, false, 220, () => {
        outgoing?.cancel();
        hold(trip);
        if (!trip.ready) announce = window.setTimeout(() => { status.textContent = "Loading " + destinationName(destination); }, 240);
        send(trip);
      });
    }

    // History restores and programmatic route commits already own the URL.
    function showCommitted(destination: URL, revisit = false) {
      clear();
      const trip: Trip = { scene: sceneOf(destination), started: performance.now(), revisit, destination, scroll: false, sent: true, ready: true };
      active = trip;
      trip.drawing = paintStage(trip.scene, scenes[trip.scene], scenePlate);
      hold(trip);
    }

    function sectionJump(url: URL, scroll: boolean, replace = false) {
      if (location.href !== url.href) {
        if (replace) history.replaceState(null, "", url.href);
        else history.pushState(null, "", url.href);
      }
      if (scroll) {
        const target = targetOf(url);
        if (target) {
          target.scrollIntoView({ behavior: "instant" });
          if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        } else if (!url.hash) window.scrollTo({ top: 0, behavior: "instant" });
      }
      accept(url);
    }

    function follow(url: URL, scroll: boolean, replace = false, prefetch = true) {
      const href = url.pathname + url.search + url.hash;
      const prior = active ?? background;
      const interrupted = prior?.sent && !prior.ready;
      if (prefetch && !samePage(url, new URL(location.href))) router.prefetch(href);
      begin(url, scroll, () => {
        if (samePage(url, new URL(location.href))) {
          // Reasserting the current URL must also supersede an older pending push.
          if (interrupted && url.href === location.href) router.replace(href, { scroll: false });
          sectionJump(url, scroll, replace);
        } else if (replace) router.replace(href, { scroll });
        else router.push(href, { scroll });
      });
    }
    function onLink(event: CustomEvent<LinkDestination>) {
      if (!canAnimate()) {
        if (background) clear();
        return;
      }
      const { href, scroll, replace, prefetch } = event.detail;
      const url = new URL(href, document.baseURI);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      follow(url, scroll, replace, prefetch);
    }

    function onNative(event: MouseEvent) {
      if (!canAnimate() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.matches('.skip-link,[download],[rel~="external"]')) return;
      const target = link.getAttribute("target");
      if (target && target !== "_self") return;
      const url = new URL(link.getAttribute("href")!, document.baseURI);
      if (url.origin !== location.origin || url.pathname.includes(".") || url.pathname.startsWith("/api/")) return;
      event.preventDefault();
      follow(url, true);
    }

    function commit() {
      const url = new URL(location.href);
      pageEntry = { url, state: history.state };
      const intent = active ?? background;
      if (intent?.destination.href === url.href && intent.scroll) targetOf(url)?.scrollIntoView({ behavior: "instant" });
      accept(url);
    }

    function onHistory() {
      const url = new URL(location.href);
      // A native fragment (including the skip link) can create an empty entry.
      if (history.state === null && pageEntry.state != null && samePage(url, pageEntry.url)) {
        history.replaceState(pageEntry.state, "");
      }
      if (url.href === last.href || active?.destination.href === url.href) return;
      if (samePage(last, url) && url.hash === "#top") {
        clear();
        last = url;
        window.dispatchEvent(new Event("mt:locationchange"));
        return;
      }
      if (samePage(last, url)) {
        clear();
        accept(url);
      } else if (canAnimate()) {
        begin(url, false);
      } else clear();
    }

    function bypass() {
      const trip = active;
      if (!trip) return;
      clear();
      if (!trip.ready) {
        background = trip;
        root.dataset.transitWait = "";
        status.textContent = "Loading " + destinationName(trip.destination);
      }
      send(trip);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Tab" || event.key === "Escape") bypass();
    }
    function onPreference() {
      if (media.matches) { heading?.cancel(); bypass(); }
    }
    function onRestore(event: PageTransitionEvent) {
      if (event.persisted && canAnimate()) showCommitted(new URL(location.href));
    }
    const onVisibility = () => { if (document.hidden) bypass(); };
    window.addEventListener(navigationEvent, onLink as EventListener);
    window.addEventListener("mt:route-commit", commit);
    window.addEventListener("click", onNative);
    window.addEventListener("popstate", onHistory);
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", clear);
    window.addEventListener("pageshow", onRestore);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onPreference);
    return () => {
      clear();
      heading?.cancel();
      window.removeEventListener(navigationEvent, onLink as EventListener);
      window.removeEventListener("mt:route-commit", commit);
      window.removeEventListener("click", onNative);
      window.removeEventListener("popstate", onHistory);
      window.removeEventListener("hashchange", onHistory);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", clear);
      window.removeEventListener("pageshow", onRestore);
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onPreference);
    };
  }, [router]);

  return <>
    <span className="route-status sr-only" role="status" aria-atomic="true" />
    <span className="route-wait" role="status">Loading page…</span>
    <Suspense fallback={null}><RouteCommit /></Suspense>
  </>;
}
