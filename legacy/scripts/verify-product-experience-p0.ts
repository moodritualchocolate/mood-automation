/**
 * VERIFY — Product Experience P0 Rebuild.
 *
 * 12 cases. Source-level checks only (no live server probe). The
 * verifier ensures that the audit's P0 blockers are closed by code
 * presence + structural checks.
 *
 *   1. /login exists
 *   2. /register exists
 *   3. /account exists
 *   4. Root / is no longer the legacy formula picker
 *   5. New product pages no longer hardcode 'org-mood' / 'wsp-mood-default'
 *   6. /api/auth/register is wired to a "create first workspace" path
 *      (the /api/auth/create-first-workspace route exists)
 *   7. /api/asset-registry POST uses requireTenantSession (not just requireSession)
 *   8. Brand identity fields influence the generator (the generator
 *      reads brand.identity.paletteKey / defaultVisualMode / defaultCta / signature)
 *   9. Brand setup includes an "Assets" step (image upload placeholder)
 *  10. AuthProvider exists and is mounted in the root layout
 *  11. /api/auth/login accepts a body WITHOUT operatorReason
 *      (operatorReason is no longer required to log in)
 *  12. /api/auth/bootstrap returns a Set-Cookie / mood_session
 *      (the route sets the session cookie on success)
 */

import { promises as fs } from 'fs';
import * as path from 'path';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function read(p: string): Promise<string> {
  try { return await fs.readFile(p, 'utf8'); } catch { return ''; }
}

const ROOT = path.resolve(__dirname, '..');

async function main(): Promise<void> {
  console.log('VERIFY — Product Experience P0 Rebuild');
  console.log('--------------------------------------');

  // ─── Case 1: /login exists ────────────────────────────────────
  {
    const p = path.join(ROOT, 'app', 'login', 'page.tsx');
    const ok = await exists(p);
    record('1', '/login page exists', ok, ok ? p : `missing: ${p}`);
  }

  // ─── Case 2: /register exists ─────────────────────────────────
  {
    const p = path.join(ROOT, 'app', 'register', 'page.tsx');
    const ok = await exists(p);
    record('2', '/register page exists', ok, ok ? p : `missing: ${p}`);
  }

  // ─── Case 3: /account exists ──────────────────────────────────
  {
    const p = path.join(ROOT, 'app', 'account', 'page.tsx');
    const ok = await exists(p);
    record('3', '/account page exists', ok, ok ? p : `missing: ${p}`);
  }

  // ─── Case 4: / is not the legacy formula picker ───────────────
  {
    const p = path.join(ROOT, 'app', 'page.tsx');
    const txt = await read(p);
    const isLegacy =
      /CAMPAIGN_MODES/.test(txt) &&
      /critic brutality/i.test(txt) &&
      /choose a formula/i.test(txt);
    const hasSignup = /\/register/.test(txt) && /\/login/.test(txt);
    record('4', 'root / is no longer the legacy formula picker (and links to login/register)',
      !isLegacy && hasSignup,
      `isLegacy=${isLegacy} hasSignup=${hasSignup}`);
  }

  // ─── Case 5: no hardcoded org/workspace ids in new pages ──────
  {
    const files = [
      'app/studio-home/page.tsx',
      'app/asset-generator/page.tsx',
      'app/asset-library/page.tsx',
      'app/brand-setup/[brandId]/page.tsx',
    ];
    let bad = 0;
    let where = '';
    for (const f of files) {
      const txt = await read(path.join(ROOT, f));
      // Match string literals only — comments may reference them.
      const literals = (txt.match(/['"`]org-mood['"`]|['"`]wsp-mood-default['"`]/g) ?? []);
      if (literals.length > 0) {
        bad += literals.length;
        where += ` ${f}(${literals.length})`;
      }
    }
    record('5', 'new product pages do not hardcode org-mood / wsp-mood-default',
      bad === 0,
      bad === 0 ? '0 hardcoded references' : `${bad} reference(s) found:${where}`);
  }

  // ─── Case 6: /api/auth/create-first-workspace exists ──────────
  {
    const p = path.join(ROOT, 'app', 'api', 'auth', 'create-first-workspace', 'route.ts');
    const txt = await read(p);
    const ok = txt.includes('appendOrganization')
      && txt.includes('appendWorkspace')
      && txt.includes('appendMembership')
      && txt.includes('organization-owner');
    record('6', '/api/auth/create-first-workspace exists and creates org+workspace+owner membership',
      ok, ok ? 'route is wired'
             : `route missing required appends · txt-len=${txt.length}`);
  }

  // ─── Case 7: asset-registry POST uses requireTenantSession ────
  {
    const p = path.join(ROOT, 'app', 'api', 'asset-registry', 'route.ts');
    const txt = await read(p);
    const importsTenant = /requireTenantSession/.test(txt);
    // Look at the POST body specifically.
    const postBlock = txt.split('export async function POST')[1] ?? '';
    const postCallsTenant = /requireTenantSession\s*\(/.test(postBlock);
    record('7', '/api/asset-registry POST uses requireTenantSession (not only requireSession)',
      importsTenant && postCallsTenant,
      `importsTenant=${importsTenant} postCallsTenant=${postCallsTenant}`);
  }

  // ─── Case 8: brand identity influences generator ──────────────
  {
    const p = path.join(ROOT, 'app', 'asset-generator', 'page.tsx');
    const txt = await read(p);
    const checks = [
      { name: 'reads ident.paletteKey',        re: /ident\.paletteKey/ },
      { name: 'reads ident.defaultVisualMode', re: /ident\.defaultVisualMode/ },
      { name: 'reads ident.defaultCta',        re: /ident\.defaultCta/ },
      { name: 'reads ident.signature',         re: /ident\.signature/ },
    ];
    const misses = checks.filter((c) => !c.re.test(txt)).map((c) => c.name);
    record('8', 'brand identity fields influence generator brief defaults',
      misses.length === 0,
      misses.length === 0 ? 'all 4 identity fields wired' : `missing: ${misses.join(', ')}`);
  }

  // ─── Case 9: brand setup has the Assets step ──────────────────
  {
    const p = path.join(ROOT, 'app', 'brand-setup', '[brandId]', 'page.tsx');
    const txt = await read(p);
    const hasStepKey = /'assets'\s*,?\s*label:\s*'Assets'/.test(txt) || /key:\s*'assets'/.test(txt);
    const hasUploadPlaceholder = /upload integration coming next/i.test(txt);
    const hasBrandAssetUI = /brandAssets/.test(txt);
    record('9', 'brand setup includes the Assets step (image upload placeholder + brandAssets record)',
      hasStepKey && hasUploadPlaceholder && hasBrandAssetUI,
      `step=${hasStepKey} placeholder=${hasUploadPlaceholder} brandAssetsUI=${hasBrandAssetUI}`);
  }

  // ─── Case 10: AuthProvider mounted in root layout ─────────────
  {
    const ap = path.join(ROOT, 'app', 'components', 'auth', 'AuthProvider.tsx');
    const lay = path.join(ROOT, 'app', 'layout.tsx');
    const apExists = await exists(ap);
    const layText = await read(lay);
    const wraps = /<AuthProvider/.test(layText) && /AuthProvider/.test(layText);
    record('10', 'AuthProvider exists and is mounted in root layout',
      apExists && wraps,
      `apExists=${apExists} wrapsInLayout=${wraps}`);
  }

  // ─── Case 11: login accepts a body without operatorReason ─────
  {
    const p = path.join(ROOT, 'app', 'api', 'auth', 'login', 'route.ts');
    const txt = await read(p);
    // Look for `operatorReason !== undefined` (optional pattern) and
    // ensure the old `'operatorReason is required'` 400 path is gone.
    const oldRequired = /operatorReason\s+is\s+required/.test(txt);
    const optionalShape = /operatorReason\?\s*:\s*string|operatorReason\s*!==\s*undefined/.test(txt);
    record('11', '/api/auth/login no longer requires operatorReason in the body',
      !oldRequired && optionalShape,
      `oldRequired=${oldRequired} optionalShape=${optionalShape}`);
  }

  // ─── Case 12: bootstrap sets the session cookie ───────────────
  {
    const p = path.join(ROOT, 'app', 'api', 'auth', 'bootstrap', 'route.ts');
    const txt = await read(p);
    const issuesSession = /appendSession\(/.test(txt) && /newSessionId\(\)/.test(txt);
    const setsCookie = /res\.cookies\.set\(\s*SESSION_COOKIE_NAME/.test(txt);
    record('12', '/api/auth/bootstrap issues a session and sets the cookie',
      issuesSession && setsCookie,
      `issuesSession=${issuesSession} setsCookie=${setsCookie}`);
  }

  console.log('');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`${passed}/${results.length} passed.`);
  if (failed > 0) {
    console.log(`${failed} failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
