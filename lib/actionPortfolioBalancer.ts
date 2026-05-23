/**
 * ACTION PORTFOLIO BALANCER (Phase 214 — Wave 12: Autonomous Action Architecture)
 *
 * No single action stands alone — it joins a portfolio. This balancer
 * reads whether the mix of actions and withholdings is balanced, or
 * whether the campaign has tilted entirely into doing.
 */

export type PortfolioBalance = 'balanced' | 'action-heavy' | 'all-action';

export interface ActionPortfolioReading {
  portfolio_balance: PortfolioBalance;
  /** 0..1 — share of cycles that were action rather than restraint. */
  action_share: number;
  /** True when the portfolio holds a healthy balance of action and rest. */
  portfolio_is_balanced: boolean;
  notes: string[];
}

export interface ActionPortfolioInput {
  actionsAuthorized: number;
  actionsWithheld: number;
}

export function readActionPortfolioBalancer(input: ActionPortfolioInput): ActionPortfolioReading {
  const { actionsAuthorized, actionsWithheld } = input;
  const notes: string[] = [];

  const total = actionsAuthorized + actionsWithheld;
  const action_share = total > 0 ? round2(actionsAuthorized / total) : 0;

  const portfolio_balance: PortfolioBalance =
    total === 0 ? 'balanced' :
    action_share >= 0.95 ? 'all-action' :
    action_share >= 0.8 ? 'action-heavy' :
    'balanced';

  const portfolio_is_balanced = portfolio_balance === 'balanced';

  notes.push(`action portfolio balancer: ${portfolio_balance} (${Math.round(action_share * 100)}% action)` +
    (portfolio_is_balanced ? '' : ' — the portfolio has tilted into doing'));
  return { portfolio_balance, action_share, portfolio_is_balanced, notes };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
