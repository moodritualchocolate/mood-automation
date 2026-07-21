/**
 * MVP PLANS (roadmap #23 + #18)
 *
 * The two-tier pricing structure and the per-operator monthly
 * generation quota. Stripe consumes PLANS when it lands (#21);
 * the quota is enforced NOW so there is something to sell tiers of
 * and the LLM budget is protected from day one.
 */

export interface Plan {
  id: 'corpus' | 'pro';
  name: string;
  /** USD/month · display only until Stripe lands. */
  priceUsd: number;
  /** Generations per operator per calendar month. */
  monthlyGenerations: number;
  /** Which provider path the plan buys. */
  providerPath: 'corpus-only' | 'llm-with-corpus-fallback';
  blurb: string;
}

export const PLANS: Plan[] = [
  {
    id: 'corpus',
    name: 'Corpus',
    priceUsd: 29,
    monthlyGenerations: 10,
    providerPath: 'corpus-only',
    blurb: 'Instant kits from the vertical knowledge base. No LLM latency, no LLM cost.',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 79,
    monthlyGenerations: 40,
    providerPath: 'llm-with-corpus-fallback',
    blurb: 'Freshly written kits by the LLM inside your industry\'s constraints, corpus as safety net.',
  },
];

/**
 * Quota for the current deployment. Until per-operator billing exists,
 * one global limit applies (env-overridable). Default matches the Pro
 * plan so early users are never blocked artificially low.
 */
export function monthlyGenerationLimit(): number {
  const env = Number(process.env.MVP_MONTHLY_GENERATION_LIMIT);
  return Number.isFinite(env) && env > 0 ? env : 40;
}

/** True when `at` falls inside the current calendar month (local time). */
export function isThisMonth(at: number, now = Date.now()): boolean {
  const a = new Date(at);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
