/**
 * STORY RISK ENGINE (pure, observational)
 *
 * Detects creative risks in a candidate story blueprint:
 *   - emotional exploitation
 *   - fake vulnerability
 *   - over-inspiration
 *   - cliché emotional arc
 *   - AI commercial feeling
 *   - excessive polish
 *   - forced drama
 *   - manipulative family imagery
 *   - trauma pressure
 *   - sentimentality overload
 *   - synthetic intimacy
 *
 * Output: low | moderate | high | do-not-use. NEVER blocks. Only
 * warns.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" arc
 *   - never names a "winner"
 *   - allowed phrasing only
 */

// ─── input ────────────────────────────────────────────────────

export interface RiskInputBlueprintHint {
  storyType?: string;
  humanTension?: string;
  emotionalArc?: string;
  memoryAnchor?: string;
  presenceAnchor?: string;
  realismStyle?: string;
}

export interface RiskInputSelfReflection {
  syntheticDrift?: number;
  manipulationCreep?: number;
  aestheticExhaustion?: number;
  humanityRetention?: number;
  restraintIntegrity?: number;
}

export interface RiskInputScar {
  exploitationRisk?: number;
  emotionalHeaviness?: number;
  griefPressure?: number;
  dignityPreservation?: number;
}

export interface RiskInputPresence {
  syntheticPressure?: number;
  authenticityWeight?: number;
}

export interface StoryRiskInput {
  hint?: RiskInputBlueprintHint | null;
  selfReflection?: RiskInputSelfReflection | null;
  scar?: RiskInputScar | null;
  presence?: RiskInputPresence | null;
}

// ─── output ───────────────────────────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high' | 'do-not-use';

export interface StoryRiskSignals {
  emotionalExploitation: number;
  fakeVulnerability: number;
  overInspiration: number;
  clicheEmotionalArc: number;
  aiCommercialFeeling: number;
  excessivePolish: number;
  forcedDrama: number;
  familyImageryRisk: number;
  traumaPressure: number;
  sentimentalityOverload: number;
  syntheticIntimacy: number;
}

export interface StoryRiskReading {
  signals: StoryRiskSignals;
  /** 0..10 — composite risk index. */
  riskIndex: number;
  level: RiskLevel;
  warnings: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Story risk warnings are observational. The engine never blocks. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }

function matches(s: string | undefined, re: RegExp): number {
  if (!s) return 0;
  return re.test(s.toLowerCase()) ? 1 : 0;
}

// ─── main ─────────────────────────────────────────────────────

export function computeStoryRisk(input: StoryRiskInput): StoryRiskReading {
  const h = input.hint ?? {};
  const sr = input.selfReflection ?? {};
  const sc = input.scar ?? {};
  const pr = input.presence ?? {};

  // ── emotional exploitation ────────────────────────────────
  const emotionalExploitation = clamp10(
    get(sc.exploitationRisk) * 0.7 +
    get(sr.manipulationCreep) * 0.3,
  );

  // ── fake vulnerability ────────────────────────────────────
  // Vulnerable framing + low authenticity weight + high synthetic
  // pressure = posed vulnerability.
  const vulnerableHint = matches(h.humanTension, /vulnerab|tender|raw|honest|confess/) +
                        matches(h.presenceAnchor, /vulnerab|tender/);
  const fakeVulnerability = clamp10(
    vulnerableHint * 4 +
    get(pr.syntheticPressure) * 0.5 +
    Math.max(0, 6 - get(pr.authenticityWeight, 5)) * 0.5,
  );

  // ── over-inspiration ──────────────────────────────────────
  const inspirationHint = matches(h.emotionalArc, /aspir|inspir|elevat|peak|hero|triumph|rise/) +
                          matches(h.storyType, /aspir|inspir|elevat|peak|hero|triumph/);
  const overInspiration = clamp10(inspirationHint * 5 + Math.max(0, 6 - get(sr.restraintIntegrity, 5)) * 0.6);

  // ── cliché emotional arc ──────────────────────────────────
  const clicheHint = matches(h.emotionalArc, /problem.*solution|before.*after|loser.*winner|sad.*happy/);
  const clicheEmotionalArc = clamp10(clicheHint * 6 + get(sr.aestheticExhaustion) * 0.4);

  // ── AI commercial feeling ────────────────────────────────
  const aiCommercialFeeling = clamp10(
    get(sr.syntheticDrift) * 0.5 +
    get(pr.syntheticPressure) * 0.5,
  );

  // ── excessive polish ──────────────────────────────────────
  const polishHint = matches(h.realismStyle, /cinematic|polished|gloss|hyper-polish|commercial/);
  const excessivePolish = clamp10(polishHint * 6 + get(sr.aestheticExhaustion) * 0.4);

  // ── forced drama ──────────────────────────────────────────
  const dramaHint = matches(h.humanTension, /crisis|disaster|urgent|terrible|catastroph|drama/);
  const forcedDrama = clamp10(dramaHint * 6 + get(sr.manipulationCreep) * 0.4);

  // ── manipulative family imagery ───────────────────────────
  const familyHint = matches(h.memoryAnchor, /child|parent|family|kid|baby/) +
                     matches(h.humanTension, /child|parent|family|kid|baby|grand/);
  const familyImageryRisk = clamp10(
    familyHint * Math.max(0, get(sc.exploitationRisk) - 3) * 0.5 +
    (familyHint >= 2 ? get(sr.manipulationCreep) * 0.5 : 0),
  );

  // ── trauma pressure ───────────────────────────────────────
  const traumaHint = matches(h.humanTension, /trauma|grief|loss|death|funeral|broken|hospital|cancer/);
  const traumaPressure = clamp10(
    traumaHint * 5 + get(sc.griefPressure) * 0.3 + get(sc.emotionalHeaviness) * 0.2,
  );

  // ── sentimentality overload ──────────────────────────────
  const sentimentHint = matches(h.emotionalArc, /tears|cry|breaking|heartbreak|miracle|magical|destiny/);
  const sentimentalityOverload = clamp10(sentimentHint * 6 + get(sr.manipulationCreep) * 0.4);

  // ── synthetic intimacy ───────────────────────────────────
  const intimacyHint = matches(h.presenceAnchor, /intimate|whisper|close|tender/);
  const syntheticIntimacy = clamp10(
    intimacyHint * get(pr.syntheticPressure) * 0.5 +
    Math.max(0, 6 - get(pr.authenticityWeight, 5)) * 0.5,
  );

  const signals: StoryRiskSignals = {
    emotionalExploitation:  r1(emotionalExploitation),
    fakeVulnerability:      r1(fakeVulnerability),
    overInspiration:        r1(overInspiration),
    clicheEmotionalArc:     r1(clicheEmotionalArc),
    aiCommercialFeeling:    r1(aiCommercialFeeling),
    excessivePolish:        r1(excessivePolish),
    forcedDrama:            r1(forcedDrama),
    familyImageryRisk:      r1(familyImageryRisk),
    traumaPressure:         r1(traumaPressure),
    sentimentalityOverload: r1(sentimentalityOverload),
    syntheticIntimacy:      r1(syntheticIntimacy),
  };

  const riskIndex = r1(clamp10(
    Object.values(signals).reduce((a, b) => Math.max(a, b * 0.7 + a * 0.3), 0),
  ));

  const level: RiskLevel =
    riskIndex >= 8 ? 'do-not-use' :
    riskIndex >= 6 ? 'high' :
    riskIndex >= 3 ? 'moderate' :
                     'low';

  const warnings: string[] = [];
  if (signals.emotionalExploitation >= 5) warnings.push('emotional exploitation risk observed alongside the blueprint');
  if (signals.fakeVulnerability >= 5) warnings.push('fake-vulnerability risk observed alongside elevated synthetic pressure');
  if (signals.overInspiration >= 5) warnings.push('over-inspiration risk observed alongside the blueprint');
  if (signals.clicheEmotionalArc >= 5) warnings.push('cliché emotional arc observed — requires more evidence before exploration');
  if (signals.aiCommercialFeeling >= 5) warnings.push('AI-commercial feeling observed alongside the blueprint');
  if (signals.excessivePolish >= 5) warnings.push('excessive polish observed alongside the blueprint');
  if (signals.forcedDrama >= 5) warnings.push('forced-drama risk observed alongside the blueprint');
  if (signals.familyImageryRisk >= 5) warnings.push('family-imagery risk observed alongside elevated exploitation pressure');
  if (signals.traumaPressure >= 5) warnings.push('trauma pressure observed alongside the blueprint — operator review required');
  if (signals.sentimentalityOverload >= 5) warnings.push('sentimentality overload observed alongside the blueprint');
  if (signals.syntheticIntimacy >= 5) warnings.push('synthetic-intimacy risk observed alongside elevated synthetic pressure');

  const notes: string[] = [];
  notes.push(`observed risk level appears ${level}`);
  if (warnings.length === 0) notes.push('risk signals appear muted in this blueprint');

  return {
    signals,
    riskIndex,
    level,
    warnings,
    notes,
    reasonCodes: [
      `level:${level}`,
      `index:${riskIndex}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
