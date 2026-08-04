/**
 * scripts/cowork-fulfill.ts — the Claude Cowork task interface for the
 * keyless premium generation path (roadmap #1/#21 alternative).
 *
 * No API key, no spend: Claude (running in Cowork, on demand or on a
 * schedule) drains the generation queue by authoring on-contract hooks.
 *
 *   npx tsx scripts/cowork-fulfill.ts list
 *       → pending tasks (taskId · brand · vertical · locale)
 *
 *   npx tsx scripts/cowork-fulfill.ts brief <taskId>
 *       → the full contract to author against (required/forbidden vocab,
 *         audience, purchase moments, on-brand example hooks, exclusions)
 *
 *   npx tsx scripts/cowork-fulfill.ts apply <taskId> <hooks.json>
 *       → validate authored hooks against the SAME gates the paid path
 *         uses; upgrade the generation only if enough pass.
 *         hooks.json = { "hooks": ["…", …], "oneLiners"?: ["…", …] }
 *         Use "-" as the path to read the JSON from stdin.
 */

import { promises as fs } from 'fs';
import {
  listCoworkTasks,
  getCoworkTask,
  resolveTaskContext,
  applyCoworkKit,
  type AuthoredKit,
} from '../lib/mvpCoworkBridge';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function cmdList(): Promise<void> {
  const pending = await listCoworkTasks('pending');
  if (!pending.length) {
    console.log('no pending Cowork tasks · queue is drained ✓');
    return;
  }
  console.log(`PENDING COWORK TASKS (${pending.length})\n`);
  for (const t of pending) {
    console.log(
      `  ${t.taskId}\n` +
        `    generation : ${t.generationId}\n` +
        `    vertical   : ${t.verticalId}   locale: ${t.locale}   need: ${t.need.hooks} hooks\n` +
        `    artifact   : ${t.signals.artifact}\n` +
        `    audience   : ${t.signals.audience}\n` +
        `    emotional  : ${t.signals.emotional}\n`,
    );
  }
  console.log('Author with:  npx tsx scripts/cowork-fulfill.ts brief <taskId>');
}

async function cmdBrief(taskId: string): Promise<void> {
  const task = await getCoworkTask(taskId);
  if (!task) { console.error(`task not found: ${taskId}`); process.exit(1); return; }
  if (task.status !== 'pending') { console.error(`task is ${task.status}, not pending`); process.exit(1); return; }
  const ctx = resolveTaskContext(task);
  const examples = ctx.availableHooks.slice(0, 8).map((h) => `    · ${h.text}`).join('\n');
  console.log(
`# COWORK BRIEF · ${task.taskId}

Write ${task.need.hooks} scroll-stopping ad HOOKS (and optionally ${task.need.oneLiners} positioning one-liners)
in locale "${ctx.locale}" for this brand. Every hook is validated on apply and
REJECTED if it breaks the contract below.

## Brand signals
  artifact  : ${task.signals.artifact}
  audience  : ${task.signals.audience}
  emotional : ${task.signals.emotional}
${task.brandVoice ? `  brandVoice: ${task.brandVoice}\n` : ''}
## Resolved context
  vertical         : ${task.verticalId}
  audience label   : ${ctx.resolvedAudience.label} · ${ctx.resolvedAudience.demographic}
  emotional field  : ${ctx.emotionalTerritory}
  purchase moments : ${ctx.purchaseMoments.join(' · ')}

## Contract (enforced on apply)
  REQUIRED vocab (include the vertical's language) : ${ctx.vocabularyRequired.join(', ') || '(none)'}
  FORBIDDEN vocab (never use)                      : ${ctx.vocabularyForbidden.join(', ') || '(none)'}
  CROSS-VERTICAL forbidden (other industries)      : ${ctx.vocabularyForbiddenCrossVertical.slice(0, 24).join(', ') || '(none)'}
  locale purity                                    : "${ctx.locale}" only (no code-switching)
  quality floor                                    : each hook must score ≥ 24 / 60
  exclusions (already shown)                        : ${task.excludeTexts.length}

## On-brand examples (match this altitude, do NOT copy)
${examples || '    (none)'}

## Deliver
  Write { "hooks": [ …${task.need.hooks} strings… ], "oneLiners": [ … ] } to a file, then:
    npx tsx scripts/cowork-fulfill.ts apply ${task.taskId} <hooks.json>`,
  );
}

async function cmdApply(taskId: string, src: string): Promise<void> {
  const raw = src === '-' ? await readStdin() : await fs.readFile(src, 'utf8');
  let kit: AuthoredKit;
  try {
    const parsed = JSON.parse(raw);
    kit = { hooks: parsed.hooks ?? [], oneLiners: parsed.oneLiners };
  } catch (e) {
    console.error('invalid JSON:', (e as Error).message);
    process.exit(1);
    return;
  }
  const report = await applyCoworkKit(taskId, kit);
  console.log(`\nCOWORK APPLY · ${report.taskId}`);
  for (const v of report.verdicts) {
    console.log(`  ${v.ok ? 'PASS' : 'FAIL'}  q=${String(v.quality).padStart(2)}  ${v.text}` +
      (v.ok ? '' : `\n        ↳ ${v.reasons.join(' · ')}`));
  }
  console.log(`\n  accepted ${report.accepted} · rejected ${report.rejected} · applied=${report.applied}`);
  console.log(`  ${report.message}\n`);
  if (!report.applied) process.exit(2);
}

async function main(): Promise<void> {
  const [cmd, a, b] = process.argv.slice(2);
  switch (cmd) {
    case 'list': return cmdList();
    case 'brief': if (!a) { console.error('usage: brief <taskId>'); process.exit(1); } return cmdBrief(a);
    case 'apply': if (!a || !b) { console.error('usage: apply <taskId> <hooks.json|->'); process.exit(1); } return cmdApply(a, b);
    default:
      console.log('usage: cowork-fulfill.ts <list | brief <taskId> | apply <taskId> <hooks.json|->>');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
