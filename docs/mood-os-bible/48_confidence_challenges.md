# 48 — Confidence Challenges

> Confidence challenges invite the user to take up a little more space in the world — to voice, show, or ask for something they usually hold back.

## Purpose
Confidence is built by evidence, not affirmations. This theme family gives a person small, repeatable proofs that their voice and presence are allowed. It targets the quiet self-shrinking many people do — swallowing an opinion, hiding a want, deflecting a compliment — and turns it into livable practice. This chapter defines the Confidence theme family and its Easy/Medium/Brave ladder (Ch. 42).

## User Experience
When the Human Map signals self-doubt or low self-assertion as a growth area, the Daily Moment may offer a Confidence challenge. Example ladder:
- **Easy** — "קבל מחמאה בלי להקטין אותה" ("accept a compliment without shrinking it").
- **Medium** — "שתף דעה אמיתית שלך בשיחה" ("share a real opinion of yours in a conversation").
- **Brave** — "בקש בבירור משהו שאתה צריך" ("clearly ask for something you need").
The user chooses, lives it, and journals the attempt. Voicing an opinion that no one agrees with is a full success — the courage was in the voicing.

## Game Mechanic
A Confidence `Challenge` carries three `ChallengeLevel` entries scaling self-exposure. Success is defined by the act of expression or asking, never by whether the request was granted or the opinion accepted. `Attempt` honored identically at all levels; no outcome is failure. Repeated Confidence attempts gently raise the soft readiness signal over time (Pattern Engine, Ch. 09 domain), never a visible score.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- People assets (open, grounded posture — no faces required)
- Light assets (warm, steadying)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the three Hebrew levels from the Moment theme and self-assertion signal. Guardrails (Ch. 52): the ask must be reasonable, consensual, non-aggressive, age-appropriate, and outcome-agnostic. Copy Linter blocks "should" and any framing where being refused equals failure. Never diagnose low self-esteem.

## Data Stored
`Challenge { theme: "confidence", levels }`, `ChallengeLevel { copyHe, socialExposure, safetyFlags }`, `Attempt`. Soft `Trait` for self-assertion (0–1 + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Request refused: reframed as brave asking, never failure (Ch. 53).
- User conflates confidence with aggression: copy models firm-and-kind, never demanding.
- Anxiety spike: skip and safe fallback available (Ch. 52).
- Offline: levels cached with the DailyMoment.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Confidence theme profile in the generator; reuse level selector and Attempt flow. Small effort.

## Definition of Done
- [ ] Ladder present: accept a compliment → share an opinion → ask for a need.
- [ ] Success = expressing/asking, never being agreed with or granted.
- [ ] Copy models firm-and-kind, never aggressive or entitled.
- [ ] Refusal is honored, never counted as failure.
- [ ] Hebrew RTL renders in light and dark.
