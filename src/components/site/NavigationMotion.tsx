"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { addresses, resolveScene, scenes, type SceneId } from "@/lib/motion/scenes";
import { navigationEvent } from "./SiteLink";

const traces = {
  flight: "M5 18 Q36 -4 71 18",
  pulse: "M5 18 H24 L29 14 L33 20 L38 5 L42 23 L47 15 L51 18 H71",
  wave: "M5 18 C18 18 21 6 33 11 S50 26 61 20 Q66 17 71 18",
};
const workspace = /^\/portal\/(doctor|patient)(\/|$)/;
const pageKey = (url: URL) => url.pathname + url.search;

function motifFor(scene: SceneId): keyof typeof traces {
  switch (scene) {
    case "treatments": case "medical": case "surgical": case "dental":
    case "rehabilitation": case "doctors": case "hospitals": return "pulse";
    case "wellness": case "holistic": case "longevity": case "hospitality": return "wave";
    default: return "flight";
  }
}

function locationChanged() {
  window.dispatchEvent(new Event("mt:locationchange"));
}

function RouteFeedback() {
  const pathname = usePathname();
  const search = useSearchParams();
  const committed = useRef<URL | null>(null);
  const requested = useRef<string | null>(null);
  const sequence = useRef(0);
  const [cue, setCue] = useState<{ id: number; scene: SceneId } | null>(null);

  function show(from: URL, to: URL) {
    if (pageKey(from) === pageKey(to) || (workspace.test(from.pathname) && workspace.test(to.pathname)) ||
        matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCue(null);
      return;
    }
    setCue({ id: ++sequence.current, scene: resolveScene(to.pathname, to.hash, addresses) });
  }

  useLayoutEffect(() => {
    const url = new URL(location.href);
    const previous = committed.current;
    committed.current = url;
    if (!previous || pageKey(previous) === pageKey(url)) return;
    // Back, forward and programmatic redirects can commit without a link click.
    if (requested.current !== pageKey(url)) show(previous, url);
    requested.current = null;
    locationChanged();
  }, [pathname, search]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    function navigate(event: Event) {
      const from = new URL(location.href);
      const to = new URL((event as CustomEvent<string>).detail, document.baseURI);
      if (to.origin !== from.origin) return;
      requested.current = pageKey(to);
      show(from, to);
      // Next can move to a fragment without changing pathname or search.
      if (pageKey(from) === pageKey(to)) locationChanged();
    }
    function dismiss() {
      requested.current = null;
      setCue(null);
    }
    window.addEventListener(navigationEvent, navigate);
    window.addEventListener("hashchange", locationChanged);
    window.addEventListener("pagehide", dismiss);
    preference.addEventListener("change", dismiss);
    return () => {
      window.removeEventListener(navigationEvent, navigate);
      window.removeEventListener("hashchange", locationChanged);
      window.removeEventListener("pagehide", dismiss);
      preference.removeEventListener("change", dismiss);
    };
  }, []);

  if (!cue) return null;
  const motif = motifFor(cue.scene);
  return (
    <div key={cue.id} className="route-cue" data-motif={motif} aria-hidden="true"
      onAnimationEnd={event => { if (event.target === event.currentTarget) setCue(null); }}>
      <svg viewBox="0 0 78 28" width="78" height="28" fill="none" focusable="false">
        <path className="route-cue-guide" d={traces[motif]} />
        <path className="route-cue-ink" d={traces[motif]} pathLength="1" />
        <circle cx="5" cy="18" r="1.75" fill="currentColor" />
        <circle className="route-cue-stop" cx="71" cy="18" r="3" />
      </svg>
      <span>{scenes[cue.scene].title}</span>
    </div>
  );
}

export function NavigationMotion() {
  return <>
    <Suspense fallback={null}><RouteFeedback /></Suspense>
    <span className="route-wait" role="status">Loading page…</span>
  </>;
}
