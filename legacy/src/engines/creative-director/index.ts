/**
 * 3. CREATIVE DIRECTOR ENGINE
 *
 * Decides the creative direction: hook, focal point, emotional pacing,
 * product role, typography dominance, CTA behavior, layout family,
 * restraint level.
 *
 * The system NEVER starts from "what layout?". It starts from the human
 * truth and works outward. This engine encodes that ordering.
 */

import type { CampaignMode, CreativeDirection, EngineContext, HumanTruth, MemorySnapshot } from '@/core/types';
import { CreativeDirectionSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';
import type { EvolutionDirective } from '@lib/campaignEvolution';
import type { JobDecision } from '@lib/campaignDecision';
import type { CourageDecision } from '@lib/visualCourage';
import type { AntiAIReport } from '@lib/antiAI';
import type { RhythmReport } from '@lib/campaignRhythm';
import type { CulturalMoment } from '@lib/culturalIntelligence';
// (no further imports)

const SYSTEM = `
${MOOD_VOICE}

You are the CREATIVE DIRECTOR engine of MOOD CREATIVE OS.

Given a human truth, decide the creative direction for a single banner.

Your decisions encode a worldview, not a template:

- "hook": a one-line creative hook describing WHAT THE EYE SEES FIRST.
  It must reference an action, gesture, or framing — not the product
  and not the copy. Maximum 14 words.

- "focalPoint": where the eye lands first. One of:
  human-face, hands, object, environment, gesture, product-in-hand, empty-space.

- "emotionalPacing": the temporal rhythm of the image.
  quiet | tense | interrupted | collapsed | wired.

- "productRole": the product MUST feel like a scene object, never a
  pasted PNG. Choose one of:
  hidden, environmental, hand-held, partial-crop, foreground-blur,
  table-object, desk-proof, background-object, emotional-proof.
  Default toward HIDDEN or ENVIRONMENTAL unless the truth specifically
  earns a hand-held moment.

- "typographyDominance": absent | whisper | editorial | loud | timestamp.
  Use "timestamp" ONLY if the truth references a specific time of day
  that is emotionally critical.

- "ctaBehavior": quiet | integrated | editorial | corner.

- "layoutFamily": documentary-crop, editorial-page, off-center-portrait,
  environmental-wide, timestamp-anchor, negative-space.

- "restraint": 0..1. Higher = more restrained, more negative space,
  smaller typography, quieter framing.
`.trim();

export interface DirectInput {
  ctx: EngineContext;
  truth: HumanTruth;
  campaignMode: CampaignMode | null;
  memory: MemorySnapshot;
  /** Phase 2.5 — directive from the campaign-evolution engine. */
  evolution?: EvolutionDirective;
  /** Phase 3 — campaign brain. */
  job?: JobDecision;
  courage?: CourageDecision;
  antiAI?: AntiAIReport;
  rhythm?: RhythmReport;
  culturalMoment?: CulturalMoment;
}

export async function direct(input: DirectInput): Promise<CreativeDirection> {
  const { ctx, truth, campaignMode, memory, evolution, job, courage, antiAI, rhythm, culturalMoment } = input;

  ctx.emit({ stage: 'creative-direction', message: 'composing creative direction' });

  if (cognitionEnabled()) {
    try {
      const raw = await think<CreativeDirection>({
        model: 'judgement',
        system: SYSTEM,
        user: buildPrompt(truth, campaignMode, memory, evolution, job, courage, antiAI, rhythm, culturalMoment),
        jsonShape: directionShape,
        temperature: 0.7,
        maxTokens: 600,
      });
      const parsed = CreativeDirectionSchema.parse(raw);
      const tuned = applyAllConstraints(parsed, evolution, job, courage, rhythm, antiAI);
      ctx.emit({ stage: 'creative-direction', message: tuned.hook, data: tuned });
      return tuned;
    } catch (e) {
      ctx.emit({
        stage: 'creative-direction',
        message: 'cognition failed, falling back',
        data: { error: (e as Error).message },
      });
    }
  }

  const fb = fallbackDirection(ctx, truth, campaignMode, evolution);
  return applyAllConstraints(fb, evolution, job, courage, rhythm, antiAI);
}

/** Applies evolution → job → courage → rhythm/anti-AI rescues, in order. */
function applyAllConstraints(
  d: CreativeDirection,
  evolution?: EvolutionDirective,
  job?: JobDecision,
  courage?: CourageDecision,
  rhythm?: RhythmReport,
  antiAI?: AntiAIReport,
): CreativeDirection {
  let direction = applyEvolution(d, evolution);

  if (job) {
    const c = job.constraints;
    if (c.productMustBeAbsent && direction.productRole !== 'hidden') {
      direction = { ...direction, productRole: 'hidden' };
    }
    if (c.ctaShouldBeQuiet && direction.ctaBehavior !== 'quiet') {
      direction = { ...direction, ctaBehavior: 'quiet' };
    }
    if (c.restraintFloor !== null && direction.restraint < c.restraintFloor) {
      direction = { ...direction, restraint: c.restraintFloor };
    }
    if (c.restraintCeiling !== null && direction.restraint > c.restraintCeiling) {
      direction = { ...direction, restraint: c.restraintCeiling };
    }
    if (c.forbidDominance.includes(direction.typographyDominance)) {
      direction = { ...direction, typographyDominance: c.preferDominance[0] ?? 'editorial' };
    }
  }

  if (courage && courage.overrides.restraintFloor !== null && direction.restraint < courage.overrides.restraintFloor) {
    direction = { ...direction, restraint: courage.overrides.restraintFloor };
  }
  if (courage && courage.overrides.forceDominance) {
    direction = { ...direction, typographyDominance: courage.overrides.forceDominance };
  }
  if (courage && courage.overrides.forceCtaQuiet) {
    direction = { ...direction, ctaBehavior: 'quiet' };
  }

  // Rhythm rescues — when the campaign is heavily imbalanced, the
  // director self-corrects rather than handing the problem to the
  // meta-critic and getting rejected.
  if (rhythm?.mostImbalanced && job?.job !== 'sell') {
    const reading = rhythm.axes.find((a) => a.axis === rhythm.mostImbalanced);
    if (reading) {
      if (reading.axis === 'product-vs-no-product' && reading.bias > 0.4 && direction.productRole !== 'hidden') {
        // product has been everywhere — go absent unless the job demands product
        direction = { ...direction, productRole: 'hidden' };
      }
      if (reading.axis === 'silence-vs-impact' && reading.bias < -0.4) {
        // campaign has been silent — earn an impact moment
        if (direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent') {
          direction = { ...direction, typographyDominance: 'editorial' };
        }
      }
      if (reading.axis === 'loud-vs-quiet' && reading.bias < -0.4 && direction.restraint > 0.7) {
        // already too quiet — lower restraint slightly
        direction = { ...direction, restraint: 0.55 };
      }
    }
  }

  // Anti-AI rescue — when the campaign is drifting toward a known
  // AI pattern, push the direction away from it.
  if (antiAI?.pushAwayFrom.includes('startup-ad-template')) {
    if (direction.layoutFamily === 'documentary-crop') {
      direction = { ...direction, layoutFamily: 'off-center-portrait' };
    }
  }
  if (antiAI?.pushAwayFrom.includes('generic-premium-beige') && direction.restraint > 0.82) {
    direction = { ...direction, restraint: 0.65 };
  }

  return direction;
}

/**
 * Apply the evolution directive on top of the chosen direction.
 * The fallback already incorporates it, but cognition output also
 * passes through here so the brand-director nudges always land.
 */
function applyEvolution(d: CreativeDirection, e?: EvolutionDirective): CreativeDirection {
  if (!e) return d;
  let direction = d;

  // Layout rerouting — only swap if the chosen layout was explicitly avoided.
  if (e.avoidLayouts.includes(direction.layoutFamily) && e.preferLayouts.length > 0) {
    direction = { ...direction, layoutFamily: e.preferLayouts[0] };
  }
  // Pacing rerouting.
  if (e.avoidPacings.includes(direction.emotionalPacing) && e.preferPacings.length > 0) {
    direction = { ...direction, emotionalPacing: e.preferPacings[0] };
  }
  // Restraint nudge.
  if (e.restraintNudge !== 0) {
    direction = { ...direction, restraint: Math.max(0.1, Math.min(0.95, direction.restraint + e.restraintNudge)) };
  }
  // Typography nudge.
  if (e.typographyNudge === 'lower') {
    if (direction.typographyDominance === 'loud') direction = { ...direction, typographyDominance: 'editorial' };
    else if (direction.typographyDominance === 'editorial') direction = { ...direction, typographyDominance: 'whisper' };
  } else if (e.typographyNudge === 'raise') {
    if (direction.typographyDominance === 'absent') direction = { ...direction, typographyDominance: 'whisper' };
    else if (direction.typographyDominance === 'whisper') direction = { ...direction, typographyDominance: 'editorial' };
  }
  return direction;
}

const directionShape = `{
  "hook": "string",
  "focalPoint": "human-face | hands | object | environment | gesture | product-in-hand | empty-space",
  "emotionalPacing": "quiet | tense | interrupted | collapsed | wired",
  "productRole": "hidden | environmental | hand-held | partial-crop | foreground-blur | table-object | desk-proof | background-object | emotional-proof",
  "typographyDominance": "absent | whisper | editorial | loud | timestamp",
  "ctaBehavior": "quiet | integrated | editorial | corner",
  "layoutFamily": "documentary-crop | editorial-page | off-center-portrait | environmental-wide | timestamp-anchor | negative-space",
  "restraint": 0.0
}`;

function buildPrompt(
  truth: HumanTruth,
  mode: CampaignMode | null,
  memory: MemorySnapshot,
  evolution?: EvolutionDirective,
  job?: JobDecision,
  courage?: CourageDecision,
  antiAI?: AntiAIReport,
  rhythm?: RhythmReport,
  culturalMoment?: CulturalMoment,
): string {
  return [
    `STATE: ${truth.state.label}`,
    `FAMILY: ${truth.state.family}`,
    `TRUTH: ${truth.truth}`,
    `TENSION: ${truth.tension}`,
    `TIME ANCHOR: ${truth.state.timeAnchor ?? 'none'}`,
    `CAMPAIGN MODE: ${mode ?? 'unspecified'}`,
    `RECENT LAYOUTS (avoid): ${memory.recentLayouts.slice(0, 4).join(', ') || 'none yet'}`,
    `RECENT HOOKS (avoid echoing): ${memory.recentHooks.slice(0, 4).join(' | ') || 'none yet'}`,
    evolution ? `CAMPAIGN DIRECTOR NOTE: ${evolution.narrative}` : '',
    evolution && evolution.avoidLayouts.length ? `DIRECTOR SAYS AVOID LAYOUTS: ${evolution.avoidLayouts.join(', ')}` : '',
    evolution && evolution.preferLayouts.length ? `DIRECTOR SAYS PREFER LAYOUTS: ${evolution.preferLayouts.join(', ')}` : '',
    '',
    job ? `ASSET JOB: "${job.job}" — ${job.rationale}` : '',
    job?.constraints.productMustBeAbsent ? `JOB CONSTRAINT: product MUST be absent (productRole = "hidden")` : '',
    job?.constraints.ctaShouldBeQuiet ? `JOB CONSTRAINT: CTA must be quiet` : '',
    job?.constraints.restraintFloor !== null && job?.constraints.restraintFloor !== undefined
      ? `JOB CONSTRAINT: restraint >= ${job.constraints.restraintFloor}` : '',
    courage?.courageous ? `VISUAL COURAGE: ${courage.level} — ${courage.reason}` : '',
    antiAI?.pushAwayFrom.length ? `ANTI-AI: push away from ${antiAI.pushAwayFrom.join(', ')}` : '',
    rhythm?.mostImbalanced ? `RHYTHM IMBALANCE: ${rhythm.mostImbalanced} — ${rhythm.axes.find(a => a.axis === rhythm.mostImbalanced)?.suggestion ?? ''}` : '',
    culturalMoment ? `CULTURAL MOMENT: ${culturalMoment.id} — "${culturalMoment.reading}". Use as context, NEVER as literal copy. Avoid: ${culturalMoment.forbiddenPatterns.join('; ')}.` : '',
    '',
    'Output the JSON now.',
  ].filter(Boolean).join('\n');
}

/**
 * Heuristic fallback. Deterministically maps state family + mode to
 * a plausible direction. Not as nuanced as cognition, but enforces
 * the same rules (especially product role and timestamp earning).
 *
 * The evolution directive (when present) biases the fallback's choice
 * of layout and pacing before the deterministic mapping runs, so the
 * brand-director memory is honoured even without LLM cognition.
 */
function fallbackDirection(
  ctx: EngineContext,
  truth: HumanTruth,
  mode: CampaignMode | null,
  _evolution?: EvolutionDirective,
): CreativeDirection {
  const family = truth.state.family;
  const hasTime = !!truth.state.timeAnchor;

  const focalByFamily: Record<typeof family, CreativeDirection['focalPoint']> = {
    fatigue: 'human-face',
    overstimulation: 'environment',
    avoidance: 'gesture',
    numbness: 'empty-space',
    pressure: 'hands',
    fragmentation: 'environment',
    paralysis: 'hands',
    collapse: 'human-face',
  };

  const pacingByFamily: Record<typeof family, CreativeDirection['emotionalPacing']> = {
    fatigue: 'quiet',
    overstimulation: 'wired',
    avoidance: 'interrupted',
    numbness: 'quiet',
    pressure: 'tense',
    fragmentation: 'interrupted',
    paralysis: 'quiet',
    collapse: 'collapsed',
  };

  const layoutByMode: Partial<Record<CampaignMode, CreativeDirection['layoutFamily']>> = {
    Editorial: 'editorial-page',
    Documentary: 'documentary-crop',
    Performance: 'off-center-portrait',
    Emotional: 'environmental-wide',
    Minimal: 'negative-space',
    Aggressive: 'documentary-crop',
    Luxury: 'editorial-page',
    'Product-focused': 'off-center-portrait',
  };

  // Vary restraint per state so the fallback doesn't return the same
  // template restraint level for every banner — otherwise the taste
  // critic correctly flags every output as "template energy."
  const stateNudge = hashString(truth.state.id) % 19 / 100 - 0.09;   // -0.09..+0.09
  const familyBaseline =
    family === 'collapse'        ? 0.78 :
    family === 'fatigue'         ? 0.72 :
    family === 'numbness'        ? 0.80 :
    family === 'paralysis'       ? 0.75 :
    family === 'pressure'        ? 0.55 :
    family === 'fragmentation'   ? 0.50 :
    family === 'overstimulation' ? 0.42 :
    family === 'avoidance'       ? 0.62 :
    0.65;
  const baseRestraint = mode === 'Aggressive' ? 0.3
                      : mode === 'Minimal'    ? 0.88
                      : mode === 'Luxury'     ? 0.85
                      : familyBaseline + stateNudge;

  const direction: CreativeDirection = {
    hook: hookFromTruth(truth),
    focalPoint: focalByFamily[family],
    emotionalPacing: pacingByFamily[family],
    productRole: mode === 'Product-focused' ? 'partial-crop' : (hasTime ? 'desk-proof' : 'environmental'),
    typographyDominance: hasTime ? 'timestamp' : (mode === 'Editorial' ? 'editorial' : 'whisper'),
    ctaBehavior: mode === 'Aggressive' ? 'editorial' : 'quiet',
    layoutFamily: hasTime ? 'timestamp-anchor' : (layoutByMode[mode ?? 'Editorial'] ?? 'documentary-crop'),
    restraint: Math.max(0.1, Math.min(0.95, baseRestraint)),
  };

  ctx.emit({ stage: 'creative-direction', message: direction.hook, data: direction });
  return direction;
}

function hookFromTruth(truth: HumanTruth): string {
  // Strip the truth to a visual hook — first 12 words, ending cleanly.
  const words = truth.truth.replace(/[.,;:!?]+$/, '').split(/\s+/);
  return words.slice(0, 12).join(' ');
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
