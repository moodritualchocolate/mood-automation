# 100 — Accessibility

> MOOD must feel gentle for every body and mind: full RTL, dynamic type, strong contrast, screen-reader clarity, reduced motion, and generous tap targets.

## Purpose
Accessibility is a first-class product requirement, not a compliance afterthought (it governs every screen, Ch. 88–99). MOOD's promise — *someone noticed something about my life* — must reach users with low vision, motor differences, cognitive load, vestibular sensitivity, and Hebrew RTL as their native reading direction. This chapter fixes the standards every other screen is tested against.

## User Experience
The user can make text larger without breaking layouts, choose higher contrast, turn off motion, and navigate entirely by screen reader — all in Hebrew RTL. Everything reads right-to-left correctly, including numerals and mixed Latin. Buttons like "רוצה אתגר?" ("want a challenge?") are announced clearly with role and state. Reduced motion replaces slides/parallax/ambient video with calm fades. Nothing depends on color alone; nothing is timed so tightly it can't be read. The feeling target: *this was made for me too.*

## Game Mechanic
Not a play mechanic — a set of enforced constraints across all screens. Standards: WCAG 2.2 AA minimum. Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text/icons, verified over artwork (scrim/overlay guaranteed). Tap targets ≥ 44×44px with ≥ 8px spacing. Dynamic type scales to 200% without clipping (text layers reflow, art crops safely). Reduced-motion honors OS + in-app toggle (Ch. 98). Full VoiceOver/TalkBack support with correct RTL reading order and focus management.

## Screens Needed
- Accessibility (this settings sub-screen)
- Settings
- Applies to all screens Ch. 88–99

## Visual Assets Needed
- No new artwork. Requires guaranteed text-over-image scrims on Moment/Masterpiece assets so live RTL text stays legible in light and dark. No baked text (a11y depends on live text).

## AI Logic
Not AI-driven — accessibility is deterministic. Constraint: AI-generated Hebrew copy (Ch. 06) must stay within readable length/complexity budgets the Copy Linter can flag, so dynamic type and screen readers handle it gracefully.

## Data Stored
- `UserSetting`: textScale, contrastMode, reducedMotion, screenReaderHints (Ch. 98).
- Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- RTL with embedded Latin/numerals: correct bidi handling, no reversed digits.
- 200% text over artwork: reflow text layer, never clip; art crops, not the words.
- Screen reader on a Moment: announce title → Reflection → challenge in reading order.
- Reduced motion: fades only; disable ambient Splash video (Ch. 88) and parallax.
- Color-blind users: never encode meaning (rare, tried/not-tried) in color alone — add label/shape.
- Offline: all a11y settings apply locally, no network dependency.
- Long-press/gesture-only actions: always have a visible, labeled alternative.

## Build Requirements
- Tailwind RTL utilities, `dir="rtl"`, logical CSS properties; `prefers-reduced-motion` + in-app toggle.
- Semantic HTML, ARIA roles/labels in Hebrew, focus traps for sheets, skip-to-content.
- Automated a11y tests (axe) in CI + manual VoiceOver/TalkBack passes; contrast tokens for light/dark.
- Effort: L (cross-cutting).

## Definition of Done
- [ ] Full RTL correctness including bidi numerals across all screens.
- [ ] Dynamic type to 200% with no clipping; text reflows over art.
- [ ] Contrast meets WCAG 2.2 AA over artwork in light and dark.
- [ ] Screen readers announce every screen in correct RTL reading order.
- [ ] Reduced motion replaces all slides/parallax/video with fades.
- [ ] All tap targets ≥ 44×44px; no meaning by color alone.
