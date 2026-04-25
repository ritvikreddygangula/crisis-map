# ReliefRoute Claude Code Rules

## Project

We are building **ReliefRoute**, a hackathon MVP for the Arista Networks "Connect the Dots" track.

ReliefRoute is a real-time emergency resource heatmap that helps people find nearby shelters, water stations, charging spots, Wi-Fi locations, clinics, and cooling centers during emergencies like power outages, wildfires, and heat waves.

The app should stay simple, clean, and demo-ready.

## Main Goal

Build a polished MVP that can win the Arista "Connect the Dots" track.

The app must clearly show:

1. People need emergency help.
2. Resources exist but are hard to find.
3. ReliefRoute connects people to the best nearby resource.
4. Users can report resource status.
5. The app updates trust/status and recommends the best option.

## Core Tech Stack

Use:

- Next.js
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- Google Maps API or Mapbox
- Next.js API routes or server actions

Avoid overengineering.

Do not add unnecessary libraries unless they clearly help the MVP.

## Product Scope

Build only the hackathon MVP.

Required features:

1. Landing page
2. Emergency type selection
3. Need filters
4. Map with resource markers
5. Resource list/cards
6. Best recommended resource card
7. Resource detail modal/page
8. Community report form
9. MongoDB persistence
10. Simple trust score calculation
11. Demo mode with seeded emergency resources

Optional only if time remains:

1. Live user location
2. Directions link
3. AI natural language need classifier
4. Public emergency/weather API
5. Admin dashboard

## Important Rule: No Hallucination

Before editing or explaining any code, inspect the relevant files first.

Never assume:

- File names
- Folder structure
- Component names
- Database schemas
- Existing functions
- Installed packages
- Environment variables

If something is missing, search the project first.

Use this pattern:

1. Inspect files.
2. Understand current structure.
3. Explain what exists.
4. Make the smallest safe change.
5. Run or suggest checks.
6. Update handoff notes.

## Coding Rules

Use simple, readable code.

Prefer:

- Clear component names
- Small functions
- TypeScript types
- Minimal dependencies
- Clean Tailwind styling
- Mobile-responsive layout
- Good empty/loading/error states

Avoid:

- Complex abstractions
- Huge files
- Unused code
- Unused imports
- Fake claims that something works without checking
- Rewriting the whole app unless necessary

## Debugging Rules

When an error happens:

1. Read the error carefully.
2. Identify the exact file and line if possible.
3. Inspect nearby code.
4. Form one likely cause.
5. Apply a minimal fix.
6. Re-run the check if possible.
7. If still failing, try a second fix.
8. If still failing after 3 attempts, document the blocker clearly.

Do not randomly rewrite code.

## Handoff Rules

At the end of every major task, update or create:

- `HANDOFF.md`

The handoff must include:

1. What was completed
2. What files were changed
3. What is working
4. What is not working
5. Commands run
6. Current blockers
7. Exact next task
8. Recommended next agent

This is critical because teammates may switch Claude accounts when limits end.

## Agent Workflow

Use this workflow for each major feature:

1. `senior-architect` plans the feature.
2. Junior agent implements:
   - frontend work: `junior-frontend-dev`
   - backend/API/database work: `junior-backend-dev`
3. `debugger` fixes build/runtime errors.
4. `qa-reviewer` checks correctness.
5. `handoff-manager` writes handoff notes.
6. `hackathon-judge` improves demo impact.

## Major Build Parts

Split the project into these parts:

### Part 1: Project Setup and UI Shell

- Next.js app setup
- Tailwind setup
- Basic layout
- Landing page
- Navigation
- Demo data file if MongoDB is not ready yet

### Part 2: MongoDB and Data Models

- MongoDB connection
- Resource model
- Report model
- Seed script or seed API
- API route to list resources

### Part 3: Map and Resource Display

- Map integration
- Markers for resources
- Resource cards
- Filters by service/type
- Best resource recommendation

### Part 4: Reporting and Trust Score

- Report form
- Save reports to MongoDB
- Update resource status
- Calculate trust score
- Show last updated time

### Part 5: Demo Polish

- Demo emergency scenario
- Seeded LA outage resources
- Clean landing copy
- Judge-friendly pitch
- Mobile responsive polish
- README/demo script

Each Claude session should complete only one major part unless it is clearly small.

## MVP Demo Scenario

Use this as the main demo:

A power outage happens in Los Angeles.  
A user needs phone charging and Wi-Fi.  
ReliefRoute shows nearby emergency resources and recommends the best open location based on distance, services, trust score, and recent reports.  
The user submits a new report, and the trust/status updates.

## Recommendation Score

Use a simple explainable score:

- 40 percent availability
- 25 percent distance
- 20 percent trust score
- 15 percent service match

Keep the formula simple and visible in code.

## Database Collections

Use these collections:

- `resources`
- `reports`
- `incidents`

Resource fields should include:

- name
- type
- address
- location
- status
- services
- capacity
- trustScore
- lastUpdated
- notes

Report fields should include:

- resourceId
- userId
- statusReported
- servicesAvailable
- crowdLevel
- note
- createdAt

## Environment Variables

Expected env vars:

- `MONGODB_URI`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Never commit real secrets.

Use `.env.local` locally and `.env.example` for shared reference.

## Final Quality Bar

Before saying a task is complete, check:

1. App builds or the exact blocker is documented.
2. No TypeScript obvious errors.
3. No unused major code.
4. UI looks clean.
5. Feature supports the demo.
6. Handoff is updated.