# 45 — Brave Challenges

> The Brave level is an honest step toward a real growth edge — the most courage the default engine ever asks, and always fully safe.

## Purpose
Brave challenges are the top rung of the standard ladder: the point where a person deliberately moves toward the thing that matters and scares them a little. Brave exists to make genuine growth possible without ever tipping into risk. It is a stretch, never a cliff (Ch. 42) and never a dare (Ch. 52). This chapter defines the design constraints of the Brave `ChallengeLevel`. Anything beyond Brave is Impossible (Ch. 46) — opt-in, aspirational, never assigned.

## User Experience
On Challenge Selection, Brave reads as "this is the real one." It names the honest edge of the theme with warmth and belief in the user. Example (social confidence ladder): Brave = "גש למישהו שסקרן אותך והתחל שיחה אמיתית" ("approach someone you're curious about and begin a real conversation"). Example (boundary ladder): Brave = "אמור 'לא' למשהו שתמיד הסכמת לו" ("say 'no' to something you always agreed to"). The user feels real nerves, chooses freely, lives it, and returns to a Journal that celebrates the courage of trying — completely independent of how it turned out.

## Game Mechanic
Brave is one of three `ChallengeLevel` entries. Generator constraints: `socialExposure 0.6–0.9`, meaningful vulnerability, but must remain safe, legal, reversible, and within the user's control to initiate. Critically, "lived" is recorded on the *attempt*: approaching someone who then walks away is a fully successful Brave attempt. There is no failure state and no extra reward for choosing Brave over Easy — `Attempt.chosenLevel = brave` is honored identically.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Masterpiece assets or Moment assets (emotionally resonant artwork)
- Light assets (warm, believing tone)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the Brave string as the honest edge of the theme, gated hard by Ch. 52 safety rules: no self-harm, no harassment, no risky physical dares, no illegality, age-appropriate. Copy Linter blocks pressure/shame words. Never diagnose; treat readiness as soft, decaying signal and keep Brave crossable from Medium.

## Data Stored
`ChallengeLevel { level: "brave", copyHe, socialExposure, safetyFlags }` on the parent `Challenge`. Chosen level on `Attempt`. Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Chose Brave but couldn't do it: honored as "didn't try", framed with warmth, zero penalty (Ch. 53).
- Safety flag raised on a generated Brave act: suppressed and regenerated; safe fallback shown.
- Offline: Brave string cached with the DailyMoment.
- Long RTL copy: keep to one clear act; test wrapping.
- Accessibility: readable large; distinguishable without color.

## Build Requirements
Reuse the level selector; generator constraint profile for Brave with hard safety gate; cached payload. Small-to-medium effort.

## Definition of Done
- [ ] Brave is a genuine growth-edge stretch, never unsafe or illegal.
- [ ] Every Brave act passes the Ch. 52 safety gate before display.
- [ ] Success recorded on attempt, independent of outcome.
- [ ] No extra reward vs. Easy/Medium; trying honored equally.
- [ ] Hebrew RTL renders in light and dark.
