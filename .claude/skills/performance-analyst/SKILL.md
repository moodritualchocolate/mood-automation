---
name: performance-analyst
description: >
  Close the creator feedback loop: after a video is published, pull its performance data, diagnose why
  it worked or flopped against real benchmarks, extract repeatable lessons, and write the next brief so
  the next video is better. Use this skill whenever the user asks how a video did, wants a post-mortem
  or performance review, says "analyze this video's numbers", "why did it flop", "why did it pop",
  "what worked", "should we make more like this", or shares analytics screenshots/exports from
  TikTok/Instagram/YouTube. Trigger it proactively a few days after anything is published — a creator
  becomes world-class by learning from data, not by guessing, and this is the step that feeds
  `trend-scout` and `scriptwriter` with evidence instead of hunches. Brand-agnostic: reads goals and
  benchmarks from the project and hands its conclusions forward as a concrete next brief.
---

# Performance Analyst

Guessing is what keeps creators average. The ones who compound are running a **loop**: publish →
measure → learn → make the next one better. This skill is the "measure and learn" half. It reads the
real numbers, separates signal from vanity, and turns "the video did okay I guess" into a specific,
testable improvement for the next piece.

## Step 1 — Get the real numbers

You cannot analyze what you can't see. Pull the metrics from platform analytics. In order of value:

- **Retention curve + average watch %** — the most important. Where exactly do viewers drop?
- **3-second / hook rate** — what fraction made it past the hook. This is the algorithm's first gate.
- **Shares and Saves** — the truest virality signals; they mean "worth passing on / coming back to".
- **Watch-through and re-watch / loop rate** — completion and replays.
- **Follows-from-video** — did it convert viewers into audience?
- **Likes, comments, reach/impressions** — context (comments are also content ideas).

If you have live access to the platform's analytics, pull them. If not, **ask the user to paste the
numbers or a screenshot of the analytics panel** — do not invent metrics. Note the sample age
(numbers at 24h vs 7d mean different things).

## Step 2 — Diagnose against benchmarks, not vanity

Raw numbers lie without a baseline. Judge against what actually matters:

- **Hook rate low (<~50–60%)** → the first 1.5s failed. The idea barely got seen; fix the hook/thumb-
  stop before anything else (route to `retention-engineer` / `viral-hook-generator`).
- **Sharp mid-drop** → a specific dead beat. Map the drop timestamp to the cut and name the moment.
- **High views but low shares/saves** → it was watchable but not *worth passing on*. The payoff or
  the "so what" was weak — a content problem, not an edit problem.
- **High saves, modest views** → strong value, weak distribution — the hook/packaging under-sold a
  good core; repackage and re-post.
- **Good watch %, low follows** → entertained but gave no reason to follow — weak brand thread / CTA.
- **Vanity trap:** likes and raw views feel good but predict little. Weight shares, saves, watch %,
  and follows far higher.

Always compare to the account's **own** recent baseline, not global myths — "good" is relative to
what this account normally does.

## Step 3 — Extract lessons (repeat / kill / test)

Turn the diagnosis into three lists:
- **Repeat** — what demonstrably worked (a hook style, a format, a topic, a length). Evidence-backed.
- **Kill** — what demonstrably hurt (a slow open, a format that under-shares).
- **Test** — hypotheses to try next, each phrased so the next video's data can confirm or refute it.

## Step 4 — Write the next brief (the point of it all)

Hand the loop forward. Produce a short brief the next step can act on directly:

```
# Performance Post-Mortem — {video} · pulled {date/age}
Scoreboard: hook {x}% · avg watch {y}% · shares {n} · saves {n} · follows {n}  (vs baseline: …)
What the data says: {2–4 evidence-backed sentences}
Repeat: {…}   Kill: {…}   Test next: {hypotheses}
→ Next brief: {angle/hook/format/length to try, ready for trend-scout / scriptwriter}
```

- Feed **Test/Next-brief into `trend-scout`** (to pair the lesson with a current trend) and
  **`scriptwriter` / the video pipeline** to produce the next iteration.
- Keep it honest: if a video underperformed, say so plainly and diagnose it — a flattering post-mortem
  teaches nothing.

## Honesty & access

- This skill needs the real analytics. Platform analytics usually require a login the environment may
  not have; when that's the case, ask the user to paste numbers/screenshots rather than estimating.
- Never fabricate metrics or a retention curve. No data → say so, and analyze qualitatively (against
  the `retention-engineer` model) while flagging that it's a prediction, not a measurement.
