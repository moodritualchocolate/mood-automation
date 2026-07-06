# 126 — Phase 5 — Social Ripple

> Phase 5 adds anonymous belonging — a quiet sense that others chose courage today too — with no likes, no profiles, and no comparison.

## Purpose
MOOD is not social media (Ch. 02). Phase 5 delivers the one social feeling the product does want: belonging without exposure. The user should sense they are part of a quiet human tide — never watched, never ranked. This phase adds the Ripple / Shared Humanity layer and the optional cloud sync needed to count it, while keeping local-first ownership intact.

## User Experience
After choosing a Challenge or journaling, the user sees a soft Shared Humanity note. Example: "8,412 אנשים בחרו היום מעשה קטן של אומץ" ("8,412 people also chose a small act of courage today"). There are no names, faces, likes, follower counts, or feeds. It is a single warm sentence of company, then it fades. Nothing can be posted, judged, or replied to.

## Game Mechanic
**Scope IN:** anonymous aggregate `RippleStat`s (counts only), Shared Humanity screen/surface, and optional Supabase sync that contributes anonymized attempt counts. Optional accounts appear here **only** to enable multi-device sync — never required.
**Scope OUT:** any profile, like, comment, follow, or comparison (permanently out — see Ch. 02); RareMoments and long Chapters (Phase 6). This phase **implements** core-loop step 10 (Ripple / Shared Humanity) and turns on the optional Supabase layer noted in prior chapters.
**Entry criteria:** Phase 4 exit met; anonymized aggregation + privacy design reviewed.
**Exit criteria:** Ripple shows accurate anonymous counts with no identifying data; app still fully works offline and account-free; privacy review passed.
**Demo goal:** two devices independently choose courage and both see the shared count rise — with no way to see who the other person is.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Settings, Privacy (sync opt-in)

## Visual Assets Needed
- Social/Share assets, Light assets, Texture assets
- Moment assets
Grok-generated, warm, painterly-photographic. NO text baked into images; the Ripple count and share visuals are live RTL layers; shared images carry no personal text.

## AI Logic
Not AI-driven for the count itself — `RippleStat`s are aggregate arithmetic, not generation. AI is unchanged from prior phases (Reflection/Challenge/Pattern). Guardrail: no AI or system output may compare users or imply ranking. Any share copy still passes Tone Guardrails + Copy Linter.

## Data Stored
- `RippleStat` (date, challenge-type, anonymous count)
- Optional `User` account (email/auth) **only** for sync opt-in
- Anonymized attempt contributions (no content, no identity linkage)
Local-first stays source of truth; Supabase (Postgres + Auth + Realtime) is the optional sync layer. Hebrew strings; ISO 8601.

## Edge Cases
- Offline / sync off: Ripple shows a gentle local-only message, loop unaffected.
- Zero/low counts: warm neutral phrasing, never "no one."
- User declines account: everything except cross-device sync still works.
- Privacy: no attempt is ever traceable to a person; counts only.
- Accessibility / long RTL: Ripple sentence readable, never clipped.
- Data deletion request: local wipe + sync purge honored (see Ch. Privacy).

## Build Requirements
Adds `RippleService`, anonymized aggregation, optional Supabase Auth + sync, and Shared Humanity UI to the Phase 4 base. Realtime count updates via Supabase Realtime, degrading gracefully offline. Next.js 14, TypeScript, Tailwind, RTL, PWA, local-first. Effort: medium.

## Definition of Done
- [ ] Shared Humanity shows accurate anonymous counts, no identities.
- [ ] No likes, profiles, feeds, follows, or comparison exist anywhere.
- [ ] Optional account enables sync only; app fully works account-free and offline.
- [ ] Privacy review passed; attempts are untraceable to individuals.
- [ ] Hebrew RTL correct; Copy Linter passes; no ranking language.
