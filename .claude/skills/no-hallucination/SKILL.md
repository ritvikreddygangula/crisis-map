---
name: no-hallucination
description: Use whenever answering questions about the codebase, modifying code, debugging, or planning. Prevents assumptions by requiring file inspection first.
---

# No Hallucination Skill

Before making claims about the project:

1. Inspect the file tree.
2. Read relevant files.
3. Search for names before assuming they exist.
4. State what was actually found.
5. Separate facts from assumptions.

Never invent:

- File names
- Components
- Routes
- API endpoints
- Database schemas
- Package names
- Environment variables

Use this response pattern:

## Checked

List files inspected.

## Found

State what exists.

## Assumption

Only include assumptions if needed.

## Next Step

Say the safest next action.