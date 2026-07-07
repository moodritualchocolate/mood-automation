#!/usr/bin/env node
// MOOD Content Linter — the Content Guardian's automated gate.
// Walks every content JSON, extracts user-facing HEBREW strings, and rejects copy
// that isn't MOOD. Exit 1 on any ERROR. Run: node content/lint/mood-content-lint.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "content");
const HEB = /[֐-׿]/;
const LATIN = /[A-Za-z]/;

// keys whose string values are INTERNAL (english notes / config) and not user copy
const INTERNAL_KEYS = new Set([
  "note", "notes", "theme", "emotional_truth", "meaning", "reason", "rule",
  "assembly_rule", "tone", "no_compare_note", "safety", "forbidden", "version",
  "id", "dimension", "hero_scene", "key", "level", "folder", "when", "when_dimensions",
  "prompt_ref", "status", "role", "blocked_by", "brief", "template", "acts_by_dimension",
  // internal config values (english by design)
  "axis", "scene", "default_level", "signals", "prefer", "constraints", "when_distinct_dimensions"
]);
const BRAND = /MOOD/g; // allowed Latin brand token inside Hebrew copy
// files that are entirely internal
const SKIP_FILES = new Set(["schema.json", "qa_notes.json", "metadata.json", "index.json"]);

// --- rule sets (Hebrew) ---
const ERROR_RULES = [
  ["comparison", /רוב האנשים|הרבה אנשים לא |כמו כולם|יותר מאחרים|פחות מאחרים|כמו אחרים/],
  ["success/failure", /הצלח|נכשל|כישלון/],
  ["gamification/streak", /רצף ימים|הרצף שלך|רצף שלך|שמור על הרצף|אל תפספס|ניקוד|נקודות|שיא אישי|דירוג|לוח מובילים|קלף/],
  ["shame/pressure", /היית צריך|אתה חייב|למה לא עשית|תתאמץ|אל תתעצל|אתה לא מספיק/],
  ["therapy/clinical", /חרדה|דיכאון|הפרעה|טראומה|תת-מודע|לעבד רגשות|אבחון|פתולוג/],
  ["productivity", /פרודוקטיב|יעילות|לייעל|אופטימיזציה|לנצל את הזמן|ניהול זמן/],
  ["generic-wellness-cliché", /אהוב את עצמך|מגיע לך|הכול יהיה בסדר|נשום עמוק|החיים יפים|האמן בעצמך|כל יום הוא מתנה|את\/ה מספיק/],
];
const WARN_RULES = [
  ["over-generalization", /אתה תמיד|אתה אף פעם|את תמיד|את אף פעם/],
  ["advice-imperative", /^(תעשה|תזכור|אל תשכח|קח את עצמך|תהיה)\b/],
];
const MAX_LEN = 135; // overlong user-facing line (chars)
const REFRAIN_ALLOW = new Set([
  "רך", "אמצע", "אמיץ", "לא הפעם", "ניסיתי", "נתראה מחר.",
  "אין נכון ואין לא-נכון. יש רק לנסות.",
]);

let errors = 0, warns = 0;
const seen = new Map(); // line -> [files]

function walk(obj, keypath, file, internalAncestor) {
  if (typeof obj === "string") {
    const lastKey = keypath[keypath.length - 1];
    const internal = internalAncestor || INTERNAL_KEYS.has(lastKey);
    check(obj, keypath.join("."), file, internal);
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, [...keypath, String(i)], file, internalAncestor)); return; }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      walk(v, [...keypath, k], file, internalAncestor || INTERNAL_KEYS.has(k));
    }
  }
}

function report(level, rule, file, kp, s) {
  const tag = level === "ERROR" ? "❌ ERROR" : "⚠️  WARN";
  console.log(`${tag} [${rule}] ${file} :: ${kp}\n        "${s}"`);
  if (level === "ERROR") errors++; else warns++;
}

const HEDGE = /נראה|אולי|לפעמים|כמעט|קצת/; // tentative framing neutralizes over-generalization

function check(s, kp, file, internal) {
  if (internal) return;                 // english notes/config — skip
  const bare = s.replace(BRAND, "").trim(); // allow the brand token "MOOD"
  if (!HEB.test(bare)) {                 // a non-Hebrew value in a user-facing slot
    if (LATIN.test(bare)) report("ERROR", "english-leakage", file, kp, s);
    return;
  }
  if (LATIN.test(bare)) report("ERROR", "english-leakage(mixed)", file, kp, s);
  for (const [name, rx] of ERROR_RULES) if (rx.test(s)) report("ERROR", name, file, kp, s);
  for (const [name, rx] of WARN_RULES) {
    if (name === "over-generalization" && HEDGE.test(s)) continue; // hedged is ok
    if (rx.test(s)) report("WARN", name, file, kp, s);
  }
  if (s.length > MAX_LEN) report("WARN", `overlong(${s.length})`, file, kp, s);
  // repetition tracking — narrative copy only; skip UI chips and yes/no buttons
  if (!REFRAIN_ALLOW.has(s) && !kp.includes("quick_taps") && !kp.includes("did_you_try")) {
    const arr = seen.get(s) || []; arr.push(file); seen.set(s, arr);
  }
}

// collect files
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return files(p);
    return d.name.endsWith(".json") ? [p] : [];
  });
}

for (const f of files(ROOT)) {
  const rel = path.relative(ROOT, f);
  if (SKIP_FILES.has(path.basename(f))) continue;
  let data;
  try { data = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { report("ERROR", "invalid-json", rel, "-", String(e.message)); continue; }
  walk(data, [], rel, false);
}
// repetition pass
for (const [line, fs_] of seen) {
  const uniq = [...new Set(fs_)];
  if (fs_.length > 2) report("WARN", `repetition(x${fs_.length})`, uniq.join(", "), "-", line);
}

console.log(`\nMOOD content lint: ${errors} error(s), ${warns} warning(s).`);
process.exit(errors > 0 ? 1 : 0);
