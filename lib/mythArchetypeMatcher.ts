/** MYTH ARCHETYPE MATCHER (Phase 427 — Wave 16) */
export interface MythArchetypeMatcherReading { archetype_matched: boolean; archetype: string | null; notes: string[]; }
export interface MythArchetypeMatcherInput { storyShape: 'quiet-witness' | 'patient-builder' | 'none'; }
export function readMythArchetypeMatcher(input: MythArchetypeMatcherInput): MythArchetypeMatcherReading {
  const archetype_matched = input.storyShape !== 'none';
  const archetype = archetype_matched ? input.storyShape : null;
  return { archetype_matched, archetype, notes: [`myth archetype matcher: ${archetype ?? 'none'}`] };
}
