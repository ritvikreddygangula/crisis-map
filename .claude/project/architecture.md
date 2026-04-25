# ReliefRoute Architecture

## High-Level Flow

User opens app
→ selects emergency type and need
→ frontend requests resources
→ backend fetches resources from MongoDB
→ frontend shows map/cards
→ recommendation algorithm ranks resources
→ user submits report
→ backend saves report and updates trust score
→ UI shows updated resource status

## Frontend

Use Next.js pages/components for:

- Landing page
- Emergency selector
- Filter sidebar
- Map section
- Resource cards
- Resource detail modal
- Report form
- Best recommendation card

## Backend

Use Next.js API routes or server actions for:

- GET resources
- GET resource by ID
- POST report
- POST seed demo data if needed

## Database

MongoDB collections:

- resources
- reports
- incidents

## Map

Use Google Maps API if available.

If API key is not ready, create a fallback UI:

- Static map-like panel
- Resource cards
- Mock coordinates
- "Open in Google Maps" links

Do not block the whole project on maps.