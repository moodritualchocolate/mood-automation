import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

test("renders the MOOD preview shell with the approved routes", async () => {
  const [homeRoute, productRoute, layout] = await Promise.all([
    text("app/page.tsx"),
    text("app/[slug]/page.tsx"),
    text("app/layout.tsx"),
  ]);

  assert.match(homeRoute, /exact-v30\/home\.html/);
  assert.match(productRoute, /energy.*relax.*sleep/s);
  assert.match(productRoute, /energy:\s*["']\/exact-v30\/energy\.html["']/);
  assert.match(productRoute, /relax:\s*["']\/exact-v30\/relax\.html["']/);
  assert.match(productRoute, /sleep:\s*["']\/exact-v30\/sleep\.html["']/);
  assert.match(layout, /MOOD/);
  assert.match(layout, /שוקולד פונקציונלי/);
});

test("ships the conversion layer on every product page", async () => {
  for (const slug of ["energy", "relax", "sleep"]) {
    const html = await text(`public/exact-v30/${slug}.html`);
    assert.match(html, /conversion-lock\.css/);
    assert.match(html, /conversion-lock\.js/);
    assert.match(html, /dotsEl\.innerHTML=''/);
  }
});

test("labels temporary social proof and includes complete policy destinations", async () => {
  const [home, homeJs, productJs, policies] = await Promise.all([
    text("public/exact-v30/home.html"),
    text("public/exact-v30/home-conversion-lock.js"),
    text("public/exact-v30/conversion-lock.js"),
    text("public/policies.html"),
  ]);

  assert.match(home, /home-conversion-lock\.css/);
  assert.match(home, /home-conversion-lock\.js/);
  assert.match(homeJs, /תוכן הדגמה/);
  assert.match(productJs, /תוכן הדגמה/);

  for (const id of ["shipping", "returns", "privacy", "terms", "accessibility"]) {
    assert.match(policies, new RegExp(`id=["']${id}["']`));
  }
});
