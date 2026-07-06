# 36 — Invitation Layer

> The Invitation layer is a soft, pressure-free nudge that opens a door from noticing into doing — always optional, never a command.

## Purpose
Between being seen (Recognition) and acting (Challenge), some Moments offer a gentle invitation: a small suggestion to sit with a feeling, notice something today, or consider one tiny shift. The Invitation lowers the step to the Challenge without ever demanding it. It exists so a Moment can encourage motion while keeping the user fully free to just receive and close.

## User Experience
After the Reflection, a quiet line appears, framed as permission rather than instruction: "אם בא לך, שים לב היום לרגע אחד שבו מישהו היה עדין איתך" ("if you feel like it, notice one moment today when someone was gentle with you"). There is no button that says "do this," no timer, no reward for accepting. The user can read it and move on. The tone is always "אם בא לך" ("if you feel like it") — an offer between friends.

## Game Mechanic
The Invitation renders in slot 5 of the Moment structure (Ch. 31), only when `MomentTemplate.layers.invitation` is true. States: `offered` (default) and, if the user taps to keep it, `accepted` (a soft bookmark, not a commitment). Accepting an Invitation may pre-warm the Challenge layer but never forces it. No penalty for ignoring; ignoring is the silent default.

## Screens Needed
- Today / Daily Moment
- Moment Detail

## Visual Assets Needed
- Light assets, Texture assets (a softer band distinguishing invitation from Reflection)
- Moment assets
No text baked into images; the invitation is a live RTL text layer.

## AI Logic
The invitation copy is produced by the **Reflection Generator** (Claude) as a gentle, optional extension of the Reflection, or authored on the template. Guardrails: phrase as permission, never obligation; forbid "should," "must," "need to." Passes Tone Guardrails and the Copy Linter. Never diagnose, never imply the user is lacking.

## Data Stored
- `DailyMoment.layerState.invitation`: `{ copyHe, state: 'offered'|'accepted', acceptedAt? }`
Copy Hebrew; timestamps ISO 8601. Local-first; Supabase optional sync.

## Edge Cases
- Ignored invitation: default, no follow-up nag, no penalty.
- Invitation without a Challenge: valid — some Moments invite reflection only.
- Offline: renders from resolved local state; accept toggles locally.
- Long RTL text: scrolls without clipping.
- Accessibility: "accept" is a clearly labeled, optional control, not the primary action.

## Build Requirements
`InvitationLayer` component gated on the layer flag, with an optional soft-accept toggle wired to Zustand. Reuses Reflection Generator output path. Effort: low.

## Definition of Done
- [ ] Invitation renders only when the template flag is set.
- [ ] Copy is framed as permission, never command.
- [ ] Ignoring produces no penalty or nag.
- [ ] Accept is a soft bookmark that never forces a Challenge.
- [ ] Hebrew invitation renders RTL in light and dark.
