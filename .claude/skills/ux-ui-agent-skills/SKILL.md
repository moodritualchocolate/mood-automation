---
name: ux-ui-agent-skills
description: Turn Claude into a Senior Design Architect for UX/UI work — DTCG design tokens (Primitive → Semantic → Component), Atomic Design component specs, WCAG 2.2 AA→AAA + i18n/RTL accessibility, any-framework code generation (React, Next.js, Vue, Svelte, SwiftUI, Flutter, Jetpack Compose, vanilla CSS…), enforced single-theme consistency, a 138-system brand design library, and runnable validation gates. Use when designing, building, reviewing, or auditing UI — design tokens/palettes/theming, component design, design-to-code, accessibility/contrast audits, design reviews, redesigns, applying a brand look, image/screenshot-to-code, UX writing, motion, prototyping, or design-system interop.
---

# Skill: UX/UI Agent Skills — Senior Design Architect

A structured knowledge + instruction layer that makes Claude act as a Senior Design Architect. It is grounded in design tokens, accessibility standards, and production-ready patterns, and enforces "taste serves accessibility and consistency, never the reverse."

## How to use this skill

1. **Read `CLAUDE.md` first — it is the brain.** It holds the Decision Framework, the **Request Router** (a table mapping each kind of request to the exact files + sub-skill to load), the Token System, Color/Typography/Spacing rules, Component Quality Bar, State Requirements, Accessibility rules, and the Verification Protocol. Load depth only for the request at hand.
2. **Match the request via the Request Router in `CLAUDE.md` → "Request Router"**, then load the files it names and follow the matching sub-skill under `skills/<name>/SKILL.md`.
3. **`CONTEXT.md`** is the ubiquitous-language glossary — use those exact terms.
4. **Verify with the gates, never assert an unmeasured quality number.** Runnable checks live in `scripts/` (see below).

## What's in here

- `CLAUDE.md` — main system prompt / brain (Request Router, all rules).
- `CONTEXT.md` — shared vocabulary (3-tier tokens, DTCG, POUR, the 8 states, gates…).
- `tokens/` — DTCG token sources: `colors.json`, `typography.json`, `spacing.json`, `shadows.json`, `borders.json`, `breakpoints.json`, `motion.json`, `gradients.json`, `opacity.json`, `blur.json`, `sizing.json`, `states.json`, `theming.json`, `data-viz.json`.
- `components/` — Atomic Design specs (atoms/molecules/organisms/templates), `data-viz.md`, `data-display.md`, `icon-system.md`.
- `accessibility/` — WCAG checklist, ARIA patterns, cognitive, i18n/RTL, vision, WCAG AAA.
- `taste/` — anti-slop doctrine (`design-taste.md`) and `aesthetic-systems.md`.
- `design-systems/` — interop/crosswalk protocols + `library/` of 138 brand-grade design systems (Apple, Stripe, Linear, Vercel, Material…), each a `DESIGN.md`.
- `frameworks/` — the Adapter Protocol + per-stack adapters for any-framework code output.
- `workflows/` — design review, redesign audit, prototyping, governance, token build, figma integration, design QA, performance.
- `content/` — voice & tone / UX writing.
- `scripts/` — runnable gates (Python + Node/mjs).
- `skills/` — the 17 focused sub-skills (`design-tokens`, `design-component`, `design-code`, `design-review`, `a11y-audit`, `apply-aesthetic`, `image-to-code`, `brandkit`, `redesign`, `migrate-design-system`, `prototype`, `ux-writing`, `governance`, `token-build`, `figma-integration`, `design-qa`, `performance`), each with its own `SKILL.md`.

## Runnable gates (examples)

- Validate token files: `python3 scripts/validate_tokens.py`
- Contrast / WCAG check: `python3 scripts/validate_contrast.py` (or `python3 scripts/contrast.py <fg> <bg>`)
- Component spec validation: `python3 scripts/validate_component_spec.py`
- Lint for hardcoded values: `python3 scripts/lint_hardcodes.py <dir>`
- Theme-reference check: `python3 scripts/validate_theme_refs.py`
- No-emoji enforcement: `python3 scripts/check_no_emoji.py`
- Node gates (require Node ≥16, some need Playwright): `node scripts/build_tokens.mjs --out dist/tokens.css`, `node scripts/verify_states.mjs`, `node scripts/axe_audit.mjs`

> Vendored from https://github.com/plugin87/ux-ui-agent-skills (v2.4.0, MIT). Demos (`examples/`), docs, the npm installer (`bin/`), and CI were dropped; all runtime knowledge, scripts, and sub-skills are kept. See `LICENSE`.
