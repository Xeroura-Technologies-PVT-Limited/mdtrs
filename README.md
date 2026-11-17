# Medtours website

Marketing site for **Medtoursin.com**, medical travel to India for international patients and the people who travel with them.
Designed and built by Xeroura Technologies.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript
- GSAP + ScrollTrigger for scroll-linked motion, Lenis for smooth scrolling
- Plain CSS (`src/styles`), with fonts from `next/font/google`
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
| `/` | Homepage: logo intro, pinned globe story, promises, care cards, patient/attender switch, accreditations, journey, cities map, FAQ, slide-to-quote |
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
    site/                 header + menu, footer, enquiry modal and form, logo, intro, smooth scroll, shared motion
    home/                 homepage sections and HomeMotion (mounts the scroll story)
    page/                 PageHero and CtaBand for inner pages
  lib/
    site.ts               all editable copy: contact details, navigation, treatments, FAQ
    scroll.ts             helpers for Lenis
    motion/globe.js       Canvas2D globe (dot-matrix earth, flights, extruded India)
    motion/home.js        homepage motion (globe pin, persona switch, city map, journey plane, slider)
  styles/
    site.css              tokens, header, menu, homepage sections, footer, modal
    pages.css             inner pages
public/
  renders/                3D renders used on cards and page heroes
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

- The logo intro plays on every full page load. A small inline script in `layout.tsx` adds `js-intro` to `<html>` before paint; `Intro.tsx` removes it when the animation hands over (with a 7 s failsafe).
- Everything respects `prefers-reduced-motion`: no intro, no smooth scroll, no pinned sections.
- The homepage motion is plain JavaScript in `src/lib/motion`, ported from the approved prototype. It runs inside a `gsap.context`, so it cleans up when you navigate away.

## Before launch

- [ ] Confirm NABH / JCI wording with the client
- [ ] Replace the three `[Partner hospital]` cards on the homepage with real hospitals and photos
- [ ] Add a portrait of Dr. Ravi Teja on `/about` (see the comment in `src/app/about/page.tsx`)
- [ ] Confirm the brand name (Medtours vs MedtoursIn) and domain
- [ ] Set up Resend and the environment variables above
- [ ] Have the privacy notice reviewed

## Deploying

Push to GitHub and import the repo in Vercel (framework: Next.js, no extra settings), then add the environment variables.
