# MOOD Content Style Guide

The official writing standard, derived from the frozen MVP library — not invented.
Every future writer learns the voice from here; the linter (`npm run lint:content`)
enforces the hard rules automatically. If a line fails the linter, it does not ship.

## The voice in one breath
Short. Warm. Specific. Human. A perceptive friend who notices the small thing —
never a coach, therapist, guru, or motivational poster. Hebrew, always.

## The seven rules (with real lines)

**1. Reflect, don't diagnose.** Name a strength *inside* the hesitation; stay tentative.
- ✅ `נראה שאתה שם לב לאנשים עוד לפני שאתה ניגש אליהם. זו לא ביישנות — זו תשומת לב.`
- ❌ `אתה ביישן.` / `יש לך חרדה חברתית.`
- Rule: hedge with `נראה / אולי / לפעמים / כמעט`. Never `אתה תמיד`, never `יש לך [condition]`.

**2. Success is the attempt, never the outcome.**
- ✅ `ניסית. זה כל העניין — לא איך זה נגמר, אלא שהתחלת.`
- ❌ `הצלחת!` / `נכשלת` / any `הצלח/נכשל/כישלון`.

**3. "Not this time" is warm and costless.** A skipped day never carries guilt.
- ✅ `לא הפעם — וזה בסדר גמור. הרגע נשאר שלך.`
- ❌ `אל תפספס יום` / `שמור על הרצף שלך` / anything with a streak or counter.

**4. No comparison, ever.** Company, never competition.
- ✅ `אתה לא לבד ברגע הזה.`
- ❌ `רוב האנשים לא עושים את זה — אתה כן.` (subtle pressure + vanity)

**5. Invite, don't instruct.** Challenges may be imperative (they're invitations to act);
everything else must not lecture the user about life.
- ✅ challenge: `תגיד שלום לאדם אחד שאתה לא מכיר.` · sub: `מילה אחת מספיקה.`
- ❌ reflection as advice: `תזכור לנשום עמוק` / `היית צריך...`

**6. Never generic wellness.** If it could appear in any calm-app, rewrite it.
- ❌ `מגיע לך` / `הכול יהיה בסדר` / `נשום עמוק` / `אהוב את עצמך` / `החיים יפים`.
- ✅ specific and earned: `נבוך ושמח באותו רגע — ככה נראה אומץ אמיתי מבפנים.`

**7. Keep it short.** One idea per line. User-facing lines stay under ~135 characters;
most are far shorter. Long, explanatory sentences are a smell.

## Length & rhythm
- Titles: 2–4 words (`רגע קטן של אומץ`).
- Recognition: 1–3 short lines, revealed one at a time.
- Reflection / hooks: one sentence, occasionally two clauses joined by `—`.
- The em-dash `—` is our breath. Use it; don't overuse it.

## Words we never use (linter-enforced)
streak/`רצף שלך`, score/`ניקוד`/`נקודות`, `הצלחת`/`נכשלת`, `רוב האנשים … אתה`,
clinical terms (`חרדה`, `דיכאון`, `הפרעה`, `טראומה`, `לעבד רגשות`), productivity
(`פרודוקטיביות`, `יעילות`, `לייעל`), wellness clichés (above), the noun "cards"/`קלף`,
and any English in user-facing copy (the brand token `MOOD` is the only exception).

## Repetition
Signature refrains are allowed (`נתראה מחר.`, the challenge header, level labels,
`ניסיתי`/`לא הפעם`, quick-tap chips). Narrative lines (recognitions, reflections,
becoming seeds, tomorrow hooks) must be **distinct per Moment** — the linter warns on
any narrative line repeated across 3+ files.

## The test for any new line
Read it aloud. If it sounds like a coach, a therapist, a productivity app, or a
fridge magnet — rewrite it. If it sounds like someone who quietly noticed something
true about you and said it gently — ship it.

## How new content enters the product
1. Author to this guide. 2. `npm run lint:content` must pass (0 errors). 3. Content
Guardian review for the things a linter can't catch (is it *specific*? does it sound
like MOOD?). 4. Only then merge. The library is frozen; only Reality Gate feedback
earns the right to add more.
