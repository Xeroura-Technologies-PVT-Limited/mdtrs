import type { Scene, SceneId } from "./scenes";

/** Trusted, authored artwork shared by the server-rendered hero and the pre-hydration stage. */
export function scenePlate(key: SceneId, instance: "hero" | "stage") {
  const artwork = key === "portal" ? "privacy" : key;
  const layer = (part: string) => '<use class="drawing-' + part + '" href="/motion/plates.svg#' + artwork + '-' + part + '"/>';
  const clip = instance + "-aperture";
  const aperture = key === "hospitality" ? '<path d="M106 172V99a74 57 0 0 1 148 0v73z"/>' :
    key === "hospitals" ? '<rect x="55" y="38" width="242" height="123"/>' :
    '<path d="m100 67 177-15 10 111-175 16z"/>';
  const photo = (url: string, x: number, y: number, width: number, height: number, cls: string, extra = "") =>
    '<image class="' + cls + '" href="/motion/' + url + '.webp" x="' + x + '" y="' + y + '" width="' + width +
    '" height="' + height + '" preserveAspectRatio="xMidYMid slice" ' + extra + '/>';
  let underlay = "";
  let detail = "";
  if (key === "hospitality" || key === "hospitals") {
    const doors = key === "hospitality";
    underlay = '<g clip-path="url(#' + clip + ')">' +
      photo(doors ? "hospitality" : "hospital-exterior", doors ? 105 : 55, 38, doors ? 151 : 242, doors ? 136 : 123, "drawing-photo") +
      (doors ? '<g class="portal-leaf portal-left"><path d="M104 35h76v139h-76z"/><path d="M112 65h60v99h-60zM118 76h48v78h-48z"/></g><g class="portal-leaf portal-right"><path d="M180 35h76v139h-76z"/><path d="M188 65h60v99h-60zM194 76h48v78h-48z"/></g>' : "") + '</g>';
  } else if (key === "about") {
    underlay = photo("arrival", 61, 41, 146, 116, "album-back", 'transform="rotate(8 61 41)"') +
      '<g clip-path="url(#' + clip + ')">' + photo("hospital-consultation", 102, 49, 187, 130, "album-front") + '</g>';
  } else if (key === "doctors") {
    detail = '<g class="portrait-roles" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="8"><text x="240" y="72">Doctor review</text><text x="240" y="103">Specialist consult</text><text x="240" y="135">Follow-up care</text></g>';
  } else if (key === "treatments") {
    detail = '<path class="pulse-heart" pathLength="1" d="M60 126 C84 126 95 105 111 99 C130 87 151 93 157 109 C168 88 190 84 204 97 C225 119 194 142 159 166 C142 156 123 145 111 132"/>';
  } else if (key === "journey") {
    detail = '<g class="journey-flight" transform="translate(305 69)" fill="currentColor" stroke-width=".65"><path d="M8 0 2-1-3-6l-2 .2 3 5-5 .6-2-1.6-1 .3 2 2.5-2 2.5 1 .3 2-1.6 5 .6-3 5 2 .2 5-5z"/></g><g class="map-labels" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="9"><text x="18" y="156">Departure</text><text x="91" y="93">Arrival</text><text x="171" y="164">Treatment</text><text x="281" y="88">Recovery</text></g>';
  }
  return '<svg class="scene-drawing" data-drawing="' + key + '" viewBox="0 0 360 216" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><defs><clipPath id="' + clip + '">' + aperture + '</clipPath></defs>' +
    '<path class="drawing-register" d="M19 37V23h16m290 0h16v14M19 179v14h16m290 0h16v-14M175 23h10m-5-3v6m-5 167h10m-5-3v6"/>' +
    layer("base") + underlay + layer("line") + layer("accent") + detail + '</svg>';
}

/** Called on both cold load and navigation. The artwork slot is outside React's child tree. */
export function paintStage(key: SceneId, config: Scene, draw: typeof scenePlate, retained?: Element, elapsed = 0) {
  const stage = document.getElementById("travel-stage");
  if (!stage) return;
  stage.dataset.scene = key;
  stage.dataset.theme = config.theme;
  stage.dataset.cut = config.cut;
  const slot = stage.querySelector<HTMLElement>(".stage-art");
  if (slot && retained) {
    // A new server tree can reconcile the empty slot. Restore the same drawing
    // in the commit frame, with the engraving exactly where the exit left it.
    if (slot.firstElementChild !== retained) {
      slot.replaceChildren(retained);
      for (const animation of slot.getAnimations({ subtree: true })) animation.currentTime = elapsed;
    }
  } else if (slot) {
    slot.innerHTML = key === "home" && document.documentElement.dataset.intro ? "" : draw(key, "stage");
  }
  const title = stage.querySelector(".stage-place");
  const caption = stage.querySelector(".stage-caption");
  if (title && title.textContent !== config.title) title.textContent = config.title;
  if (caption && caption.textContent !== config.caption) caption.textContent = config.caption;
  return slot?.firstElementChild ?? undefined;
}
