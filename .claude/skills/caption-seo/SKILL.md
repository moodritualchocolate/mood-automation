---
name: caption-seo
description: >
  Write the discovery layer for a short-form video — the on-screen text hook, the platform caption,
  the hashtag set, and the searchable keywords — tuned per platform (TikTok, Instagram Reels, YouTube
  Shorts) and in the audience's own language. Use this skill whenever the user needs a caption,
  description, on-screen text, title, or hashtags for a video, asks to "make it discoverable", "write
  the caption", "what hashtags", "add the on-screen hook text", "SEO for reels/tiktok/shorts", or is
  about to publish and hasn't written the copy yet. Trigger it proactively whenever a video is finished
  but its caption/hashtags/on-screen text aren't written — the visual can be perfect and still die
  without the text that makes it findable and clickable. Brand-agnostic: reads brand voice and audience
  from the project, pulls current hashtags/topics from `trend-scout`, and forbids the brand's banned
  words.
---

# Caption & SEO

A video's reach has two engines: the **feed** (hook + retention) and **search/discovery** (the text
around it). Creators obsess over the first and neglect the second, then wonder why a great clip
stalls. The caption, the on-screen text, and the hashtags decide whether the algorithm understands
the video, whether search surfaces it for months, and whether a scroller taps. This skill writes that
layer deliberately — not as an afterthought, and not as generic hashtag soup.

## The three surfaces (write all three)

### 1. On-screen text hook (highest leverage)
The words burned into the **first frame** are read before the caption and often before the audio
loads. They must state the hook or pose the tension in a few words, in the audience's language,
scannable at a glance. Keep it short, high-contrast, and legible on mobile. This is part of the
video, so coordinate with the hook (`viral-hook-generator`) and the composition.

### 2. Caption
Platform-native structure:
- **Line 1 = a second hook.** The caption's first line is a hook in its own right (it shows above the
  "more" fold). Curiosity, a bold claim, or a relatable line — never a description of the video.
- **Value / context** — one or two lines that add something the video didn't, or sharpen the point.
- **Soft CTA** — a comment prompt ("איזה מהם אתם?"), a save nudge, or "בלינק בביו". Comment-bait that
  invites a genuine reply lifts engagement and reach.
- **Language & voice** — the audience's language, first-person and specific. Obey the brand's banned
  words and tone (e.g. no "Discover/Premium/Transform" for MOOD). Never translate ad copy literally.

### 3. Hashtags & keywords
- **Mix by breadth**, don't spam one tier: a couple of **broad** (large reach, high competition),
  several **niche** (where you can actually rank), and one or two **branded** (own your tag).
- **Pull current tags from `trend-scout`** (Lens 1/2) rather than guessing — tag trends shift.
- **Search SEO:** platforms are search engines now. Put the real keyword phrase a person would type
  into the caption and (where relevant) the on-screen text and file/title — not just hashtags.
- Keep the count platform-appropriate (Reels/TikTok: a focused handful beats 30; Shorts: lean on
  title + description keywords more than tags).

## Per-platform notes

- **TikTok** — search-driven; keywords in the caption matter as much as tags. Trending-sound name can
  itself aid discovery. Short punchy caption.
- **Instagram Reels** — caption line 1 is critical (fold); a few strong tags; keywords help the
  in-app search and Explore.
- **YouTube Shorts** — title carries the most SEO weight; write a real searchable title; description
  keywords; tags matter least.

## Output

```
# Discovery Pack — {video} · {platform(s)}
On-screen hook (frame 0): "{≤6 words, audience language}"
Caption:
  {hook line}
  {value/context}
  {soft CTA}
Hashtags: {broad} {niche×several} {branded}
Search keywords: {the phrase people would type}
Per-platform tweaks: {if publishing to more than one}
```

Rules:
- **Three surfaces, always** — the on-screen hook, the caption, the tags. A caption without on-screen
  text leaves the biggest lever unused.
- **Audience language, brand voice, banned words respected.** Discoverability never overrides brand.
- **Current tags, not evergreen guesses** — route through `trend-scout` when unsure.
- Offer platform variants when the video goes to more than one place; don't cross-post one caption
  blindly.
