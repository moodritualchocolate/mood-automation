# PROOF_EXPERIMENT — Does doing change how people see themselves?

**Optimized for truth, not success.** Designed so the fastest possible outcome is
*discovering we're wrong.* No app, no art, no polish — on purpose. The things we
strip (beautiful UI, images, reflection) are the alternative explanations we must
rule out, so we remove them rather than defend them.

---

## Hypothesis

**Small real-world choices, repeated over a few days, produce a detectable shift in
how a person describes themselves — and the shift is caused by the *doing*, not by
reflecting, being witnessed, or being entertained.**

One week cannot show a transformation. It can show the **leading indicator**: a
*flicker* — the earliest detectable change in self-description, plus an unprompted
desire to keep going. We are testing for the flicker and its cause.

## Product assumption being tested

That the causal agent is the **act**. If merely thinking/writing about the same
theme moves self-perception just as much, then our core belief is false even if the
product would still be pleasant. We would be selling reflection and telling
ourselves it was action.

## Experiment — a two-arm, single-blind, no-software field test

Everything runs over **text messages + one form.** The operator (founder) sends
scripted daily messages by hand. Participants never learn the hypothesis, never hear
the words *becoming / transformation / self-image*, and don't know there are two arms.

- **Arm A — ACTION (n≈4):** each day, one small real-world choice to *do* in the
  world. Do it, send a one-line "done + what happened." Acknowledgment is neutral
  ("got it"). **No reflection prompt, no portrait, no art.**
- **Arm B — REFLECTION control (n≈4):** each day, the *same theme*, but the
  instruction is to **spend two minutes thinking/writing about it — not doing it.**
  Same neutral acknowledgment. Same everything except the real-world act.

The single variable between arms is **real-world action vs. reflection.** That
isolation is the whole point of the design.

The daily themes rotate across dimensions (a courage day, a rest day, a kindness
day, a connection day, a boundary day, a presence day) so we test the *general*
belief, not one behavior.

## Timeline (7 days)

- **Day 0** — recruit; capture baseline self-description (see Metric); assign arms.
- **Days 1–6** — one message per day per participant; one-line reply back.
- **Day 7** — capture post self-description (independently); 15-min interview.

## Participants

- **6–8 people**, split evenly Action / Reflection, roughly matched on age/temperament.
- Friends-of-friends, **not** insiders. Told only: *"a 6-day daily texting study, ~2
  minutes a day."* Blind to hypothesis and arm. Consent to a short call at the end.

## Daily flow (identical structure, one line differs)

1. **Morning (operator → user):** one sentence.
   - Action arm: *"Today: [small real choice, e.g. 'say the thing you'd normally
     swallow to one person']. Do it when it feels right."*
   - Reflection arm: *"Today: spend two minutes writing about [same theme] — what
     you'd say, and why it's hard."*
2. **User does the act (A) or the reflection (B).**
3. **Evening (user → operator):** one line — *did you / what happened* (A) or *what
   came up* (B). Behavioral truth is logged (did the act actually happen).

No scores, no streaks, no reminders-with-guilt. A missed day is logged, never punished.

## Metric — the only thing that proves transformation

**PRIMARY: Self-Description Shift (blind-coded).**
- **Baseline (Day 0)** and **post (Day 7)**, each participant freely writes **five
  statements beginning "I am someone who…"** — generated, not rated (harder to fake
  than a Likert scale).
- Two raters, **blind to arm**, score each participant 0/1/2:
  - **0** — no meaningful change in self-description.
  - **1** — self-description shifts toward agency/identity, but not clearly tied to
    anything they did.
  - **2** — self-description shifts **and** references, in their own words, things
    they actually *did* this week ("I'm someone who now says what I feel").
- **The proof is a score of 2 in Arm A that does not appear in Arm B.**

**GUARDRAIL 1 — Behavioral floor:** did they actually do the acts? (Action arm must
have done ≥4 of 6; otherwise any "change" is placebo, and it *kills*, not confirms.)
**GUARDRAIL 2 — Arm contrast:** Action shift must clearly exceed Reflection shift.

We explicitly do **not** use retention, DAU, session time, clicks, or completion.

## The single interview question (asked first, then silence)

> **"What changed?"**

Only after they answer freely, unprompted, do we ask the follow-ups — kept open so we
never hand them the answer:
- "What changed about how you see yourself, if anything?"
- "Was there a moment you did something you normally wouldn't?"
- "Do you feel different than a week ago? How?"
- "If you kept going, who would you become?"
- **Attribution:** "What do you think caused that — doing the things, or thinking
  about them?"

Interviews are transcribed and coded blind. The win condition is **spontaneous
self-concept language** ("I realized I'm more…", "I'm becoming someone who…") in Arm
A — *before* we ask about self-image. If they only say "it was nice / fun / pretty,"
the belief is **not** supported (that's aesthetics, not identity).

## Success criteria

- Majority of **Action** arm scores **2** on Self-Description Shift, blind-coded.
- Action shift **clearly exceeds** Reflection shift.
- In interviews, Action users **spontaneously** describe a changed self-view and
  **attribute it to the doing.**
- Behavioral floor met (they actually did the acts).

## Failure criteria (any one)

- No self-description shift in the Action arm.
- Reflection arm shifts **as much** as Action → the driver is reflection/attention,
  not acts. **Core belief killed.**
- "Change" is only aesthetic/enjoyment language → we built a nice thing, not a true one.
- Users report change but **didn't do the acts** → placebo.

## Founder Decision Matrix

**If it succeeds** — the belief holds. Build the smallest *real* product around it:
the 6-day **One Becoming** thread (daily real-world choice → effortless capture →
the evolving portrait). Now, and only now, we add reflection and the portrait back,
because they become the *delivery* of a proven cause. Then run the same "what
changed" measure at scale.

**If it partially succeeds** (Action shifts, but Reflection shifts nearly as much) —
the act is *not* the unique driver. Do **not** build the anti-engagement, "leave the
app and live" architecture yet. Re-run with larger n and a longer horizon to see if
action *separates* from reflection over time; if it never does, our promise becomes
"a daily reflection that shifts self-view," which is a smaller, different company —
decide if we want it.

**If it partially succeeds** (real but weak, or only some users) — the flicker is
real but under-powered. Tighten act-sizing to each person's edge, extend to 3 weeks,
re-run before committing engineering.

**If it fails** — throw away the thesis that *small acts change self-view on a short
timescale.* Two honest branches before abandoning the company: (a) acts may need
**months** — run one tiny long-horizon cohort; (b) if even that shows nothing, retire
"self-view change" as the promise and find a different honest value. **Build no app
until one of these clears.**

---

### Why this can kill us fast (the feature, not the bug)

If reflection moves people as much as action, we learn in **7 days** that our
anti-engagement, real-world-action bet is wrong — before building a single screen for
it. That is worth more than six months of shipping the wrong product. The experiment
is designed to *earn* the right to build, not to bless what we already want.
