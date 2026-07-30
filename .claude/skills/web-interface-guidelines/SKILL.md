---
name: web-interface-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Vercel's Web Interface Guidelines — 100+ rules
covering accessibility, focus states, forms, animation, typography, layout,
content, and performance.

## How It Works

1. Load the guidelines (see "Guidelines Source" below)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

The full rule set is bundled with this skill at `guidelines.md` (in this
directory). Read that file first — it works offline and contains all rules plus
the output-format instructions.

Optionally, to pick up upstream changes, fetch the latest version with WebFetch:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

If the fetch fails or is unavailable, fall back to the bundled `guidelines.md`.

## Usage

When a user provides a file or pattern argument:
1. Load the guidelines (bundled `guidelines.md`, optionally refreshed from the URL)
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
