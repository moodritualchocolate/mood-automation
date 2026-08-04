/**
 * VIDEO EXECUTION ENGINE (pure, observational)
 *
 * Phase 2 — Execution Layer.
 *
 * Transforms an APPROVED video brief + production prompt into a
 * VIDEO GENERATION PACKAGE — scene list, camera, audio, timing,
 * caption, hashtags. This engine does NOT call any video model.
 * It composes the spec text only.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never calls a generator
 *   - never publishes
 *   - never auto-approves
 *   - hashtags are restrained, brand-true — no growth-hacking tags
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';
import type { VideoBrief } from './creativeBriefGenerator';
import type { PromptArtifact } from './promptArchitect';

// ─── input ────────────────────────────────────────────────────

export interface VideoExecutionInput {
  brief: VideoBrief;
  prompt: PromptArtifact;
  platform?: VideoPlatform;
  aspectRatio?: VideoAspectRatio;
}

export type VideoPlatform =
  | 'instagram-reels' | 'instagram-story' | 'tiktok' | 'youtube-shorts'
  | 'facebook-reels' | 'website-hero';

export type VideoAspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

// ─── output ───────────────────────────────────────────────────

export interface VideoSceneSpec {
  index: number;
  scene: string;
  beat: string;
  cameraDirection: string;
  durationSeconds: number;
  silenceShare: number;
}

export interface VideoExecutionPackage {
  packageId: string;
  packageType: 'video';
  formula: Formula;
  sourceStoryName: string;
  sourceBriefId: string;
  sourcePromptId: string;
  prompt: string;
  /** Ordered scene list with camera direction + timing per beat. */
  scenes: VideoSceneSpec[];
  totalDurationSeconds: number;
  aspectRatio: VideoAspectRatio;
  dimensions: { width: number; height: number };
  platform: VideoPlatform;
  /** Camera / lens summary for the whole piece. */
  camera: string;
  /** Audio direction — restrained, no music swell. */
  audio: string;
  /** Hebrew captions block (Israeli market) or English captions block. */
  caption: string;
  /** Restrained brand-true hashtags. No growth-hacking. */
  hashtags: string[];
  targetAudience: string;
  operatorApprovalRequired: true;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Video execution package is a specification only. ' +
  'No video generation occurs in this engine. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function platformFor(brief: VideoBrief): VideoPlatform {
  if (brief.audienceMarket === 'global') return 'instagram-reels';
  return 'instagram-reels';
}

function aspectFor(platform: VideoPlatform): VideoAspectRatio {
  switch (platform) {
    case 'instagram-reels':  return '9:16';
    case 'instagram-story':  return '9:16';
    case 'tiktok':           return '9:16';
    case 'youtube-shorts':   return '9:16';
    case 'facebook-reels':   return '9:16';
    case 'website-hero':     return '16:9';
  }
}

function dimensionsFor(ar: VideoAspectRatio): { width: number; height: number } {
  switch (ar) {
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1':  return { width: 1080, height: 1080 };
    case '16:9': return { width: 1920, height: 1080 };
    case '4:5':  return { width: 1080, height: 1350 };
  }
}

function audioDirectionFor(brief: VideoBrief): string {
  return [
    'ambient room sound · diegetic only',
    'no music swell · no dramatic cue · no manufactured urgency',
    'optional restrained ambient bed (low volume) · operator review required',
    brief.rhythm ? `rhythm match: ${brief.rhythm}` : 'rhythm match: measured restraint',
  ].join(' · ');
}

function cameraSummaryFor(brief: VideoBrief): string {
  return [
    '50mm or 35mm handheld · natural light · soft falloff',
    'minimal movement · slow push-in or static · no rack-zoom',
    'no whip-pan · no fast cut · no jump-cut',
    brief.realismAnchors.length > 0 ? `realism: ${brief.realismAnchors.join(' · ')}` : 'realism: documentary handheld',
  ].join(' · ');
}

function captionFor(brief: VideoBrief): string {
  if (brief.audienceMarket === 'israel') {
    return [
      'Hebrew captions for accessibility · RTL alignment',
      'final frame: small Hebrew product line only — no aspirational claims',
      'no manufactured urgency · no clickbait',
    ].join(' · ');
  }
  return [
    'English captions for accessibility',
    'final frame: small product line only — no aspirational claims',
    'no manufactured urgency · no clickbait',
  ].join(' · ');
}

function restrainedHashtags(formula: Formula, market: string | undefined): string[] {
  // Restrained, brand-true. No #ad, #fyp, #foryou, #viral, #explore.
  const base = [
    `#MOOD_${formula}`,
    '#chocolate',
    '#ritual',
    '#quiet',
  ];
  if (market === 'israel') {
    return [...base, '#מצב_רוח', '#שוקולד'];
  }
  return base;
}

function distributeDuration(total: number, count: number, weightFn: (i: number) => number): number[] {
  if (count <= 0) return [];
  const weights = Array.from({ length: count }, (_, i) => weightFn(i));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  // Round to one decimal and reconcile so the sum is exact.
  const rounded = raw.map((v) => Math.round(v * 10) / 10);
  const diff = total - rounded.reduce((a, b) => a + b, 0);
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 10) / 10;
  return rounded;
}

// ─── main ─────────────────────────────────────────────────────

export function composeVideoExecutionPackage(input: VideoExecutionInput): VideoExecutionPackage {
  const { brief, prompt } = input;
  const platform = input.platform ?? platformFor(brief);
  const aspect = input.aspectRatio ?? aspectFor(platform);
  const dims = dimensionsFor(aspect);
  const total = brief.durationSeconds;
  // Distribute duration with slightly more time on the pause beat.
  const durations = distributeDuration(
    total,
    brief.beats.length,
    (i) => i === Math.floor(brief.beats.length / 2) ? 1.4 : 1.0,
  );

  const scenes: VideoSceneSpec[] = brief.beats.map((b, i) => ({
    index: b.index,
    scene: b.scene,
    beat: b.beat,
    cameraDirection: i === 0
      ? 'static · low angle · 50mm handheld · soft natural light'
      : i === brief.beats.length - 1
        ? 'static · close · 50mm handheld · single warm practical light'
        : 'slow push-in · 35mm handheld · soft natural light · minimal movement',
    durationSeconds: durations[i] ?? 0,
    silenceShare: b.silenceShare,
  }));

  return {
    packageId: `exec-video-${brief.briefId.replace('brief-video-', '')}`,
    packageType: 'video',
    formula: brief.formula,
    sourceStoryName: brief.sourceStoryName,
    sourceBriefId: brief.briefId,
    sourcePromptId: prompt.promptId,
    prompt: prompt.promptText,
    scenes,
    totalDurationSeconds: total,
    aspectRatio: aspect,
    dimensions: dims,
    platform,
    camera: cameraSummaryFor(brief),
    audio: audioDirectionFor(brief),
    caption: captionFor(brief),
    hashtags: restrainedHashtags(brief.formula, brief.audienceMarket),
    targetAudience: brief.audienceMarket === 'israel'
      ? 'Adults observed seeking restraint over hype · Israeli market · mobile-first'
      : 'Adults observed seeking restraint over hype · global',
    operatorApprovalRequired: true,
    notes: [
      'execution package — ready for operator-driven generation',
      'operator approval required before any generation',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
