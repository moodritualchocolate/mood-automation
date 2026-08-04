/**
 * SOCIAL PRESSURE SYSTEMS (Phase 42 — World-State Executive Brain / Wave 4)
 *
 * Models the social pressure systems the audience is suspended in —
 * social fragmentation, attention chaos, the loneliness index, and
 * trust erosion. These shape what an audience can receive.
 */

import type { IngestedSignal } from './realityIngestion';
import type { EmotionalTraceEntry } from './humanMemory';

export interface SocialPressureReading {
  social_fragmentation: number;     // 0..10
  attention_chaos: number;          // 0..10
  loneliness_index: number;         // 0..10
  trust_erosion: number;            // 0..10
  notes: string[];
}

export interface SocialPressureInput {
  ingestedSignals: IngestedSignal[];
  trail: EmotionalTraceEntry[];
}

const LONELINESS_RX = /\b(lonely|alone|no one|isolated|disconnected|unreachable|nobody)\b|(בודד|לבד|מנותק)/i;
const TRUST_RX = /\b(fake|lying|scam|don'?t trust|betrayed|cynical|manipulated|sold)\b|(מזויף|שקר|לא מאמין)/i;
const FRAGMENTATION_RX = /\b(scattered|fragmented|all over|cant focus|in pieces|split|pulled)\b|(מפוזר|מקוטע|לא מצליח להתרכז)/i;

export function readSocialPressure(input: SocialPressureInput): SocialPressureReading {
  const { ingestedSignals, trail } = input;
  const notes: string[] = [];

  const corpus = [
    ...ingestedSignals.map((s) => s.text),
    ...trail.slice(0, 20).map((t) => `${t.truth} ${t.tension}`),
  ];
  const total = Math.max(1, corpus.length);

  let lonely = 0, distrust = 0, fragmented = 0;
  for (const text of corpus) {
    if (LONELINESS_RX.test(text)) lonely += 1;
    if (TRUST_RX.test(text)) distrust += 1;
    if (FRAGMENTATION_RX.test(text)) fragmented += 1;
  }

  // Fragmentation families in the trail also feed attention chaos.
  const fragFamilies = trail.slice(0, 20).filter((t) => t.family === 'fragmentation' || t.family === 'overstimulation').length;

  const loneliness_index = round1(clamp10(4 + (lonely / total) * 16));
  const trust_erosion = round1(clamp10(3.5 + (distrust / total) * 18));
  const social_fragmentation = round1(clamp10(4 + (fragmented / total) * 16));
  const attention_chaos = round1(clamp10(5 + (fragFamilies / Math.max(1, Math.min(20, trail.length))) * 8));

  notes.push(`social pressure: fragmentation ${social_fragmentation}/10, attention chaos ${attention_chaos}/10, loneliness ${loneliness_index}/10, trust erosion ${trust_erosion}/10`);
  return { social_fragmentation, attention_chaos, loneliness_index, trust_erosion, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
