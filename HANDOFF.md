# ReliefRoute Handoff

## Current Part

Part: 2 — MongoDB Backend (code complete; live DB connection blocked by Atlas IP allowlist)

---

## Completed

- Installed `mongoose@^8` (added 376 packages, no breaking issues)
- Created [lib/mongodb.ts](lib/mongodb.ts) — cached Mongoose connection helper using `globalThis._mongooseCache` to survive Next.js dev hot reloads. `dbName: "reliefroute"`, `bufferCommands: false`
- Created [models/Resource.ts](models/Resource.ts) — Mongoose schema mirroring the `Resource` type. `id` is unique-indexed, `_id` stripped on serialization, `versionKey: false`
- Created [models/Report.ts](models/Report.ts) — Mongoose schema mirroring the `Report` type. `id` and `resourceId` indexed
- Created [app/api/resources/route.ts](app/api/resources/route.ts) — `GET` returns all resources from MongoDB. `runtime = "nodejs"`, `dynamic = "force-dynamic"`
- Created [app/api/reports/route.ts](app/api/reports/route.ts) — `POST` saves a new report and updates the linked resource's `status`, `trustScore`, and `lastUpdated`. Validates payload before connecting
- Created [app/api/seed/route.ts](app/api/seed/route.ts) — `POST` wipes and reseeds the `resources` collection from `lib/demo-data.ts` (chose seed API over `scripts/seed.ts` to avoid pulling in `tsx`/`ts-node` for a one-purpose script)
- Recreated [.env.example](.env.example) — `MONGODB_URI` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` placeholders
- **Build passes clean** — `npm run build` compiles, type-checks, and lists three new dynamic routes: `/api/reports`, `/api/resources`, `/api/seed`
- **Endpoint plumbing verified** — dev server starts; `/api/reports` returns proper 400s for invalid bodies; all three routes load `MONGODB_URI` from `.env` and reach Mongoose's `connect()`

### Trust score update logic

In [app/api/reports/route.ts](app/api/reports/route.ts) — when a report is saved:

- `statusReported = "open"` → trustScore +2
- `statusReported = "limited"` → trustScore −1
- `statusReported = "closed"` → trustScore −3
- Score clamped to [0, 100]
- Resource's `status` is set to the reported status, `lastUpdated` set to now

---

## Files Changed

```
lib/mongodb.ts              (new)
models/Resource.ts          (new)
models/Report.ts            (new)
app/api/resources/route.ts  (new)
app/api/reports/route.ts    (new)
app/api/seed/route.ts       (new)
.env.example                (recreated — file was missing despite previous handoff note)
package.json                (mongoose added)
package-lock.json           (updated)
HANDOFF.md                  (updated)
```

---

## Commands Run

```bash
npm install mongoose
npm run build                                          # passes
npm run dev                                            # background
curl -X POST http://localhost:3000/api/seed            # 500 — Atlas IP not allowlisted
curl http://localhost:3000/api/resources               # 500 — same
curl -X POST http://localhost:3000/api/reports -d '{}' # 400 — validation works
curl -X POST http://localhost:3000/api/reports \
  -d '{"resourceId":"r1","statusReported":"bogus"}'    # 400 — enum validation works
npm run build                                          # passes again
```

---

## What Works

- `npm run build` exits 0 with three new API routes registered as dynamic
- `lib/mongodb.ts` correctly reads `MONGODB_URI` from `.env` (Next.js auto-loads it; logs show `Environments: .env`)
- Mongoose `connect()` is invoked, fails gracefully on Atlas IP block, and the route handler returns the Atlas error message as JSON (no crash)
- `/api/reports` payload validation works without a DB:
  - missing `resourceId` / `statusReported` → 400
  - invalid `statusReported` enum value → 400
- All TypeScript types are clean; no warnings from the compiler

---

## What Does Not Work

- **Live MongoDB Atlas connection is blocked.** All three routes return:
  > "Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted."
  This is a cluster network-access config issue, not a code issue. The Mongoose URI in `.env` is correct in form (`mongodb+srv://...mongodb.net/?appName=Cluster0`).
- The frontend (`app/resources/page.tsx`) still uses static `DEMO_RESOURCES` from `lib/demo-data.ts`. It has not been swapped to fetch from `/api/resources` yet — see "Exact Next Task" below
- No community report form UI yet (Part 4)
- No map view yet (Part 3)

---

## Blockers

**Atlas IP allowlist.** Before live DB testing can pass, the user must, in MongoDB Atlas:

1. Open the cluster → **Network Access**
2. Add the current dev machine's IP, OR add `0.0.0.0/0` (allow from anywhere) for hackathon convenience
3. Then call `curl -X POST http://localhost:3000/api/seed` to populate `resources`, and `curl http://localhost:3000/api/resources` to verify

Once that's unblocked, every endpoint should function as designed without further code changes.

---

## Exact Next Task

**Wire the frontend to the live API and start Part 3 (Map view).**

1. **Frontend swap (small, finishes Part 2 cleanly).** In [app/resources/page.tsx](app/resources/page.tsx):
   - Replace the static `DEMO_RESOURCES` import with a client-side `useEffect` that `fetch("/api/resources")` on mount
   - Keep `DEMO_RESOURCES` as a fallback if the fetch fails or returns `[]`, so the demo never goes blank
   - Add a small loading state
2. **Part 3 — Map and Filters:**
   - Choose Google Maps (`@vis.gl/react-google-maps`) or Mapbox; install
   - Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env`
   - Create `components/ResourceMap.tsx` — renders markers from `resources` prop with status-colored pins
   - Add the map above the resource grid in `/resources`
   - Wire marker clicks to highlight/scroll to the matching `ResourceCard`

---

## Recommended Next Agent

`junior-frontend-dev`

The remaining frontend swap is small (one file, ~30 lines), then Part 3's map integration is mostly UI work. Backend is complete pending the Atlas allowlist fix, which the user should resolve out-of-band.

---

## Notes for Next Teammate

- **API routes use Node runtime** (`export const runtime = "nodejs"`) — Mongoose isn't compatible with the Edge runtime. Don't change this
- **`MONGODB_URI` is in `.env`**, not `.env.local`. Both are loaded by Next.js. `.env` is gitignored via the `.env*` glob in [.gitignore](.gitignore)
- **Seeding uses an API route**, not a CLI script. To seed: `curl -X POST http://localhost:3000/api/seed`. It wipes and re-inserts the 8 resources from `lib/demo-data.ts`. Idempotent
- **`Resource` and `Report` Mongoose schemas keep an application-level `id` field** alongside Mongo's `_id`. The `_id` is stripped via `toJSON` transforms and lean-query post-processing. The frontend should keep using `resource.id`
- **Trust score updates are inline** in `POST /api/reports`. If you need a more sophisticated score (e.g., decay over time, aggregate over recent reports), the place to add it is in the same handler before `resource.save()`
- The connection helper (`lib/mongodb.ts`) caches the connection on `globalThis`, which is the standard Next.js pattern for surviving HMR
- Workspace-root warning about multiple lockfiles still appears but is benign
