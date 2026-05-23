/** SYMBOLIC LANGUAGE GENERATOR (Phase 425 — Wave 16) */
export interface SymbolicLanguageReading { generating: boolean; vocabulary_richness: number; notes: string[]; }
export interface SymbolicLanguageInput { uniquePhrasesUsed: number; consistentVoice: boolean; }
export function readSymbolicLanguageGenerator(input: SymbolicLanguageInput): SymbolicLanguageReading {
  const vocabulary_richness = Math.min(10, input.uniquePhrasesUsed + (input.consistentVoice ? 3 : 0));
  const generating = vocabulary_richness >= 5;
  return { generating, vocabulary_richness, notes: [`symbolic language generator: ${generating ? 'generating' : 'thin'} (${vocabulary_richness}/10)`] };
}
