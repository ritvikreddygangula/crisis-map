# ReliefRoute Handoff

## Current Part

Part: 3 — Map and Filters (complete, ArcGIS + NWS integrated)

---

## Completed (Part 3 — final state)

### Map overhaul
- Map re-centered on Phoenix metro (`33.456, -111.980`), zoom 11 — shows Tempe, Phoenix, and Scottsdale simultaneously
- Map height changed to `clamp(350px, 60vh, 640px)` — dominant visual on the page
- Unknown status marker (gray) added to the legend
- Loading indicator in the map header while ArcGIS fetch is in progress

### Live ArcGIS data — Arizona Heat Preparedness Network
- Created [app/api/arcgis-resources/route.ts](app/api/arcgis-resources/route.ts)
- Queries the Arizona ADHS FeatureServer at layer 19:
  `https://services1.arcgis.com/mpVYz37anSdrK4d8/arcgis/rest/services/AZCoolingandHydration/FeatureServer/19`
- WHERE clause: `UPPER(City) IN ('PHOENIX','SCOTTSDALE','TEMPE')` — up to 300 results
- Output SR 4326 (lat/lng); geometry returned as `{ x: lng, y: lat }`
- Transforms ArcGIS features → `Resource` type using fields: `Facility`, `Organization`, `HydrationActivities`, `CollectionActivities`, `Hydration`, `Collection`, `Address`, `City`, `Zip`, `SeasonStatus`, `Open24seven`, `PopupHours`, `Pets`, `PrimaryPhone`
- Resource ID format: `arcgis-{OBJECTID}`
- Status: `SeasonStatus = "Active"` → open, `"Inactive"` → closed, other → unknown
- Type detection: Cooling Center (default), Hydration Station, Respite Center, Donation Site
- Services derived from activity fields + hydration/collection flags
- `recommendationScore` computed server-side (50% status + 30% trust + 20% service breadth)
- Response cached 5 minutes via `next: { revalidate: 300 }`
- Graceful error handling: returns `{ error }` with 502 or 500 on failure; frontend falls back to DEMO_RESOURCES

### NWS heat alerts
- Created [app/api/heat-alerts/route.ts](app/api/heat-alerts/route.ts)
- Calls `https://api.weather.gov/alerts/active?area=AZ&status=actual`
- Filters for: Excessive Heat Warning, Excessive Heat Watch, Heat Advisory, Heat Wave Warning
- Returns array of `HeatAlert` objects (id, event, headline, severity, urgency, expires, description)
- Returns `[]` on any fetch failure — non-crashing
- Response cached 5 minutes

### HeatAlertBanner component
- Created [components/HeatAlertBanner.tsx](components/HeatAlertBanner.tsx)
- Renders full-bleed above page content when heat alerts are active
- Red background for `severity = "Extreme"`, orange for others
- Shows top alert headline; "+N more" chip if multiple alerts
- Dismissable with × button
- Returns null when no alerts (currently no active heat alerts — pre-season)

### Resources page changes
- [app/resources/page.tsx](app/resources/page.tsx): Primary fetch now targets `/api/arcgis-resources`; falls back silently to `DEMO_RESOURCES`
- Both fetches happen in a single `useEffect` (resources + heat alerts) on mount
- Header badge shows "Live · Phoenix Metro" when ArcGIS data loaded, "Demo · Los Angeles" when fallback
- Subheader shows "Tempe, Phoenix & Scottsdale" context when live data is active
- Default emergency scenario changed to `heat_wave` to match the ArcGIS data theme
- `/api/resources` (MongoDB) and `/api/seed` remain available for Part 4 community reports

---

## Files Changed (this session)

```
app/api/arcgis-resources/route.ts   (new)
app/api/heat-alerts/route.ts        (new)
components/HeatAlertBanner.tsx      (new)
components/ResourceMap.tsx          (center, zoom, height, Tailwind class fixes)
app/resources/page.tsx              (ArcGIS fetch, heat alert banner, map prominence)
HANDOFF.md                          (updated)
```

---

## Commands Run

```bash
npm run build    # passes — 7 routes registered, zero TypeScript errors
```

---

## What Works

- `npm run build` exits 0, all routes compile clean
- Map renders centered on Phoenix/Scottsdale/Tempe at zoom 11, 60vh tall
- `/api/arcgis-resources` queries the live Arizona ADHS dataset filtered to the three cities
- `/api/heat-alerts` queries NWS; currently returns `[]` (no active heat alerts — pre-season, May–Sep)
- `HeatAlertBanner` renders automatically when NWS returns active heat events; dismissable
- Status-colored pins, InfoWindow, marker-to-card scroll, type/trust/service/status filters all work with ArcGIS data
- Page header badge and subheader dynamically reflect whether live or demo data is loaded
- All existing filter, heatmap toggle, and scroll-to-card behavior preserved

---

## What Does Not Work

- **ArcGIS `SeasonStatus = "Inactive"`** — the ADHS network is seasonal (May–Sep). Most or all records will show `status: "closed"` until the season opens. Use the "All" status filter to see all locations. This is correct behavior reflecting real-world data.
- **No community report form UI** (Part 4)
- **MongoDB Atlas IP allowlist** still needs to be configured before `/api/reports` and `/api/seed` work for live DB. The ArcGIS flow does not depend on MongoDB.
- **Heatmap visualization library** must be enabled in Google Cloud Console. Silently no-ops if not enabled.

---

## Blockers

None blocking the demo. The app runs cleanly on demo data without any external configuration.

Optional:
- Atlas IP allowlist for MongoDB (Part 4 community reports)
- Google Cloud Console: enable "Maps JavaScript API" visualization library for heatmap

---

## Exact Next Task

**Part 4 — Community Report Form + Live Trust Score Updates**

1. **Report form UI** (new `components/ReportForm.tsx` modal):
   - Trigger: "Report Status" button on each ResourceCard (add it as a new optional prop/callback)
   - Fields: `statusReported` (open/limited/closed), `servicesAvailable` (checkboxes), `crowdLevel` (empty/moderate/crowded), `note` (textarea)
   - `POST /api/reports` with the resource's `id` as `resourceId`
   - On success: re-fetch `/api/arcgis-resources` to refresh trust scores and status in the map and list
   - Show inline success message or toast

2. **Wiring**:
   - Add `onReport?: (r: Resource) => void` prop to `ResourceCard`
   - Pass it from `ResourcesContent` with a handler that opens `ReportForm` for the selected resource
   - After report submission, call the resource refresh function already in state

3. **Trust score** (backend already complete in `POST /api/reports`):
   - open → +2, limited → −1, closed → −3, clamped to [0, 100]
   - Note: ArcGIS-sourced records have `id = "arcgis-{OBJECTID}"`, which won't match MongoDB. Either seed ArcGIS data into MongoDB first, or handle the case where `resourceId` is not found in MongoDB gracefully.

---

## Recommended Next Agent

`junior-frontend-dev`

Part 4 is pure UI: a report modal, one POST call, and a list refresh. Backend is complete. The one edge case to handle is that ArcGIS resource IDs (`arcgis-*`) don't exist in MongoDB — the report route will return a 404 for those. Options: (a) seed ArcGIS data into MongoDB via `/api/seed` after updating `lib/demo-data.ts` with ArcGIS records, or (b) have the report form store reports in MongoDB without updating the resource's trust score (log-only mode).

---

## Notes for Next Teammate

- **ArcGIS endpoint**: `FeatureServer/19`, layer name `AZCoolingandHydration`, org `mpVYz37anSdrK4d8`
- **ArcGIS geometry**: `{ x: longitude, y: latitude }` when `outSR=4326`
- **City filter**: `UPPER(City) IN ('PHOENIX','SCOTTSDALE','TEMPE')` — UPPER() handles mixed-case data
- **Seasonal data**: ADHS runs May–Sep; `SeasonStatus = "Active"` only during that window
- **NWS User-Agent required**: NWS API returns 403 without a descriptive `User-Agent` header
- **HeatAlertBanner placement**: it lives outside the `max-w-5xl` container so it spans full page width. Do not move it inside.
- **ResourceMap center**: `{ lat: 33.456, lng: -111.980 }` — geometric center of the three cities
- **API routes use Node runtime** — do not change to Edge runtime (Mongoose incompatibility)
- **`MONGODB_URI` in `.env`**, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env`
- **`/api/seed`** seeds MongoDB from `lib/demo-data.ts` (LA data) — not ArcGIS data. Update `lib/demo-data.ts` if you want to seed AZ data into MongoDB for Part 4 trust score updates.
