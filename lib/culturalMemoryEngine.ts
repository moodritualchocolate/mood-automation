/**
 * CULTURAL MEMORY ENGINE (pure, observational, non-stereotyping)
 *
 * Tracks recurring emotional-cultural patterns across observed
 * audience segments. Groups outcome memory by segment and scores
 * 18 cultural-emotional dimensions from the content the segment
 * historically engaged with.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - never stereotypes humans — the engine reads what content
 *     RECEIVED engagement, not what people "are"
 *   - never produces signals usable for political persuasion,
 *     outrage segmentation, identity manipulation, or polarization
 *   - includes a COLLECTIVE MEMORY OBSERVATORY pass that tracks
 *     which emotional themes survive repetition across all
 *     segments — observational only
 *
 * Same input → same output.
 */

// ─── loose structural subsets ────────────────────────────────

export interface OutcomeSubset {
  outcomes?: Array<{
    at?: number;
    audienceSegment?: string;
    formula?: string;
    campaignMode?: string | null;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    mutationPressure?: number;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; comments?: number;
      shares?: number; bounceRate?: number; follows?: number;
      ctr?: number; rewatches?: number; likes?: number;
      profileVisits?: number; scrollDepth?: number; impressions?: number;
    };
  }>;
}

export interface CulturalInput {
  outcomes?: OutcomeSubset | null;
}

// ─── 18 cultural-emotional dimensions ────────────────────────

export interface CulturalSignature {
  silenceTolerance: number;
  humorDensity: number;
  emotionalDirectness: number;
  nostalgiaSensitivity: number;
  familyOrientation: number;
  aspirationStyle: number;
  realismPreference: number;
  authorityTrust: number;
  ritualAttraction: number;
  vulnerabilityAcceptance: number;
  pacingPreference: number;       // 0 = slow, 10 = fast
  symbolismOpenness: number;
  optimismTolerance: number;
  emotionalWarmth: number;
  cinematicTolerance: number;
  ironyUsage: number;
  sincerityComfort: number;
  identityAttachment: number;
}

// ─── output ───────────────────────────────────────────────────

export interface CulturalSegmentSummary {
  segment: string;
  outcomes: number;
  averageEngagement: number;
  signature: CulturalSignature;
  /** Top three signature axes (highest scores) for the segment. */
  dominantDimensions: string[];
  notes: string[];
}

export interface CollectiveMemoryEntry {
  /** Fingerprint of the emotional theme (emotional + narrative signature). */
  theme: string;
  occurrences: number;
  /** 0..10 — durability score: surviving repetition with sustained engagement. */
  durability: number;
  averageEngagement: number;
  /** True when the theme appears in many segments with sustained engagement. */
  timeless: boolean;
  /** True when the theme has decayed after heavy use (saturation collapse). */
  collapsed: boolean;
  description: string;
}

export interface CulturalMemoryReading {
  totalOutcomes: number;
  segments: CulturalSegmentSummary[];
  /** Collective memory observatory — emotional themes across all segments. */
  collectiveMemory: CollectiveMemoryEntry[];
  /** Themes that have collapsed from overuse. */
  collapsedSymbols: CollectiveMemoryEntry[];
  /** Aesthetic styles that lost trust over time. */
  aestheticsLosingTrust: Array<{ style: string; trustDelta: number; occurrences: number }>;
  emotionalPersistence: number;   // 0..10 — overall how durable emotional themes are
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — cultural memory describes RECURRING ENGAGEMENT PATTERNS. ' +
  'The system NEVER stereotypes humans, NEVER segments for outrage, ' +
  'NEVER uses these signals for political or tribal optimization.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function engagementScore(m: NonNullable<NonNullable<OutcomeSubset['outcomes']>[number]['metrics']>): number {
  const saves = Math.min(1, (m.saves ?? 0) / 10);
  const comments = Math.min(1, (m.comments ?? 0) / 20);
  const shares = Math.min(1, (m.shares ?? 0) / 10);
  const retention = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  return Math.max(0, Math.min(10,
    (retention * 0.40 + scrollDepth * 0.15 + saves * 0.15 +
     comments * 0.10 + shares * 0.10 + bouncePenalty * 0.10) * 10,
  ));
}

function tokenize(s: string | undefined | null): string {
  return (s ?? '').toLowerCase();
}

// ─── dimension scorers ────────────────────────────────────────
//
// Each scorer reads a slice of outcomes for ONE segment and returns
// a 0..10 reading for that cultural-emotional axis. The scorers
// describe what the segment ENGAGED WITH; they do not describe the
// people in the segment.

type Outcome = NonNullable<OutcomeSubset['outcomes']>[number];

function silenceToleranceScore(records: Outcome[]): number {
  const stillnessShare = records.filter((r) =>
    /still|silen|pause|breath/.test(tokenize(r.visualStyle) + ' ' + tokenize(r.narrativeSignature)),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * stillnessShare / records.length);
}
function humorDensityScore(records: Outcome[]): number {
  const humorShare = records.filter((r) =>
    /humor|irony|playful|wry|joke/.test(tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature)),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * humorShare / records.length);
}
function emotionalDirectnessScore(records: Outcome[]): number {
  return clamp10(avg(records.map((r) => r.persuasionIntensity ?? 5)) * 0.6 +
    (records.filter((r) =>
      /direct|honest|plain|sincere/.test(tokenize(r.narrativeSignature)),
    ).length / Math.max(records.length, 1)) * 4);
}
function nostalgiaSensitivityScore(records: Outcome[]): number {
  const nostalgicShare = records.filter((r) =>
    /nostalg|childhood|memory|parents|old|past/.test(
      tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature) + ' ' + tokenize(r.visualStyle),
    ),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * nostalgicShare / records.length);
}
function familyOrientationScore(records: Outcome[]): number {
  const familyShare = records.filter((r) =>
    /family|kitchen|table|parents|kids|home/.test(
      tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature) + ' ' + tokenize(r.visualStyle),
    ),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * familyShare / records.length);
}
function aspirationStyleScore(records: Outcome[]): number {
  return clamp10(avg(records.map((r) => r.persuasionIntensity ?? 5)) * 0.4 +
    (records.filter((r) =>
      /aspir|ambit|dream|future|build/.test(tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature)),
    ).length / Math.max(records.length, 1)) * 6);
}
function realismPreferenceScore(records: Outcome[]): number {
  return clamp10(avg(records.map((r) => r.realismLevel ?? 5)));
}
function authorityTrustScore(records: Outcome[]): number {
  // Trust formation outcomes from authority-leaning content.
  const trustShare = records.filter((r) => r.downstreamOutcome === 'trust-formation').length;
  return records.length === 0 ? 5 : clamp10(10 * trustShare / records.length);
}
function ritualAttractionScore(records: Outcome[]): number {
  const ritualShare = records.filter((r) =>
    /ritual|routine|morning|night|coffee|bedtime|commute/.test(
      tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature) + ' ' + tokenize(r.visualStyle),
    ),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * ritualShare / records.length);
}
function vulnerabilityAcceptanceScore(records: Outcome[]): number {
  const vulShare = records.filter((r) =>
    /vulnera|tender|honest|tired|quiet|gentle|unsure/.test(
      tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature),
    ),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * vulShare / records.length);
}
function pacingPreferenceScore(records: Outcome[]): number {
  // 0 slow → 10 fast.
  const fast = records.filter((r) => r.cadenceState === 'burst' || r.cadenceState === 'normal').length;
  return records.length === 0 ? 5 : clamp10(10 * fast / records.length);
}
function symbolismOpennessScore(records: Outcome[]): number {
  const symbolicShare = records.filter((r) =>
    /symbol|imagery|metaphor|object|moment/.test(
      tokenize(r.narrativeSignature) + ' ' + tokenize(r.visualStyle),
    ),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * symbolicShare / records.length);
}
function optimismToleranceScore(records: Outcome[]): number {
  const optimisticShare = records.filter((r) =>
    /optim|hope|aspir|warm|light/.test(tokenize(r.emotionalSignature)),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * optimisticShare / records.length);
}
function emotionalWarmthScore(records: Outcome[]): number {
  const warmShare = records.filter((r) =>
    /warm|tender|gentle|kind|soft/.test(tokenize(r.visualStyle) + ' ' + tokenize(r.emotionalSignature)),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * warmShare / records.length);
}
function cinematicToleranceScore(records: Outcome[]): number {
  // Inverse of realism preference + presence of "cinematic" style.
  const cinematicShare = records.filter((r) =>
    /cinematic|polished|controlled/.test(tokenize(r.visualStyle)),
  ).length;
  return records.length === 0 ? 5 : clamp10(
    (10 * cinematicShare / records.length) * 0.6 +
    (10 - avg(records.map((r) => r.realismLevel ?? 5))) * 0.4,
  );
}
function ironyUsageScore(records: Outcome[]): number {
  const ironyShare = records.filter((r) =>
    /iron|wry|dry|self-aware/.test(tokenize(r.emotionalSignature) + ' ' + tokenize(r.narrativeSignature)),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * ironyShare / records.length);
}
function sincerityComfortScore(records: Outcome[]): number {
  // Inverse of irony usage.
  return clamp10(10 - ironyUsageScore(records));
}
function identityAttachmentScore(records: Outcome[]): number {
  const followRate = records.length === 0 ? 0 : avg(records.map((r) => Math.min(1, (r.metrics?.follows ?? 0) / 5)));
  const profileVisitsRate = records.length === 0 ? 0 : avg(records.map((r) => Math.min(1, (r.metrics?.profileVisits ?? 0) / 5)));
  return clamp10((followRate + profileVisitsRate) * 5);
}

function signatureFor(records: Outcome[]): CulturalSignature {
  return {
    silenceTolerance:        r1(silenceToleranceScore(records)),
    humorDensity:            r1(humorDensityScore(records)),
    emotionalDirectness:     r1(emotionalDirectnessScore(records)),
    nostalgiaSensitivity:    r1(nostalgiaSensitivityScore(records)),
    familyOrientation:       r1(familyOrientationScore(records)),
    aspirationStyle:         r1(aspirationStyleScore(records)),
    realismPreference:       r1(realismPreferenceScore(records)),
    authorityTrust:          r1(authorityTrustScore(records)),
    ritualAttraction:        r1(ritualAttractionScore(records)),
    vulnerabilityAcceptance: r1(vulnerabilityAcceptanceScore(records)),
    pacingPreference:        r1(pacingPreferenceScore(records)),
    symbolismOpenness:       r1(symbolismOpennessScore(records)),
    optimismTolerance:       r1(optimismToleranceScore(records)),
    emotionalWarmth:         r1(emotionalWarmthScore(records)),
    cinematicTolerance:      r1(cinematicToleranceScore(records)),
    ironyUsage:              r1(ironyUsageScore(records)),
    sincerityComfort:        r1(sincerityComfortScore(records)),
    identityAttachment:      r1(identityAttachmentScore(records)),
  };
}

// ─── collective memory observatory ────────────────────────────

function buildCollectiveMemory(records: Outcome[]): CollectiveMemoryEntry[] {
  // Group by emotional theme (emotional + narrative signature).
  const groups = new Map<string, Outcome[]>();
  for (const r of records) {
    const key = `${(r.emotionalSignature ?? '').toLowerCase()}|${(r.narrativeSignature ?? '').toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const entries: CollectiveMemoryEntry[] = [];
  for (const [theme, recs] of groups) {
    recs.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
    const scores = recs.map((r) => engagementScore(r.metrics ?? {}));
    const meanEngagement = r1(avg(scores));
    const half = Math.max(1, Math.floor(scores.length / 2));
    const early = avg(scores.slice(0, half));
    const recent = avg(scores.slice(-half));
    // Distinct segments touched by this theme.
    const segments = new Set(recs.map((r) => r.audienceSegment ?? 'unspecified'));
    const acrossSegments = segments.size;
    // Durability: high mean engagement + sustained across many appearances + appears across segments.
    const durability = r1(clamp10(
      meanEngagement * 0.5 +
      Math.min(10, recs.length) * 0.3 +
      Math.min(5, acrossSegments) * 0.4,
    ));
    const timeless = recs.length >= 4 && acrossSegments >= 2 && recent >= early * 0.85 && meanEngagement >= 5;
    const collapsed = recs.length >= 4 && early > 0 && recent < early * 0.5;
    entries.push({
      theme: theme || 'unsigned',
      occurrences: recs.length,
      durability,
      averageEngagement: meanEngagement,
      timeless,
      collapsed,
      description:
        `theme "${theme || 'unsigned'}" — ${recs.length} appearance(s) across ${acrossSegments} segment(s) ` +
        `· average engagement ${meanEngagement}/10` +
        (timeless ? ' · timeless' : '') + (collapsed ? ' · collapsed' : ''),
    });
  }
  entries.sort((a, b) => b.durability - a.durability || b.occurrences - a.occurrences || a.theme.localeCompare(b.theme));
  return entries;
}

function aestheticsLosingTrust(records: Outcome[]): Array<{ style: string; trustDelta: number; occurrences: number }> {
  const groups = new Map<string, Outcome[]>();
  for (const r of records) {
    const style = (r.visualStyle ?? '').toLowerCase();
    if (!style) continue;
    if (!groups.has(style)) groups.set(style, []);
    groups.get(style)!.push(r);
  }
  const out: Array<{ style: string; trustDelta: number; occurrences: number }> = [];
  for (const [style, recs] of groups) {
    if (recs.length < 4) continue;
    recs.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
    const half = Math.floor(recs.length / 2);
    const earlyTrust = recs.slice(0, half).filter((r) => r.downstreamOutcome === 'trust-formation').length / Math.max(half, 1);
    const recentTrust = recs.slice(-half).filter((r) => r.downstreamOutcome === 'trust-formation').length / Math.max(half, 1);
    const trustDelta = r1((recentTrust - earlyTrust) * 10);
    if (trustDelta <= -2) out.push({ style, trustDelta, occurrences: recs.length });
  }
  out.sort((a, b) => a.trustDelta - b.trustDelta);
  return out;
}

// ─── main ─────────────────────────────────────────────────────

export function computeCulturalMemory(input: CulturalInput): CulturalMemoryReading {
  const outcomes = input.outcomes?.outcomes ?? [];

  // Group by audience segment.
  const groups = new Map<string, Outcome[]>();
  for (const r of outcomes) {
    const seg = r.audienceSegment ?? 'unspecified';
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg)!.push(r);
  }

  const segments: CulturalSegmentSummary[] = [];
  for (const [seg, recs] of groups) {
    const engagement = recs.length === 0 ? 0 : avg(recs.map((r) => engagementScore(r.metrics ?? {})));
    const sig = signatureFor(recs);
    const dominant = (Object.entries(sig) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    const notes: string[] = [];
    if (sig.silenceTolerance >= 6) notes.push('high silence tolerance');
    if (sig.realismPreference >= 7) notes.push('strong realism preference');
    if (sig.ritualAttraction >= 6) notes.push('responds to ritual structures');
    if (sig.cinematicTolerance >= 6) notes.push('engages with cinematic polish');
    if (notes.length === 0) notes.push('no dominant cultural-emotional axis');
    segments.push({
      segment: seg,
      outcomes: recs.length,
      averageEngagement: r1(engagement),
      signature: sig,
      dominantDimensions: dominant,
      notes,
    });
  }
  segments.sort((a, b) =>
    b.outcomes - a.outcomes ||
    b.averageEngagement - a.averageEngagement ||
    a.segment.localeCompare(b.segment),
  );

  const collectiveMemory = buildCollectiveMemory(outcomes);
  const collapsedSymbols = collectiveMemory.filter((e) => e.collapsed);
  const losing = aestheticsLosingTrust(outcomes);

  // Overall emotional persistence: average durability of themes that
  // appeared in more than one segment.
  const cross = collectiveMemory.filter((e) => e.occurrences >= 2);
  const emotionalPersistence = cross.length === 0
    ? 0
    : r1(avg(cross.map((e) => e.durability)));

  return {
    totalOutcomes: outcomes.length,
    segments,
    collectiveMemory: collectiveMemory.slice(0, 16),
    collapsedSymbols,
    aestheticsLosingTrust: losing,
    emotionalPersistence,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `segments:${segments.length}`,
      `themes:${collectiveMemory.length}`,
      `collapsed-symbols:${collapsedSymbols.length}`,
      `aesthetics-losing-trust:${losing.length}`,
      `emotional-persistence:${emotionalPersistence}/10`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
