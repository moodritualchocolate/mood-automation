// Server-only loader: reads the frozen content library from /content into a bundle.
// No duplication — the JSON files are the single source of truth.
import fs from "node:fs";
import path from "node:path";
import type { ContentBundle, MomentContent } from "./engine";

const ROOT = path.join(process.cwd(), "content");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

export function loadBundle(): ContentBundle {
  const index = read("index.json");
  const moments: Record<string, MomentContent> = {};
  for (const m of index.moments) {
    const f = m.folder; // e.g. "moments/moment_001_courage"
    const md = read(`${f}/metadata.json`);
    const rec = read(`${f}/recognitions.json`);
    const ch = read(`${f}/challenge_ladder.json`);
    const rf = read(`${f}/reflections.json`);
    const bs = read(`${f}/becoming_seeds.json`);
    const th = read(`${f}/tomorrow_hooks.json`);
    moments[md.dimension] = {
      id: md.id,
      dimension: md.dimension,
      title: md.title,
      recognitions: rec.recognitions,
      challengeHeader: ch.header,
      challenges: ch.levels,
      onTry: rf.on_try || [],
      onNotThisTime: rf.on_not_this_time || [],
      becomingOnTry: bs.on_try || [],
      tomorrowHooks: th.hooks || [],
    };
  }
  // The wedge rotation: a fixed, life-chosen (never user-chosen) diverse 6-day sample.
  const order = ["courage", "rest", "kindness", "connection", "presence", "curiosity"]
    .filter((d) => moments[d]);
  return {
    moments,
    order,
    discovery: read("library/discovery_conversation.json"),
    becomingStatements: read("library/becoming_statements.json"),
    becomingPortrait: read("library/becoming_portrait.json"),
    feelings: read("library/feelings.json").feelings,
    system: read("library/system.json"),
  };
}
