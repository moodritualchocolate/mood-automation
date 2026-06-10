/**
 * DIAGNOSE — OpenAI LIVE failure
 *
 * Bypasses the mvpGenerate fallback wrapper. Surfaces the EXACT
 * OpenAI failure reason so the operator can identify which of the
 * 10 candidate root causes is actually happening.
 *
 * Test ladder (each step gates the next · first failure exits):
 *
 *   1 · env presence            · is OPENAI_API_KEY loaded by THIS process?
 *   2 · key shape               · does it match sk-... or sk-proj-... ?
 *   3 · SDK ping                · plainest possible chat call · model=gpt-4o-mini
 *   4 · configured model ping   · same call · model=OPENAI_MODEL (default gpt-4.1-mini)
 *   5 · structured-output ping  · minimal json_schema strict · same model
 *   6 · full generation call    · the actual mvpGenerate prompt · chocolate vertical
 *
 * On any error, prints:
 *   · status (HTTP code)
 *   · code (OpenAI error code · e.g. model_not_found, invalid_api_key)
 *   · type (e.g. authentication_error, billing_error)
 *   · message (full message · NOT truncated)
 *   · request_id (the OpenAI x-request-id header · for support tickets)
 *   · stack (first 8 lines)
 *
 * Then a "diagnosis" pointing at the specific root cause and the fix.
 *
 * Exit code: 0 on all 6 steps green · 1 on any failure.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/diagnose-openai.ts
 *   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o-mini npx tsx scripts/diagnose-openai.ts
 *   OPENAI_API_KEY=sk-... OPENAI_DEBUG=1 npx tsx scripts/diagnose-openai.ts
 */

import OpenAI from 'openai';
import {
  resolveVerticalContext,
  assembleGenerationContext,
} from '../lib/verticalIntelligence';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const PROBE_MODEL = 'gpt-4o-mini'; // widely available · used to isolate auth from model availability
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 60_000);
const DEBUG = process.env.OPENAI_DEBUG === '1';

interface FailureInfo {
  step: string;
  status?: number;
  code?: string;
  type?: string;
  message: string;
  requestId?: string;
  raw?: unknown;
  stack?: string;
  diagnosis: string;
  fix: string;
}

function summarizeError(e: unknown): { status?: number; code?: string; type?: string; message: string; requestId?: string; stack?: string } {
  // The OpenAI Node SDK throws APIError subclasses with these fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = e as any;
  const status = typeof err?.status === 'number' ? err.status : undefined;
  const code = typeof err?.code === 'string' ? err.code : undefined;
  const type = typeof err?.type === 'string' ? err.type : undefined;
  const message = typeof err?.message === 'string' ? err.message : String(err);
  const requestId = err?.headers?.['x-request-id'] || err?.requestID || err?.requestId;
  const stack = typeof err?.stack === 'string' ? err.stack.split('\n').slice(0, 8).join('\n') : undefined;
  return { status, code, type, message, requestId, stack };
}

function classify(err: { status?: number; code?: string; type?: string; message: string }, model: string): { diagnosis: string; fix: string } {
  const m = (err.message || '').toLowerCase();
  const code = err.code || '';
  const status = err.status;

  // 1 · auth failures
  if (status === 401 || code === 'invalid_api_key' || /incorrect api key|invalid api key/i.test(err.message)) {
    return {
      diagnosis: '#2 INVALID API KEY · the key OpenAI received is rejected · either the key is wrong, revoked, or from a different organization than expected.',
      fix: 'Generate a fresh key at https://platform.openai.com/api-keys · copy the WHOLE key (sk-... or sk-proj-...) · paste into the environment with no surrounding whitespace · re-run.',
    };
  }
  // 2 · model availability
  if (status === 404 || code === 'model_not_found' || /model.*does not exist|not.found/i.test(err.message)) {
    return {
      diagnosis: `#5 MODEL NAME INVALID · model "${model}" is not available to this OpenAI account.`,
      fix: `Either (a) set OPENAI_MODEL=gpt-4o-mini · widely available · or (b) request access to "${model}" in the OpenAI dashboard · or (c) use a different model like gpt-4o, gpt-4.1.`,
    };
  }
  // 3 · billing / quota
  if (status === 429 || code === 'insufficient_quota' || /insufficient.quota|exceeded.*quota|billing/i.test(err.message)) {
    return {
      diagnosis: '#6 API QUOTA / BILLING ISSUE · the account is out of credit or has hit its quota.',
      fix: 'Open https://platform.openai.com/account/billing and verify the project has a payment method and remaining balance. New accounts often need to add a card before any API call works.',
    };
  }
  // 4 · rate limit (true rate-limit, not quota)
  if (status === 429 && (code === 'rate_limit_exceeded' || /rate.*limit/i.test(err.message))) {
    return {
      diagnosis: '#6 RATE LIMIT (transient) · the project hit a per-minute or per-day cap.',
      fix: 'Wait 60s and re-run. If it persists, request a tier upgrade at https://platform.openai.com/account/limits.',
    };
  }
  // 5 · network
  if (/enotfound|econnrefused|connect.*timeout|getaddrinfo|fetch failed|host.*not.*allowlist/i.test(err.message)) {
    return {
      diagnosis: '#4 NETWORK BLOCKED · this process cannot reach api.openai.com.',
      fix: 'If running on a sandboxed remote (Claude Code on web, CI, corporate proxy), the environment must allow egress to api.openai.com. On the operator\'s local Windows box, check VPN / firewall / corporate proxy.',
    };
  }
  // 6 · schema invalid for strict mode
  if (status === 400 && (code === 'invalid_request_error' || /response_format|json_schema|strict/i.test(err.message))) {
    return {
      diagnosis: '#7 OPENAI REQUEST SCHEMA INVALID · the JSON schema sent with response_format is malformed for strict mode.',
      fix: 'This points at lib/mvpOpenaiAdapter.ts RESPONSE_SCHEMA. Verify every property in `properties` is also in `required`, every object has `additionalProperties: false`, and no schema uses unsupported keywords (oneOf, patternProperties, etc.).',
    };
  }
  // 7 · timeout
  if (/timeout|aborted/i.test(err.message)) {
    return {
      diagnosis: '#8 TIMEOUT · the call exceeded OPENAI_TIMEOUT_MS (default 60_000).',
      fix: 'Either (a) bump OPENAI_TIMEOUT_MS=120000 · or (b) switch to a faster model like gpt-4o-mini · or (c) check the network — slow links cause timeouts.',
    };
  }
  // 8 · everything else
  return {
    diagnosis: `#10 OTHER · status=${status ?? 'n/a'} code=${code || 'n/a'} type=${err.type || 'n/a'}`,
    fix: 'Inspect the full message + request_id above. Open a ticket at help.openai.com with the request_id if the message is unclear.',
  };
}

function printFailure(info: FailureInfo): void {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════════════════');
  console.error(`FAIL · step ${info.step}`);
  console.error('═══════════════════════════════════════════════════════════════════════');
  if (info.status !== undefined) console.error(`HTTP status   : ${info.status}`);
  if (info.code)                  console.error(`OpenAI code   : ${info.code}`);
  if (info.type)                  console.error(`OpenAI type   : ${info.type}`);
  console.error(`message       : ${info.message}`);
  if (info.requestId)             console.error(`request id    : ${info.requestId}`);
  if (info.stack && DEBUG)        console.error(`stack:\n${info.stack}`);
  console.error('');
  console.error(`DIAGNOSIS     : ${info.diagnosis}`);
  console.error(`FIX           : ${info.fix}`);
  console.error('═══════════════════════════════════════════════════════════════════════');
}

async function main(): Promise<void> {
  console.log('DIAGNOSE · OpenAI LIVE failure');
  console.log('────────────────────────────────────────────────────────────────────');

  // ── Step 1 · env presence ─────────────────────────────────────
  console.log('Step 1 · environment');
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    printFailure({
      step: '1 · env presence',
      message: 'OPENAI_API_KEY is not set in this process environment',
      diagnosis: '#1 OPENAI_API_KEY NOT LOADED · the verifier process did not inherit the key from the shell.',
      fix: 'Confirm the key is exported BEFORE running: `OPENAI_API_KEY=sk-... npx tsx scripts/diagnose-openai.ts`. On Windows PowerShell: `$env:OPENAI_API_KEY = "sk-..."`. On Windows cmd: `set OPENAI_API_KEY=sk-...`. If using .env, confirm dotenv is loaded (Next.js loads .env.local for `next dev`/`next build` but tsx scripts need explicit loading · use `npx dotenv-cli -e .env.local -- tsx scripts/diagnose-openai.ts`).',
    });
    process.exit(1);
  }
  console.log(`  OPENAI_API_KEY    : present · length=${key.length} · prefix="${key.slice(0, 8)}…" · suffix="…${key.slice(-4)}"`);
  console.log(`  OPENAI_MODEL      : "${MODEL}" ${process.env.OPENAI_MODEL ? '(from env)' : '(default)'}`);
  console.log(`  OPENAI_TIMEOUT_MS : ${TIMEOUT_MS}`);
  console.log(`  OPENAI_DEBUG      : ${DEBUG ? 'on' : 'off'}`);
  console.log('  PASS');

  // ── Step 2 · key shape ────────────────────────────────────────
  console.log('\nStep 2 · key shape');
  if (!/^sk-[A-Za-z0-9\-_]+$/.test(key)) {
    printFailure({
      step: '2 · key shape',
      message: `OPENAI_API_KEY value does not match the expected pattern sk-... · got prefix "${key.slice(0, 8)}..."`,
      diagnosis: '#2 KEY SHAPE WRONG · the value loaded is not a normal OpenAI API key. Could be a trailing newline, surrounding quotes from a config file, or the wrong env var.',
      fix: 'Print the key length in the shell and confirm it matches platform.openai.com. Trim quotes and whitespace. On Windows .env files, ensure the line is `OPENAI_API_KEY=sk-...` with no quotes and no trailing whitespace.',
    });
    process.exit(1);
  }
  console.log(`  shape OK · "sk-..."`);
  console.log('  PASS');

  // ── Build a client we can reuse for the remaining steps ───────
  const client = new OpenAI({ apiKey: key, timeout: TIMEOUT_MS });

  // ── Step 3 · SDK ping (gpt-4o-mini · simplest call) ──────────
  console.log(`\nStep 3 · SDK ping (model=${PROBE_MODEL} · plain chat · no schema)`);
  try {
    const t0 = Date.now();
    const r = await client.chat.completions.create({
      model: PROBE_MODEL,
      messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
      max_tokens: 5,
      temperature: 0,
    });
    const latency = Date.now() - t0;
    const out = r.choices[0]?.message?.content ?? '';
    console.log(`  response          : "${out.trim()}"`);
    console.log(`  latency           : ${latency}ms`);
    console.log(`  tokens in/out     : ${r.usage?.prompt_tokens}/${r.usage?.completion_tokens}`);
    console.log('  PASS');
  } catch (e) {
    const err = summarizeError(e);
    const { diagnosis, fix } = classify(err, PROBE_MODEL);
    printFailure({ step: '3 · SDK ping', ...err, diagnosis, fix });
    process.exit(1);
  }

  // ── Step 4 · configured-model ping ────────────────────────────
  console.log(`\nStep 4 · configured-model ping (model=${MODEL})`);
  try {
    const t0 = Date.now();
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
      max_tokens: 5,
      temperature: 0,
    });
    const latency = Date.now() - t0;
    const out = r.choices[0]?.message?.content ?? '';
    console.log(`  response          : "${out.trim()}"`);
    console.log(`  latency           : ${latency}ms`);
    console.log(`  tokens in/out     : ${r.usage?.prompt_tokens}/${r.usage?.completion_tokens}`);
    console.log('  PASS');
  } catch (e) {
    const err = summarizeError(e);
    const { diagnosis, fix } = classify(err, MODEL);
    printFailure({ step: '4 · configured-model ping', ...err, diagnosis, fix });
    process.exit(1);
  }

  // ── Step 5 · structured-output ping ───────────────────────────
  console.log(`\nStep 5 · structured-output ping (model=${MODEL} · response_format json_schema strict)`);
  try {
    const t0 = Date.now();
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Return: {"ok":true,"echo":"pong"}' }],
      max_tokens: 50,
      temperature: 0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ping',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['ok', 'echo'],
            properties: {
              ok: { type: 'boolean' },
              echo: { type: 'string' },
            },
          },
        },
      },
    });
    const latency = Date.now() - t0;
    const out = r.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(out);
    console.log(`  response          : ${JSON.stringify(parsed)}`);
    console.log(`  latency           : ${latency}ms`);
    console.log(`  tokens in/out     : ${r.usage?.prompt_tokens}/${r.usage?.completion_tokens}`);
    console.log('  PASS');
  } catch (e) {
    const err = summarizeError(e);
    const { diagnosis, fix } = classify(err, MODEL);
    printFailure({ step: '5 · structured-output ping', ...err, diagnosis, fix });
    process.exit(1);
  }

  // ── Step 6 · full generation call (chocolate vertical) ────────
  console.log(`\nStep 6 · full generation call (vertical=chocolate · same prompt as production)`);
  // Lazy import to avoid loading adapter side-effects unless we reach step 6.
  const adapter = await import('../lib/mvpOpenaiAdapter');
  const vc = resolveVerticalContext(
    {
      artifact: 'שוקולד מריר פרימיום של מותג ישראלי',
      audience: 'בוגרים ישראליים 32-50 · עירוניים · עם תקציב להוצאה איכותית',
      emotional: 'להיות נוכחים ברגעים שאחרת היו אובדים',
      locale: 'Israel · Hebrew',
    },
    { forceVerticalId: 'chocolate' },
  );
  const ctx = assembleGenerationContext(vc);

  try {
    const t0 = Date.now();
    const outcome = await adapter.openaiGenerate(ctx, {
      artifact: 'שוקולד מריר פרימיום של מותג ישראלי',
      audience: 'בוגרים ישראליים 32-50',
      emotional: 'להיות נוכחים ברגעים שאחרת היו אובדים',
      locale: 'Israel · Hebrew',
    });
    const totalLatency = Date.now() - t0;

    console.log(`  total latency     : ${totalLatency}ms`);
    console.log(`  attempts          : ${outcome.attempts.length}`);
    for (const a of outcome.attempts) {
      console.log(`    attempt ${a.attemptNumber}     : ok=${a.ok} · latency=${a.latencyMs}ms · tokens=${a.tokensIn ?? '?'}/${a.tokensOut ?? '?'}`);
      if (!a.ok && a.failures.length > 0) {
        for (const f of a.failures) console.log(`      ↳ ${f}`);
      }
    }
    if (outcome.fellBackToCorpus) {
      printFailure({
        step: '6 · full generation call',
        message: `openaiGenerate returned a fallback after ${outcome.attempts.length} attempt(s). Last reason: ${outcome.fallbackReason ?? '(unknown)'}`,
        diagnosis: '#9 VALIDATOR REJECTS EVERY OPENAI OUTPUT (likely) · the API call(s) returned content but the validator (locale purity · forbidden vocab · cross-vertical leakage · density · risky claims) rejected both attempts.',
        fix: 'Inspect the per-attempt failure list above. If failures show locale-purity violations, the model produced mixed-language text · the prompt is binding it incorrectly. If forbidden-vocab/cross-vertical-leak, the model leaked another vertical\'s words. If density < 60%, the model isn\'t including the required vocabulary. Each maps to a prompt tweak in buildSystemPrompt.',
      });
      process.exit(1);
    }
    if (outcome.result) {
      console.log(`  result.tokens in/out : ${outcome.result.tokensIn ?? '?'}/${outcome.result.tokensOut ?? '?'}`);
      console.log(`  result.model         : ${outcome.result.model}`);
      console.log(`  hooks count          : ${outcome.result.payload.hooks.length}`);
      console.log(`  oneLiners count      : ${outcome.result.payload.positioningOneLiners.length}`);
      console.log(`  ugcScripts count     : ${outcome.result.payload.ugcScripts.length}`);
      console.log(`  imageConcepts count  : ${outcome.result.payload.imageConcepts.length}`);
      console.log(`  qualitySelfCheck     : ${JSON.stringify(outcome.result.payload.qualitySelfCheck)}`);
      console.log('  PASS');
    }
  } catch (e) {
    const err = summarizeError(e);
    const { diagnosis, fix } = classify(err, MODEL);
    printFailure({ step: '6 · full generation call', ...err, diagnosis, fix });
    process.exit(1);
  }

  console.log('\n────────────────────────────────────────────────────────────────────');
  console.log('ALL 6 STEPS PASS · OpenAI LIVE pipeline is healthy.');
  console.log('Re-run `npx tsx scripts/verify-real-llm-generator.ts` · the verifier should now show non-zero tokens / latency / cost.');
  console.log('────────────────────────────────────────────────────────────────────');
  process.exit(0);
}

main().catch((e) => {
  const err = summarizeError(e);
  printFailure({
    step: 'unexpected',
    ...err,
    diagnosis: 'Unexpected error outside the test ladder.',
    fix: 'Inspect the message and stack above.',
  });
  process.exit(1);
});
