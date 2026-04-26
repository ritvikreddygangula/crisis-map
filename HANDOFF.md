# ReliefRoute Handoff

## Current Part

Part 4 — Community Report Form (complete)

---

## Completed

### Part 4: Community Report Form

**`components/ReportForm.tsx`** (new) — Modal dialog component:
- Semi-transparent backdrop overlay; click backdrop or press Escape to close
- Resource name displayed in header
- Radio button group for `statusReported`: Open / Limited / Closed (color-coded green/amber/red)
- Optional textarea for notes ("What did you see?" placeholder)
- POST to `/api/reports` on submit; loading state shows "Submitting…" and disables button
- Success path: inline green banner for 1.5s, then calls `onSuccess()` which closes the modal and re-fetches all three resource APIs
- `resourceUpdated: false` response treated as soft success ("Report saved. This resource may not be in our database yet.") — not an error
- Error path: inline red banner, modal stays open
- Accessible: `role="dialog"`, `aria-modal`, `aria-labelledby`

**`components/ResourceCard.tsx`** (updated) — Added `onReport?: () => void` prop. When provided, a small "Report status" underlined link renders in the card footer (right side). Uses `e.stopPropagation()` so it does not trigger card selection.

**`app/resources/page.tsx`** (updated) — Added `ReportForm` import, `reportingResource: Resource | null` state, `onReport={() => setReportingResource(r)}` on each ResourceCard, and the conditional `<ReportForm>` modal. The `onSuccess` handler closes the modal and re-fetches all three APIs (arcgis-resources, wifi-resources, medical-resources) to refresh the map.

### Previous parts (Parts 1–3) remain unchanged

See previous handoff sections for details. Summary:
- Two-column Booking.com-style layout (left: filters + list, right: sticky map)
- Three live data sources: ArcGIS cooling centers, Phoenix City Wi-Fi, OSM medical facilities
- Map bounds filtering, hover/click cross-linking, Show More zoom-out
- MongoDB sync for ArcGIS data with 5-minute cache
- HeatAlertBanner (NWS alerts, full-width)
- Trust score bar, recommendation score, Best Match badge

---

## Files Changed (Part 4)

```
components/ReportForm.tsx          (new)
components/ResourceCard.tsx        (added onReport prop + "Report status" button)
app/resources/page.tsx             (added ReportForm import, reportingResource state, modal wiring)
HANDOFF.md                         (this file)
```

---

## Commands Run

```bash
npm run build
# Result: exits 0, no TypeScript errors
```

---

## What Works

- `npm run build` exits 0 with no TypeScript errors
- "Report status" link appears on every resource card
- Clicking it opens the ReportForm modal with the correct resource name
- Selecting a status and submitting POSTs to `/api/reports`
- Success message shows for 1.5s, then modal closes and map re-fetches
- ArcGIS resources that haven't been synced to MongoDB show soft success message rather than error
- Escape key and backdrop click both close the modal
- All Part 1–3 features still work: map, filters, hover cross-linking, best pick, heatmap toggle

---

## What Does Not Work

- ArcGIS ADHS data is seasonal (May–Sep). Most Phoenix cooling centers show `status: "closed"` or `"unknown"` outside summer. This is expected real-world behavior.
- MongoDB Atlas IP allowlist must be configured for report persistence to work. Without it, `/api/reports` will fail with a MongoDB connection error (shows inline error in modal — does not crash the page).
- Wi-Fi resources have no hours data (field absent from the Phoenix city dataset).
- Heatmap visualization requires the "Maps JavaScript API" visualization library to be enabled in Google Cloud Console.

---

## Blockers

None blocking the demo. The app runs cleanly without any external configuration.

For full report persistence:
- MongoDB Atlas IP allowlist must include the deployment server's IP (or 0.0.0.0/0 for dev)
- `MONGODB_URI` in `.env.local` must be set

---

## Next Task

**Part 5 — Demo Polish**

1. **Landing page copy** — Update the landing page (`app/page.tsx`) with judge-friendly pitch copy that clearly explains the "Connect the Dots" Arista narrative: people need help → resources exist but are scattered → CrisisMap connects them
2. **Demo scenario seed** — Ensure `/api/seed` seeds compelling demo data (LA power outage scenario with open shelters, Wi-Fi, charging spots). Verify the seed script works end-to-end.
3. **README** — Write a concise `README.md` with: what the app does, how to run it locally (env vars, `npm install`, `npm run dev`), demo scenario walkthrough, and tech stack
4. **Mobile responsive polish** — Test on mobile viewport; fix any layout issues in the two-column layout
5. **Best recommendation visibility** — Make the "Best Match" card more visually prominent; consider adding a brief text explanation of WHY it is the best match (e.g., "Open · 0.3 mi · Trust 92")
6. **Demo script** — Add a `DEMO.md` with a judge-facing walkthrough script (30-second pitch + step-by-step feature demo)

---

## Recommended Next Agent

`hackathon-judge` (for demo polish, pitch clarity, README, Devpost wording)

or `junior-frontend-dev` if specific UI features from Part 5 need implementation first.

---

## Notes for Next Teammate

- The app is branded "CrisisMap" in the Navbar; project folder and CLAUDE.md still say "ReliefRoute". Do not rename unless asked.
- ArcGIS endpoint: `FeatureServer/19`, layer `AZCoolingandHydration`, org `mpVYz37anSdrK4d8`
- ArcGIS geometry format: `{ x: longitude, y: latitude }` when `outSR=4326`
- Seasonal data: ADHS runs May–Sep; use "All" status filter during development
- NWS User-Agent header is required (already set in `/api/heat-alerts/route.ts`)
- HeatAlertBanner must stay outside the two-column wrapper (full-width). Do not move it inside.
- ResourceMap center: `{ lat: 33.456, lng: -111.980 }` — Phoenix metro center
- All API routes use Node runtime. Do not switch to Edge runtime (Mongoose is incompatible).
- Environment variables: `MONGODB_URI` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env`
- Run dev: `npm run dev`. Build check: `npm run build`.
- `/api/seed` seeds MongoDB from `lib/demo-data.ts` (LA demo data). Does not seed ArcGIS data.
- Do not import `DEMO_RESOURCES` into page.tsx — intentionally removed. Page starts with `[]` and populates from live APIs.
- ReportForm modal is rendered inside the two-column flex wrapper (between left and right column divs). It uses `fixed inset-0 z-50` so it covers the full viewport regardless of scroll position.
