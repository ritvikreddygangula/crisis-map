---
name: mongodb
description: Use for MongoDB Atlas, Mongoose models, API routes, seed data, resources, reports, and trust score updates.
---

# MongoDB Skill

Use MongoDB simply.

Expected collections:

- resources
- reports
- incidents

Rules:

1. Use one reusable DB connection helper.
2. Never hardcode secrets.
3. Use `MONGODB_URI`.
4. Keep models simple.
5. Add timestamps where useful.
6. Validate required fields.
7. Return clear API errors.

Resource model should support:

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

Report model should support:

- resourceId
- userId
- statusReported
- servicesAvailable
- crowdLevel
- note
- createdAt

For hackathon, prioritize working APIs over perfect schema design.