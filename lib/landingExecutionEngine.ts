/**
 * LANDING EXECUTION ENGINE (pure, observational)
 *
 * Phase 4 — Execution Layer.
 *
 * Transforms an APPROVED landing section brief + production prompt
 * into a COMPLETE LANDING SPECIFICATION — hero, sections, cta, faq,
 * social proof. This engine does NOT call any model, does NOT
 * publish, does NOT auto-deploy.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never calls a generator
 *   - never publishes
 *   - never auto-approves
 *   - FAQ and social proof are SLOTS for operator-provided content,
 *     never invented testimonials, never invented quotes
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';
import type { LandingSectionBrief } from './creativeBriefGenerator';
import type { PromptArtifact } from './promptArchitect';

// ─── input ────────────────────────────────────────────────────

export interface LandingExecutionInput {
  brief: LandingSectionBrief;
  prompt: PromptArtifact;
}

// ─── output ───────────────────────────────────────────────────

export interface LandingHero {
  purpose: string;
  visualAnchor: string;
  copyDirection: string;
  layout: string;
}

export interface LandingSection {
  index: number;
  sectionId: string;
  purpose: string;
  emotionalPurpose: string;
  visualAnchor: string;
  copyDirection: string;
  layout: string;
}

export interface LandingCTA {
  /** Operator-reviewable direction — NOT the CTA text itself. */
  copyDirection: string;
  visualDirection: string;
  layout: string;
  /** Where on the page the CTA appears. */
  placement: 'inline-low' | 'sticky-bottom' | 'after-faq';
}

export interface LandingFAQSlot {
  index: number;
  questionDirection: string;
  answerDirection: string;
}

export interface LandingSocialProofSlot {
  proofType: 'lab-result' | 'product-claim' | 'press-mention' | 'operator-quote' | 'operator-provided';
  directionNote: string;
}

export interface LandingExecutionPackage {
  packageId: string;
  packageType: 'landing';
  formula: Formula;
  sourceStoryName: string;
  sourceBriefId: string;
  sourcePromptId: string;
  prompt: string;
  hero: LandingHero;
  sections: LandingSection[];
  cta: LandingCTA;
  faq: LandingFAQSlot[];
  socialProof: LandingSocialProofSlot[];
  targetAudience: string;
  layoutGuidance: string;
  operatorApprovalRequired: true;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Landing execution package is a specification only. ' +
  'No landing page is built, deployed, or published in this engine. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function languageNote(audienceMarket: string | undefined): string {
  if (audienceMarket === 'global') return 'English copy';
  return 'Hebrew RTL copy · Israeli market · mobile-first responsive';
}

function brandHonestNote(formula: Formula): string {
  return `MOOD ${formula} chocolate · present as a quiet object · no productivity-drug claims · no luxury-performance language · no fictional testimonials`;
}

// ─── main ─────────────────────────────────────────────────────

export function composeLandingExecutionPackage(input: LandingExecutionInput): LandingExecutionPackage {
  const { brief, prompt } = input;
  const lang = languageNote(brief.audienceMarket);

  const hero: LandingHero = {
    purpose: brief.sectionPurpose,
    visualAnchor: brief.visualAnchor,
    copyDirection: [
      lang,
      'single line headline · 4-10 words',
      'no aspirational claim · no marketing-speak',
      brief.copyDirection,
    ].join(' · '),
    layout: [
      'full-width hero · 70vh on desktop · 80vh on mobile',
      'visual anchor centered · single focal point',
      lang === 'Hebrew RTL copy · Israeli market · mobile-first responsive'
        ? 'Hebrew RTL · copy block aligned right'
        : 'copy block aligned left',
      'no overlay text on the visual anchor itself',
    ].join(' · '),
  };

  const sections: LandingSection[] = [
    {
      index: 1, sectionId: 'section-story',
      purpose: 'story · why this moment matters',
      emotionalPurpose: brief.emotionalPurpose,
      visualAnchor: brief.memoryAnchor,
      copyDirection: [lang, '2-3 short paragraphs', 'observed restraint', brandHonestNote(brief.formula)].join(' · '),
      layout: 'centered single column · max-width 720px · generous line height · no decorative dividers',
    },
    {
      index: 2, sectionId: 'section-product',
      purpose: 'product · what MOOD is, honestly',
      emotionalPurpose: 'a quiet recognition of the object',
      visualAnchor: 'product as quiet object on a real surface',
      copyDirection: [lang, '1-2 short paragraphs', 'product as object · never indulgence · never hack', brandHonestNote(brief.formula)].join(' · '),
      layout: 'two-column on desktop (visual left, copy right) · single column on mobile · soft warm light visual',
    },
    {
      index: 3, sectionId: 'section-ritual',
      purpose: 'ritual · how the product fits a real moment',
      emotionalPurpose: 'a recognition of the small moment',
      visualAnchor: brief.memoryAnchor,
      copyDirection: [lang, 'short observational paragraph', 'no productivity claim · no hype', brandHonestNote(brief.formula)].join(' · '),
      layout: 'centered single column · max-width 720px · single visual anchor below copy',
    },
  ];

  const cta: LandingCTA = {
    copyDirection: [
      lang,
      '2-4 words · plain language · no manufactured urgency',
      'no "limited time" · no "last chance" · no "act now"',
    ].join(' · '),
    visualDirection: 'restrained button · brand-color from MOOD palette · large touch target on mobile · single state',
    layout: 'inline after section-ritual · sticky bottom on mobile · single CTA per page',
    placement: 'inline-low',
  };

  const faq: LandingFAQSlot[] = [
    { index: 1, questionDirection: 'what MOOD is (the honest answer) — operator provides',
      answerDirection: 'plain language · 2-3 sentences · no marketing claims' },
    { index: 2, questionDirection: 'when MOOD fits in a day — operator provides',
      answerDirection: 'observed moment · no prescriptive claim' },
    { index: 3, questionDirection: 'what MOOD is NOT — operator provides',
      answerDirection: 'plain language · "not a supplement, not a hack, not a drug"' },
    { index: 4, questionDirection: 'ingredients — operator provides',
      answerDirection: 'plain list · no proprietary-blend language' },
    { index: 5, questionDirection: 'where to find MOOD — operator provides',
      answerDirection: 'plain list · no scarcity framing' },
  ];

  const socialProof: LandingSocialProofSlot[] = [
    { proofType: 'lab-result',     directionNote: 'optional · operator-provided lab / sourcing reference · no implied health claims' },
    { proofType: 'press-mention',  directionNote: 'optional · operator-provided press references · no out-of-context quotes' },
    { proofType: 'operator-quote', directionNote: 'optional · operator-provided real quote · no invented testimonials' },
    { proofType: 'operator-provided', directionNote: 'all social proof items require operator approval before display' },
  ];

  return {
    packageId: `exec-landing-${brief.briefId.replace('brief-landing-', '')}`,
    packageType: 'landing',
    formula: brief.formula,
    sourceStoryName: brief.sourceStoryName,
    sourceBriefId: brief.briefId,
    sourcePromptId: prompt.promptId,
    prompt: prompt.promptText,
    hero,
    sections,
    cta,
    faq,
    socialProof,
    targetAudience: brief.audienceMarket === 'israel'
      ? 'Adults observed seeking restraint over hype · Israeli market · mobile-first'
      : 'Adults observed seeking restraint over hype · global',
    layoutGuidance: brief.layoutGuidance,
    operatorApprovalRequired: true,
    notes: [
      'execution package — ready for operator-driven implementation',
      'operator approval required before any implementation',
      'FAQ + social proof slots require operator-provided content — never invented',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
