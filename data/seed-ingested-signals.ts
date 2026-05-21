/**
 * SEED INGESTED SIGNALS (Phase 16)
 *
 * The reality-ingestion layer is fed by real comment text from
 * external sources (TikTok / Reddit / YouTube / IG saves / anonymous
 * confessions). In production those signals arrive via the
 * /api/ingest endpoint.
 *
 * In stub mode this catalog seeds the system with plausible
 * observations — exactly the kind of unguarded language the spec
 * named as the dataset that matters:
 *
 *   "I thought it was just me"
 *   "why is this painfully accurate"
 *   "I didn't realize I do this"
 *   "I'm exhausted but can't stop"
 *   "I rest but never recover"
 *   "I can't mentally land"
 *   "everything feels half-open"
 *   "my brain feels interrupted"
 *
 * Each entry encodes the SOURCE, the RAW TEXT, the emotional_weight
 * (how deeply this signal indicates recognition), and the loose
 * topical_tags. The system reads them at runtime.
 */

import type { IngestedSignal } from '@lib/realityIngestion';

const NOW = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;
const D = (days: number) => NOW - days * ONE_DAY;

export const SEED_INGESTED_SIGNALS: IngestedSignal[] = [
  // ─── PRODUCTIVITY DISCOURSE ───────────────────────────────────
  { id: 's1',  source: 'reddit',    text: 'i rest but i never recover', observed_at: D(45), emotional_weight: 9, topical_tags: ['rest', 'recovery', 'depletion'] },
  { id: 's2',  source: 'tiktok',    text: 'i thought it was just me but everyone i know says they are exhausted in a weird way', observed_at: D(38), emotional_weight: 9, topical_tags: ['depletion', 'collective'] },
  { id: 's3',  source: 'reddit',    text: 'i cant mentally land. i sit on the couch and my brain is still at work', observed_at: D(31), emotional_weight: 9, topical_tags: ['inability-to-land', 'commute', 'work-after-work'] },
  { id: 's4',  source: 'youtube',   text: 'why is this so accurate. i open my laptop after dinner just to close it again', observed_at: D(20), emotional_weight: 8, topical_tags: ['silent-burnout', 'productivity-loop'] },
  { id: 's5',  source: 'tiktok',    text: 'i am tired and im scrolling. i know its making it worse. i wont stop', observed_at: D(18), emotional_weight: 9, topical_tags: ['doomscrolling', 'awareness'] },

  // ─── PARENTING EXHAUSTION ─────────────────────────────────────
  { id: 's6',  source: 'reddit',    text: 'i love my kid. i also need to be alone for one hour. i wont get it.', observed_at: D(50), emotional_weight: 9, topical_tags: ['parenting', 'depletion'] },
  { id: 's7',  source: 'reddit',    text: 'i sit in the car for ten minutes before i open the door at home. nobody knows.', observed_at: D(40), emotional_weight: 10, topical_tags: ['parenting', 'inability-to-land', 'private-pause'] },
  { id: 's8',  source: 'ig-save',   text: 'mom guilt is just exhaustion with a costume', observed_at: D(25), emotional_weight: 8, topical_tags: ['parenting', 'guilt'] },

  // ─── STARTUP BURNOUT ──────────────────────────────────────────
  { id: 's9',  source: 'twitter',   text: 'i didnt realize i do this. i check slack on shabbat just to confirm nothing is broken', observed_at: D(35), emotional_weight: 9, topical_tags: ['silent-burnout', 'shabbat', 'guilt'] },
  { id: 's10', source: 'reddit',    text: 'startup founders dont sleep. we replace sleep with worry that costs less.', observed_at: D(60), emotional_weight: 8, topical_tags: ['silent-burnout', 'sleep'] },

  // ─── PASSIVE OVERSTIMULATION ──────────────────────────────────
  { id: 's11', source: 'tiktok',    text: 'my brain feels interrupted constantly. i cant finish a thought before checking the phone', observed_at: D(15), emotional_weight: 10, topical_tags: ['overstimulation', 'fragmentation', 'unfinished-thoughts'] },
  { id: 's12', source: 'reddit',    text: 'everything feels half-open. tabs, conversations, projects, all of it', observed_at: D(28), emotional_weight: 10, topical_tags: ['fragmentation', 'private-language'] },
  { id: 's13', source: 'anonymous-confessions', text: 'i open the fridge when im not hungry. im looking for something i dont have words for', observed_at: D(10), emotional_weight: 10, topical_tags: ['restlessness', 'fridge-without-hunger', 'private-language'] },

  // ─── MODERN LONELINESS ────────────────────────────────────────
  { id: 's14', source: 'reddit',    text: 'i have hundreds of friends online and none of them know that today was hard', observed_at: D(48), emotional_weight: 9, topical_tags: ['loneliness-while-connected', 'overconnected'] },
  { id: 's15', source: 'youtube',   text: 'im in a room full of people and im quietly somewhere else', observed_at: D(22), emotional_weight: 8, topical_tags: ['loneliness-in-public', 'numbness'] },

  // ─── INABILITY TO LAND ────────────────────────────────────────
  { id: 's16', source: 'twitter',   text: 'i kept the engine running for nine minutes in my driveway. i didnt want to go inside yet', observed_at: D(8), emotional_weight: 10, topical_tags: ['inability-to-land', 'car-after-work'] },
  { id: 's17', source: 'reddit',    text: 'i go home and im still at work. i am at work all the way to bed', observed_at: D(42), emotional_weight: 9, topical_tags: ['working-or-cannot-stop', 'silent-burnout'] },

  // ─── DEEP RECOGNITION COMMENT PATTERNS ────────────────────────
  // (These are the spec's named markers — meta-critic reads them to
  //  confirm a banner's truth was DISCOVERED, not invented.)
  { id: 's18', source: 'tiktok',    text: 'how did they know. this is literally my life.', observed_at: D(12), emotional_weight: 10, topical_tags: ['recognition-marker', 'literally-me'] },
  { id: 's19', source: 'ig-share',  text: 'i didnt realize i do this. saving this.', observed_at: D(9), emotional_weight: 10, topical_tags: ['recognition-marker', 'didnt-realize'] },
  { id: 's20', source: 'reddit',    text: 'why is this painfully accurate. i thought i was the only one.', observed_at: D(33), emotional_weight: 10, topical_tags: ['recognition-marker', 'thought-i-was-the-only-one'] },

  // ─── SHABBAT / ISRAELI-SPECIFIC ─────────────────────────────
  { id: 's21', source: 'twitter',   text: 'בשבת אני יושב על הספה ולא מצליח לנוח. הראש עוד עובד', observed_at: D(36), emotional_weight: 9, topical_tags: ['shabbat', 'inability-to-land', 'hebrew'] },
  { id: 's22', source: 'reddit',    text: 'אחרי המילואים אני בבית אבל עוד לא חזרתי. הגוף כן, השאר לא', observed_at: D(70), emotional_weight: 10, topical_tags: ['reserves', 'inability-to-land', 'hebrew'] },

  // ─── COLLECTIVE / GENERATIONAL DRIFT MARKERS ─────────────────
  { id: 's23', source: 'reddit',    text: 'optimization used to feel productive. now it feels like another job', observed_at: D(55), emotional_weight: 9, topical_tags: ['optimization-fatigue', 'drift'] },
  { id: 's24', source: 'youtube',   text: 'we used to talk about ambition. now we talk about not being able to stop', observed_at: D(80), emotional_weight: 8, topical_tags: ['ambition-to-pressure', 'drift'] },
  { id: 's25', source: 'tiktok',    text: 'connection used to feel like presence. now it feels like a performance', observed_at: D(90), emotional_weight: 9, topical_tags: ['connection-to-performance', 'drift'] },
];
