# 104 — Friend Challenges

> A user can gently invite one friend to live the same small challenge — as companionship, never competition, with no scoreboard and no winner.

## Purpose
Some courage is easier with a companion. This chapter lets a user say to one person, "let's try this together today." It turns a private Challenge (Ch. 41) into shared courage without ever becoming a contest. There is no comparison of who did more, no ranking, no visibility into whether the friend "won". The purpose is solidarity, not rivalry.

## User Experience
From Challenge Selection, the user may tap "להזמין חבר/ה לנסות יחד" ("invite a friend to try together"). They pick the level for themselves and send a warm invitation link: "בא/י ננסה משהו קטן ואמיץ יחד היום?" ("shall we try something small and brave together today?"). The friend opens it, chooses their own level (or opts out warmly), and both live it separately in the real world. Later each may see only a soft, symmetric acknowledgment: "שניכם ניסיתם היום. זה יפה." ("you both tried today. that's beautiful."). Neither sees the other's journal, outcome, or a comparison. Declining is honored: "אולי בפעם אחרת" ("maybe another time").

## Game Mechanic
A `FriendChallenge` links two `Attempt`s to one shared `Challenge` theme. States: `invited → accepted | declined`, then each side independently `chosen → lived | not_lived`. The only shared signal is a symmetric "both tried" acknowledgment — and only if both opt to share it. No level comparison, no timing race, no streak between friends. Declines and non-participation are never surfaced as failure.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Shared Humanity

## Visual Assets Needed
- Social/Share assets (the invitation background)
- People assets and Light assets (warm companionship, faceless/intimate)
No text baked into images; the Hebrew invitation copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) supplies the shared challenge's three levels. Reflection Generator may write the symmetric acknowledgment line. Guardrails: outcome-agnostic, no comparison, no "who did better". Copy Linter blocks competitive, rank, or shame framing. Never diagnose either participant.

## Data Stored
`FriendChallenge { id, challengeId, inviterAttemptId, inviteeAttemptId?, state, createdAt }`. Each side owns its own `Attempt` and private `JournalEntry` — never shared. Copy Hebrew; timestamps ISO 8601. Local-first; Supabase relays the invite token and the optional symmetric acknowledgment only.

## Edge Cases
- Friend never accepts: inviter's own Attempt stands, fully complete, no "waiting on them" nag.
- Friend declines: warm message, no penalty to either.
- Different levels chosen: honored equally; never compared.
- Offline: user's own side works locally; invite queues to send.
- One tries, one doesn't: no "you beat them" — only each person's honored attempt.

## Build Requirements
Invite-token flow; `FriendChallenge` model; symmetric acknowledgment component; Copy Linter rules. Medium effort atop Challenge infra. No scoreboard or shared journal.

## Definition of Done
- [ ] Invitation is one-to-one, warm, and penalty-free to decline.
- [ ] No scoreboard, winner, ranking, or level comparison exists.
- [ ] Journals and outcomes stay private to each person.
- [ ] Only a symmetric, opt-in "both tried" signal is ever shared.
- [ ] Hebrew RTL copy renders in light and dark.
