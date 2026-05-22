/**
 * BRAND TRUTH CONSTITUTION (Phase 39 — Executive Identity Governance / Wave 4)
 *
 * The constitution of MOOD — a fixed set of articles the executive
 * organism cannot amend through any amount of performance pressure.
 * Where Phase 34's brandTruthCore guides execution, the constitution
 * GOVERNS: it is the law every other layer is measured against.
 */

export interface ConstitutionArticle {
  id: string;
  article: string;
  /** A test phrase — what a violation of this article reads like. */
  violation_reads_like: string;
}

export const BRAND_TRUTH_CONSTITUTION: ConstitutionArticle[] = [
  {
    id: 'grounded-realism',
    article: 'every banner must be grounded in observed reality, never an idealised one',
    violation_reads_like: 'an aspirational, art-directed, too-perfect scene',
  },
  {
    id: 'emotional-restraint',
    article: 'restraint is the default; intensity must be earned by truth',
    violation_reads_like: 'loudness, urgency, or drama without a reason',
  },
  {
    id: 'israeli-documentary-truth',
    article: 'the voice is Israeli-documentary — quiet, exact, unembellished',
    violation_reads_like: 'a glossy, global, brand-agency gloss',
  },
  {
    id: 'anti-performance',
    article: 'the banner observes a human; it never performs an emotion at the viewer',
    violation_reads_like: 'performed vulnerability, performed sadness, performed calm',
  },
  {
    id: 'human-tension',
    article: 'every banner holds a real, unresolved human tension',
    violation_reads_like: 'a resolved, comfortable, tension-free image',
  },
  {
    id: 'believable-imperfection',
    article: 'the world must carry believable imperfection',
    violation_reads_like: 'a frictionless, clean, designed-looking world',
  },
  {
    id: 'product-is-a-real-object',
    article: 'the product is a real chocolate in a real moment — never a fix, drug, or hack',
    violation_reads_like: 'the product framed as a solution, a boost, or a cure',
  },
];

export interface ConstitutionReading {
  /** 0..10 — how fully the candidate upholds the constitution. */
  constitution_alignment: number;
  /** Articles the candidate appears to violate. */
  violated_articles: string[];
  /** True when the candidate is constitutionally sound. */
  constitutionally_sound: boolean;
  notes: string[];
}

export interface ConstitutionCheckInput {
  /** 0..10 — observed realism (Wave 2 visual cognition). */
  realism: number;
  /** 0..10 — restraint of the direction. */
  restraint: number;
  /** 0..10 — how non-performative the banner reads. */
  nonPerformative: number;
  /** True when the banner holds a real tension. */
  hasTension: boolean;
  /** 0..10 — believable imperfection / life-noise. */
  imperfection: number;
  /** True when the product is framed as a fix / drug / hack. */
  productAsFix: boolean;
}

export function checkConstitution(input: ConstitutionCheckInput): ConstitutionReading {
  const { realism, restraint, nonPerformative, hasTension, imperfection, productAsFix } = input;
  const notes: string[] = [];
  const violated_articles: string[] = [];

  if (realism < 5) violated_articles.push('grounded-realism');
  if (restraint < 4) violated_articles.push('emotional-restraint');
  if (nonPerformative < 5) violated_articles.push('anti-performance');
  if (!hasTension) violated_articles.push('human-tension');
  if (imperfection < 4) violated_articles.push('believable-imperfection');
  if (productAsFix) violated_articles.push('product-is-a-real-object');

  const constitution_alignment = Math.max(0, Math.min(10, round1(10 - violated_articles.length * 2)));
  const constitutionally_sound = violated_articles.length === 0;

  if (violated_articles.length) {
    notes.push(`brand truth constitution: violated articles — ${violated_articles.join(', ')}`);
  } else {
    notes.push('brand truth constitution: the candidate upholds every article');
  }

  return { constitution_alignment, violated_articles, constitutionally_sound, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
