/** One entry for each destination. Section links keep their original addresses. */
export const scenes = {
  home: { title: "Medtours", caption: "Medical travel to India", theme: "ink", cut: "curtain", entry: "flight" },
  treatments: { title: "Treatments", caption: "Clinical & wellness care", theme: "teal", cut: "pulse", entry: "pulse" },
  medical: { title: "Medical", caption: "Clinical care", theme: "paper", cut: "iris", entry: "breathe" },
  surgical: { title: "Surgical", caption: "Clinical care", theme: "ink", cut: "diagonal", entry: "align" },
  dental: { title: "Dental", caption: "Clinical care", theme: "paper", cut: "crown", entry: "enamel" },
  rehabilitation: { title: "Rehabilitation", caption: "Clinical care", theme: "teal", cut: "hinge", entry: "hinge" },
  longevity: { title: "Longevity", caption: "Wellness care", theme: "ink", cut: "scan", entry: "scan" },
  holistic: { title: "Holistic health", caption: "Wellness care", theme: "paper", cut: "horizon", entry: "balance" },
  journey: { title: "Care journey", caption: "From departure to recovery", theme: "ink", cut: "route", entry: "route" },
  companions: { title: "Guest & companion journeys", caption: "Travelling together", theme: "teal", cut: "diagonal", entry: "route" },
  hospitals: { title: "Hospitals", caption: "Accredited care in India", theme: "paper", cut: "elevation", entry: "elevation" },
  doctors: { title: "Doctors", caption: "Doctor-led care", theme: "ink", cut: "portrait", entry: "portrait" },
  wellness: { title: "Wellness", caption: "Screening, rest & recovery", theme: "teal", cut: "ripple", entry: "ripple" },
  hospitality: { title: "Hospitality", caption: "Your stay in India", theme: "paper", cut: "door", entry: "door" },
  about: { title: "About us", caption: "The Medtours story", theme: "ink", cut: "album", entry: "album" },
  contact: { title: "Contact", caption: "Speak with the team", theme: "teal", cut: "converge", entry: "connect" },
  faq: { title: "Questions", caption: "Before you travel", theme: "paper", cut: "leaf", entry: "index" },
  privacy: { title: "Privacy notice", caption: "Your information", theme: "ink", cut: "margin", entry: "seal" },
  portal: { title: "Care portal", caption: "Patient and doctor access", theme: "ink", cut: "margin", entry: "seal" },
  cities: { title: "Medical cities", caption: "Care across India", theme: "teal", cut: "route", entry: "route" },
  missing: { title: "Off course", caption: "Page not found", theme: "paper", cut: "bearing", entry: "compass" },
} as const;
export type SceneId = keyof typeof scenes;
export type Scene = (typeof scenes)[SceneId];

export const addresses: Record<string, SceneId> = {
  "/": "home", "/treatments": "treatments", "/patient-journey": "journey", "/hospitals": "hospitals",
  "/doctors": "doctors", "/wellness": "wellness", "/hospitality": "hospitality", "/about": "about",
  "/contact": "contact", "/faq": "faq", "/privacy": "privacy", "/portal": "portal",
  "/login/doctor": "portal", "/login/patient": "portal",
  "/treatments/medical": "medical", "/treatments/surgical": "surgical", "/treatments/dental": "dental",
  "/treatments/rehabilitation": "rehabilitation", "/treatments/longevity": "longevity", "/treatments/holistic-health": "holistic",
  "/#journeys": "companions", "/#journey": "journey", "/#hospitals": "hospitals", "/#cities": "cities",
  "/#contact": "contact", "/#care": "treatments", "/#faq": "faq", "/#prologue": "about", "/#promise": "about",
};

// Also used before hydration. This function has no runtime dependencies.
export function resolveScene(path: string, hash: string, routes: Record<string, SceneId>): SceneId {
  const page = path.replace(/\/+$/, "") || "/";
  if (/^\/portal\/(doctor|patient)(\/|$)/.test(page)) return "portal";
  return routes[page + hash] ?? routes[page] ?? "missing";
}
