---
name: maps-and-routing
description: Use for map display, resource markers, location filtering, directions links, and best resource recommendation.
---

# Maps and Routing Skill

Goal:

Show emergency resources clearly on a map and recommend the best option.

Rules:

1. Use Google Maps API if the key is available.
2. If not available, create a fallback map-like layout.
3. Do not block the MVP on map API issues.
4. Markers should show resource type/status.
5. Clicking a marker should show resource details.
6. Filters should update visible resources.
7. Best recommendation should be explainable.

Recommendation score:

- 40 percent availability
- 25 percent distance
- 20 percent trust score
- 15 percent service match

For directions:

Use a simple Google Maps directions link if full route rendering is too much.

Example:

`https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`