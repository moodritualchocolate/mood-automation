#!/usr/bin/env node
/**
 * scripts/print-lan-url.mjs
 *
 * Print every LAN IPv4 address this machine has, with the runtime
 * URL the user can open from a phone on the same WiFi. Runs once at
 * the top of `npm run dev:lan` so the URL is visible above the
 * Next.js startup output.
 *
 * No external deps; uses node:os only.
 */
import os from 'node:os';

const PORT = process.env.PORT || 3000;
const interfaces = os.networkInterfaces();
const candidates = [];

for (const [name, addrs] of Object.entries(interfaces)) {
  if (!addrs) continue;
  for (const a of addrs) {
    // IPv4, non-loopback, non-link-local.
    if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) {
      candidates.push({ iface: name, ip: a.address });
    }
  }
}

console.log('');
console.log('  ─── LAN ACCESS — open from a phone on the same WiFi ───');
if (candidates.length === 0) {
  console.log('  no LAN interfaces found — falling back to localhost only');
} else {
  for (const c of candidates) {
    console.log(`  http://${c.ip}:${PORT}/runtime    (${c.iface})`);
  }
  console.log('');
  console.log('  note: this exposes the runtime to anyone on this WiFi.');
  console.log('  trusted networks only. ctrl-c to stop.');
}
console.log('');
