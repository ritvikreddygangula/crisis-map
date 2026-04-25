# ReliefRoute Handoff

## Current Part

Part: 1 — Project Setup and UI Shell

---

## Completed

- Scaffolded Next.js 16.2.4 app with TypeScript, Tailwind CSS v4, ESLint, App Router
- Created `types/index.ts` — shared TypeScript interfaces (Resource, Report, EmergencyScenario, ServiceType, ResourceStatus, EmergencyType)
- Created `lib/demo-data.ts` — 8 static LA emergency resources with realistic data (addresses, services, trust scores, distances, recommendation scores)
- Updated `app/globals.css` — Tailwind v4 CSS-first import, brand CSS vars
- Updated `app/layout.tsx` — ReliefRoute metadata, Geist font, Navbar, footer
- Created `components/Navbar.tsx` — sticky top nav with ReliefRoute logo, "Find Help Now" CTA
- Created `components/ServiceTag.tsx` — colored badge component for service types (power, wifi, water, shelter, medical, cooling, food)
- Created `components/ResourceCard.tsx` — full resource card with status badge, address, service tags, notes, trust bar, last-updated
- Updated `app/page.tsx` — polished landing page: hero, emergency type selector, "How it works", stats strip, CTA
- Created `app/resources/page.tsx` — resource listing page: service filters, status filters, best-pick recommendation card, all-resources grid, score legend
- Created `.env.example` — documents MONGODB_URI and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- **Build passes clean** — `npm run build` exits 0, no TypeScript errors

---

## Files Changed

```
types/index.ts              (new)
lib/demo-data.ts            (new)
components/Navbar.tsx       (new)
components/ServiceTag.tsx   (new)
components/ResourceCard.tsx (new)
app/globals.css             (updated)
app/layout.tsx              (updated)
app/page.tsx                (updated — full replacement)
app/resources/page.tsx      (new)
.env.example                (new)
HANDOFF.md                  (new)
```

---

## Commands Run

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes --skip-git
npm run build
```

---

## What Works

- `npm run build` passes with zero errors
- `npm run dev` starts the dev server at http://localhost:3000
- Landing page (`/`) renders hero, emergency type cards, how-it-works, CTA
- Resources page (`/resources`) renders all 8 demo resources with:
  - Best recommendation card highlighted at top
  - Service filter chips (click to filter by need)
  - Status filter buttons (All / Open / Limited)
  - Empty state when filters match nothing
  - Trust score bar on each card
  - "Updated X min ago" relative timestamps
- `?emergency=wildfire` etc. query param changes the page header scenario icon/label
- All TypeScript types are clean

---

## What Does Not Work

- No real map view yet (Part 3)
- No MongoDB connection or API routes yet (Part 2)
- No community report form yet (Part 4)
- Trust score and recommendation score are hardcoded in demo data (not dynamically calculated)
- Emergency type selection on landing page navigates to /resources with query param but the resources shown are the same static list for all emergency types (filtering by `defaultNeeds` not yet wired up)

---

## Blockers

- None. Build is clean.

---

## Exact Next Task

**Part 2 — MongoDB Backend:**

1. Install `mongoose` and set up `lib/mongodb.ts` connection helper
2. Create `models/Resource.ts` (Mongoose schema matching the `Resource` type)
3. Create `models/Report.ts` (Mongoose schema matching the `Report` type)
4. Create `app/api/resources/route.ts` — GET returns all resources from MongoDB
5. Create `app/api/reports/route.ts` — POST saves a new report, updates resource trust score
6. Create `scripts/seed.ts` — seeds MongoDB with the 8 resources from `lib/demo-data.ts`
7. Add `MONGODB_URI` to `.env.local` and test the API routes

---

## Recommended Next Agent

`junior-backend-dev`

Wire MongoDB Atlas connection, Mongoose models, and the two API routes (GET /api/resources, POST /api/reports). Then swap `lib/demo-data.ts` usage in the resources page to fetch from the API.

---

## Notes for Next Teammate

- The app uses **Next.js App Router** (not Pages Router). API routes go in `app/api/`.
- Tailwind v4 is configured via `@import "tailwindcss"` in `app/globals.css` — there is no `tailwind.config.ts`.
- The `Resource` type in `types/index.ts` is the source of truth for the MongoDB schema shape.
- `lib/demo-data.ts` contains the seed data — the backend agent should use this exact data for the seed script.
- The `getBestResource()` function in `lib/demo-data.ts` will need to be replaced with a server-side recommendation score calculation once MongoDB is wired up.
- There's a benign workspace-root warning from Next.js about multiple lockfiles (`/Users/ritvik/package-lock.json` exists above the project). It does not affect the build.
