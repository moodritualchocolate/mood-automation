/**
 * scripts/build-production-safety-envelope.ts
 *
 * Read full-hardening-report.json → compute Production Safety Envelope
 * → write data/policies/production-safety-envelope.json + print human
 * report.
 *
 * READ-ONLY:
 *   - reads the matrix report from disk
 *   - writes the envelope to disk
 *   - does NOT touch runtime, memory, critic, or pipeline state
 *   - the system must NEVER auto-apply the envelope's
 *     recommendedRuntimePolicy — it is purely advisory
 *
 * Usage:
 *   npx tsx scripts/build-production-safety-envelope.ts
 *   npx tsx scripts/build-production-safety-envelope.ts --report path/to/report.json
 *   npx tsx scripts/build-production-safety-envelope.ts --out path/to/envelope.json
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  buildProductionSafetyEnvelope,
  type MatrixReportInput,
  type ProductionSafetyEnvelope,
} from '../lib/productionSafetyEnvelope';

interface Flags {
  reportPath: string;
  outPath: string;
  jsonOnly: boolean;
}

function parseFlags(): Flags {
  const argv = process.argv.slice(2);
  const get = (name: string, fallback: string): string => {
    const idx = argv.indexOf(`--${name}`);
    if (idx === -1) return fallback;
    return argv[idx + 1] ?? fallback;
  };
  return {
    reportPath: get('report', 'full-hardening-report.json'),
    outPath:    get('out', 'data/policies/production-safety-envelope.json'),
    jsonOnly:   argv.includes('--json-only'),
  };
}

function fmtCell(c: { formula: string; mode: string; brutality: number; stabilityScore?: number; cellLatencyMs?: number }): string {
  const score = c.stabilityScore !== undefined ? ` score=${c.stabilityScore}` : '';
  const lat = c.cellLatencyMs !== undefined ? ` lat=${c.cellLatencyMs}ms` : '';
  return `${c.formula}/${c.mode}/b=${c.brutality}${score}${lat}`;
}

function printHumanReport(env: ProductionSafetyEnvelope): void {
  console.log('───── PRODUCTION SAFETY ENVELOPE ─────');
  console.log(`  schema:              v${env.schemaVersion}`);
  console.log(`  generated:           ${env.generatedAt}`);
  console.log(`  advisory-only:       ${env.advisoryOnly} (system must never auto-apply)`);
  console.log(`  source runs:         ${env.sourceReport.totalRuns} across ${env.sourceReport.totalCombinations} cells`);
  console.log(`  det. consistency:    ${env.sourceReport.deterministicConsistencyScore}/10`);
  console.log(`  production readiness: ${env.productionReadinessScore}/10`);
  if (env.sourceReport.stoppedEarly) {
    console.log(`  ⚠ source stopped early: ${env.sourceReport.stoppedReason}`);
  }
  console.log('');

  console.log('FORMULA STABILITY');
  for (const r of env.formulaStability) {
    console.log(`  [${r.rank}] ${r.key.padEnd(8)} score=${r.stabilityScore}/10  failRate=${r.failureRate}  lat=${r.avgLatencyMs}ms  tier=${r.safetyTier}`);
  }
  console.log('');

  console.log('CAMPAIGN MODE STABILITY');
  for (const r of env.modeStability) {
    console.log(`  [${r.rank}] ${r.key.padEnd(18)} score=${r.stabilityScore}/10  failRate=${r.failureRate}  lat=${r.avgLatencyMs}ms  tier=${r.safetyTier}`);
  }
  console.log('');

  console.log('BRUTALITY STABILITY');
  for (const r of env.brutalityStability) {
    console.log(`  [${r.rank}] b=${String(r.key).padEnd(6)} score=${r.stabilityScore}/10  failRate=${r.failureRate}  lat=${r.avgLatencyMs}ms  tier=${r.safetyTier}`);
  }
  console.log('');

  console.log('SAFE ZONES');
  console.log(`  formulas:           ${env.safestFormulas.join(', ') || '(none)'}`);
  console.log(`  modes:              ${env.safestModes.join(', ') || '(none)'}`);
  console.log(`  brutality ranges:   ${env.safestBrutalityRanges.join(', ') || '(none)'}`);
  console.log('');

  console.log('MATRIX TIERING');
  console.log(`  SAFE_PRODUCTION_MATRIX:  ${env.SAFE_PRODUCTION_MATRIX.length} cells`);
  console.log(`  WARNING_MATRIX:          ${env.WARNING_MATRIX.length} cells`);
  console.log(`  FORBIDDEN_MATRIX:        ${env.FORBIDDEN_MATRIX.length} cells`);
  console.log('');

  console.log('RECOMMENDED RUNTIME POLICY (advisory)');
  const p = env.recommendedRuntimePolicy;
  console.log(`  default:             ${p.defaultProductionMode.formula} / ${p.defaultProductionMode.mode ?? 'AUTO'} / b=${p.defaultProductionMode.brutality}`);
  console.log(`  fallback:            ${p.safeFallbackMode.formula} / ${p.safeFallbackMode.mode ?? 'AUTO'} / b=${p.safeFallbackMode.brutality}`);
  console.log(`  max brutality:       ${p.maxAllowedBrutality}`);
  console.log(`  refusal escalation:  trigger=${p.refusalEscalationRules.consecutiveRefusalsTrigger} consecutive  action=${p.refusalEscalationRules.escalationAction}  maxRefusalRate=${p.refusalEscalationRules.maxAllowedRefusalRate}`);
  console.log(`  latency guardrails:  p50=${p.latencyGuardrails.p50TargetMs}ms  p95=${p.latencyGuardrails.p95CeilingMs}ms  timeout=${p.latencyGuardrails.timeoutMs}ms`);
  console.log(`  memory guardrails:   maxBytesGrowthPerRun=${p.memoryPressureGuardrails.maxBytesGrowthPerRun}  hotspots=${p.memoryPressureGuardrails.hotspotFiles.length}`);
  console.log('');

  console.log('TOP 10 SAFEST COMBINATIONS');
  if (env.top10Safest.length === 0) console.log('  (none)');
  for (let i = 0; i < env.top10Safest.length; i++) {
    console.log(`  [${i + 1}] ${fmtCell(env.top10Safest[i])}`);
  }
  console.log('');

  console.log('TOP 10 DANGEROUS COMBINATIONS');
  if (env.top10Dangerous.length === 0) console.log('  (none)');
  for (let i = 0; i < env.top10Dangerous.length; i++) {
    const c = env.top10Dangerous[i];
    console.log(`  [${i + 1}] ${fmtCell(c)}`);
    for (const r of c.riskReasons.slice(0, 3)) console.log(`      · ${r}`);
  }
  console.log('');

  console.log('HIGHEST-LATENCY COMBINATIONS');
  if (env.highestLatencyCombinations.length === 0) console.log('  (none)');
  for (let i = 0; i < env.highestLatencyCombinations.length; i++) {
    const c = env.highestLatencyCombinations[i];
    console.log(`  [${i + 1}] ${c.formula}/${c.mode}/b=${c.brutality}  ${c.latencyMs}ms`);
  }
  console.log('');

  if (env.instabilityClusters.length > 0) {
    console.log('INSTABILITY CLUSTERS');
    for (const c of env.instabilityClusters) {
      console.log(`  ${c.axis}=${c.value}  score=${c.stabilityScore}  failRate=${c.failureRate}  lat=${c.avgLatencyMs}ms`);
    }
    console.log('');
  }

  if (env.refusalHeavyZones.length > 0) {
    console.log('REFUSAL-HEAVY ZONES');
    for (const r of env.refusalHeavyZones) {
      console.log(`  ${r.axis}=${r.value}  refusalShare=${r.refusalShare}  · ${r.note}`);
    }
    console.log('');
  }

  if (env.memoryPressureHotspots.length > 0) {
    console.log('MEMORY PRESSURE HOTSPOTS');
    for (const h of env.memoryPressureHotspots) {
      console.log(`  ${h.file}  +${h.deltaBytes} bytes  (${Math.round(h.shareOfTotalGrowth * 100)}% of growth)`);
    }
    console.log('');
  }

  console.log('READINESS REASON CODES');
  for (const code of env.productionReadinessReasonCodes) console.log(`  · ${code}`);
}

async function main(): Promise<void> {
  const flags = parseFlags();
  const reportAbs = path.resolve(flags.reportPath);
  const outAbs = path.resolve(flags.outPath);

  let raw: string;
  try {
    raw = await fs.readFile(reportAbs, 'utf8');
  } catch (e) {
    console.error(`✗ cannot read matrix report at ${reportAbs}`);
    console.error(`  ${(e as Error).message}`);
    console.error(`  run the matrix first:`);
    console.error(`    npx tsx scripts/run-full-hardening-matrix.ts --report ${flags.reportPath}`);
    process.exit(2);
  }

  let report: MatrixReportInput;
  try {
    report = JSON.parse(raw) as MatrixReportInput;
  } catch (e) {
    console.error(`✗ matrix report at ${reportAbs} is not valid JSON`);
    console.error(`  ${(e as Error).message}`);
    process.exit(2);
  }

  const envelope = buildProductionSafetyEnvelope(report);

  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, JSON.stringify(envelope, null, 2));

  if (!flags.jsonOnly) printHumanReport(envelope);
  console.log(`\n  envelope written to: ${path.relative(process.cwd(), outAbs)}`);
}

void main().catch((e) => {
  console.error('envelope builder crashed:', e);
  process.exit(1);
});
