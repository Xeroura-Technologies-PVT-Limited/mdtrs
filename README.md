# Medtours website

Marketing site for **Medtoursin.com**, medical travel to India for international patients and the people who travel with them.
Designed and built by Xeroura Technologies.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Native scrolling, SVG illustration and CSS motion
- Plain CSS (`src/styles`), with locally hosted Cormorant and Instrument Sans
- No database. The enquiry form posts to a route handler that emails the team (see below)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the build
npm run lint
npm run typecheck
```

Requires Node 18.18 or newer.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Illustrated arrival, treatment directory, patient and attender planning, accreditations, itinerary, city routes, FAQ and slide-to-quote |
| `/treatments` | Overview of the six services |
| `/treatments/[slug]` | Medical, Surgical, Dental, Rehabilitation, Longevity, Holistic health |
| `/about` | Who Medtours is and how it works |
| `/contact` | Contact details and the full enquiry form |
| `/faq` | All questions (with FAQPage structured data) |
| `/privacy` | Privacy notice |

`sitemap.xml` and `robots.txt` are generated from `src/app/sitemap.ts` and `src/app/robots.ts`.

## Where things live

```
src/
  app/                    routes, layout, API route, sitemap, robots, favicon
  components/
    site/                 navigation, footer, enquiry dialog and form, logo and section reveals
    home/                 homepage sections and the illustrated arrival scene
    page/                 PageHero and CtaBand for inner pages
  lib/
    site.ts               all editable copy: contact details, navigation, treatments, FAQ
  fonts/                  local font files and their licences
  styles/
    site.css              tokens, navigation, footer, FAQ and enquiry form
    atlas-hero.css        homepage introduction and postage frame
    arrival-illustration.css  single-play flight path and arrival highlight
    navigation-motion.css  arrival screen, page transitions and interactive motion
    atlas-home.css        treatment directory and travel planning sections
    pages.css             inner pages
public/
  editorial/              care, treatment and hospitality imagery
  og.jpg                  social share image
```

To change copy, edit `src/lib/site.ts` first. Homepage section text lives in `src/components/home/*.tsx`.

## Enquiry form

The form (modal and `/contact`) posts to `POST /api/enquiry`, which validates the fields and emails the enquiry, with attached reports, through [Resend](https://resend.com).

Set these environment variables (see `.env.example`):

```
RESEND_API_KEY=...
ENQUIRY_TO=drravitejabuddha@gmail.com
ENQUIRY_FROM="Medtours <enquiries@medtoursin.com>"   # needs a verified domain in Resend
NEXT_PUBLIC_SITE_URL=https://medtoursin.com
```

Without `RESEND_API_KEY` and `ENQUIRY_TO`, the route logs enquiries in development and returns an error in production, so the live site never tells a patient their enquiry was sent when it wasn't.

## Motion notes

- `ArrivalIllustration.tsx` defines one path for the aircraft and the route reveal. Its default SVG renders the completed scene. CSS adds the flight when the browser supports motion paths and the visitor allows motion.
- On a full document visit, the introduction displays its message for 2 seconds before revealing the hero. The priority image and fonts load during that time. Skip intro and Escape dismiss it immediately. The HTML content is available with JavaScript disabled.
- Use `SiteLink` for internal page links. Destination messages use the same reading time for page links, section links, and browser history. The router loads the destination in parallel. If it is still pending when the curtain lifts, a small loading label stays visible until it arrives. Reduced motion opens pages directly.
- Section reveals keep text visible throughout. The mobile navigation, section reveals and aircraft respond to changes in the visitor's reduced-motion preference.

## Before launch

- [ ] Confirm NABH / JCI wording with the client
- [ ] Replace the three sample profiles on the homepage with real hospitals and photos
- [ ] Add a portrait of Dr. Ravi Teja on `/about` when one is available
- [ ] Confirm the brand name (Medtours vs MedtoursIn) and domain
- [ ] Set up Resend and the environment variables above
- [ ] Have the privacy notice reviewed

## Deploying

Push to GitHub and import the repo in Vercel (framework: Next.js, no extra settings), then add the environment variables.

## Premium line (homepage)

The homepage (`src/components/premium/PremiumHome.tsx`, styles in `src/styles/premium.css`) is a scroll-driven, 3D version of the site in the client's Frosted Periwinkle `#EEF2F9` and Deep Navy `#143A66`.

- `src/lib/premium/motion.ts` turns scroll into CSS variables (`--p` for pinned sections, `--v` for passing ones) and runs smooth wheel scrolling, the custom cursor, tilt and magnetic buttons, counters, the velocity marquee and the patient/attender tabs.
- `src/lib/premium/orbit-scene.ts` renders the Care Orbit emblem (cross, orbit ring and travelling satellite) in WebGL; drag to rotate.
- `src/lib/premium/globe-scene.ts` renders the dotted globe with flight arcs that draw into India as you scroll.
- The WebGL helpers in `src/lib/premium/gl.ts` have no dependencies. Scenes load only as they approach the viewport and pause off-screen.
- Reduced motion: nothing is pinned, all text is visible and the 3D scenes render a still frame.
- The header is now a light, frosted bar on every page (`src/styles/premium-site.css`).
