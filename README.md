# CrisisMap

Real-time emergency resource map for the Arista Networks "Connect the Dots" hackathon track.

People caught in emergencies — power outages, wildfires, heat waves — have no fast way to find what is open nearby. CrisisMap pulls live data from government and OpenStreetMap sources, shows every open shelter, Wi-Fi hotspot, cooling center, and medical facility on an interactive map, and lets the community report status in real time so the information stays accurate.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env or .env.local and add your keys
MONGODB_URI=your_atlas_connection_string
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# 3. Run dev server
npm run dev
# → http://localhost:3000

# 4. (Optional) Seed demo LA data into MongoDB
curl -X POST http://localhost:3000/api/seed
```

**MongoDB Atlas:** make sure your IP is in the Atlas allowlist (Network Access → Add IP Address).

**Google Maps:** enable "Maps JavaScript API" in Google Cloud Console. For heatmap support also enable "Visualization API".

---

## What is built

### Map and resource display

- Google Maps with color-coded markers: green = open, amber = limited, red = closed, gray = unknown
- Booking.com-style two-column layout: scrollable resource list on the left, sticky full-height map on the right
- Map bounds filtering — the list only shows resources visible in the current viewport
- "Show more" button zooms the map out by 2 levels to reveal more resources
- Hover on a marker → InfoWindow with name, type, address, status badge; marker scales up 35%
- Click a marker → scrolls to the matching card in the list
- Hover on a card → corresponding marker scales up
- Click a card → map pans to that resource's location
- Optional heatmap overlay toggle (requires Maps Visualization API)
- NWS heat alert banner above the map when Arizona heat warnings are active

### Filters

- Status filter: All / Open
- Services filter: shelter, Wi-Fi, water, medical, food — multi-select with AND logic (resource must offer all selected services)
- Min. trust filter: Any / 60+ / 75+ / 90+
- "Showing X of Y" count reflects viewport + active filters simultaneously
- Clear all filters resets every filter at once

### Resource cards

Each card shows: name, resource type, status badge, address, service tags, optional notes, trust score progress bar (green ≥ 80, amber ≥ 60, red < 60), "Updated X ago" timestamp, and a "Report status" link.

### Best Match

The card with the highest `recommendationScore` among open resources is pinned with a "⭐ Best Match" badge. Only open resources qualify — limited and closed are excluded regardless of score.

### Community report form

Clicking "Report status" on any card opens a modal:
- Status selection: Open / Limited / Closed — color-coded radio buttons
- Optional notes textarea
- Submit button with "Submitting…" loading state
- Inline success or error message (modal stays open on error)
- Closes on submit success, Escape key, or backdrop click
- On success the page re-fetches all three resource APIs and refreshes the map and trust score

---

## Data sources

| Source | What it provides | Endpoint |
|---|---|---|
| ADHS via ArcGIS | Arizona cooling centers, hydration stations, respite centers (~300 records) | ArcGIS FeatureServer layer 19 |
| City of Phoenix | Public Wi-Fi hotspot locations (52 sites) | Phoenix city GeoJSON |
| OpenStreetMap | Hospitals, clinics, doctor offices in Phoenix metro (up to 80) | Overpass API |
| NWS | Active heat alerts for Arizona | api.weather.gov |

---

## How often data is fetched from each source

### ArcGIS cooling centers — every 5 minutes per server process

Controlled by a module-level `lastSyncedAt` variable (resets on server restart).

Flow on each request to `/api/arcgis-resources`:
1. Check `lastSyncedAt`. If null or older than 5 minutes → fetch from ArcGIS, upsert all records into MongoDB.
2. If within 5 minutes → skip the external fetch entirely.
3. In both cases, read and return all `arcgis-*` records from MongoDB.
4. If MongoDB is unreachable → fall back to a direct ArcGIS fetch (returned but not stored).

The upsert uses MongoDB `$set` for source-derived fields (name, address, location, services, notes) and `$setOnInsert` for community-mutable fields (status, trustScore, lastUpdated). This means a re-sync **never overwrites community reports**.

> ADHS runs this dataset seasonally (May–September). Most records show `status: closed` or `unknown` outside summer. This is correct real-world behavior — use the "All" status filter during development.

### Phoenix Wi-Fi hotspots — every 1 hour

Controlled by Next.js fetch cache (`revalidate: 3600`). The same cached response is reused for all requests within that hour.

After building the list from the external API, the route does a bulk MongoDB lookup and overwrites `status`, `trustScore`, and `lastUpdated` for any resource that has community reports. Resources with no reports are returned with original API values (status: open, trustScore: 80).

### OpenStreetMap medical facilities — every 24 hours

Controlled by Next.js fetch cache (`revalidate: 86400`). Same MongoDB community-override merge as Wi-Fi.

### NWS heat alerts — every 5 minutes

Controlled by Next.js fetch cache (`revalidate: 300`). Returns an empty array silently if NWS is unreachable. NWS requires a `User-Agent` header — without it NWS returns 403.

---

## Recommendation score — how Best Match is selected

Every resource has a `recommendationScore` (0–100). The Best Match badge goes to whichever open resource has the highest score in the current viewport.

### ArcGIS resources — formula

```
statusScore  = open → 100  |  unknown → 40  |  closed → 0
serviceScore = min(services.length / 3, 1) × 100   (3+ services = full score)
trustScore   = 70  (ArcGIS starting baseline)

recommendationScore = round(
  statusScore  × 0.50 +
  trustScore   × 0.30 +
  serviceScore × 0.20
)
```

Weight rationale:
- **50% status** — an open resource always outranks a closed one, regardless of other factors
- **30% trust score** — community confidence in the data is weighted more than service breadth
- **20% service count** — more services offered = higher score, saturates at 3 service types

### Wi-Fi resources

Fixed `recommendationScore: 72`. All Phoenix city Wi-Fi sites are assumed open.

### Medical resources

```
statusScore  = 40   (unknown — OSM has no real-time open/close data)
trustScore   = 65
serviceScore = 33   (single service: medical)

recommendationScore = round(40 × 0.50 + 65 × 0.30 + 33 × 0.20) = 46
```

---

## Trust score — how it is computed and updated

Every resource has a `trustScore` (0–100) shown as a colored bar on each card.

### Starting values — before any community reports

| Source | Starting trust score | Reason |
|---|---|---|
| ArcGIS (ADHS) | 70 | Government-published, seasonally maintained |
| Phoenix Wi-Fi | 80 | City-managed infrastructure, consistently reliable |
| OpenStreetMap medical | 65 | Crowd-sourced map data, may be stale |

### How a report changes trust score

When a report is submitted, the API reads the **last 5 reports** for that resource (the consensus window) and recomputes the trust score from scratch using a weighted average:

```
weight per status:
  "open"    → +5
  "limited" → −2
  "closed"  → −8
  "unknown" →  0

newTrustScore = 70 + round( (sum of weights ÷ count of reports in window) × 5 )
newTrustScore = clamp(newTrustScore, 0, 100)
```

**Worked examples:**

| Recent reports (last 5) | Calculation | Result |
|---|---|---|
| 1 × open | 70 + (5/1 × 5) | **95** |
| 1 × limited | 70 + (−2/1 × 5) | **60** |
| 1 × closed | 70 + (−8/1 × 5) | **30** |
| 3 × limited, 2 × open | 70 + ((−6+10)/5 × 5) | **74** |
| 4 × limited, 1 × open | 70 + ((−8+5)/5 × 5) | **67** |
| 5 × closed | 70 + (−40/5 × 5) | **30** |

Because the formula averages the window rather than accumulating a running delta, **spamming a status converges at a ceiling** instead of drifting to 0 or 100. One person submitting 100 "closed" reports produces the exact same trust score as submitting 5.

---

## Status updates and anti-spam

### How status changes after a report

1. The report is saved to the `reports` collection immediately and unconditionally.
2. The API fetches the last 5 reports for that resource (newest first).
3. `MIN_REPORTS_FOR_STATUS_CHANGE = 1` — status updates on the very first report.
4. The new status is whichever value appears most often in the window (majority vote). Ties go to the most-recent report's value.
5. Trust score is recomputed using the weighted average formula above.
6. `lastUpdated` is stamped with the current time.
7. The updated resource is saved back to MongoDB.

### Anti-spam measures

**Consensus window (last 5 reports):** A single outlier report cannot flip the status if the window contains several reports pointing the other way. If 4 previous reports said "open" and 1 new report says "closed", the status stays "open" (majority wins).

**Averaged trust score:** The trust score formula divides by the number of reports in the window. Filling the window with the same status nudges the score to a fixed ceiling — it does not keep climbing or falling with additional reports beyond that.

**No running accumulation:** The score is always a fresh calculation over the current window. Reports older than the last 5 have zero effect.

**Acknowledged gaps (acceptable for hackathon scope):**
- No per-user or per-IP rate limiting. A single user can fill the 5-report window by submitting 5 reports back-to-back and control both status and trust score.
- User identity defaults to `"anonymous"`. There is no authentication layer.
- Production deployment would add IP-based cooldowns (e.g., one report per resource per hour per IP) and require a minimum number of distinct users for a status change.

---

## MongoDB schema

### `resources` collection

```js
{
  id: String,           // "arcgis-12345" | "wifi-6" | "osm-987654"
  name: String,
  type: String,         // "Cooling Center" | "Wi-Fi Hotspot" | "Hospital" | "Clinic" | ...
  address: String,
  location: { lat: Number, lng: Number },
  status: String,       // "open" | "limited" | "closed" | "unknown"
  services: [String],   // subset of: "shelter" | "wifi" | "water" | "medical" | "food"
  capacity: Number | null,
  trustScore: Number,   // 0–100, updated by reports
  lastUpdated: String,  // ISO 8601 — set on insert, then updated on each report
  notes: String,
  recommendationScore: Number  // 0–100, computed at insert time
}
```

**What gets stored:** ArcGIS resources are upserted on every sync cycle. Wi-Fi and medical resources are created in MongoDB on their **first community report** — before any report they exist only as live API responses. Once created, subsequent reports and re-fetches read from and update the MongoDB record.

### `reports` collection

```js
{
  id: String,              // UUID v4
  resourceId: String,      // matches resources.id
  userId: String,          // "anonymous" unless passed by client
  statusReported: String,  // "open" | "limited" | "closed" | "unknown"
  servicesAvailable: [String],
  crowdLevel: String,      // "empty" | "moderate" | "crowded"
  note: String,            // free text from user
  createdAt: String        // ISO 8601
}
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas + Mongoose |
| Map | Google Maps via `@vis.gl/react-google-maps` |
| External data | ArcGIS REST, Phoenix GeoJSON, OSM Overpass API, NWS Weather API |

All API routes use the Node.js runtime. Edge runtime is not compatible with Mongoose.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key |

Store in `.env` or `.env.local`. Never commit real values. See `.env.example` for the template.

---

## Demo walkthrough

1. Open the app → map loads centered on Phoenix metro
2. Three data sources load in parallel: AZ cooling centers, city Wi-Fi hotspots, OSM medical facilities
3. NWS heat alert banner appears at the top if any Arizona heat warnings are currently active
4. Filter by status "Open" and service "Wi-Fi" to narrow to open Wi-Fi locations
5. The ⭐ Best Match card highlights the highest-scoring open resource in the current viewport
6. Click any card → map pans to that pin; click any pin → card scrolls into view
7. Click "Report status" on a card, select "Limited", optionally add a note, and submit
8. Map refreshes — the card now shows "Limited" status, updated trust score bar, and "Updated just now"
