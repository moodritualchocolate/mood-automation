/**
 * AGENT TYPES (shared)
 *
 * The Execution Agent Layer wraps the existing pure analyzers and
 * composers as OPERATOR-TRIGGERED AGENT RUNS. Each agent is a pure
 * orchestrator — it never publishes, never spends, never calls
 * external APIs, never approves itself. The operator triggers a
 * run, reviews the structured output, and decides whether to
 * approve, reject, or archive it.
 *
 * STRICT CONTRACT (enforced statically by verify-execution-agent-layer):
 *   - agents are pure functions over inputs + existing engine output
 *   - agents NEVER fetch from any external API
 *   - agents NEVER write to disk
 *   - agents NEVER modify any upstream registry
 *   - agents NEVER auto-approve their own runs
 *   - allowed phrasing only: "historically observed", "operator
 *     review required", "requires more evidence", "operator-reviewable",
 *     "may carry memory weight"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-approve, auto-optimize, viral, dopamine, outrage,
 *     manipulat, exploit
 */

export type AgentId =
  | 'creative-director'
  | 'content-producer'
  | 'quality-reviewer'
  | 'campaign-manager'
  | 'performance-analyst';

export const AGENT_IDS: AgentId[] = [
  'creative-director', 'content-producer', 'quality-reviewer',
  'campaign-manager', 'performance-analyst',
];

export interface AgentDescriptor {
  agentId: AgentId;
  name: string;
  /** Plain-language purpose, allowed phrasing only. */
  purpose: string;
  /** Inputs the agent consumes from upstream layers. */
  consumes: string[];
  /** Outputs the agent produces — operator-reviewable. */
  produces: string[];
}

export const AGENT_CATALOG: Record<AgentId, AgentDescriptor> = {
  'creative-director': {
    agentId: 'creative-director',
    name: 'Creative Director',
    purpose: 'compose creative briefs · creative angles · story directions · asset requirements for operator review',
    consumes: ['business goal', 'campaign plan', 'performance history'],
    produces: ['creative briefs', 'creative angles', 'story directions', 'asset requirements'],
  },
  'content-producer': {
    agentId: 'content-producer',
    name: 'Content Producer',
    purpose: 'compose banner · video · carousel · landing packages from an approved brief — uses existing production systems · operator review required before any production',
    consumes: ['approved brief'],
    produces: ['banner package', 'video package', 'carousel package', 'landing package'],
  },
  'quality-reviewer': {
    agentId: 'quality-reviewer',
    name: 'Quality Reviewer',
    purpose: 'review assets against brand rules + knowledge base — surface violations and warnings, never blocks',
    consumes: ['assets', 'brand rules', 'knowledge base'],
    produces: ['violations', 'warnings', 'review notes'],
  },
  'campaign-manager': {
    agentId: 'campaign-manager',
    name: 'Campaign Manager',
    purpose: 'observe campaign readiness · missing assets · timeline status · dependencies for operator review',
    consumes: ['campaign plans', 'calendar', 'assets'],
    produces: ['campaign readiness', 'missing assets', 'timeline status', 'dependencies'],
  },
  'performance-analyst': {
    agentId: 'performance-analyst',
    name: 'Performance Analyst',
    purpose: 'observe performance · revenue · attribution and surface research questions for operator review',
    consumes: ['performance layer', 'revenue layer', 'attribution layer'],
    produces: ['observations', 'patterns', 'research questions', 'requires-more-evidence reports'],
  },
};

export const AGENT_ADVISORY_NOTICE =
  'Agent output is operator-reviewable only. The agent never publishes, ' +
  'never spends money, never modifies external systems, never calls ad APIs, ' +
  'never approves its own runs. Operator approval required. ' +
  'Human remains final authority.';
