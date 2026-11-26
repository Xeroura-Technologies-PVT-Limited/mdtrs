# Medtours website

Marketing site for **Medtoursin.com**, medical travel to India for international patients and the people who travel with them.
Designed and built by Xeroura Technologies.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Native scrolling, SVG illustration and CSS motion
- Plain CSS (`src/styles`), with locally hosted Cormorant and Instrument Sans
- Supabase Auth, Postgres and private Storage power the care portal. The public quote form sends enquiries by email.

## Getting started

Use Node.js 24.x and npm for the full development toolchain. Run the commands below from the repository root (the folder containing `package.json`).

### Run the website locally

Install the dependencies from the lockfile, then start Next.js in the same terminal.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public pages work without Supabase or email credentials. Keep the terminal running while browsing and press Ctrl+C to stop the server. On later runs, start it with `npm run dev`.

To test accounts and reports, complete the local portal setup below. To run a production build or deploy the website, follow [Deploying](#deploying).

### Enable doctor and patient logins locally

1. Install the Supabase CLI and start Docker Desktop (or a Docker engine). Start the local Supabase stack from the repository root.

   ```sh
   supabase start
   ```

   On first startup, the CLI applies the SQL in `supabase/migrations/`. Its output includes the local Project URL, browser publishable key, Studio and email inbox. Run `supabase status` to display those details again. [Supabase CLI setup](https://supabase.com/docs/guides/local-development/cli/getting-started)

2. Open `.env.local` in the repository root. If it's missing, copy [.env.example](.env.example) to `.env.local`. Use the Project URL and publishable key from the CLI output. The example shows the default local API port.

   ```dotenv
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_LOCAL_PUBLISHABLE_KEY
   ```

3. Restart `npm run dev` after saving the file. Open [Patient login](http://localhost:3000/login/patient), select **Create a patient account**, and confirm the email in the local inbox. Sign in, save **My intake**, then attach a sample file under **My reports**.

4. A fresh local database starts without demo accounts. To test both roles, register a second account and [give it doctor access](#give-a-doctor-access) using the local Studio SQL Editor. Then open [Doctor login](http://localhost:3000/login/doctor) and check **Assigned patients** for the patient whose intake you saved.

When finished, stop Next.js with Ctrl+C and run `supabase stop` to stop the local services. To resume, run `supabase start`, then `npm run dev`.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Illustrated arrival, treatment directory, patient and attender planning, accreditations, itinerary, city routes, FAQ and slide-to-quote |
| `/treatments` | Overview of the six services |
| `/treatments/[slug]` | Medical, Surgical, Dental, Rehabilitation, Longevity, Holistic health |
| `/about` | Who Medtours is and how it works |
| `/contact` | Contact details and the full enquiry form |
| `/login/patient` | Patient sign-in and registration |
| `/login/doctor` | Doctor sign-in |
| `/portal` | Login chooser, signed-in redirect and Supabase email confirmation or password recovery |
| `/portal/patient` | Patient overview with links to My intake, My reports and My account |
| `/portal/doctor` | Doctor overview with recent intakes, Assigned patients and My account |
| `/portal/doctor/patients/[patientId]` | An assigned patient's saved intake and reports |
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

## Care portal

Click **Login** in the site header and choose **Patient** or **Doctor**. After sign-in, the header shows your name and opens a menu for your role. Both portals have a **My account** page where you can update your name.

- **Patients** can save their details on **My intake** and attach PDF, JPEG or PNG files under **My reports** (up to 10 MiB each). The overview links to care journey, treatment, hospital, hospitality and wellness guides. Treatment quote forms prefill the account name and email, and both fields are editable.
- **Doctors** can open **Assigned patients** and select **Review intake** to read a patient's details and download their reports. Their overview links to clinical team, hospital, treatment and patient journey guides, with a **Contact care team** shortcut in the header.

### Production database migration

Run the migration from this repository on a machine or release runner with Node.js 20.12+ and a running Docker engine. The first run downloads the pinned Flyway image.

1. Create or select the hosted Supabase project. Copy its **Project URL** and **Publishable key** from **Connect** into `.env.production.local` at the repository root (create the file if needed). For the database migration, also set the project's **database password** as a server-only variable. Values supplied by your release runner's environment take precedence. Replace the example website origin with your live origin.

   ```dotenv
   NEXT_PUBLIC_SITE_URL=https://medtoursin.com
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   SUPABASE_DB_PASSWORD="YOUR_DATABASE_PASSWORD"
   ```

2. On an IPv4-only runner, select **Session pooler** in **Connect** and set `SUPABASE_DB_URL` to the PostgreSQL connection string on port 5432. This setting takes precedence over the derived direct connection. Use the host and username shown by Supabase. Percent-encode special characters in a password embedded in the URI. Keep database credentials in the ignored environment file or in the release runner's secret store. [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)

3. Run the following command before deploying the website. To select a different environment file, use `npm run db:migrate -- --env-file <path>`.

   ```sh
   npm run db:migrate
   ```

   On a new project, Flyway installs the schema and backfills a patient profile for each existing Auth user. If the original care portal migration was applied through the SQL Editor or Supabase CLI, the first Flyway run checks that installation before recording it. An incompatible existing schema produces an error so you can review the differences with the existing data intact.

4. In **Table Editor**, verify `profiles`, `patient_intakes` and `doctor_patient_assignments`. In **Storage**, verify the private `patient-reports` bucket.

5. In hosted Supabase **Authentication**, enable email/password signup and email confirmation. Under **URL Configuration**, set **Site URL** to your live origin and add that origin plus `/portal` to **Redirect URLs** (for example, `https://medtoursin.com/portal`). Configure a custom SMTP sender for confirmation and password-reset emails. Then [build or deploy the website](#deploying).

For later schema changes, add a new file named `YYYYMMDDHHMMSS_description.sql` in `supabase/migrations/`. Use fully qualified object names (for example, `public.patient_intakes`) and let Flyway manage the transaction. Keep applied files unchanged. Run the same command on each release. Flyway checks migration checksums and applies pending versions in order, with deployment history in `medtours_migrations.flyway_schema_history`. Local `supabase start` uses the same source directory. [Flyway versioned migrations](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/versioned-migrations)

### Give a doctor access

For self-registration, the doctor first creates an account through the **Patient** option and confirms their email. A project administrator then verifies their identity and obtains their user ID from **Authentication → Users**. Run the following statements in the Supabase SQL Editor, replacing the placeholders with the correct user IDs. The doctor can then use **Login → Doctor**. Use the assignment statement for each patient the doctor is responsible for.

```sql
update public.profiles set role = 'doctor' where id = '<doctor-user-id>'::uuid;

insert into public.doctor_patient_assignments (doctor_id, patient_id)
values ('<doctor-user-id>'::uuid, '<patient-user-id>'::uuid)
on conflict (doctor_id, patient_id) do nothing;
```

The patient appears in the doctor's portal once they have saved an intake. To end that doctor's access to the patient's information, delete the assignment.

```sql
delete from public.doctor_patient_assignments
where doctor_id = '<doctor-user-id>'::uuid and patient_id = '<patient-user-id>'::uuid;
```

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

1. For the live care portal, complete the [production database migration and Auth setup](#production-database-migration) on your release machine. Run `npm run db:migrate` again when deploying new migrations. For live treatment quote emails, configure the [enquiry form](#enquiry-form).

2. Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the build environment. These values are bundled when Next.js builds the site. Keep the database password or connection string on the migration runner. [Next.js environment variables](https://nextjs.org/docs/15/app/guides/environment-variables)

3. Start the production build on your own host or deploy it to Vercel.

   - **On your own machine or server**, use `.env.production.local` for the production settings. Stop any development server using port 3000, then install, build and start the app.

     ```sh
     npm ci
     npm run build
     npm start
     ```

     Open [http://localhost:3000](http://localhost:3000) to check the running build.

   - **On Vercel**, import the repository, select the **Next.js** framework preset, and set the website and email variables under **Settings → Environment Variables → Production**. Deploy once the migration succeeds. Redeploy after changing public environment variables.

4. On the deployed site, open `/login/patient`, confirm a test account, save an intake and upload a sample PDF. Sign in through `/login/doctor` with an assigned doctor account and verify the record and report appear under **Assigned patients**.

Run `npm run lint` and `npm run typecheck` from the repository root to check the source.

## Premium line (homepage)

The homepage (`src/components/premium/PremiumHome.tsx`, styles in `src/styles/premium.css`) is a scroll-driven, 3D version of the site in the site's aubergine `#361a31` and apricot `#fdf4e5` theme, with a magenta accent `#9b3d7e`.

- `src/lib/premium/motion.ts` turns scroll into CSS variables (`--p` for pinned sections, `--v` for passing ones) and runs smooth wheel scrolling, the custom cursor, tilt and magnetic buttons, counters, the velocity marquee and the patient/attender tabs.
- `src/lib/premium/orbit-scene.ts` raymarches the Care Orbit emblem from a pose it is given each frame (porcelain cross, lacquered ring, and a magenta-and-ivory capsule travelling round it while the ring glows behind) in a fragment shader with physically based lighting, soft shadows, ambient occlusion and studio reflections. Resolution adapts if frames run slow. Drag to rotate.
- `src/lib/premium/globe-scene.ts` renders the dotted globe with flight arcs that draw into India as you scroll.
- The WebGL helpers in `src/lib/premium/gl.ts` have no dependencies. Scenes load only as they approach the viewport and pause off-screen.
- `src/components/premium/PremiumLoader.tsx` is the first-visit loader for the homepage: the orbit ring is the progress bar, the plane flies around it, the cross draws in and the labels walk through the patient journey. Progress follows real milestones (fonts, page load, the hero's first 3D frame) with a short minimum time; Skip or Escape dismisses it. It replaces the site introduction on `/` only; other pages keep it. Client-side navigation back to the homepage skips it.
- There is one emblem for the whole page: a fixed, full-viewport canvas (`.pm-orbit-layer`). `motion.ts` blends its position, size and rotation between anchors: the loader's mark, the hero (`[data-orbit-anchor="hero"]`) and the promise section (`[data-orbit-anchor="side"]`). In the loader the cross spins in as progress fills; at 100% it flies into the hero while its orbit ring unfolds and the curtain opens. On scroll it turns, then glides down beside the promise text and leaves with that section. Sections after the promise sit above the layer (`z-index: 1`).
- Reduced motion: nothing is pinned, all text is visible and the 3D scenes render a still frame.
