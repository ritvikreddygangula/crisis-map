# ReliefRoute Build Plan

## Product

ReliefRoute is a real-time emergency resource heatmap for finding shelters, water, power, Wi-Fi, clinics, and cooling centers during emergencies.

## Winning Angle

This fits Arista's "Connect the Dots" track because the app connects people to emergency resources and routes useful live data to solve a daily-life problem.

## MVP

The MVP should show a simulated power outage in Los Angeles.

A user selects:

- Emergency: Power outage
- Need: Power and Wi-Fi

The app shows:

- Map markers
- Resource cards
- Best recommended resource
- Trust score
- Status updates from community reports

## Major Parts

### Part 1: Setup and UI Shell

Owner: Person 1  
Agent: senior-architect, then junior-frontend-dev

Deliverables:

- Next.js project
- Tailwind configured
- Landing page
- Basic app shell
- Static demo data
- Initial README

### Part 2: MongoDB Backend

Owner: Person 2  
Agent: senior-architect, then junior-backend-dev

Deliverables:

- MongoDB connection
- Mongoose models
- Resource API
- Report API
- Seed data

### Part 3: Map and Filters

Owner: Person 3  
Agent: junior-frontend-dev

Deliverables:

- Map view
- Resource markers
- Filter panel
- Resource cards
- Best recommendation card

### Part 4: Reports and Trust Score

Owner: Person 4  
Agent: junior-backend-dev, debugger

Deliverables:

- Report form
- Save report
- Recalculate resource status
- Recalculate trust score
- Show recent updates

### Part 5: Demo Polish

Owner: Person 5  
Agent: hackathon-judge, qa-reviewer

Deliverables:

- Demo scenario
- Better UI copy
- Clean README
- Final test pass
- Pitch script
- Devpost text