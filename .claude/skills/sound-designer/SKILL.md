---
name: sound-designer
description: >
  Design the complete audio layer for a short-form or branded video — trending-sound selection, music
  bed, sound-effects, voiceover direction, and cut-to-the-beat timing — then wire it into the actual
  production (HyperFrames `<audio>`/media-use, or an edit spec). Use this skill whenever a video is
  silent and needs sound, when the user says "add music", "add a sound", "make it feel alive", "pick a
  trending audio", "sound design", "sync the cuts to the beat", "it feels flat/quiet", or is about to
  publish a clip with no audio. Trigger it proactively right after a video is cut or rendered — audio
  is roughly half of short-form virality in 2026 and a silent clip almost never travels. Brand-agnostic:
  reads the brand's tone and the video's beat structure from the project/composition, and coordinates
  with `trend-scout` for current sounds and `media-use` for real audio files.
---

# Sound Designer

A silent short-form video is a dead short-form video. Sound is not decoration — the **sound carries
the emotion, sets the pace, and is a primary reason the algorithm and the viewer stay.** In 2026 a
huge share of reach on TikTok/Reels rides the audio (trending sounds get surfaced; original sound
sets a brand apart). This skill turns "we have a silent cut" into a deliberate, beat-synced audio
layer — and actually wires it into production, not just advice.

## Step 1 — Read the cut and the brand

You can't score a video you don't understand. Establish:
- **The beat structure** — the key moments and their timestamps: hook, turns, the reveal/"snap", the
  logo lockup. Read them from the composition/storyboard (e.g. a HyperFrames timeline's scene starts)
  or ask for the cut.
- **Brand tone** — from project instructions (e.g. premium, warm, Israeli, not loud/gimmicky). The
  audio must obey the same brand discipline as the visuals.
- **Platform** — TikTok/Reels reward trending sounds; a website hero wants owned, loopable music.

## Step 2 — Choose the audio strategy (name the tradeoff)

There is no default — pick deliberately and tell the user why:

- **Trending-sound-led** — ride a currently-trending sound/song. *Max reach, but generic and
  short-lived, and you can't legally embed a copyrighted platform sound in a rendered file.* Use for
  organic TikTok/Reels posts where you add the sound **in-app**. Get the current sound from
  `trend-scout` (Lens 1) or a live search — name the track/creator and the trend window.
- **Owned music bed + SFX** — a licensed/generated track plus designed sound-effects. *Distinct,
  brand-owned, embeddable in the render, works for ads and web.* Use for anything rendered or paid.
- **Hybrid** — owned bed for the render + a note to swap/layer the trending sound on the organic post.

State the choice in one line with the reason. For a brand still building identity, bias toward
**owned bed + SFX** for rendered assets and **trending-sound** only for organic posts.

## Step 3 — Build the beat map (the real craft)

Great sound design is **synchronised** — cuts and accents land on the beat, and every key visual
moment gets an audio event. Produce a beat map:

- Pick a **BPM** and confirm the video's key cuts land on beats (or nudge cut timing to the grid —
  coordinate with `motion-psychology` on pacing).
- Assign an **audio event to every key visual moment**. A moment without a sound feels cheap; a sound
  without a moment is noise. Example structure:

```
BPM: 90 · Track: {name/brief} · Mood: {warm, building}
0.0s  hook            → low sub + soft riser begins
2.6s  the reveal/snap → sharp tactile SFX (the "snap"), music hits downbeat
7.7s  macro moment    → bright transient + shimmer as the accent lands
11s   payoff line     → music opens up, warm pad swells
15s   logo lockup     → single confident stinger, then tail
```

- **SFX menu** to draw from: tactile snaps/clicks (product), risers (build tension), transients/hits
  (reveals), whooshes (transitions), sub-drops (impact), shimmers (premium sparkle), UI ticks. Keep
  them subtle and premium if the brand is premium — SFX should feel *felt*, not heard.
- Design an **outro tail** so the end is clean, and consider **loop-ability** (does the last beat lead
  back into the first? — matters for re-watch, coordinate with `retention-engineer`).

## Step 4 — Wire it into production (don't stop at advice)

Turn the plan into real audio in the actual pipeline:

- **HyperFrames**: audio lives in `<audio>` / `<video muted>` elements the framework owns (see
  `hyperframes-core` → `references/variables-and-media.md`). Resolve real files with **`media-use`**:
  `node <media-use>/scripts/resolve.mjs --type bgm --intent "{mood brief}"` and `--type sfx` for
  effects (HeyGen catalog: 10k+ tracks, bundled SFX). Place them, set volume, trim to the cut, and
  align hits to the beat map. A dedicated beat-synced piece may fit the `/music-to-video` workflow.
- **Voiceover**: if the piece needs narration, generate it via `media-use` TTS (`--type voice`) — pick
  a voice matching brand tone; keep VO under the music, ducked at hits.
- **In-app trending sound**: if the strategy is trending-sound-led, render the visual clean (or with a
  quiet bed) and hand the user a note: exact sound name, where to find it, and where the beats should
  land so they can align in-app.

## Step 5 — Deliver the Audio Plan

```
# Audio Plan — {video} · {platform}
Strategy: {trending / owned / hybrid} — {one-line why}
Track: {name or generated brief} · BPM {n} · Mood {…}
Beat map: {the moment→sound table above}
VO: {yes/no, voice, script ref} 
Integration: {exact media-use / HyperFrames steps taken or to take}
In-app note: {only if trending-sound strategy}
```

## Honesty

- You **cannot** download or embed copyrighted TikTok/Instagram/Spotify audio into a rendered file —
  that's the in-app path, and the plan must say so rather than pretend. For embeddable audio, use
  licensed/catalog (`media-use` → HeyGen) or generated music.
- If no audio tooling or network is available, still deliver the beat map and SFX spec so a human (or
  a later run with access) can execute it — the map is the valuable, reusable part.
