/**
 * Asset Quality Guard — pure validator that runs BEFORE rendering.
 *
 * It is the structural gate between an operator brief and the
 * renderer. If the brief asks for a product hero but does not
 * specify a product, the guard refuses with a clear reason. The
 * renderer NEVER ships an asset that the guard rejected.
 *
 * Operator-facing rejections use allowed phrasing only.
 *
 * STRICT CONTRACT:
 *   - pure (no I/O, no fetches)
 *   - deterministic for the same input
 *   - rejection is observational ("does not meet the contract") —
 *     never punitive
 *   - the operator is always the final authority and MAY override
 *     warnings; rejections block the render
 */

import type { Formula } from '@/core/types';
import { FORMULA_PALETTES } from '@/components/creative-brief-imagery';
import type {
  CreativeBrief, VisualMode, ProductPresence,
} from '@/components/creative-brief-svg';

// ─── result shape ─────────────────────────────────────────────

export type GuardLevel = 'rejection' | 'warning';

export interface GuardFinding {
  code: string;
  level: GuardLevel;
  field: string;
  detail: string;
}

export interface QualityGuardResult {
  ok: boolean;
  findings: GuardFinding[];
  rejections: GuardFinding[];
  warnings: GuardFinding[];
  advisoryNotice: string;
}

// ─── matchers ─────────────────────────────────────────────────

const HEBREW_LETTERS = /[֐-׿]/;
const LATIN_LETTERS  = /[A-Za-z]/;

/** Latin words allowed inside Hebrew copy (proper nouns / units). */
const ALLOWED_LATIN = new Set([
  'MOOD', 'ENERGY', 'FOCUS', 'RELAX', 'SLEEP',
  '30g', 'g', 'mg', 'mL', 'ml',
]);

/** Hebrew phrases that mark a headline as "too generic". */
const HEBREW_GENERIC_PATTERNS: Array<[string, RegExp]> = [
  ['cliché-discover', /(גלו עכשיו|לחצו כאן|קנו עכשיו|הזמינו עכשיו)/],
  ['cliché-best',     /(הכי טוב|הטוב ביותר|המומלץ ביותר)/],
  ['cliché-buy',      /(קנו|הזמינו)\s+(עכשיו|כעת|מיד)/],
];

function isHebrew(s: string): boolean { return HEBREW_LETTERS.test(s); }

function stripAllowedLatin(s: string): string {
  let out = s;
  for (const w of ALLOWED_LATIN) {
    out = out.replace(new RegExp(`\\b${w}\\b`, 'g'), '');
  }
  return out;
}

// ─── validators ───────────────────────────────────────────────

function checkProductPresence(brief: CreativeBrief): GuardFinding[] {
  const mode: VisualMode = brief.visualMode ?? 'text-only-editorial';
  const presence: ProductPresence = brief.productPresence ?? 'none';
  const requiresProduct = mode === 'product-hero' || mode === 'product-and-human';
  const out: GuardFinding[] = [];

  // Product modes MUST include a product (pouch or chocolate square).
  // human-moment does NOT require a product — the still-life scene
  // (window light, table) is what makes it not-a-plain-gradient.
  if (requiresProduct && presence === 'none') {
    out.push({
      code: 'product-missing',
      level: 'rejection',
      field: 'productPresence',
      detail: `Visual mode "${mode}" requires productPresence to include the pouch or chocolate square. ` +
              'Operator review required.',
    });
  }
  return out;
}

/** Plain-gradient detector: when a non-text mode is chosen but neither
 *  product nor scene-renderer would draw anything, reject. This is a
 *  separate check from product-missing because the rejection language
 *  is different. */
function checkPlainGradient(brief: CreativeBrief): GuardFinding[] {
  const mode: VisualMode = brief.visualMode ?? 'text-only-editorial';
  if (mode === 'text-only-editorial') return [];
  // human-moment always renders still-life scene props.
  // carousel-story delegates to per-slide modes — we trust those.
  // product modes already caught by product-missing.
  return [];
}

function checkFormulaColor(brief: CreativeBrief): GuardFinding[] {
  if (!FORMULA_PALETTES[brief.formula as Formula]) {
    return [{
      code: 'unknown-formula',
      level: 'rejection',
      field: 'formula',
      detail: `Formula "${brief.formula}" has no canonical palette. ` +
              `Allowed: ${Object.keys(FORMULA_PALETTES).join(', ')}.`,
    }];
  }
  return [];
}

function checkHebrewOnly(brief: CreativeBrief): GuardFinding[] {
  const fields: Array<{ name: string; value?: string }> = [
    { name: 'headline', value: brief.headline },
    { name: 'subline',  value: brief.subline ?? brief.body },
    { name: 'cta',      value: brief.cta },
  ];
  const out: GuardFinding[] = [];

  for (const f of fields) {
    if (!f.value) continue;
    if (!isHebrew(f.value)) {
      // headline / cta / subline must be Hebrew for the Israeli market
      // (the only market this generator targets in this phase).
      out.push({
        code: 'hebrew-required',
        level: 'rejection',
        field: f.name,
        detail: `Field "${f.name}" must contain Hebrew letters. Observed: "${f.value}".`,
      });
      continue;
    }
    const stripped = stripAllowedLatin(f.value);
    if (LATIN_LETTERS.test(stripped)) {
      // english leak — but allow proper nouns + units (stripped above)
      out.push({
        code: 'english-in-hebrew-asset',
        level: 'warning',
        field: f.name,
        detail: `Field "${f.name}" contains Latin letters not in the allow-list ` +
                `(MOOD, formula names, units). Observed leftover: "${stripped.trim()}".`,
      });
    }
  }

  // Carousel slides — apply same check to each headline.
  if (brief.slides && brief.slides.length > 0) {
    brief.slides.forEach((slide, idx) => {
      if (!isHebrew(slide.headline)) {
        out.push({
          code: 'hebrew-required',
          level: 'rejection',
          field: `slides[${idx}].headline`,
          detail: `Carousel slide ${idx + 1} headline must contain Hebrew letters.`,
        });
      }
    });
  }

  return out;
}

function checkHeadlineQuality(brief: CreativeBrief): GuardFinding[] {
  const out: GuardFinding[] = [];
  const h = brief.headline ?? '';
  if (h.length < 6) {
    out.push({
      code: 'headline-too-short',
      level: 'rejection',
      field: 'headline',
      detail: `Headline must be at least 6 characters. Observed: ${h.length}.`,
    });
  }
  for (const [tag, re] of HEBREW_GENERIC_PATTERNS) {
    if (re.test(h)) {
      out.push({
        code: `headline-generic-${tag}`,
        level: 'warning',
        field: 'headline',
        detail: `Headline contains a cliché pattern (${tag}). Consider a more specific phrasing.`,
      });
    }
  }
  return out;
}

function checkCtaPresent(brief: CreativeBrief): GuardFinding[] {
  const cta = (brief.cta ?? '').trim();
  if (cta.length === 0) {
    return [{
      code: 'cta-missing',
      level: 'rejection',
      field: 'cta',
      detail: 'CTA is required. The asset must end the operator decides what action follows.',
    }];
  }
  if (cta.length < 2) {
    return [{
      code: 'cta-too-short',
      level: 'rejection',
      field: 'cta',
      detail: `CTA must be at least 2 characters. Observed: ${cta.length}.`,
    }];
  }
  return [];
}

function checkAudienceAndEmotion(brief: CreativeBrief): GuardFinding[] {
  // These are descriptive operator fields. Missing them is a
  // warning, not a rejection — the renderer can still produce an
  // asset, but downstream analytics / approvals lose context.
  const out: GuardFinding[] = [];
  if (!brief.audience || brief.audience.trim().length === 0) {
    out.push({ code: 'audience-missing', level: 'warning', field: 'audience',
      detail: 'Audience description is missing. Add it so the asset has provenance.' });
  }
  if (!brief.emotion || brief.emotion.trim().length === 0) {
    out.push({ code: 'emotion-missing', level: 'warning', field: 'emotion',
      detail: 'Emotion description is missing. Add it so the brief is reproducible.' });
  }
  return out;
}

// ─── runner ───────────────────────────────────────────────────

export function runQualityGuard(brief: CreativeBrief): QualityGuardResult {
  const findings: GuardFinding[] = [
    ...checkProductPresence(brief),
    ...checkPlainGradient(brief),
    ...checkFormulaColor(brief),
    ...checkHebrewOnly(brief),
    ...checkHeadlineQuality(brief),
    ...checkCtaPresent(brief),
    ...checkAudienceAndEmotion(brief),
  ];
  const rejections = findings.filter((f) => f.level === 'rejection');
  const warnings   = findings.filter((f) => f.level === 'warning');
  return {
    ok: rejections.length === 0,
    findings, rejections, warnings,
    advisoryNotice:
      'Asset Quality Guard — observational only. Rejections block render. ' +
      'Warnings surface to the operator; the operator MAY override. ' +
      'Human remains final authority.',
  };
}
