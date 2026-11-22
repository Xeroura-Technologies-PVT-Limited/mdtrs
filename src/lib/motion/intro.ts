export const loaderDisplayMs = 2_000;

/**
 * Runs in the document head, before the first paint. Keep this function
 * self-contained: the layout serialises it so the introduction can finish
 * even if the React bundle is late or fails to hydrate.
 */
export function startIntroduction(scene: string, displayMs: number) {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || !Element.prototype.getAnimations) return;

  root.dataset.scene = scene;
  root.style.setProperty("--intro-display-time", displayMs + "ms");
  root.dataset.intro = "loading";
  let content: HTMLElement | null = null;
  let complete = false;
  let frame = 0;
  let deadline = 0;

  function finish() {
    if (complete) return;
    complete = true;
    const skipFocused = document.activeElement?.id === "intro-skip";
    delete root.dataset.intro;
    root.style.removeProperty("--intro-progress");
    root.style.removeProperty("--intro-display-time");
    if (content) content.inert = false;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(deadline);
    document.removeEventListener("mt:intro-ready", startReading);
    document.removeEventListener("DOMContentLoaded", prepare);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("pagehide", finish);
    preference.removeEventListener("change", finish);
    if (skipFocused) document.getElementById("top")?.focus({ preventScroll: true });
  }

  function onClick(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest("#intro-skip")) finish();
  }
  function onKey(event: KeyboardEvent) {
    if (event.key === "Escape") finish();
  }
  function startReading() {
    if (deadline) return;
    // Time the visible stage, even when the server streams the body after the head.
    deadline = window.setTimeout(finish, displayMs + 500);
    frame = window.requestAnimationFrame(() => {
      window.clearTimeout(deadline);
      deadline = window.setTimeout(() => {
        root.dataset.intro = "opening";
        deadline = window.setTimeout(finish, 500);
        const sheet = document.querySelector(".motion-sheet");
        const opening = sheet?.getAnimations().map(animation => animation.finished) ?? [];
        Promise.allSettled(opening).then(finish);
      }, displayMs);
    });
  }
  function prepare() {
    if (complete) return;
    startReading();
    content = document.getElementById("site-content");
    if (content) content.inert = true;
    const hero = document.querySelector<HTMLImageElement>('main img[fetchpriority="high"]');
    let milestones = 1;
    const advance = () => {
      if (!complete) root.style.setProperty("--intro-progress", String(++milestones / 3));
    };
    const imageReady = hero?.decode ? hero.decode() : Promise.resolve();
    void imageReady.then(advance, advance);
    void document.fonts.ready.then(advance, advance);
  }

  document.addEventListener("mt:intro-ready", startReading, { once: true });
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", finish, { once: true });
  preference.addEventListener("change", finish);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", prepare, { once: true });
  else prepare();
}
