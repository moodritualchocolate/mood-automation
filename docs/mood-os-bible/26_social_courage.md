# 26 — Social Courage

> A soft read of how ready a person feels to reach toward other people — used to size social challenges kindly, never to label someone "shy" or "introverted."

## Purpose
Social Courage is the Human Map (Ch. 22) signal for a user's current readiness to connect with others — to speak, to be seen, to reach out. It exists so MOOD can offer social challenges at a size that feels brave-but-possible. It is a *state*, not a *type*: MOOD never says "you are introverted" or "you are anti-social." It only senses today's readiness.

## User Experience
The user experiences Social Courage as well-fitted invitations. On a low-courage day, a Moment might invite the smallest step: "אולי רק חיוך לאדם אחד היום." ("Maybe just a smile to one person today.") On a higher-courage day: "אולי שיחה קטנה עם מישהו לא מוכר." ("Maybe a small conversation with someone new.") Success is always the attempt: "ניסית — זה נחשב." ("You tried — that counts.") The user never sees a "social score" and is never compared to anyone.

## Game Mechanic
- Social courage `Trait`: `{ family: "socialCourage", kind, signal: 0–1, confidence, decayRate, evidence[] }`.
- Drives the social axis of Challenge levels: low signal → tiny Easy steps; higher → Medium/Brave social reaches.
- Reinforced by attempted social challenges (attempt, not outcome) and journal notes of connection; eases up gently, bounded nudges.
- Time-sensitive: paired with Energy Patterns (Ch. 27) so a tired day lowers the offered social size.
- Decays toward neutral; a hard week doesn't permanently mark the user.

## Screens Needed
- Challenge Selection (social level sizing)
- Today / Daily Moment (invitation)
- Evening Check-in (how the social attempt felt)
- Shared Humanity (anonymous belonging: "8,412 אנשים גם בחרו מעשה קטן של אומץ היום")

## Visual Assets Needed
- People assets rendering warm, non-staged human connection (textless, no faces implying judgment).
- Moment and Light assets for approachable, open moods.

## AI Logic
Challenge Generator (Claude) reads social courage to size the social step; Reflection Generator affirms attempts. Guardrails: never label as introvert/extrovert/shy/anxious; never imply a "normal" amount of socializing; never compare to others. Copy Linter blocks type language and comparison. Confidence-weighted so uncertain reads yield only the gentlest social nudge.

## Data Stored
- Social courage `Trait[]` on the `HumanMap`.
- `evidence[]` referencing social `Attempt`/`JournalEntry` ids.
- Local-first; optional Supabase sync.

## Edge Cases
- New user → assume modest courage; offer smallest social steps first.
- Repeated declines of social challenges → down-weight social offers, rotate to non-social Moments; never pressure.
- Skipped days → no penalty (no streaks).
- Offline → local; Shared Humanity stats show last cached anonymous count.
- Never expose a number or a personality type.
- RTL long-text; People assets must respect diverse representation.

## Build Requirements
- Social axis in Challenge Generator level sizing, combined with energy state.
- Reinforcement hooks on social attempt/journal saves.
- Shared Humanity anonymous counter integration (RippleStat) — no profiles, no likes.
- Effort: ~2–3 dev days.

## Definition of Done
- [ ] Social readiness stored as a soft 0–1 state signal with confidence + decay.
- [ ] Social challenge size scales from the signal (and energy).
- [ ] No personality types, labels, or social comparisons appear.
- [ ] Attempts count as success regardless of outcome.
- [ ] Declines rotate content gently with no penalty.
