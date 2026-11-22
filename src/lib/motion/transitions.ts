import type { Scene } from "./scenes";

type Cut = Scene["cut"];
type Aperture = { closed: string; released: string; open: string };

const inset = (closed: string, released: string): Aperture => ({
  closed: `inset(${closed})`, released: `inset(${released})`, open: "inset(0% 0% 0% 0%)",
});
const radial = (x: number, y: number, endX = x, endY = y): Aperture => ({
  closed: `circle(0% at ${x}% ${y}%)`, released: `circle(0% at ${endX}% ${endY}%)`, open: `circle(146% at ${x}% ${y}%)`,
});
const slant = (reverse: boolean): Aperture => ({
  closed: reverse ? "polygon(100% 0%,100% 0%,100% 100%,100% 100%)" : "polygon(0% 0%,0% 0%,0% 100%,0% 100%)",
  released: reverse ? "polygon(0% 0%,0% 0%,8% 100%,0% 100%)" : "polygon(92% 0%,100% 0%,100% 100%,100% 100%)",
  open: "polygon(-12% 0%,100% 0%,112% 100%,0% 100%)",
});

const apertures: Partial<Record<Cut, Aperture>> = {
  pulse: inset("47% 0% 52% 0%", "49% 0% 51% 0%"),
  iris: radial(70, 52), crown: radial(48, 101, 50, 0), portrait: inset("0% 34% 100% 34%", "0% 50% 0% 50%"),
  diagonal: slant(false), album: slant(true), route: inset("0% 100% 0% 0%", "0% 0% 0% 100%"),
  elevation: inset("100% 0% 0% 0%", "0% 0% 100% 0%"), scan: inset("0% 0% 100% 0%", "99.9% 0% 0% 0%"),
  horizon: { closed: "ellipse(2% 0% at 50% 85%)", open: "ellipse(120% 160% at 50% 85%)", released: "ellipse(0% 3% at 50% 22%)" },
  ripple: { closed: "ellipse(8% 0% at 73% 83%)", open: "ellipse(145% 190% at 73% 83%)", released: "ellipse(21% 0% at 28% 22%)" },
  door: inset("0% 49.9% 0% 49.9%", "0% 50% 0% 50%"),
  converge: { closed: "polygon(76% 50%,76% 50%,76% 50%,76% 50%)", open: "polygon(-80% 50%,50% -160%,180% 50%,50% 260%)", released: "polygon(28% 54%,28% 54%,28% 54%,28% 54%)" },
  margin: inset("0% 0% 0% 100%", "0% 100% 0% 0%"), bearing: radial(50, 50, 76, 12),
};

export function transitionFrames(cut: Cut, opening: boolean): Keyframe[] {
  const aperture = apertures[cut];
  if (aperture) return (opening ? [aperture.open, aperture.released] : [aperture.closed, aperture.open])
    .map(clipPath => ({ clipPath }));
  const cover = cut === "hinge" ? "perspective(1100px) rotateX(-72deg)" :
    cut === "leaf" ? "perspective(1200px) rotateY(-65deg)" : "translateY(100%)";
  const release = cut === "hinge" ? "perspective(1100px) rotateX(75deg)" :
    cut === "leaf" ? "perspective(1200px) rotateY(70deg)" : "translateY(-101%)";
  return opening ? [{ transform: "none", opacity: 1 }, { transform: release, opacity: 0 }] :
    [{ transform: cover, opacity: .2 }, { transform: "none", opacity: 1 }];
}

/** Both plates use the same 5:3 drawing. Carry the ink to its new position. */
export function sharePlate(key: string, duration: number, elapsed: number) {
  const stage = document.querySelector<HTMLElement>(".stage-art");
  const target = document.querySelector<HTMLElement>(`[data-hero-scene="${key}"] .hero-plate`);
  if (!stage || !target || !stage.firstElementChild) return;
  const from = stage.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width || to.top > innerHeight - 30 || to.bottom < 50 || from.width > to.width * 4) return;

  target.closest<HTMLElement>("[data-hero-scene]")?.setAttribute("data-landed", "");
  const ghost = document.createElement("div");
  ghost.className = "shared-plate";
  ghost.dataset.theme = stage.closest<HTMLElement>("[data-theme]")?.dataset.theme;
  const drawing = stage.firstElementChild.cloneNode(true) as SVGElement;
  drawing.querySelector("clipPath")?.setAttribute("id", "shared-aperture");
  drawing.querySelector('[clip-path]')?.setAttribute("clip-path", "url(#shared-aperture)");
  ghost.appendChild(drawing);
  Object.assign(ghost.style, { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px" });
  document.body.appendChild(ghost);
  // Continue the stroke and door frames already visible on the departing sheet.
  for (const animation of ghost.getAnimations({ subtree: true })) animation.currentTime = elapsed;
  stage.style.visibility = "hidden";
  target.style.visibility = "hidden";
  const move = ghost.animate([
    { transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})`, opacity: 1 },
    { transform: "none", opacity: .95 },
  ], { duration, easing: "cubic-bezier(.28,.02,.18,1)", fill: "both", id: "shared-destination-drawing" });
  const release = () => {
    ghost.remove();
    stage.style.removeProperty("visibility");
    target.style.removeProperty("visibility");
  };
  void move.finished.then(release, () => {});
  return () => { move.cancel(); release(); };
}
