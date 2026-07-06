# 18 — Year Review

> The grand, once-a-year chapter that gathers a whole year of Moments into a single moving story of who the user became.

## Purpose
The Year Review is the highest-order **station 9 (Pattern Engine)** output and the emotional summit of MOOD. It gathers twelve Monthly Chapters (Ch. 17) into one cinematic, deeply personal narrative of the user's year — a keepsake that proves the daily ritual added up to a life. It closes the largest loop: many small Moments, one big story.

## User Experience
Once a year, the user is gently invited (on **Patterns**, opening from **Living Library**) into a slow, cinematic **Year Review**: a sequence of **Masterpiece assets** and **Video keyframes**, chapter by chapter, narrated in warm Hebrew — "השנה שבה למדת לבקש עזרה" ("the year you learned to ask for help"). It surfaces courage history (Brave attempts tried), the year's Rare Moments, recurring themes, and the user's own journal words replayed. It is celebratory but never a scoreboard: "אספת 214 רגעים קטנים" ("you gathered 214 small moments") — accumulation, never a grade. It is optionally shareable via a text-free **Social/Share asset**.

## Game Mechanic
- **Window:** calendar year (user's locale).
- **States:** `accumulating → composed → invited → viewed → (optionally) shared`.
- **Trigger:** composed at year end if the user has any `LibraryItem`s; presented as an invitation, never forced.
- **Inputs:** the year's monthly `Chapter`s, `Pattern`s, `RareMoment`s, courage history (`Attempt` brave+tried), standout `JournalEntry`s.
- **Outputs:** a `Chapter` (scope='year') with a multi-scene narrative, curated Moments, and share asset.

## Screens Needed
- Patterns
- Living Library
- Moment Detail
- Shared Humanity (belonging framing for any shared view)

## Visual Assets Needed
- Masterpiece assets, Video keyframes (cinematic scenes), Moment assets (highlights), Social/Share assets (text-free), Light/Texture assets. Absolutely no text baked into any image or share asset; all narrative is a live RTL text layer.

## AI Logic
- **Pattern Recognition** (Claude + heuristics) derives the year's throughline from monthly themes; **Reflection Generator** writes the multi-scene Hebrew narrative; **Memory Engine** assembles the full-year context and selects standout Moments.
- Guardrails: celebratory but non-diagnostic, no labels, no scores framed as judgment; sharing is anonymous belonging, never comparison. Copy Linter enforced across every scene.

## Data Stored
- `Chapter` (id, userId, scope='year', windowStart/End ISO 8601, titleHe, sceneNarrativesHe[], heroAssetRefs[], highlightItemIds[], courageSummary, rareMomentIds[], shareAssetRef?, generatedAt).
Local-first; optional Supabase sync. Share assets in Supabase Storage. Copy Hebrew.

## Edge Cases
- **Partial year / new user:** compose a "first chapter" from whatever exists; never a penalty for a short year.
- **Empty year:** warm invitation to begin, no review forced.
- **Offline:** compose narrative locally from cached chapters; render video keyframes from cache; enrich on sync.
- **Sharing:** share view strips all personal free text by default; only anonymous, chosen elements; text-free imagery.
- **RTL/long multi-scene + accessibility:** each scene readable, reduced-motion alternative to video, alt text, captions for narration.

## Build Requirements
- Year composer (`compose-year.ts`) consuming monthly chapters + courage history.
- `/api/chapter?scope=year`; cinematic player (reduced-motion fallback).
- Text-free Social/Share asset generator; privacy-safe share flow.
- Effort: L.

## Definition of Done
- [ ] A Year Review composes for any user with ≥1 Moment; offered as invitation.
- [ ] Multi-scene Hebrew narrative surfaces themes, courage history, rare moments, and the user's own words.
- [ ] Accumulation shown ("gathered N moments"), never a score/grade.
- [ ] Share assets are text-free and privacy-safe (no free text leaked).
- [ ] Composes offline + enriches on sync; Copy Linter passes.
- [ ] Reduced-motion, captions, RTL, and accessibility verified.
