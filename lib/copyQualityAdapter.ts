/**
 * COPY-QUALITY ADAPTER (Phase Next)
 *
 * READ-ONLY signal. Reads `banner.copywriter` + `banner.adStrategy` +
 * current brutality and emits a `CopyQualityAxis` the meta-critic
 * may consult — alongside its existing taste / aesthetic inputs.
 *
 * STRICTLY:
 *   - does NOT alter critic verdicts
 *   - does NOT create a new refusal gate
 *   - does NOT modify brutality semantics or refusal behavior
 *   - does NOT lower standards
 *
 * Deterministic. Same inputs → same scores. No RNG, no I/O.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CopywriterOutput } from './copywriterEngine';
import { toneForStrategy } from './copyPatterns';

// ─── output shape ──────────────────────────────────────────────

export interface CopyQualityAxis {
  /** 0..10 — composite quality score (weighted mean of the other axes
   *  minus repetition concern). Higher = better. */
  copyIntegrity: number;
  /** 0..10 — how trust-safe the copy is (urgency under debt, forbidden
   *  hits, proof respect). Higher = safer. */
  trustSafety: number;
  /** 0..10 — premium dignity preservation (no clickbait, no shouting,
   *  no over-explaining). Higher = more dignified. */
  dignitySafety: number;
  /** 0..10 — concern about repetition vs recent memory. HIGHER = MORE
   *  CONCERN (inverted vs the other "safety" axes; matches how the
   *  meta-critic reads risk). */
  repetitionConcern: number;
  /** 0..10 — how well the proof line matches the proof need. Higher = better. */
  proofAdequacy: number;
  /** 0..10 — how restrained the CTA is given the trust context. Higher
   *  = more restrained / safer. */
  ctaRestraint: number;
  /** 0..10 — how native-Hebrew the copy feels. Higher = more natural. */
  hebrewNaturalness: number;
  /** 0..10 — alignment between copy and strategy (tone matches role,
   *  product presence matches visibility, restraint matches directness). */
  strategicCopyFit: number;
  /** Human-readable warnings exposed to the meta-critic / dashboard. */
  warnings: string[];
  /** Per-decision audit trail. */
  reasonCodes: string[];
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── role × tone fit table ─────────────────────────────────────
//
// Each role has tones that fit cleanly. A tone outside the fitting
// set is a mismatch (penalty). Same data the toneForStrategy mapping
// produces, expressed as an inclusion check.

const ROLE_TONE_FIT: Record<AdStrategyAssessment['campaignRole'], readonly string[]> = {
  awareness:            ['empathic', 'restrained', 'observational', 'hopeful-quiet', 'documentary'],
  curiosity:            ['cinematic', 'observational', 'restrained', 'intimate'],
  objection_breaker:    ['anti-hype', 'confrontational-soft', 'documentary', 'restrained'],
  trust_builder:        ['documentary', 'restrained', 'empathic', 'ritualistic'],
  conversion_push:      ['confrontational-soft', 'documentary', 'cinematic'],
  retargeting_memory:   ['observational', 'intimate', 'anti-hype', 'hopeful-quiet'],
  ritual_education:     ['ritualistic', 'documentary', 'restrained', 'observational'],
  product_proof:        ['documentary', 'observational', 'restrained'],
  emotional_mirror:     ['empathic', 'intimate', 'emotionally-exhausted', 'hopeful-quiet', 'observational', 'restrained'],
  social_share_trigger: ['cinematic', 'confrontational-soft', 'observational'],
};

// ─── hebrew-naturalness heuristics ─────────────────────────────
//
// Targets common "translated-marketing-English" smells in Hebrew copy.
// Detection runs over hook + body + cta + proof concatenated.

const HEBREW_CALQUE_PATTERNS: Array<{ pattern: RegExp; tag: string }> = [
  // "be the best version of yourself" — Hebrew calque
  { pattern: /גרסה\s+הטובה\s+ביותר/, tag: 'calque:best-version' },
  // "unlock your potential" calques
  { pattern: /לפתוח\s+את\s+הפוטנציאל/, tag: 'calque:unlock-potential' },
  // "level up" calque
  { pattern: /לעלות\s+רמה/, tag: 'calque:level-up' },
  // "you deserve" calque (over-translated)
  { pattern: /את\s+מגיע\s+לך\b|אתה\s+מגיע\s+לך\b/, tag: 'calque:you-deserve' },
  // "amazing results" generic
  { pattern: /תוצאות\s+מדהימות/, tag: 'calque:amazing-results' },
  // "transform" generic marketing
  { pattern: /טרנספורמציה/, tag: 'calque:transformation' },
];

const HEBREW_LETTER_RE = /[֐-׿]/;
const ENGLISH_WORD_RE = /\b[a-zA-Z]{3,}\b/g;

function detectHebrewSmells(text: string): string[] {
  const smells: string[] = [];
  // Calques.
  for (const { pattern, tag } of HEBREW_CALQUE_PATTERNS) {
    if (pattern.test(text)) smells.push(tag);
  }
  // English words inside an otherwise-Hebrew sentence. Threshold ≥ 2.
  const hasHebrew = HEBREW_LETTER_RE.test(text);
  const englishMatches = text.match(ENGLISH_WORD_RE) ?? [];
  // Allow a single brand/product token; ≥ 2 is mixing.
  const filteredEnglish = englishMatches.filter((w) => !/^https?$/.test(w.toLowerCase()));
  if (hasHebrew && filteredEnglish.length >= 2) {
    smells.push(`english-intrusion:${filteredEnglish.length}`);
  }
  // Excessive punctuation inside Hebrew (smell of imported English-marketing).
  const exclam = (text.match(/!/g) ?? []).length;
  if (hasHebrew && exclam >= 2) smells.push(`exclamation-storm:${exclam}`);
  // Generic "כל מה שצריך" / "פתרון הכולל" — overused marketing scaffolding.
  if (/כל\s+מה\s+שאתה\s+צריך/.test(text)) smells.push('cliche:all-you-need');
  if (/פתרון\s+הכולל/.test(text)) smells.push('cliche:complete-solution');
  return smells;
}

// ─── axis computations ────────────────────────────────────────

function trustSafety(c: CopywriterOutput, s: AdStrategyAssessment): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  let score = c.trustAlignment;  // start from existing alignment
  // High urgency under high trust debt → trust-unsafe.
  if (s.trustDebt >= 6 && (c.urgencyStyle === 'editorial' || c.urgencyStyle === 'pressed')) {
    score -= 2;
    warnings.push(`trust-debt ${s.trustDebt} with ${c.urgencyStyle} urgency`);
    reasons.push(`urgency-under-debt:-2`);
  }
  // Forbidden hits already penalize trustAlignment; re-surface a strong
  // warning when there are any.
  if (c.forbiddenPhrasesTriggered.length > 0) {
    warnings.push(`${c.forbiddenPhrasesTriggered.length} forbidden phrase(s) triggered`);
    reasons.push(`forbidden-flag:${c.forbiddenPhrasesTriggered.length}`);
  }
  // Proof respect bonus.
  if (s.proofNeed === 'high' && c.proofLine) { score += 0.5; reasons.push('proof-respected:+0.5'); }
  return { score: round1(clamp10(score)), reasons, warnings };
}

function dignitySafety(c: CopywriterOutput): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  let score = c.dignityAlignment;
  // Clickbait structural smells captured in forbidden list — add weight here.
  const structuralHits = c.forbiddenPhrasesTriggered.filter((p) =>
    p === 'multiple-exclamations' || p === 'multiple-question-marks'
    || p === 'all-caps-shouting' || p === 'emoji-excess',
  ).length;
  if (structuralHits > 0) {
    score -= structuralHits * 1.2;
    warnings.push(`${structuralHits} clickbait structural hit(s)`);
    reasons.push(`clickbait-structural:-${(structuralHits * 1.2).toFixed(1)}`);
  }
  // Over-explaining: long body penalty (above and beyond what alignment caught).
  if (c.body.length >= 400) { score -= 0.8; reasons.push('body-overexplain:-0.8'); }
  // Restraint bonus.
  if (c.restraintLevel >= 7) { score += 0.5; reasons.push('high-restraint:+0.5'); }
  return { score: round1(clamp10(score)), reasons, warnings };
}

function proofAdequacy(c: CopywriterOutput, s: AdStrategyAssessment): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  const hasProof = c.proofLine !== null && c.proofLine.length > 0;
  let score: number;
  if (s.proofNeed === 'high') {
    score = hasProof ? 10 : 2;
    if (!hasProof) {
      warnings.push('high proofNeed without proof line');
      reasons.push('high-need-no-proof:hard-penalty');
    } else { reasons.push('high-need-with-proof:full'); }
  } else if (s.proofNeed === 'medium') {
    score = hasProof ? 9 : 5;
    reasons.push(hasProof ? 'medium-need-with-proof:strong' : 'medium-need-no-proof:partial');
  } else {
    // low — over-proving is mildly wasteful, but not harmful.
    score = hasProof ? 8 : 10;
    if (hasProof) reasons.push('low-need-with-proof:over-proving');
  }
  return { score: round1(clamp10(score)), reasons, warnings };
}

function ctaRestraintScore(c: CopywriterOutput, s: AdStrategyAssessment): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  let score =
    c.urgencyStyle === 'silent' ? 10 :
    c.urgencyStyle === 'soft' ? 8 :
    c.urgencyStyle === 'editorial' ? 6 :
                                     3;  // pressed
  reasons.push(`urgency-${c.urgencyStyle}:base=${score}`);
  // Under high trust debt, pressed CTA is especially harmful.
  if (s.trustDebt >= 6 && c.urgencyStyle === 'pressed') {
    score -= 2;
    warnings.push('pressed CTA under high trust debt');
    reasons.push('pressed-under-debt:-2');
  }
  // Low brand dignity, pressed CTA = dignity risk.
  if (c.urgencyStyle === 'pressed' && s.brandRisk >= 6) {
    score -= 1; reasons.push('pressed-with-brand-risk:-1');
  }
  return { score: round1(clamp10(score)), reasons, warnings };
}

function hebrewNaturalness(c: CopywriterOutput): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  const text = `${c.hook}\n${c.body}\n${c.cta}${c.proofLine ? `\n${c.proofLine}` : ''}`;
  const smells = detectHebrewSmells(text);
  let score = 10 - smells.length * 1.5;
  for (const smell of smells) {
    reasons.push(`hebrew-smell:${smell}:-1.5`);
    warnings.push(`hebrew-naturalness: ${smell}`);
  }
  return { score: round1(clamp10(score)), reasons, warnings };
}

function strategicCopyFit(c: CopywriterOutput, s: AdStrategyAssessment, brutality: number): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []; const warnings: string[] = [];
  let score = c.strategicAlignment;
  // Role × tone mismatch.
  const fitTones = ROLE_TONE_FIT[s.campaignRole] ?? [];
  const toneMatches = fitTones.includes(c.persuasionTone);
  if (!toneMatches) {
    score -= 1.5;
    warnings.push(`tone "${c.persuasionTone}" mismatches role "${s.campaignRole}"`);
    reasons.push(`role-tone-mismatch:-1.5`);
  } else { reasons.push(`role-tone-fit:+0`); }
  // Expected tone from strategy — secondary signal.
  const expectedTone = toneForStrategy(s.persuasionMode, s.trustDebt, 7, brutality);
  if (c.persuasionTone === expectedTone) { score += 0.5; reasons.push('matches-expected-tone:+0.5'); }
  return { score: round1(clamp10(score)), reasons, warnings };
}

// ─── main entry ────────────────────────────────────────────────

export interface CopyQualityInput {
  copywriter: CopywriterOutput;
  strategy: AdStrategyAssessment;
  brutality: number;
}

export function evaluateCopyQuality(input: CopyQualityInput): CopyQualityAxis {
  const { copywriter: c, strategy: s, brutality } = input;

  const trust    = trustSafety(c, s);
  const dignity  = dignitySafety(c);
  const proof    = proofAdequacy(c, s);
  const cta      = ctaRestraintScore(c, s);
  const hebrew   = hebrewNaturalness(c);
  const stratFit = strategicCopyFit(c, s, brutality);
  const repetitionConcern = c.repetitionSimilarity;  // already 0..10 risk

  // Composite copyIntegrity = weighted mean of safety axes minus
  // repetition concern. Weights favor trust + dignity + strategic fit.
  const weighted =
    trust.score    * 0.20 +
    dignity.score  * 0.20 +
    proof.score    * 0.15 +
    cta.score      * 0.10 +
    hebrew.score   * 0.10 +
    stratFit.score * 0.25;
  const copyIntegrity = round1(clamp10(weighted - repetitionConcern * 0.15));

  const warnings = [
    ...trust.warnings, ...dignity.warnings, ...proof.warnings,
    ...cta.warnings, ...hebrew.warnings, ...stratFit.warnings,
    ...(repetitionConcern >= 6 ? [`repetition concern ${repetitionConcern}/10`] : []),
  ];

  const reasonCodes = [
    `composite:${copyIntegrity}/10 (weighted - repetition*0.15)`,
    ...trust.reasons.map((r) => `trustSafety[${r}]`),
    ...dignity.reasons.map((r) => `dignitySafety[${r}]`),
    ...proof.reasons.map((r) => `proofAdequacy[${r}]`),
    ...cta.reasons.map((r) => `ctaRestraint[${r}]`),
    ...hebrew.reasons.map((r) => `hebrew[${r}]`),
    ...stratFit.reasons.map((r) => `strategicCopyFit[${r}]`),
    `repetitionConcern:${repetitionConcern}/10`,
  ];

  return {
    copyIntegrity,
    trustSafety:       trust.score,
    dignitySafety:     dignity.score,
    repetitionConcern,
    proofAdequacy:     proof.score,
    ctaRestraint:      cta.score,
    hebrewNaturalness: hebrew.score,
    strategicCopyFit:  stratFit.score,
    warnings,
    reasonCodes,
  };
}
