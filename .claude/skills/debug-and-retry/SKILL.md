---
name: debug-and-retry
description: Use when any command, build, lint, runtime, API, database, dependency, or UI behavior fails. Tries focused fixes before escalating.
---

# Debug and Retry Skill

When an error happens, do not stop immediately.

Follow this loop:

## Step 1: Capture Error

Record:

- Command run
- Error message
- File/line if available

## Step 2: Inspect

Read the file causing the error.

## Step 3: Fix

Apply the smallest likely fix.

## Step 4: Retry

Run the failing command again if possible.

## Step 5: Repeat

Try up to 3 focused attempts.

## Step 6: Escalate

If still failing, write:

- What failed
- What was tried
- Most likely remaining cause
- Exact next action

Never randomly rewrite large files.