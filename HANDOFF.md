# ReliefRoute Handoff

## Current Part

Part 3 — Map and Resource Display (complete, extended with MongoDB sync, two-column layout, multi-source data, and cross-linking UX)

---

## Completed

### MongoDB sync for ArcGIS data
- `/app/api/arcgis-resources/route.ts` is now MongoDB-backed
- Module-level `lastSyncedAt` tracks sync time with a 5-minute interval
- On first request: fetches from ArcGIS, upserts records to MongoDB via `ResourceModel.findOneAndUpdate({ id }, resource, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })`
- Subsequent requests within 5 minutes are served from MongoDB
- Falls back to a direct ArcGIS fetch if MongoDB is unreachable
- Fixed Mongoose deprecation: `new: true` replaced with `returnDocument: 'after'`

### Booking.com-style two-column layout
- `app/resources/page.tsx` overhauled to a two-column sticky layout
- Left column (420px, scrollable): filters and resource list
- Right column (flex-1, sticky): map fills full viewport height
- `HeatAlertBanner` remains full-width above the two-column wrapper
- Stacks vertically on mobile

### Map bounds filtering and Show More
- `BoundsWatcher` component inside `<Map>` listens to `bounds_changed`, `tilesloaded`, and calls `update()` immediately on effect run so bounds are computed as soon as resources load
- List filters to only show resources visible in current map viewport
- "Show more" button zooms map out by 2 levels
- "Showing X of Y" count displayed below the list

### Hover cross-linking
- Hovering a map marker: InfoWindow appears, marker scales up
- Clicking a map marker: InfoWindow closes, scrolls to matching card
- Hovering a card: blue ring on card, corresponding marker scales up
- Card click: `map.panTo()` via `PanController` component inside ResourceMap

### Card click pan fix
- Added `panTarget` state and `PanController` child component in ResourceMap
- Clicking a card pans the map to that resource's location

### New data sources
- `/app/api/wifi-resources/route.ts`: 52 Phoenix City public Wi-Fi locations from Phoenix city ArcGIS GeoJSON
- `/app/api/medical-resources/route.ts`: up to 80 hospitals, clinics, and doctor offices in Phoenix metro from OpenStreetMap Overpass API
- `page.tsx` fetches all three APIs in parallel using `Promise.allSettled` and merges results

### Service type consolidation
- `types/index.ts`: ServiceType reduced from 7 to 5 values: `"shelter" | "wifi" | "water" | "medical" | "food"` (removed "power" and "cooling")
- `components/ServiceTag.tsx`: SERVICE_CONFIG updated to match
- `lib/demo-data.ts`: all "power" and "cooling" values replaced with "shelter"
- `app/api/arcgis-resources/route.ts`: `services.push("cooling")` changed to `services.push("shelter")`

### UI cleanup
- Removed "Resources" plain nav link from Navbar (kept "Find Help Now" button)
- Removed Type filter row from left panel (was showing Cooling Center, Hydration Station, etc.)
- Removed `typeFilter` state and `allTypes` useMemo from page.tsx
- `DEMO_RESOURCES` no longer used as initial state; page starts with `[]` and live data populates it
- Removed `DEMO_RESOURCES` import from page.tsx
- Navbar is now full-width (`w-full px-6` instead of `max-w-5xl mx-auto`)
- Brand renamed from "ReliefRoute" to "CrisisMap" in Navbar
- Status filter now only shows "All" and "Open" (removed "Limited")

### Bug fixes
- Map not rendering: wrapper div height pattern fixed (height on parent div, Map uses `style={{ width: '100%', height: '100%' }}`)
- Parker Public Library showing as best match on first load: fixed by calling `update()` immediately in BoundsWatcher effect
- Card click not panning map: `PanController` + `panTarget` state added to ResourceMap

---

## Files Changed

```
app/resources/page.tsx              (major rewrite: two-column layout, multi-source fetch, filter cleanup)
components/ResourceMap.tsx          (BoundsWatcher, PanController, hover props, zoom control, height fix)
components/ResourceCard.tsx         (isHovered, onMouseEnter, onMouseLeave props)
components/Navbar.tsx               (full-width, CrisisMap branding, removed Resources link)
components/ServiceTag.tsx           (removed power/cooling from SERVICE_CONFIG)
types/index.ts                      (ServiceType reduced to 5 values)
lib/demo-data.ts                    (power/cooling replaced with shelter, no longer used as initial state)
app/api/arcgis-resources/route.ts   (MongoDB-backed sync, returnDocument fix, shelter service)
app/api/wifi-resources/route.ts     (new: Phoenix City Wi-Fi GeoJSON)
app/api/medical-resources/route.ts  (new: OSM Overpass medical facilities)
HANDOFF.md                          (this file)
```

---

## Commands Run

```bash
npm run build
# Result: exits 0, 9 routes registered, zero TypeScript errors
# Routes: /, /_not-found, /api/arcgis-resources, /api/heat-alerts,
#         /api/medical-resources, /api/reports, /api/resources,
#         /api/seed, /api/wifi-resources, /resources
```

---

## What Works

- `npm run build` exits 0 with no TypeScript errors
- Three data sources load in parallel: ArcGIS cooling centers (via MongoDB cache), Phoenix Wi-Fi hotspots, OSM medical facilities
- Map shows Phoenix metro at zoom 10; list reflects only resources visible in the current viewport
- Hover and click cross-linking between map markers and list cards works in both directions
- Card click pans the map to that resource's coordinates
- MongoDB upserts ArcGIS records on first load; falls back to direct ArcGIS fetch if Atlas is unreachable
- No deprecated Mongoose warnings in console
- "Show more" zooms out to reveal more resources in the list
- HeatAlertBanner still renders full-width above the two-column layout

---

## What Does Not Work

- ArcGIS ADHS data is seasonal (May–Sep active). Most Phoenix cooling centers show `status: "closed"` or `"unknown"` until summer. Open resources tend to be in remote AZ cities like Parker, Yuma, and Somerton. This is correct real-world behavior, not a bug.
- MongoDB Atlas IP allowlist must be configured for MongoDB persistence to work. The ArcGIS flow degrades gracefully without it.
- Heatmap visualization requires the "Maps JavaScript API" visualization library to be enabled in Google Cloud Console. Silently no-ops if not enabled.
- No community report form UI exists yet (Part 4 not started).
- Wi-Fi resources have no hours data (the field is absent from the Phoenix city dataset).

---

## Blockers

None blocking the demo. The app runs cleanly without any external configuration.

Optional blockers for Part 4:
- MongoDB Atlas IP allowlist required for `/api/reports` to persist community reports
- ArcGIS resource IDs (`arcgis-*`) do not exist in the MongoDB resources collection, so reporting on ArcGIS resources will return a 404 from `/api/reports` unless those records are first synced (the sync already runs via `/api/arcgis-resources` on first load)

---

## Next Task

**Part 4 — Community Report Form**

1. Build `components/ReportForm.tsx` modal:
   - Trigger: "Report Status" button on each ResourceCard
   - Fields: `statusReported` (radio: open / limited / closed), `note` (textarea)
   - POST to `/api/reports` with `resourceId`
   - On success: show inline confirmation, then re-fetch all three resource APIs to refresh the map

2. Add `onReport?: () => void` prop to ResourceCard — renders a small "Report" button in the card footer

3. Wire from page.tsx: open ReportForm modal for the selected resource

4. Handle the ArcGIS ID edge case: records synced to MongoDB by `/api/arcgis-resources` use IDs like `arcgis-12345`. The `/api/reports` route does a MongoDB lookup by `resourceId`. Because the sync runs automatically on first load, these records should exist in MongoDB by the time the user tries to report. Test this flow end-to-end and handle a missing-resource 404 gracefully on the frontend (show a soft error message rather than crashing).

---

## Recommended Next Agent

`junior-frontend-dev`

Part 4 is pure UI work: a report modal, one POST call, and a list refresh. The backend `/api/reports` route with trust score logic is already complete. The main risk is the ArcGIS ID edge case described above — handle it gracefully on the frontend.

---

## Notes for Next Teammate

- The app is branded "CrisisMap" in the Navbar but the project folder and CLAUDE.md still refer to "ReliefRoute". Do not rename files or folders unless asked.
- ArcGIS endpoint: `FeatureServer/19`, layer `AZCoolingandHydration`, org `mpVYz37anSdrK4d8`
- ArcGIS geometry format: `{ x: longitude, y: latitude }` when `outSR=4326`
- Seasonal data: ADHS runs May–Sep; most records will be closed until then. Use the "All" status filter to see all locations during development.
- NWS User-Agent header is required — NWS returns 403 without it. Already set in `/api/heat-alerts/route.ts`.
- HeatAlertBanner must stay outside the two-column wrapper so it spans full page width. Do not move it inside.
- ResourceMap center: `{ lat: 33.456, lng: -111.980 }` — Phoenix metro center
- All API routes use Node runtime. Do not switch to Edge runtime (Mongoose is incompatible).
- Environment variables: `MONGODB_URI` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env`
- Run dev: `npm run dev`. Build check: `npm run build`.
- `/api/seed` seeds MongoDB from `lib/demo-data.ts` (LA demo data). It does not seed ArcGIS data. ArcGIS data is seeded automatically on the first call to `/api/arcgis-resources`.
- Do not import `DEMO_RESOURCES` into page.tsx — it was intentionally removed. The page now starts with an empty array and populates from live APIs.
