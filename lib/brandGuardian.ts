/**
 * BRAND GUARDIAN (pure, observational)
 *
 * Phase 3 — Creative Production Layer.
 *
 * Verifies briefs + prompts against brand rules:
 *   - logo rules (mention / placement language)
 *   - formula colors (per-mood palette guidance)
 *   - Hebrew language presence on Israeli-market briefs
 *   - product dimensions language presence
 *   - brand consistency (no rule-violating tokens)
 *   - packaging consistency (no invented packaging variants)
 *   - no invented products (no fictional flavors / formulas)
 *
 * The engine NEVER auto-corrects. It only WARNS. The operator decides.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-fixes briefs or prompts
 *   - never blocks (only warns)
 *   - allowed phrasing: "brand guardian observed", "operator approval
 *     required", "rule appears upheld", "rule appears violated",
 *     "requires more evidence"
 *   - forbidden: predict, best, winner, recommended, selected, chosen,
 *     optimal, auto-apply, optimize, viral, dopamine, outrage,
 *     manipulat, exploit
 */

import type { Formula } from '@/core/types';

// ─── known brand corpus ───────────────────────────────────────

export const KNOWN_FORMULAS: Formula[] = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];

export const FORMULA_COLOR_GUIDE: Record<Formula, string> = {
  ENERGY: 'warm wake tones — soft amber, morning cream, low-saturation orange',
  FOCUS:  'cool neutral tones — soft slate, paper white, low-saturation blue-gray',
  RELAX:  'warm evening tones — soft terracotta, dim amber, low-saturation rose',
  SLEEP:  'deep restful tones — soft navy, warm charcoal, low-saturation indigo',
};

// Phrases that violate the brand truth core (drawn from
// lib/brandTruthCore.ts patterns).
const REFUSAL_PATTERNS: Array<[string, RegExp]> = [
  ['supplement-hype', /\b(supplement|dose|nootropic|boost your|fuel your)\b/i],
  ['luxury-performance', /\b(luxur(y|ious)|elevate your|indulge|premium experience|treat yourself)\b/i],
  ['influencer-wellness', /\b(my routine|link in bio|use my code|sponsored)\b/i],
  ['productivity-drug', /\b(productivity hack|get more done|unlock focus|peak performance|grind\b)/i],
  ['fake-mental-health', /\b(healing era|trauma|therapy[- ]?speak|inner child)\b/i],
  ['tiktok-wellness', /\b(that girl|soft girl|wellness era|romanticis(e|ing) (my|your))\b/i],
];

// Invented-product hints — fictional flavors not in MOOD's line.
const INVENTED_PRODUCT_PATTERNS: Array<[string, RegExp]> = [
  ['invented-flavor', /\b(strawberry|matcha|caramel|peanut butter|hazelnut|orange|mint)\s+(MOOD|mood)\b/i],
  ['invented-formula', /\bMOOD\s+(CALM|JOY|VIBE|RAGE|HUSTLE|VICTORY|DREAM|RIZZ)\b/i],
  ['invented-packaging', /\b(limited edition|holiday edition|collab edition|gold edition|holo)\b/i],
];

// ─── input ────────────────────────────────────────────────────

export interface GuardianBriefHint {
  briefId: string;
  briefType: string;
  formula: Formula;
  sourceStoryName: string;
  audienceMarket?: string;
  /** Concatenable strings from the brief — copyDirection / productDirection / scene / etc. */
  briefText: string;
}

export interface GuardianPromptHint {
  promptId: string;
  promptType: string;
  formula: Formula;
  sourceStoryName: string;
  promptText: string;
}

export interface BrandGuardianInput {
  briefs?: GuardianBriefHint[];
  prompts?: GuardianPromptHint[];
  audienceMarket?: 'israel' | 'global';
}

// ─── output ───────────────────────────────────────────────────

export type RuleStatus = 'upheld' | 'requires-more-evidence' | 'violated';

export interface GuardianFinding {
  ruleId: string;
  ruleName: string;
  status: RuleStatus;
  detail: string;
}

export interface GuardianReport {
  targetId: string;
  targetType: 'brief' | 'prompt';
  formula: Formula;
  sourceStoryName: string;
  findings: GuardianFinding[];
  /** Counts. */
  violationCount: number;
  evidenceGapCount: number;
  /** 0..10 — composite alignment. */
  brandAlignment: number;
  operatorApprovalRequired: true;
  notes: string[];
}

export interface BrandGuardianReading {
  briefReports: GuardianReport[];
  promptReports: GuardianReport[];
  /** Counts across all targets. */
  totalViolations: number;
  totalEvidenceGaps: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Brand guardian observed briefs and prompts. ' +
  'Findings are observational. The engine never auto-corrects. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

function check(text: string, re: RegExp): boolean { return re.test(text); }

interface RuleSpec {
  ruleId: string;
  ruleName: string;
  evaluate: (text: string, target: { formula: Formula; audienceMarket?: string }) => GuardianFinding;
}

const RULES: RuleSpec[] = [
  {
    ruleId: 'logo-rules',
    ruleName: 'logo rules',
    evaluate: (text, target) => {
      const mentionsLogo = /\b(MOOD|mood logo)\b/.test(text);
      const placementHint = /\b(logo placement|placement|safe area|safe areas|safe zone)\b/i.test(text);
      if (!mentionsLogo) {
        return { ruleId: 'logo-rules', ruleName: 'logo rules',
          status: 'requires-more-evidence',
          detail: 'no MOOD reference observed — requires more evidence the logo will appear correctly' };
      }
      if (mentionsLogo && placementHint) {
        return { ruleId: 'logo-rules', ruleName: 'logo rules',
          status: 'upheld',
          detail: `MOOD ${target.formula} reference observed alongside safe-area / placement guidance` };
      }
      return { ruleId: 'logo-rules', ruleName: 'logo rules',
        status: 'requires-more-evidence',
        detail: 'MOOD reference observed but placement guidance not explicit — requires more evidence' };
    },
  },
  {
    ruleId: 'formula-colors',
    ruleName: 'formula colors',
    evaluate: (text, target) => {
      const guide = FORMULA_COLOR_GUIDE[target.formula] ?? '';
      // Approximate: check for any of the formula's color words.
      const colorTokens = guide.toLowerCase().match(/[a-z][a-z- ]+/g)?.filter((s) => s.length >= 4) ?? [];
      const hits = colorTokens.filter((t) => text.toLowerCase().includes(t.trim())).length;
      if (hits >= 1) {
        return { ruleId: 'formula-colors', ruleName: 'formula colors',
          status: 'upheld',
          detail: `${target.formula} palette token observed alongside the target` };
      }
      return { ruleId: 'formula-colors', ruleName: 'formula colors',
        status: 'requires-more-evidence',
        detail: `${target.formula} palette tokens not yet observed — requires more evidence (guide: ${guide})` };
    },
  },
  {
    ruleId: 'hebrew-language',
    ruleName: 'Hebrew language',
    evaluate: (text, target) => {
      if (target.audienceMarket && target.audienceMarket !== 'israel') {
        return { ruleId: 'hebrew-language', ruleName: 'Hebrew language',
          status: 'upheld',
          detail: 'non-Israeli market — Hebrew rule does not apply' };
      }
      const mentionsHebrew = /\bHebrew\b/i.test(text) || /[֐-׿]/.test(text);
      const mentionsRTL = /\b(RTL|right-to-left)\b/i.test(text);
      if (mentionsHebrew && mentionsRTL) {
        return { ruleId: 'hebrew-language', ruleName: 'Hebrew language',
          status: 'upheld',
          detail: 'Hebrew + RTL guidance observed alongside the target' };
      }
      if (mentionsHebrew || mentionsRTL) {
        return { ruleId: 'hebrew-language', ruleName: 'Hebrew language',
          status: 'requires-more-evidence',
          detail: 'partial Hebrew / RTL guidance observed — requires more evidence' };
      }
      return { ruleId: 'hebrew-language', ruleName: 'Hebrew language',
        status: 'violated',
        detail: 'no Hebrew / RTL guidance observed on Israeli-market target' };
    },
  },
  {
    ruleId: 'product-dimensions',
    ruleName: 'product dimensions',
    evaluate: (text) => {
      const hasDim = /\b(dimension|dimensions|80.{0,3}100\s*mm|25\s*mm|bar|square|hand|surface)\b/i.test(text);
      if (hasDim) {
        return { ruleId: 'product-dimensions', ruleName: 'product dimensions',
          status: 'upheld',
          detail: 'product dimension / scale reference observed alongside the target' };
      }
      return { ruleId: 'product-dimensions', ruleName: 'product dimensions',
        status: 'requires-more-evidence',
        detail: 'no explicit product dimension reference observed — requires more evidence' };
    },
  },
  {
    ruleId: 'brand-consistency',
    ruleName: 'brand consistency',
    evaluate: (text) => {
      const violations: string[] = [];
      for (const [tag, re] of REFUSAL_PATTERNS) {
        if (check(text, re)) violations.push(tag);
      }
      if (violations.length === 0) {
        return { ruleId: 'brand-consistency', ruleName: 'brand consistency',
          status: 'upheld',
          detail: 'no brand-refusal patterns observed' };
      }
      return { ruleId: 'brand-consistency', ruleName: 'brand consistency',
        status: 'violated',
        detail: `brand-refusal patterns observed: ${violations.join(', ')}` };
    },
  },
  {
    ruleId: 'packaging-consistency',
    ruleName: 'packaging consistency',
    evaluate: (text, target) => {
      const guide = FORMULA_COLOR_GUIDE[target.formula] ?? '';
      const mentionsPackaging = /\b(packaging|wrapper|box|sleeve)\b/i.test(text);
      const mentionsBrandLine = /\b(MOOD\s+(ENERGY|FOCUS|RELAX|SLEEP))\b/.test(text);
      if (!mentionsPackaging && !mentionsBrandLine) {
        return { ruleId: 'packaging-consistency', ruleName: 'packaging consistency',
          status: 'requires-more-evidence',
          detail: 'no packaging reference observed — requires more evidence' };
      }
      if (mentionsBrandLine) {
        return { ruleId: 'packaging-consistency', ruleName: 'packaging consistency',
          status: 'upheld',
          detail: `MOOD ${target.formula} packaging line referenced (color guide: ${guide})` };
      }
      return { ruleId: 'packaging-consistency', ruleName: 'packaging consistency',
        status: 'requires-more-evidence',
        detail: 'packaging referenced but brand line not explicit — requires more evidence' };
    },
  },
  {
    ruleId: 'no-invented-products',
    ruleName: 'no invented products',
    evaluate: (text) => {
      const violations: string[] = [];
      for (const [tag, re] of INVENTED_PRODUCT_PATTERNS) {
        if (check(text, re)) violations.push(tag);
      }
      if (violations.length === 0) {
        return { ruleId: 'no-invented-products', ruleName: 'no invented products',
          status: 'upheld',
          detail: 'no invented-product patterns observed' };
      }
      return { ruleId: 'no-invented-products', ruleName: 'no invented products',
        status: 'violated',
        detail: `invented-product patterns observed: ${violations.join(', ')}` };
    },
  },
];

function evaluateTarget(
  text: string,
  formula: Formula,
  audienceMarket: string | undefined,
): { findings: GuardianFinding[]; alignment: number; violations: number; gaps: number } {
  const findings = RULES.map((rule) =>
    rule.evaluate(text, { formula, audienceMarket }),
  );
  const violations = findings.filter((f) => f.status === 'violated').length;
  const gaps = findings.filter((f) => f.status === 'requires-more-evidence').length;
  const upheld = findings.filter((f) => f.status === 'upheld').length;
  const alignment = r1(clamp10((upheld / Math.max(1, findings.length)) * 10 - violations * 1.5));
  return { findings, alignment, violations, gaps };
}

// ─── main ─────────────────────────────────────────────────────

export function computeBrandGuardian(input: BrandGuardianInput): BrandGuardianReading {
  const briefs = input.briefs ?? [];
  const prompts = input.prompts ?? [];

  const briefReports: GuardianReport[] = briefs.map((b) => {
    const evalResult = evaluateTarget(b.briefText, b.formula, b.audienceMarket);
    return {
      targetId: b.briefId,
      targetType: 'brief',
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      findings: evalResult.findings,
      violationCount: evalResult.violations,
      evidenceGapCount: evalResult.gaps,
      brandAlignment: evalResult.alignment,
      operatorApprovalRequired: true,
      notes: evalResult.violations > 0
        ? ['brand guardian observed violations — operator approval required before any production']
        : evalResult.gaps > 0
        ? ['brand guardian observed evidence gaps — operator review required']
        : ['brand guardian rules appear upheld'],
    };
  });

  const promptReports: GuardianReport[] = prompts.map((p) => {
    const evalResult = evaluateTarget(p.promptText, p.formula, undefined);
    return {
      targetId: p.promptId,
      targetType: 'prompt',
      formula: p.formula,
      sourceStoryName: p.sourceStoryName,
      findings: evalResult.findings,
      violationCount: evalResult.violations,
      evidenceGapCount: evalResult.gaps,
      brandAlignment: evalResult.alignment,
      operatorApprovalRequired: true,
      notes: evalResult.violations > 0
        ? ['brand guardian observed violations in prompt — operator approval required']
        : evalResult.gaps > 0
        ? ['brand guardian observed evidence gaps in prompt — operator review required']
        : ['brand guardian rules appear upheld for prompt'],
    };
  });

  const totalViolations = briefReports.reduce((a, r) => a + r.violationCount, 0) +
    promptReports.reduce((a, r) => a + r.violationCount, 0);
  const totalEvidenceGaps = briefReports.reduce((a, r) => a + r.evidenceGapCount, 0) +
    promptReports.reduce((a, r) => a + r.evidenceGapCount, 0);

  const notes: string[] = [];
  notes.push('brand guardian observed — operator approval required before any production');
  if (totalViolations > 0) {
    notes.push(`brand guardian observed ${totalViolations} rule violation(s) — operator review required`);
  }
  if (totalEvidenceGaps > 0) {
    notes.push(`brand guardian observed ${totalEvidenceGaps} evidence gap(s) — requires more evidence`);
  }

  return {
    briefReports,
    promptReports,
    totalViolations,
    totalEvidenceGaps,
    notes,
    reasonCodes: [
      `briefs:${briefReports.length}`,
      `prompts:${promptReports.length}`,
      `violations:${totalViolations}`,
      `gaps:${totalEvidenceGaps}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

// ─── helper for the route ────────────────────────────────────

/** Flatten a structured brief object into a single text string that
 *  the guardian rules can scan. Pure helper. */
export function briefToScanText(brief: Record<string, unknown>): string {
  const collect: string[] = [];
  for (const v of Object.values(brief)) {
    if (typeof v === 'string') collect.push(v);
    else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') collect.push(item);
        else if (item && typeof item === 'object') {
          for (const subv of Object.values(item)) {
            if (typeof subv === 'string') collect.push(subv);
          }
        }
      }
    }
  }
  return collect.join(' \n ');
}
