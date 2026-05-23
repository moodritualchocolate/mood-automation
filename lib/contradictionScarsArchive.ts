/**
 * CONTRADICTION SCARS ARCHIVE (Wave 17.4 — Embodied Runtime Presence)
 *
 * The dark counterpart to the protection memory. The protection
 * archive records what restraint refused; this archive records when
 * the organism broke its own restraint and acted anyway.
 *
 * Scars are rare — most of these breaches are refused by the
 * meta-critic at default brutality. But at lower brutality some slip
 * through, and the organism that has shipped through a captured
 * moment should *remember* that it did. Scars create wisdom.
 *
 * Persisted to data/runtime/contradiction-scars.json. Each scar
 * carries a kind, a severity, a description, and a one-line wisdom
 * (what this breach teaches if the organism ever reads itself back).
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'contradiction-scars.json';
const MAX_SCARS = 100;

export type ContradictionKind =
  | 'overreach'
  | 'noise'
  | 'broken-restraint'
  | 'meaning-dilution'
  | 'applause-chasing'
  | 'identity-drift'
  | 'compulsive-action';

export interface ContradictionScar {
  /** When this scar was recorded (epoch ms). */
  at: number;
  /** What kind of contradiction this is. */
  kind: ContradictionKind;
  /** 0..10 — how severe the breach was. */
  severity: number;
  /** A description of what was breached. */
  description: string;
  /** A one-line lesson from the breach, for the dashboard to render. */
  wisdom: string;
}

export interface ContradictionScarsState {
  bornAt: number;
  totalScars: number;            // monotonic, includes evicted history
  scars: ContradictionScar[];    // capped, oldest evicted
  updatedAt: number;
}

export function createInitialContradictionScars(): ContradictionScarsState {
  return { bornAt: Date.now(), totalScars: 0, scars: [], updatedAt: Date.now() };
}

const g = globalThis as unknown as { __moodContradictionScars?: ContradictionScarsState };

export interface ContradictionScarsStore {
  read(): Promise<ContradictionScarsState>;
  save(state: ContradictionScarsState): Promise<void>;
  reset(): Promise<void>;
}

export function createContradictionScarsStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): ContradictionScarsStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodContradictionScars) return g.__moodContradictionScars;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodContradictionScars = { ...createInitialContradictionScars(), ...(JSON.parse(txt) as Partial<ContradictionScarsState>) };
      } catch { g.__moodContradictionScars = createInitialContradictionScars(); }
      return g.__moodContradictionScars;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodContradictionScars = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodContradictionScars = undefined;
    },
  };
}

/**
 * Detection input — the conditions the pipeline knows about after
 * an approved run. None of these are inferred or invented; each is
 * an actual breach the meta-critic *would* have caught at default
 * brutality but allowed at the current setting.
 */
export interface ScarDetectionInput {
  /** True when the action overreached its support but still shipped. */
  overreached: boolean;
  /** 0..10 — overreach gap (how far ambition outran grasp). */
  overreachGap?: number;
  /** True when the run was not dignified but shipped anyway. */
  undignified: boolean;
  /** Specific dignity breach if one was identified. */
  dignityBreach?: string | null;
  /** True when restraint budget could not afford the action but it ran. */
  brokenRestraint: boolean;
  /** True when audience capture fired on an approved run. */
  audienceCapture: boolean;
  /** True when popularity was chosen over truth on this run. */
  popularityChosenOverTruth: boolean;
  /** True when the run was judged compulsive by the action core. */
  compulsiveAction: boolean;
  /** True when this cycle's feedback registered a serious contradiction. */
  feedbackContradicted: boolean;
}

const WISDOM: Record<ContradictionKind, string> = {
  'overreach':         'ambition without ground; next time, smaller',
  'noise':             'loud without truth; next time, quieter',
  'broken-restraint':  'moved when held was the move',
  'meaning-dilution':  'what was protected before was talked over',
  'applause-chasing':  'a smile that cost trust',
  'identity-drift':    'approval is not the same as being known',
  'compulsive-action': 'the organism automated; it did not decide',
};

const SEVERITY: Record<ContradictionKind, number> = {
  'overreach':         5,
  'noise':             5,
  'broken-restraint':  7,
  'meaning-dilution':  4,
  'applause-chasing':  6,
  'identity-drift':    8,
  'compulsive-action': 9,
};

function describeBreach(kind: ContradictionKind, input: ScarDetectionInput): string {
  switch (kind) {
    case 'overreach':
      return `the action reached past what trust could support — gap ${input.overreachGap ?? 'n/a'}/10`;
    case 'noise':
      return `the action shipped without dignity — ${input.dignityBreach ?? 'undignified delivery'}`;
    case 'broken-restraint':
      return 'the restraint budget was depleted but the run shipped anyway';
    case 'meaning-dilution':
      return 'feedback contradicted intent — the prior meaning was diluted';
    case 'applause-chasing':
      return 'audience capture pressures fired and were not refused';
    case 'identity-drift':
      return 'when popularity and truth diverged, the organism picked popularity';
    case 'compulsive-action':
      return 'the synthesis core read the run as compulsive — automation, not decision';
  }
}

/**
 * Detect any scars in the post-approval signals and append them to
 * the archive. Returns the (possibly unchanged) state and the list
 * of newly recorded scars so the pipeline can emit them.
 *
 * Most approved runs leave no scar — the meta-critic catches breaches
 * before they ship. This function only writes when a breach actually
 * made it through.
 */
export function detectAndRecordScars(
  state: ContradictionScarsState,
  input: ScarDetectionInput,
): { state: ContradictionScarsState; newScars: ContradictionScar[] } {
  const breaches: ContradictionKind[] = [];

  // Severity order: the worst goes first so the dashboard sees the
  // most important breach if the UI ever displays "dominant scar".
  if (input.compulsiveAction)            breaches.push('compulsive-action');
  if (input.popularityChosenOverTruth)   breaches.push('identity-drift');
  if (input.brokenRestraint)             breaches.push('broken-restraint');
  if (input.audienceCapture)             breaches.push('applause-chasing');
  if (input.overreached)                 breaches.push('overreach');
  if (input.undignified)                 breaches.push('noise');
  if (input.feedbackContradicted)        breaches.push('meaning-dilution');

  if (breaches.length === 0) return { state, newScars: [] };

  const now = Date.now();
  const newScars: ContradictionScar[] = breaches.map((kind) => ({
    at: now,
    kind,
    severity: SEVERITY[kind],
    description: describeBreach(kind, input),
    wisdom: WISDOM[kind],
  }));

  const scars = [...state.scars, ...newScars].slice(-MAX_SCARS);
  return {
    state: {
      ...state,
      scars,
      totalScars: state.totalScars + newScars.length,
      updatedAt: now,
    },
    newScars,
  };
}
