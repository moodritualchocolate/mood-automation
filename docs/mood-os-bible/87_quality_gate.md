# 87 — Quality Gate

> The mandatory pass/fail checkpoint every generated image and keyframe must clear before it can become an `Asset`.

## Purpose
The Quality Gate is the pipeline's conscience (stage 3 of Ch. 77). It exists so that no image reaches a user unless it is provably text-free, text-ready, on-style, safe, and correctly formatted. It converts MOOD's visual rules from aspiration into an enforced boundary — especially the absolute rule that no text, and never Hebrew, is ever baked into a picture.

## User Experience
Invisible to the user, but it is why the user can trust every image: none ever shows stray words, none ever leaves the live Hebrew title with nowhere to sit, none ever feels off-brand or unsafe. The user simply never meets a broken or wrong picture.

## Game Mechanic
Every candidate from Grok runs the checklist below. **All checks must pass** or the candidate is rejected and regenerated (with an adjusted brief) up to a retry cap, then flagged for human review. Checks combine automated detectors (OCR, luminance/contrast analysis on the safe zone, aspect/resolution math, a style-embedding similarity score, a safety classifier) with a lightweight human spot-check on Masterpiece and People tiers.

### Quality Gate Checklist
- [ ] **No text present** — OCR across the full frame (and every video keyframe) finds zero letters, words, numerals, or Hebrew; no watermark, logo, signage, or UI.
- [ ] **Negative space present** — the briefed safe zone exists, is ≥ the category minimum (30–35% depending on category), and measures low-detail + low-contrast enough for legible RTL text in both light and dark.
- [ ] **On-style** — matches the Volume 07 language (timeless, painterly-photographic, warm light, muted palette, human intimacy) at or above the style-similarity threshold; Masterpiece uses a stricter threshold.
- [ ] **Safe content** — no identifiable real people, no minors in sensitive contexts, no explicit content, no gore, no brand marks; People assets pass a stricter safety + anonymity pass.
- [ ] **Correct aspect & resolution** — exact target aspect ratio(s), master resolution ≥ category minimum, correct format and sRGB color profile; video sets are seamless with a motionless text zone.

## Screens Needed
- Internal review/QA tooling (not user-facing)
- Settings (asset debug, internal only)

## Visual Assets Needed
Applies to all nine categories (Ch. 78–86); the Gate produces no assets itself.

## AI Logic
Not a reflection/challenge/pattern engine. Uses OCR, image-analysis, a style-embedding model, and a safety classifier as deterministic guardrails — analogous to the Copy Linter for text (Ch. 06). It never generates; it only judges. Human spot-check backstops the automated pass on sensitive tiers.

## Data Stored
- `Asset.qualityGateStatus` (pass|rejected|needs_review), per-check results, detector versions, reviewerId (if human), timestamp ISO 8601. Rejected candidates retained briefly for audit, then purged. Stored with the `Asset` record; masters in Supabase Storage.

## Edge Cases
- OCR false positive on painterly marks → human confirm before final reject.
- Borderline safe zone → require regeneration, never ship marginal.
- Any Hebrew detected → hard, non-overridable reject.
- Detector/model version bump → re-audit affected assets.
- Offline → generation queues; the Gate never runs client-side on the fly.

## Build Requirements
Gate service orchestrating OCR, safe-zone luminance/contrast analysis, aspect/resolution validator, style-embedding scorer, safety classifier; retry/queue integration; human-review queue for Masterpiece/People. Effort: L.

## Definition of Done
- [ ] Every image and keyframe passes all five checks before becoming an `Asset`.
- [ ] Zero text (and zero Hebrew) can reach production; Hebrew triggers a hard reject.
- [ ] Safe-zone presence and legibility verified in light and dark.
- [ ] Style, safety, aspect, resolution, and format all validated.
- [ ] Rejections regenerate or escalate; nothing marginal ships.
