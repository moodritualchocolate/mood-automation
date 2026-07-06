# 32 — Moment Metadata

> Every Moment carries a concrete metadata schema — identity, category, mood, layer flags, and asset refs — that lets the system select, personalize, and archive it without ever labeling the person.

## Purpose
Metadata is how MOOD reasons about a Moment without reasoning about the user. It lets the daily selector choose an appropriate `MomentTemplate`, lets the Reflection Generator anchor tone, and lets the Living Library sort and surface Moments. Crucially, metadata describes the *Moment*, never diagnoses the person — categories are content tags, not psychological labels.

## User Experience
Metadata is mostly invisible. The user feels its effects: the right Moment arrives on the right day, the Library groups by emotional chapter, and search in the Library ("רגעים של אומץ" / "moments of courage") works. No metadata is ever shown as a verdict about the user. At most, a soft category name appears as a Library section header.

## Game Mechanic
The daily selector matches `MomentTemplate` metadata against soft `HumanMap` signals (see Ch. 22) to pick each day's `DailyMoment`, with anti-repetition and readiness gating. Metadata is authored on the template and copied (with resolved fields) onto the `DailyMoment`.

Concrete schema:

```ts
type MomentTemplate = {
  id: string;                 // "mt_courage_small_01"
  titleHe: string;            // "רגע קטן של אומץ"
  category: MomentCategory;   // see Ch. 33
  moodTone: 'tender'|'brave'|'still'|'playful'|'aching'|'warm';
  intensity: number;          // 0–1 soft, emotional weight
  themes: string[];           // ["courage","connection"]
  layers: {
    recognition: boolean; invitation: boolean; challenge: boolean;
    journal: boolean; memory: boolean; socialShare: boolean;
  };
  assetId: string;            // Grok Moment asset ref, no text
  readiness: number;          // 0–1 challenge-readiness gate
  rarity: 'common'|'rare';    // rare → RareMoment eligible
  reflectionSeed: string;     // non-user-facing prompt anchor (Hebrew)
  createdAt: string;          // ISO 8601
};

type DailyMoment = {
  id: string; userId: string; date: string; // ISO
  templateId: string;
  reflection: Reflection;     // resolved Hebrew copy
  state: 'unseen'|'seen'|'challenge_chosen'|'lived'|'journaled';
  chosenLevel?: ChallengeLevel;
};
```

## Screens Needed
- Today / Daily Moment (consumes metadata for selection)
- Living Library (groups by `category` / `themes`)
- Moment Detail

## Visual Assets Needed
- Moment assets (referenced by `assetId`)
No text in images; metadata never becomes baked image text.

## AI Logic
Reflection Generator (Claude) reads `moodTone`, `themes`, `reflectionSeed`, plus Human Map signals, to write Hebrew copy. Selection uses heuristics over metadata + soft signals — never hard labels. All generated copy passes Tone Guardrails and the Copy Linter.

## Data Stored
`MomentTemplate` and `DailyMoment` as above. Signals stay soft floats (0–1) with confidence + decay. Copy fields Hebrew; timestamps ISO 8601. Local-first source of truth; Supabase optional sync.

## Edge Cases
- Missing `assetId`: fall back to neutral warm texture.
- No eligible template (all recently seen): relax anti-repetition before repeating exactly.
- `readiness` above user signal: still deliverable as a core-only Moment without Challenge.
- Offline: selection runs on locally cached templates.
- RTL: `titleHe` and `reflection` render right-to-left.

## Build Requirements
Local template store (bundled + synced). `selectDailyMoment(user, date)` heuristic function. Zod schema validation on templates. Effort: medium.

## Definition of Done
- [ ] `MomentTemplate` and `DailyMoment` schemas implemented and validated.
- [ ] Selector chooses templates from metadata + soft signals, with anti-repetition.
- [ ] Category/themes drive Library grouping.
- [ ] No metadata field is ever surfaced as a user diagnosis.
- [ ] Hebrew fields render RTL in light and dark.
