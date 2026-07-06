# SPEC — One Perfect Moment (Vertical Slice #1)

> **Owner of this document:** Claude (Product + Psychology).
> **Status:** Product definition complete — ready for Grok (visual body), then Codex (build).
> **Pipeline:** this feature runs the FULL pipeline incl. Feeling Gate + Reality Gate.
> **KPI it must move:** *"Did the player naturally want to return tomorrow?"*

This is the first feature. Everything depends on it. Per founder mandate, this
slice is not "the Moment alone" — it must contain the **entire loop, simplified**,
because the loop *is* the game:

```
Discovery → Human Map → Moment → Recognition → Challenge → Evening Journal → Living Library → (Returning Pull → tomorrow)
```

Nothing here is placeholder. The Hebrew copy below is canonical intent (final
strings pending a native copywriter pass, per the audit follow-up). This spec is
the Claude-lane source of truth; Grok and Codex build from the two briefs at the end.

---

## 1. The Human Moment (what we are actually making)

A person opens MOOD for the first time. In under 90 seconds, through a few playful
choices — not a questionnaire — MOOD learns one true, small thing about them. It
then hands them a single **Daily Moment** that quietly reflects that thing back, and
invites one small, real-world act of courage they can do *today*. In the evening
they return, say whether they tried, and watch the Moment settle into a library that
is now, unmistakably, *theirs*. They leave wanting to know what tomorrow will notice.

The feeling we are optimizing for, in the user's inner voice:
> *"מישהו שם לב למשהו קטן בחיים שלי שלא ידעתי איך להגיד."*
> ("Someone noticed something small about my life I never knew how to say.")

For the very first slice we hand-craft **one theme: small social courage.** One
theme, done perfectly, beats ten done adequately. The architecture is general; the
content set is one.

---

## 2. The Loop, Simplified (each stage, with copy)

### 2.1 Discovery (≈4 choices, visual, playful)
Full-bleed image pairs; the person taps the one that feels more like them. No text
questions, no right answers, no progress-percent nag. Each tap writes a soft signal.

Opening line (once): **"בוא נכיר. בלי שאלות. רק תבחר מה מרגיש לך."**
("Let's get to know each other. No questions. Just choose what feels like you.")

Four binary image-choices (Grok provides the pairs; Product defines the axis):
1. A lit window from outside **vs.** a warm room from inside — *belonging axis*.
2. A hand reaching first **vs.** a hand waiting, open — *initiation axis*.
3. A crowded sunlit street **vs.** one quiet person on a bench — *social-energy axis*.
4. A door half-open **vs.** a door wide open — *approach-to-risk axis*.

Each choice nudges 1–2 soft `Trait` signals (0–1, with low starting confidence).
No result screen, no "your type is…". It simply flows into the Moment.

### 2.2 Human Map (simplified, invisible)
The four choices produce a minimal `HumanMap`: soft floats for `social_courage`,
`initiation`, `social_energy`, `belonging`, each with `confidence` starting low
(~0.3) and `decay` defined but not yet firing (single day). **Never shown as a
profile. Never labeled.** It exists only to choose the right first Moment and to
tune the challenge intensity. For slice #1 there is one Moment, so the Map's live
job is small — but it must be real, written, and inspectable, because Phase 2 grows it.

### 2.3 Moment (the one hand-crafted Daily Moment)
Timeless artwork (Grok) + tiny Hebrew title + living reflection, over negative space.

- **Title (tiny):** **"רגע קטן של אומץ"** ("a small moment of courage").
- **Living reflection (the Recognition — see 2.4):** shown as 1–2 quiet lines.

No "cards." No buttons shouting. The artwork breathes; text is the app's live layer.

### 2.4 Recognition (the line that makes them feel seen)
This is the heart. One or two Hebrew sentences that reflect the person's own
discovery choices back to them — gently, specifically, never as a verdict.

Example (person leaned "waiting hand" + "quiet bench"):
> **"נראה שאתה שם לב לאנשים לפני שאתה ניגש. זו לא ביישנות — זו תשומת לב."**
> ("It seems you notice people before you approach. That's not shyness — it's attention.")

Rules: reflect, don't diagnose; name a strength inside the hesitation; never
"you are X." (Owned by Claude; passes Tone Guardrails + Copy Linter.)

### 2.5 Challenge (one ladder: Easy / Medium / Brave)
One tap reveals three real-world invitations. **Success = trying.** The person picks
one; nothing is locked, nothing is scored.

| Level | Hebrew invitation | Gloss |
|-------|-------------------|-------|
| Easy | **"תגיד שלום לאדם אחד שאתה לא מכיר."** | Say hello to one stranger. |
| Medium | **"פתח שיחה קצרה עם מישהו היום."** | Start a short conversation with someone today. |
| Brave | **"ניגש למישהו שסקרן אותך, והתחל שיחה אמיתית."** | Approach someone who intrigued you and begin a real conversation. |

Selection copy: **"אין נכון ואין לא-נכון. יש רק לנסות."** ("No right, no wrong. Only trying.")
The chosen `Challenge`+`ChallengeLevel` writes an open `Attempt` (status: `chosen`).

### 2.6 Live (outside the app)
The person leaves. MOOD gets quieter, not louder. **At most one** gentle, optional
reminder later in the day (default on, one time, easily off — per Settings Ch. 98).
Reminder copy: **"הרגע שלך מחכה בערב."** ("Your moment is waiting this evening.") —
an invitation, never a nag, never a streak warning.

### 2.7 Evening Journal (the return)
Same day, evening. Four soft inputs, all optional except the first:
1. **"ניסית?"** (Did you try?) → *ניסיתי / לא הפעם* ("I tried" / "not this time").
   - If **not this time:** **"גם זה בסדר גמור. הרגע נשאר שלך."** ("That's completely
     okay too. The moment stays yours.") — zero penalty, warm, no loss language.
2. **"מה קרה?"** (What happened?) — free text, optional.
3. **"איך הרגשת?"** (How did you feel?) — a small set of soft feeling taps + free text.
4. **"תרצה לנסות שוב?"** (Want to try again?) — yes/maybe/no, feeds tomorrow's tuning.

Writes a `JournalEntry` and closes the `Attempt` (`tried` | `not_this_time` — never
`failed`). Trying nudges `social_courage` confidence up a little; not-this-time never
nudges down. Life is not punished.

### 2.8 Living Library (their story, now visibly begun)
The Moment settles in with its artwork, title, recognition line, the level they chose,
and their evening words. The library shows **one** item — but it is *theirs*, and the
empty space around it clearly implies growth. Copy on first entry:
> **"זה הרגע הראשון בספרייה שלך. מחר יצטרף עוד אחד."**
> ("This is the first moment in your library. Tomorrow another will join it.")

---

## 3. The Returning Pull — how we earn tomorrow WITHOUT dark patterns

This is the Product answer to the KPI *"did the player naturally want to return
tomorrow?"* We refuse streaks, counters, guilt, and loss-aversion. A wanted return
is built from three tone-safe forces, all seeded tonight:

1. **Anticipation (a gift waiting, not a debt owed).** Tomorrow holds a *new* Moment
   they haven't seen. The evening closes with a soft forward-look — a gift, never an
   obligation: **"מחר מחכה לך רגע חדש — לא יודע עדיין מה הוא יראה בך."** ("A new moment
   waits for you tomorrow — it doesn't yet know what it'll notice in you.")
2. **Continuity (their own story growing, not a score).** They saw the library begin.
   The pull is "I want to see my story fill in," which is self-referential and needs
   no comparison, no number going up.
3. **Curiosity (being noticed, and wanting to be noticed again).** After one real
   recognition, the person wants to know *what MOOD will notice next.* The Pattern
   Engine (Phase 4) will later deepen this, but even at slice #1 the recognition line
   plants: "this thing sees me — I'm curious what it sees tomorrow."

**Explicitly forbidden in this feature (and enforced by the Copy Linter):** streak
counters, "don't break your streak," "you'll lose…", day-counters, red badges,
guilt reminders, or any loss-framed notification. If the return is not *wanted*, it
does not count toward the KPI.

---

## 4. Data (this slice)
`User`, `HumanMap` (+ 4 soft `Trait`s), one `MomentTemplate` + one `DailyMoment`,
one `Challenge` (+ 3 `ChallengeLevel`s), one `Attempt`, one `JournalEntry`, one
`LibraryItem`. Local-first (no account required); schema mirrors Ch. 113. **No
streak/score/level/points fields exist.** All copy fields store Hebrew.

## 5. Edge Cases (must be handled)
- **First run / cold start:** discovery flows straight into the Moment; never a blank.
- **Skipped day:** no penalty, no streak break, no guilt copy. The next open simply
  presents the day's Moment warmly.
- **Offline:** entire loop works offline (local-first); sync is optional/later.
- **Not-this-time:** warm acknowledgement, Moment still saved, Map never decremented.
- **Reminder off:** fully functional; the app never punishes silence.
- **RTL / long Hebrew strings:** every string reflows without clipping in RTL.
- **Accessibility:** screen-reader labels for image-choices; reduced-motion honored;
  tap targets ≥ 44px; contrast on text-over-image guaranteed by the app's scrim.

## 6. Definition of Done (Product)
- [ ] A first-time user completes Discovery → Moment → Recognition → Challenge →
      Evening Journal → Library in one day, offline, with no account.
- [ ] The recognition line demonstrably reflects the user's own choices.
- [ ] Success is framed as trying everywhere; "not this time" is warm and costless.
- [ ] Zero streak/score/guilt/loss language anywhere (Copy Linter green).
- [ ] The Returning Pull is present (anticipation + continuity + curiosity), with a
      single optional reminder and no dark patterns.
- [ ] Passes Feeling Gate (all three agree) **and** Reality Gate (real people:
      "would you come back tomorrow?" trends yes).

---

## 7. Handoff Brief → GROK (Art Department)
Product needs these visual assets for slice #1. No text of any kind in any image;
reserve bottom-third negative space for the live Hebrew layer. Follow Vol. 07/08 +
`GROK_ASSET_BRIEF.md`. Deliver:
- **4 discovery image-pairs** (8 images), each pair expressing one axis in §2.1,
  emotionally warm, wordless, tappable full-bleed (9:16).
- **1 Masterpiece Moment artwork** for "small social courage" — two people on the
  edge of a first hello, warm afternoon light, seen with tenderness, generous
  bottom negative space (4:5 + 9:16 crops).
- **1 evening/return background** — same world at dusk, calm, for the Journal (9:16).
- **1 Library ground texture** — paper-like warmth for the first library entry (1:1).
- Grok holds a **Visual QA veto** at the Feeling Gate.

*Claude ↔ Grok question on the table:* does "small social courage" read warmer as
two strangers at a café counter, or a bus-stop bench at golden hour? Propose the one
that best carries the recognition line's warmth — challenge my framing if a third
setting serves the feeling better.

## 8. Handoff Brief → CODEX (Engineering)
Build per Vol. 11 + `CODEX_BUILD_PLAN.md` Phase 1, using this spec as the content
truth. Requirements:
- Screens: Splash, Discovery Flow, Today/Daily Moment, Challenge Selection, Evening
  Check-in, Living Library, Moment Detail (Vol. 09), mobile-first, RTL, light/dark.
- Data layer implements the §4 entities via the one data layer (`store` ↔ Supabase),
  local-first, **no streak/score fields** in the schema.
- Copy Linter runs in CI and blocks banned tokens (Ch. 63).
- One optional local daily reminder (max one/day, default on, easily off).
- No account required to complete the full loop.
- Codex holds an **Engineering veto** at the Feeling Gate.

*Claude ↔ Codex question on the table:* recognition copy for slice #1 is
hand-authored (deterministic), not live-Claude-generated, so the first experience is
perfectly controlled and offline. Confirm that's the right call for slice #1, or make
the case for wiring the live Reflection Generator now — challenge me if you see a reason.
