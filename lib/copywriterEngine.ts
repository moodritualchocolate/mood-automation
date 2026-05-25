/**
 * COPYWRITER ENGINE (Strategy-Conditioned Copywriter — Phase Next)
 *
 * Deterministic persuasion cognition. Reads an AdStrategyAssessment +
 * memory + brutality, composes Hebrew copy (hook / body / cta /
 * optional proof line) from pre-curated tables, then scores:
 *   - forbidden-phrase triggers
 *   - repetition similarity against recent hooks / bodies / structures
 *   - trust / strategic / dignity alignment
 *   - confidence
 *
 * Template selection uses a deterministic FNV-1a hash of a strategy
 * fingerprint — no RNG, no memory-dependent picking. Memory only
 * scores the output, never deviates the template.
 *
 * Same strategy → same copy. Same memory → same scores.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import {
  AUDIENCE_OPENERS_HE, CTA_POOLS_HE, DESIRE_PHRASES_HE,
  FORBIDDEN_PHRASES, PROOF_LINES_HE, TONE_TEMPLATES, WOUND_PHRASES_HE,
  toneForStrategy, fingerprintHash,
  type CopyTone, type RestraintBand,
} from './copyPatterns';
import type {
  CopywriterMemoryState, HookRecord, BodyRecord, CTARecord,
  EmotionalFrameRecord, ForbiddenTriggerRecord, SuccessfulMirrorRecord,
  StructureRecord,
} from './copywriterMemory';

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── output shape ──────────────────────────────────────────────

export type UrgencyStyle = 'silent' | 'soft' | 'editorial' | 'pressed';
export type ProductPresenceCopy = 'absent' | 'background' | 'mentioned' | 'foreground';

export interface CopywriterOutput {
  hook: string;
  body: string;
  cta: string;
  proofLine: string | null;
  emotionalFrame: string;           // wound|desire fingerprint
  persuasionTone: CopyTone;
  urgencyStyle: UrgencyStyle;
  restraintLevel: number;           // 0..10
  productPresence: ProductPresenceCopy;
  forbiddenPhrasesTriggered: string[];
  repetitionSimilarity: number;     // 0..10
  trustAlignment: number;           // 0..10
  strategicAlignment: number;       // 0..10
  dignityAlignment: number;         // 0..10
  confidence: number;               // 0..10
  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface CopywriterInput {
  strategy: AdStrategyAssessment;
  brutality: number;                // 0..1
  memory: CopywriterMemoryState;
  /** Optional emotional context. */
  context?: {
    stateLabel?: string;
    truthSummary?: string;
  };
}

// ─── derivation helpers ───────────────────────────────────────

function restraintBandFromStrategy(s: AdStrategyAssessment): { band: RestraintBand; level: number } {
  // Use creativeConstraints.emotionalDirectness (lower = more restrained).
  const directness = s.creativeConstraints.emotionalDirectness;       // 0..10
  // Trust debt + low brand dignity nudge toward restraint.
  const trustDebt = s.trustDebt;
  // Score the inverse of directness, biased up by debt.
  const restraint = clamp10(10 - directness + (trustDebt >= 5 ? 1.5 : 0));
  const band: RestraintBand =
    restraint >= 7 ? 'high' :
    restraint >= 4 ? 'medium' :
                     'low';
  return { band, level: round1(restraint) };
}

function urgencyStyleFromStrategy(s: AdStrategyAssessment): UrgencyStyle {
  // CTA strength + urgency level → style. High trust debt forces softer.
  if (s.trustDebt >= 7) return 'silent';
  const cta = s.creativeConstraints.ctaStrength;
  const urgency = s.urgencyLevel;
  if (cta <= 2 && urgency <= 4) return 'silent';
  if (cta <= 4 && urgency <= 6) return 'soft';
  if (cta <= 6) return 'editorial';
  return 'pressed';
}

function productPresenceCopyFromStrategy(s: AdStrategyAssessment): ProductPresenceCopy {
  const v = s.creativeConstraints.productVisibility;
  if (v <= 3) return 'absent';
  if (v <= 5) return 'background';
  if (v <= 7) return 'mentioned';
  return 'foreground';
}

function lookupHebrew(map: Record<string, string>, key: string, fallback: string): string {
  return map[key] ?? fallback;
}

function fillTemplate(t: string, slots: Record<string, string>): string {
  let out = t;
  for (const [k, v] of Object.entries(slots)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function tokenize(s: string): string[] {
  // Split by non-letter characters (Hebrew + English).
  // The regex `[^א-תa-zA-Z0-9]+` splits on anything not letter/digit.
  return s.toLowerCase().split(/[^א-תa-zA-Z0-9]+/).filter((w) => w.length >= 2);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── forbidden detection ─────────────────────────────────────

function detectForbidden(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) hits.push(phrase);
  }
  // Heuristics for clickbait-style structural smells.
  if (/[!]{2,}/.test(text)) hits.push('multiple-exclamations');
  if (/[?]{2,}/.test(text)) hits.push('multiple-question-marks');
  // ALL-CAPS shouting (English-only — Hebrew has no case).
  const capsWords = (text.match(/\b[A-Z]{4,}\b/g) ?? []).length;
  if (capsWords >= 2) hits.push('all-caps-shouting');
  // Emoji excess.
  const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length;
  if (emojiCount >= 3) hits.push('emoji-excess');
  return hits;
}

// ─── repetition + alignment scoring ──────────────────────────

function computeRepetitionSimilarity(
  hook: string, body: string, structureSig: string, memory: CopywriterMemoryState,
): { similarity: number; reasons: string[] } {
  const reasons: string[] = [];
  let max = 0;
  const hookTokens = tokenize(hook);
  for (const prior of memory.hookHistory.slice(-8)) {
    const sim = jaccard(hookTokens, tokenize(prior.hook));
    if (sim > max) max = sim;
    if (sim >= 0.55) reasons.push(`hook-overlap:${sim.toFixed(2)}`);
  }
  const bodyTokens = tokenize(body);
  for (const prior of memory.bodyHistory.slice(-8)) {
    const sim = jaccard(bodyTokens, tokenize(prior.body));
    if (sim > max) max = sim;
    if (sim >= 0.55) reasons.push(`body-overlap:${sim.toFixed(2)}`);
  }
  // Structural repeats raise similarity even if surface differs.
  const recentStructures = memory.structureHistory.slice(-12).filter((s) => s.signature === structureSig).length;
  if (recentStructures >= 3) {
    max = Math.max(max, 0.7);
    reasons.push(`structure-streak:${recentStructures}/12`);
  }
  return { similarity: round1(clamp10(max * 10)), reasons };
}

function computeTrustAlignment(
  s: AdStrategyAssessment, hits: string[], urgencyStyle: UrgencyStyle,
  proofPresent: boolean,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 8;
  // High proof need with no proof line → trust hit.
  if (s.proofNeed === 'high' && !proofPresent) {
    score -= 3; reasons.push('high-proofNeed-without-proof:-3');
  } else if (s.proofNeed === 'medium' && !proofPresent) {
    score -= 1; reasons.push('medium-proofNeed-without-proof:-1');
  } else if (s.proofNeed !== 'low' && proofPresent) {
    score += 1; reasons.push('proof-respected:+1');
  }
  // Trust debt + non-silent urgency = trust hit.
  if (s.trustDebt >= 6 && urgencyStyle !== 'silent') {
    score -= 2; reasons.push(`trustDebt-${s.trustDebt}-and-${urgencyStyle}-urgency:-2`);
  }
  // Forbidden hits hurt trust.
  if (hits.length > 0) {
    score -= Math.min(3, hits.length);
    reasons.push(`forbidden-hits:${hits.length}:-${Math.min(3, hits.length)}`);
  }
  return { score: round1(clamp10(score)), reasons };
}

function computeStrategicAlignment(
  s: AdStrategyAssessment, tone: CopyTone, restraintLevel: number, productPresence: ProductPresenceCopy,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 7;
  // Tone matches strategy persuasion mode → reward.
  const expectedTone = toneForStrategy(s.persuasionMode, s.trustDebt, 7, 0.65);
  if (expectedTone === tone) { score += 1.5; reasons.push(`tone-matches-strategy:+1.5`); }
  // Restraint matches creativeConstraints.emotionalDirectness inverse.
  const expectedRestraint = 10 - s.creativeConstraints.emotionalDirectness;
  if (Math.abs(restraintLevel - expectedRestraint) <= 1.5) {
    score += 1; reasons.push('restraint-aligned:+1');
  } else {
    score -= 0.5; reasons.push('restraint-misaligned:-0.5');
  }
  // Product presence matches creativeConstraints.productVisibility band.
  const v = s.creativeConstraints.productVisibility;
  const expectedPresence: ProductPresenceCopy =
    v <= 3 ? 'absent' : v <= 5 ? 'background' : v <= 7 ? 'mentioned' : 'foreground';
  if (productPresence === expectedPresence) {
    score += 0.5; reasons.push('product-presence-aligned:+0.5');
  }
  return { score: round1(clamp10(score)), reasons };
}

function computeDignityAlignment(
  s: AdStrategyAssessment, hits: string[], hookLen: number, bodyLen: number,
  restraintLevel: number,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 7;
  if (hits.length === 0) { score += 1; reasons.push('no-forbidden-hits:+1'); }
  else { score -= Math.min(4, hits.length * 1.2); reasons.push(`forbidden:${hits.length}:-${Math.min(4, hits.length * 1.2).toFixed(1)}`); }
  // Premium = shorter hooks. Over-explained body costs dignity.
  if (hookLen <= 50) { score += 0.5; reasons.push('hook-restrained-length:+0.5'); }
  else if (hookLen >= 120) { score -= 1; reasons.push('hook-overexplaining:-1'); }
  if (bodyLen >= 350) { score -= 1; reasons.push('body-overlong:-1'); }
  if (restraintLevel >= 7) { score += 0.5; reasons.push('high-restraint:+0.5'); }
  return { score: round1(clamp10(score)), reasons };
}

// ─── main compose ────────────────────────────────────────────

export function composeCopy(input: CopywriterInput): CopywriterOutput {
  const { strategy: s, brutality, memory } = input;

  // 1. tone selection
  const tone = toneForStrategy(s.persuasionMode, s.trustDebt, 7, brutality);

  // 2. wound + desire Hebrew anchors
  const woundHe  = lookupHebrew(WOUND_PHRASES_HE,  s.emotionalWound, s.emotionalWound);
  const desireHe = lookupHebrew(DESIRE_PHRASES_HE, s.hiddenDesire,   s.hiddenDesire);

  // 3. opener for audience — deterministic by fingerprint
  const openers = AUDIENCE_OPENERS_HE[s.primaryAudience];
  const openerFingerprint = `${s.primaryAudience}|${s.campaignRole}|${s.emotionalWound}`;
  const opener = openers[fingerprintHash(openerFingerprint) % openers.length];

  // 4. tone template — deterministic by fingerprint
  const templates = TONE_TEMPLATES[tone];
  const templateFingerprint = `${s.primaryAudience}|${tone}|${s.campaignRole}|${s.emotionalWound}|${s.hiddenDesire}`;
  const tpl = templates[fingerprintHash(templateFingerprint) % templates.length];

  const slots = { wound: woundHe, desire: desireHe, opener };
  const hook = fillTemplate(tpl.hook, slots);
  const body = fillTemplate(tpl.body, slots);

  // 5. CTA — restraint band × role
  const { band: restraintBand, level: restraintLevel } = restraintBandFromStrategy(s);
  const ctaPool = CTA_POOLS_HE[restraintBand][s.campaignRole];
  const ctaFingerprint = `${restraintBand}|${s.campaignRole}|${s.trustDebt.toFixed(1)}`;
  const cta = ctaPool[fingerprintHash(ctaFingerprint) % ctaPool.length];

  // 6. proof line — only when proofNeed >= medium
  let proofLine: string | null = null;
  if (s.proofNeed !== 'low') {
    const proofPool = PROOF_LINES_HE[s.proofNeed];
    const proofFingerprint = `${s.proofNeed}|${s.primaryAudience}|${s.campaignRole}`;
    proofLine = proofPool[fingerprintHash(proofFingerprint) % proofPool.length] || null;
    if (proofLine === '') proofLine = null;
  }

  // 7. urgency + product presence derived
  const urgencyStyle = urgencyStyleFromStrategy(s);
  const productPresence = productPresenceCopyFromStrategy(s);

  // 8. forbidden detection across hook + body + cta
  const fullText = `${hook}\n${body}\n${cta}${proofLine ? `\n${proofLine}` : ''}`;
  const forbiddenPhrasesTriggered = detectForbidden(fullText);

  // 9. structural signature for repetition tracking
  const structureSig = `${tone}|${s.campaignRole}|${restraintBand}|${urgencyStyle}|${productPresence}|hL${hook.length > 80 ? 'L' : 'S'}|bL${body.length > 200 ? 'L' : 'S'}`;

  // 10. repetition similarity (memory-aware scoring; does not change template selection)
  const { similarity: repetitionSimilarity, reasons: repReasons } = computeRepetitionSimilarity(
    hook, body, structureSig, memory,
  );

  // 11. alignments
  const { score: trustAlignment, reasons: trustReasons } = computeTrustAlignment(
    s, forbiddenPhrasesTriggered, urgencyStyle, proofLine !== null,
  );
  const { score: strategicAlignment, reasons: stratReasons } = computeStrategicAlignment(
    s, tone, restraintLevel, productPresence,
  );
  const { score: dignityAlignment, reasons: dignityReasons } = computeDignityAlignment(
    s, forbiddenPhrasesTriggered, hook.length, body.length, restraintLevel,
  );

  // 12. confidence — composite of alignments + strategy confidence
  const confidence = round1(clamp10(
    (trustAlignment + strategicAlignment + dignityAlignment) / 3
    - repetitionSimilarity / 10
    + (s.confidence / 10),
  ));

  const emotionalFrame = `${s.emotionalWound}->${s.hiddenDesire}`;

  const reasonCodes: string[] = [
    `tone:${tone} from persuasion:${s.persuasionMode}, trustDebt:${s.trustDebt}, brutality:${brutality.toFixed(2)}`,
    `wound:"${woundHe}" desire:"${desireHe}" opener-idx:${fingerprintHash(openerFingerprint) % openers.length}/${openers.length}`,
    `template:${fingerprintHash(templateFingerprint) % templates.length}/${templates.length}`,
    `restraint:${restraintBand}(${restraintLevel}) cta-pool:${ctaPool.length} urgency:${urgencyStyle} product:${productPresence}`,
    `proofNeed:${s.proofNeed} proofPresent:${proofLine !== null}`,
    `structureSig:${structureSig}`,
    ...repReasons.map((r) => `repetition[${r}]`),
    ...trustReasons.map((r) => `trust[${r}]`),
    ...stratReasons.map((r) => `strategic[${r}]`),
    ...dignityReasons.map((r) => `dignity[${r}]`),
    ...(forbiddenPhrasesTriggered.length > 0
      ? [`forbidden[${forbiddenPhrasesTriggered.join(', ')}]`]
      : []),
  ];

  return {
    hook, body, cta, proofLine,
    emotionalFrame,
    persuasionTone: tone,
    urgencyStyle,
    restraintLevel,
    productPresence,
    forbiddenPhrasesTriggered,
    repetitionSimilarity,
    trustAlignment,
    strategicAlignment,
    dignityAlignment,
    confidence,
    reasonCodes,
  };
}

// ─── memory writes ────────────────────────────────────────────

export function recordCopyOutput(
  memory: CopywriterMemoryState, output: CopywriterOutput,
  strategy: AdStrategyAssessment, bannerId: string, at: number,
): CopywriterMemoryState {
  const hookRec: HookRecord = {
    at, bannerId, hook: output.hook,
    tone: output.persuasionTone,
    audience: strategy.primaryAudience,
    role: strategy.campaignRole,
  };
  const bodyRec: BodyRecord = {
    at, bannerId, body: output.body, tone: output.persuasionTone,
  };
  const restraintBand: 'low' | 'medium' | 'high' =
    output.restraintLevel >= 7 ? 'high' :
    output.restraintLevel >= 4 ? 'medium' : 'low';
  const ctaRec: CTARecord = {
    at, bannerId, cta: output.cta, role: strategy.campaignRole, restraintBand,
  };
  const frameRec: EmotionalFrameRecord = {
    at, bannerId,
    frame: output.emotionalFrame,
    audience: strategy.primaryAudience,
  };
  const structureRec: StructureRecord = {
    at, bannerId,
    signature: `${output.persuasionTone}|${strategy.campaignRole}|${restraintBand}|${output.urgencyStyle}|${output.productPresence}`,
  };

  const forbiddenTriggers: ForbiddenTriggerRecord[] = output.forbiddenPhrasesTriggered.map((phrase) => ({
    at, bannerId, phrase, channel: 'body',
  }));

  // Dignity erosion: drops if forbidden hits or low dignity alignment.
  // Recovers if alignment is high and no hits.
  let dignityErosion = memory.dignityErosionScore;
  if (output.forbiddenPhrasesTriggered.length >= 1) {
    dignityErosion = round1(clamp10(dignityErosion + 0.5 + output.forbiddenPhrasesTriggered.length * 0.3));
  } else if (output.dignityAlignment >= 8) {
    dignityErosion = round1(clamp10(dignityErosion - 0.3));
  }

  // Structural repetition score.
  const samStructure = memory.structureHistory.slice(-12).filter((s) => s.signature === structureRec.signature).length;
  let repeatedStructures = memory.repeatedStructuresScore;
  if (samStructure >= 3) {
    repeatedStructures = round1(clamp10(repeatedStructures + 0.4));
  } else {
    repeatedStructures = round1(clamp10(repeatedStructures - 0.1));
  }

  // Successful-mirror log: high trust + dignity + low forbidden = a mirror that worked.
  let successfulMirrors = memory.successfulMirrors;
  if (output.trustAlignment >= 8 && output.dignityAlignment >= 8 && output.forbiddenPhrasesTriggered.length === 0) {
    const mirror: SuccessfulMirrorRecord = {
      at, bannerId,
      audience: strategy.primaryAudience,
      tone: output.persuasionTone,
      frame: output.emotionalFrame,
      trustAlignment: output.trustAlignment,
      dignityAlignment: output.dignityAlignment,
    };
    successfulMirrors = [...successfulMirrors, mirror];
  }

  return {
    ...memory,
    hookHistory:        [...memory.hookHistory, hookRec],
    bodyHistory:        [...memory.bodyHistory, bodyRec],
    ctaHistory:         [...memory.ctaHistory, ctaRec],
    frameHistory:       [...memory.frameHistory, frameRec],
    toneHistory:        [...memory.toneHistory, output.persuasionTone],
    forbiddenTriggers:  [...memory.forbiddenTriggers, ...forbiddenTriggers],
    successfulMirrors,
    structureHistory:   [...memory.structureHistory, structureRec],
    dignityErosionScore: dignityErosion,
    repeatedStructuresScore: repeatedStructures,
    totalCopiesProduced: memory.totalCopiesProduced + 1,
    firstUpdatedAt:     memory.firstUpdatedAt ?? at,
    updatedAt:          at,
  };
}
