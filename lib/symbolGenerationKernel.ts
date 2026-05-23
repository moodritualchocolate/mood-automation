/**
 * SYMBOL GENERATION KERNEL (Phase 413 — Wave 16)
 */

export interface SymbolGenerationReading {
  generating: boolean;
  symbol_strength: number;
  notes: string[];
}

export interface SymbolGenerationInput {
  meaningDensity: number;
  symbolicCoherence: number;
}

export function readSymbolGenerationKernel(input: SymbolGenerationInput): SymbolGenerationReading {
  const notes: string[] = [];
  const symbol_strength = round1((input.meaningDensity * 0.6 + input.symbolicCoherence * 0.4));
  const generating = symbol_strength >= 6;
  notes.push(`symbol generation kernel: ${generating ? 'generating' : 'thin'} (${symbol_strength}/10)`);
  return { generating, symbol_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
