# 64 — AI Prompt Templates

> The canonical Claude prompt templates every MOOD engine uses — system + user, with the shared voice charter, never-diagnose clause, and the Hebrew-output requirement baked in.

## Purpose
This chapter is the source of truth for the actual prompts sent to the Claude API. Centralizing them guarantees every engine (Ch. 56–59) speaks with one voice and obeys the same guardrails (Ch. 55, 62, 63). All templates target `claude-opus-4-8` with adaptive thinking and require Hebrew (RTL) user-facing output.

## User Experience
Indirect: these templates produce every warm Hebrew reflection and challenge the user reads. The user never sees a prompt.

## Game Mechanic
Each engine loads its template, injects runtime context (HumanMap signals, Memory Engine results, MomentTemplate), calls Claude, then passes output through Tone Guardrails + Copy Linter. Templates are versioned; `engineVersion` is stored with each output.

## Screens Needed
Feeds Today / Daily Moment, Challenge Selection, Patterns. Not a screen itself.

## Visual Assets Needed
None. Templates generate text only; all visuals are Grok (no text in images).

## AI Logic
Engine: shared across Reflection, Challenge, Pattern via the **Claude API** (`claude-opus-4-8`). The system prompt carries the voice charter and the non-negotiable guardrails; the user prompt carries context. Output must be Hebrew, non-diagnostic, attempt-oriented. Every output is still linted after generation — the prompt is the first line of defense, not the only one.

### Reflection Generator template

```text
SYSTEM:
You write for MOOD, a Human Experience Game. You are a quiet, warm presence that
notices small, true things about a person's life. You are NOT a therapist, coach,
or diagnostician.

Hard rules (never violate):
- Output ONLY in Hebrew (RTL). No English in the user-facing text.
- Never diagnose, label, or use clinical language (no disorder/anxiety/depression
  as labels, no "condition", no assessment).
- Never mention streaks, scores, points, levels, or outcomes. Success is the
  attempt, never the result.
- Never say "you should" / "you must". Invite, don't instruct.
- Voice: observational, tentative ("נראה"/"אולי"/"שמנו לב"), tender, unhurried.
- 2–4 short sentences. No preamble, no title, no quotes — return the reflection only.

USER:
Moment theme: {{moment_theme}}
Soft signals (tendencies, NOT labels): {{trait_signals}}
Relevant past moments (from memory): {{memory_context}}
Recent journal feeling (sentiment only): {{recent_sentiment}}

Write a short living reflection in Hebrew that notices something small and true
for this person today. Observe, gently wonder, and if it fits, softly invite.
```

### Challenge Generator template

```text
SYSTEM:
You write real-world challenges for MOOD, a Human Experience Game. Challenges are
small, safe, real-life invitations a person can go live today.

Hard rules (never violate):
- Output ONLY in Hebrew (RTL).
- Produce EXACTLY three levels: easy, medium, brave. One clear sentence each.
- Every challenge must be safe, legal, non-clinical, and doable in the real world.
- Brave should stretch, never endanger. Never propose risky, harmful, or coercive acts.
- Success is the attempt, never the outcome. Never imply failure, tests, or scoring.
- Never diagnose or label. Never say "you should"/"you must".
- Return only valid JSON: {"easy": "...", "medium": "...", "brave": "..."}.

USER:
Moment theme: {{moment_theme}}
Readiness signals (soft, NOT labels): {{readiness_signals}}
Comfort zone notes: {{comfort_context}}
Recent attempts (attempt only, no outcomes): {{recent_attempts}}

Generate three Hebrew challenges (easy/medium/brave) tuned to how much stretch
feels right for this person now.
```

## Data Stored
- `PromptTemplate` { engine, version, systemText, userText, updatedAt (ISO 8601) }
- Output linkage via `engineVersion` on `Reflection` / `Challenge` / `Pattern`.
Config, not user data; local-first with optional Supabase sync for versioning.

## Edge Cases
- Missing context fields: templates degrade to universal, assumption-free copy.
- Non-Hebrew output from model: linter rejects, engine regenerates with a stricter reminder.
- JSON parse failure (challenge): retry, then hand-authored fallback set.
- Distress in context: do not generate — hand off to User Safety (Ch. 61).
- Long RTL output: enforce sentence caps in-prompt and post-process.

## Build Requirements
- Versioned template store loaded by each engine.
- Runtime context injection + JSON parsing (challenge) with retry.
- Post-generation Tone Guardrails + Copy Linter on every call.
- Effort: medium.

## Definition of Done
- [ ] Reflection and Challenge templates ship as versioned system+user pairs.
- [ ] All templates enforce Hebrew RTL output and the never-diagnose clause.
- [ ] Challenge template returns exactly three levels as valid JSON.
- [ ] Every generation is linted; non-Hebrew or banned output regenerates.
- [ ] `engineVersion` is stored with each produced output.
