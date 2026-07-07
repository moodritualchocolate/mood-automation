import { chromium } from "playwright-core";
const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const DIR = "/home/user/mood-automation/art/scene_001_before_returning/";

// SHARED DEFS — identical light/palette DNA for every derivative (same stops = same world).
const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#120f26"/><stop offset="0.34" stop-color="#1b1733"/>
    <stop offset="0.56" stop-color="#322540"/><stop offset="0.72" stop-color="#5e3a3f"/>
    <stop offset="0.86" stop-color="#95562f"/><stop offset="1" stop-color="#bf7435"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.13" cy="0.86" r="0.6">
    <stop offset="0" stop-color="#ffd79a" stop-opacity="0.95"/><stop offset="0.2" stop-color="#f6b46a" stop-opacity="0.66"/>
    <stop offset="0.48" stop-color="#c9793e" stop-opacity="0.24"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="door" cx="0.5" cy="0.5" r="0.55">
    <stop offset="0" stop-color="#ffe6b0"/><stop offset="0.55" stop-color="#f0a95c" stop-opacity="0.92"/>
    <stop offset="1" stop-color="#b56a30" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a2418"/><stop offset="0.4" stop-color="#241522"/><stop offset="1" stop-color="#0d0912"/>
  </linearGradient>
  <radialGradient id="vign" cx="0.5" cy="0.46" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0a0710" stop-opacity="0"/><stop offset="0.7" stop-color="#0a0710" stop-opacity="0.34"/>
    <stop offset="1" stop-color="#0a0710" stop-opacity="0.74"/>
  </linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="softer"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="haze"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="shadowblur"><feGaussianBlur stdDeviation="11"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.9 0"/></filter>
</defs>`;

// reusable house (base-centered at cx, sitting on groundY, scaled by s)
function house(cx, groundY, s) {
  const w = 300 * s, h = 252 * s, x = cx - w / 2, y = groundY - h;
  const dw = 78 * s, dh = 186 * s, dx = cx - w * 0.28, dy = groundY - dh;
  return `
  <g fill="#160f16"><rect x="${x}" y="${y}" width="${w}" height="${h}"/>
    <path d="M${x - 12} ${y + 4} L${cx} ${y - 72 * s} L${x + w + 12} ${y + 4} Z"/></g>
  <ellipse cx="${dx + dw / 2}" cy="${groundY + 34 * s}" rx="${210 * s}" ry="${52 * s}" fill="#e2a55e" opacity="0.30" filter="url(#softer)"/>
  <rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="4" fill="url(#door)" filter="url(#softer)" opacity="0.85"/>
  <rect x="${dx + 11}" y="${dy + 12}" width="${dw - 22}" height="${dh - 12}" fill="#ffe9bc"/>
  <rect x="${dx + 11}" y="${dy + 12}" width="${dw - 22}" height="${dh - 12}" fill="url(#door)" opacity="0.55"/>
  <rect x="${dx + 4}" y="${dy + 6}" width="${dw - 8}" height="${dh - 6}" fill="none" stroke="#0e0910" stroke-width="${7 * s}" opacity="0.6"/>`;
}
// reusable figure (feet-centered at cx,feetY, scaled by s); sun-left rim + shadow to right
function figure(cx, feetY, s) {
  return `
  <path d="M${cx} ${feetY - 6} L${cx + 300 * s} ${feetY + 6} L${cx + 300 * s} ${feetY + 16} L${cx} ${feetY + 4} Z" fill="#080510" opacity="0.5" filter="url(#shadowblur)"/>
  <g transform="translate(${cx},${feetY}) scale(${s})">
    <path d="M-20 -179 q6 -12 20 -12 q14 0 20 12 q10 20 8 44 l4 92 q-32 12 -64 0 l4 -92 q-2 -24 8 -44 z" fill="#130c16"/>
    <ellipse cx="0" cy="-197" rx="13" ry="15" fill="#130c16"/>
    <path d="M-18 -46 l-6 46 q8 4 16 0 l6 -44 z" fill="#0e0812"/>
    <path d="M10 -46 l10 44 q8 3 15 -2 l-11 -44 z" fill="#0e0812"/>
    <path d="M-20 -212 q-9 20 -8 54 q0 40 4 78" stroke="#eab06a" stroke-width="3.5" fill="none" opacity="0.55" filter="url(#soft)"/>
  </g>`;
}
const atmosphere = (W, H, horizon) => `
  <rect width="${W}" height="${horizon + 30}" fill="url(#sky)"/>
  <rect width="${W}" height="${H * 0.8}" fill="url(#sun)"/>
  <rect x="0" y="${horizon - 54}" width="${W}" height="120" fill="#c88a4e" opacity="0.24" filter="url(#haze)"/>
  <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#ground)"/>`;
const finish = (W, H, scrimTop) => `
  <rect y="${scrimTop}" width="${W}" height="${H - scrimTop}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#vign)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05" style="mix-blend-mode:overlay"/>`;

// --- derivative compositions (same world, reframed) ---
const targets = [
  { name: "hero_9x16", W: 1080, H: 1920, body: () => {
      const horizon = 1040;
      return atmosphere(1080, 1920, horizon)
        + house(760, horizon, 0.72)
        + figure(300, 1240, 1.15)
        + `<rect y="${horizon}" width="1080" height="150" fill="#5a3a3e" opacity="0.16" filter="url(#haze)"/>`
        + `<circle cx="880" cy="240" r="1.8" fill="#e9e2ff" opacity="0.4"/>`
        + finish(1080, 1920, 1240);
    } },
  { name: "background_9x16", W: 1080, H: 1920, body: () => {
      const horizon = 1120;
      return atmosphere(1080, 1920, horizon)
        + `<rect y="${horizon}" width="1080" height="160" fill="#5a3a3e" opacity="0.14" filter="url(#haze)"/>`
        + `<circle cx="300" cy="300" r="1.6" fill="#e9e2ff" opacity="0.4"/><circle cx="820" cy="200" r="1.2" fill="#e9e2ff" opacity="0.3"/>`
        + finish(1080, 1920, 900);
    } },
  { name: "close_1x1", W: 1200, H: 1200, body: () => {
      // intimate doorway: the wall fills, one warm door, spill
      return `<rect width="1200" height="1200" fill="#160f16"/>
        <rect width="1200" height="1200" fill="url(#sun)" opacity="0.5"/>
        <ellipse cx="560" cy="1020" rx="520" ry="150" fill="#e2a55e" opacity="0.30" filter="url(#softer)"/>
        <rect x="430" y="300" width="300" height="640" rx="10" fill="url(#door)" filter="url(#softer)" opacity="0.9"/>
        <rect x="470" y="340" width="210" height="600" fill="#ffe9bc"/>
        <rect x="470" y="340" width="210" height="600" fill="url(#door)" opacity="0.5"/>
        <rect x="452" y="320" width="256" height="620" fill="none" stroke="#0e0910" stroke-width="22" opacity="0.65"/>`
        + finish(1200, 1200, 820);
    } },
  { name: "poster_3x4", W: 1200, H: 1600, body: () => {
      const horizon = 1000;
      return atmosphere(1200, 1600, horizon)
        + house(940, horizon, 0.62)
        + figure(430, 1120, 1.0)
        + `<rect y="${horizon}" width="1200" height="150" fill="#5a3a3e" opacity="0.16" filter="url(#haze)"/>`
        + finish(1200, 1600, 1120);
    } },
];

const b = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox", "--force-color-profile=srgb"] });
for (const t of targets) {
  const ctx = await b.newContext({ viewport: { width: t.W, height: t.H }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const svg = `<svg width="${t.W}" height="${t.H}" viewBox="0 0 ${t.W} ${t.H}" xmlns="http://www.w3.org/2000/svg">${DEFS}${t.body()}</svg>`;
  await p.setContent(`<!doctype html><body style="margin:0">${svg}</body>`, { waitUntil: "networkidle" });
  await p.locator("svg").screenshot({ path: DIR + t.name + "_v01.png" });
  console.log("rendered", t.name);
  await ctx.close();
}
await b.close();
