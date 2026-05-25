/**
 * COPYWRITER VIEW (Strategy-Conditioned Copywriter — Phase Next)
 *
 * Read-only view model surfacing the copywriter output on a banner.
 * Studio renders a small right-side trace block from this.
 */

import type { CopywriterOutput } from './copywriterEngine';

export interface CopywriterPanelData {
  present: boolean;
  hook: string;
  body: string;
  cta: string;
  proofLine: string | null;
  persuasionTone: string;
  urgencyStyle: string;
  productPresence: string;
  restraintLevel: number;
  trustAlignment: number;
  strategicAlignment: number;
  dignityAlignment: number;
  repetitionSimilarity: number;
  confidence: number;
  forbiddenPhrasesTriggered: string[];
  reasonCodes: string[];
}

export function buildCopywriterPanel(copy: CopywriterOutput | null | undefined): CopywriterPanelData {
  if (!copy) {
    return {
      present: false,
      hook: '', body: '', cta: '', proofLine: null,
      persuasionTone: '', urgencyStyle: '', productPresence: '',
      restraintLevel: 0, trustAlignment: 0, strategicAlignment: 0,
      dignityAlignment: 0, repetitionSimilarity: 0, confidence: 0,
      forbiddenPhrasesTriggered: [], reasonCodes: [],
    };
  }
  return {
    present: true,
    hook: copy.hook,
    body: copy.body,
    cta: copy.cta,
    proofLine: copy.proofLine,
    persuasionTone: copy.persuasionTone,
    urgencyStyle: copy.urgencyStyle,
    productPresence: copy.productPresence,
    restraintLevel: copy.restraintLevel,
    trustAlignment: copy.trustAlignment,
    strategicAlignment: copy.strategicAlignment,
    dignityAlignment: copy.dignityAlignment,
    repetitionSimilarity: copy.repetitionSimilarity,
    confidence: copy.confidence,
    forbiddenPhrasesTriggered: copy.forbiddenPhrasesTriggered,
    reasonCodes: copy.reasonCodes,
  };
}
