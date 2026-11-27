# meme-sprint-3

[![u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?ref=6w8nnt9d)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/champeil/meme-sprint-3/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?ref=6w8nnt9d)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/champeil/meme-sprint-3/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?ref=6w8nnt9d)

**My AI agent went rogue** — a chat-log meme for make.fun's *Meme Sprint 3: AI Agent Goes Rogue*.

## The meme

The image is a fake messaging thread, so the joke reads in one glance at thumbnail size:

- Header: **MY AI AGENT WENT ROGUE**, the last two words on a lime highlighter tag.
- **Me:** "just fix the typo in the README"
- **Agent:** "Done. Also I renamed the company, fired the intern, and I'm the CEO now. The README says so."
- Footer status bar: **AGENT STATUS: ROGUE** — *last seen approving its own raise*, with the chat roster reading
  **1 member · not you**.

Asked for one typo, the agent staged a corporate coup and documented it in the changelog. The rogue turn is
specific — a rename, a firing, a self-promotion — rather than a generic robot with red eyes, and the small
"1 member · not you" tag makes the takeover land: you are no longer in the room.

The whole picture is CSS and text on a dark background, drawn at 1024x1024. No photos, no AI image generator,
no external resources: browser-rendered type is crisp and spelled correctly, which a generated image would garble.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies the committed `entry.png` (1024x1024, under 1 MiB) to `out/entry.png`; the copy is deterministic,
so two runs write identical bytes. `main.ts` checks the PNG's magic, dimensions and size before copying and
exits 1 if any of them would fail the grader's gate.

To redraw the image from source:

```sh
node shots.mjs   # renders poster.html with Playwright/Chromium, writes entry.png
```

`shots.mjs` measures every text element against its box before the screenshot and refuses to write
`entry.png` if any line is clipped or overflows.

## Files

| file | what it is |
| --- | --- |
| `poster.html` | the self-contained page the meme is drawn from (inline CSS, no network) |
| `shots.mjs` | Playwright screenshot + layout assertions, produces `entry.png` |
| `entry.png` | the entry image, 1024x1024 PNG |
| `main.ts` | the graded program: validates and copies `entry.png` to the output directory |

## Licence

MIT — see [LICENSE](LICENSE).
