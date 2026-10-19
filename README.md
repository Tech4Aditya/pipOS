# Pip's Dream OS — haX.baby "Baby's First Website"

Track 1 (Pip, the Skull Baby). Plain HTML, CSS and JS. No build step, no dependencies.

## Run
Open `index.html`, or `python3 -m http.server` and visit localhost:8000.

## Deploy (5 minutes)
- Vercel / Netlify: drag the folder in, or import the GitHub repo (framework: "Other", no build command, output dir `.`).
- GitHub Pages: push, then Settings > Pages > deploy from `main` / root.

## Before you submit (do these)
1. `git init`, commit, push to a PUBLIC repo now. History must fall inside 17-19 Oct 2026 IST. Commit as you change things; do not fake dates.
2. Hard-refresh the live URL on a real phone. Open DevTools on desktop: console should be clean.
3. Optional art: see `assets/README.txt` (add 2 PNGs, flip one meta flag).
4. Personalise the footer in `index.html` if you want a different credit line.
5. Paste/adapt `SUBMISSION.md` into the form.

## What is in it
- Tier 1: eyes follow cursor/touch, head tilt, blink, day/night mood (Pip falls sleepy), scroll-driven story (4 scenes, <150 words each), fully responsive, hidden Easter egg (tap the gold nightcap star 5 times).
- Tier 2: Web Audio music box + endless generative lullaby, flashlight dark room (CSS mask), SVG dream-delivery route synced to scroll, block-stacking mini-game.
- Side quests: sparkle trail, click sounds + mute switch, odometer counter, wish wall, responsive chaos (taskbar becomes a bottom dock on phones, desktop icons on wide screens).
- Visitor memory: Pip greets returning visitors by name and visit count (localStorage).

## Honest limits
- Wish wall and visit memory are stored on the visitor's device only (no backend). The footer and UI say so.
- Odometer is Pip's in-world tally, not real traffic.
- Sound is off until the visitor turns it on (browser autoplay rules); Lullaby Lab turns it on when used.
- Pip's art is an inline SVG drawn with AI assistance (credited in footer).

## Files
`index.html` · `css/style.css` · `js/{util,audio,fx,pip,toys,main}.js` · `assets/`
