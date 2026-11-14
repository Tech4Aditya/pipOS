# Pip's Dream OS — haX.baby "Baby's First Website"

Track 1 (Pip, the Skull Baby). Plain HTML, CSS and JS. No build step, no dependencies.

## Run
Open `index.html`, or `python3 -m http.server` and visit localhost:8000.

## Deploy (5 minutes)
- Vercel / Netlify: drag the folder in, or import the GitHub repo (framework: "Other", no build command, output dir `.`).
- GitHub Pages: push, then Settings > Pages > deploy from `main` / root.
## Running Tests

PipOS includes automated test suites with **zero dependencies**, using Node.js's built-in test runner.

Run all tests from the repository root:
```bash
node --test
```
Or from the `js/` directory:
```bash
cd js
node --test
```

### Test Suites Overview:
- `js/maths.test.js`: Verifies block-stacking physics, overlap calculations, miss detection, and perfect drop thresholds.
- `js/wall.test.js`: Verifies wish length validation, control character sanitization, 15-second cooldown and 10-minute rate limit ceilings, and Firebase/Supabase payload parsing.
- `js/og.test.js`: Verifies Open Graph and Twitter Card metadata in `index.html`, image dimension standards (1200x630 px), PNG signature integrity, and social platform debugger constraints (WhatsApp < 300 KB limit, LinkedIn Post Inspector, and X Card Validator requirements).

## Social Sharing & Open Graph

PipOS features a rich 1200x630 Open Graph preview image (`assets/og-preview.png`) and comprehensive social meta tags configured for high-fidelity link cards across LinkedIn, X (Twitter), WhatsApp, Discord, and Slack:

- **1200x630 Image**: Depicts Pip on a fluffy cloud with glowing amber eyes and starry nightcap, accompanied by the hero headline (*"I build the dreams you fall asleep inside."*) and retro Midnight Nursery badges on a starry midnight sky.
- **File Size**: Optimized at ~181 KB, strictly adhering to WhatsApp's 300 KB maximum preview ceiling.
- **Twitter Card**: Configured as `summary_large_image` for edge-to-edge preview cards.
- **Open Graph Standards**: Includes `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:site_name`, and `og:locale`.

### Testing with Social Debuggers:
- **LinkedIn**: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) - Verifies `og:title`, `og:description`, and large banner rendering.
- **X (Twitter)**: [Card Validator / Tweet Composer preview](https://cards-dev.twitter.com/validator) - Verifies `twitter:card` (`summary_large_image`), image aspect ratio, and typography.
- **WhatsApp**: Previews link in WhatsApp mobile/desktop chats; confirms thumbnail generation respects the < 300 KB constraint.

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
- Wish wall defaults to local device storage, with optional live sharing across devices via a free Firebase or Supabase backend (see setup guide below).
- Visit memory is stored on the visitor's device only (localStorage).
- Odometer is Pip's in-world tally, not real traffic.
- Sound is off until the visitor turns it on (browser autoplay rules); Lullaby Lab turns it on when used.
- Pip's art is an inline SVG drawn with AI assistance (credited in footer).

## Shared Wish Wall Backend Setup (Optional)

PipOS includes a dependency-free backend adapter in `js/wall.js` that connects to any free REST-compatible backend via standard `fetch()`. If unconfigured or offline, it automatically falls back to `localStorage` without generating console errors.

### Option A: Firebase Realtime Database (Recommended)

Firebase Realtime Database offers a generous free tier (1 GB stored, 10 GB/month data transfer, no credit card required) and provides a native REST API requiring **no SDK or libraries**.

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `pip-dreams`).
2. In the left sidebar, open **Build > Realtime Database** and click **Create Database** (choose default location).
3. Open the **Rules** tab and paste the following security rules to enforce length limits and field validation:
   ```json
   {
     "rules": {
       "wishes": {
         ".read": true,
         ".write": true,
         "$wishId": {
           ".validate": "newData.hasChildren(['n', 'w', 't']) && newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('w').isString() && newData.child('w').val().length >= 1 && newData.child('w').val().length <= 120 && newData.child('t').isNumber()"
         }
       }
     }
   }
   ```
4. Copy your Realtime Database reference URL (e.g. `https://pip-dreams-default-rtdb.firebaseio.com/`).
5. In `index.html`, add this script configuration in the `<head>` or before `js/wall.js`:
   ```html
   <script>
     window.PIP_WALL_BACKEND = {
       type: 'firebase',
       url: 'https://pip-dreams-default-rtdb.firebaseio.com/wishes'
     };
   </script>
   ```

---

### Option B: Supabase (PostgreSQL + PostgREST)

Supabase offers a free PostgreSQL database with built-in REST endpoints and Row Level Security (RLS).

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In the **SQL Editor**, run the following schema migration:
   ```sql
   create table wishes (
     id bigint generated by default as identity primary key,
     n text not null default 'A sleepy visitor',
     w text not null,
     t bigint not null default (extract(epoch from now()) * 1000)::bigint,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     constraint wish_length check (char_length(w) >= 1 and char_length(w) <= 120),
     constraint name_length check (char_length(n) <= 20)
   );

   -- Enable Row Level Security
   alter table wishes enable row level security;

   -- Allow public read access
   create policy "Public wishes are viewable by everyone"
     on wishes for select using (true);

   -- Allow public insert access with constraints
   create policy "Anyone can pin a wish"
     on wishes for insert with check (
       char_length(w) >= 1 and char_length(w) <= 120 and char_length(n) <= 20
     );
   ```
3. In **Project Settings > API**, copy your **Project URL** and the public **anon key**.
4. In `index.html`, add this script configuration:
   ```html
   <script>
     window.PIP_WALL_BACKEND = {
       type: 'supabase',
       url: 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/wishes',
       apiKey: 'YOUR_SUPABASE_ANON_KEY'
     };
   </script>
   ```

---

### Security, Rate Limiting & Resilience Features

- **XSS Prevention:** All user-provided names and wishes are rendered strictly using `textContent` and sanitized to strip control characters and invisible unicode characters. No user content is ever evaluated as HTML.
- **Client Rate Limiting:** Enforces a 15-second cooldown between submissions and a maximum of 5 wishes per 10-minute window per visitor, persisted in `localStorage` across page refreshes.
- **Length Limits:** Enforced on client (`name <= 20`, `1 <= wish <= 120`) and server (Firebase Rules / Supabase RLS).
- **Graceful Fallback:** If the network is offline or the backend fails to respond within 6 seconds, wishes are stored locally, cached wishes are rendered, and the user receives a friendly offline toast while keeping the browser console clean.

## Files
`index.html` · `css/style.css` · `js/{util,audio,wall,fx,pip,toys,main,maths,maths.test,wall.test,og.test}.js` · `assets/{favicon.svg,og-preview.png}`
