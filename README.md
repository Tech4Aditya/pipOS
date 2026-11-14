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
- `js/xss.test.js`: Verifies the Content Security Policy `<meta>` tag structure, audits source code for unsafe DOM sinks, runs an automated battery of 14 OWASP XSS payloads through `createNoteElement`, and validates end-to-end sanitization and safe DOM rendering.
- `js/shortcuts.test.js`: Verifies the `keys.txt` `#shortcuts` window structure, checks presence of all required controls (1 to 8 music keys, arrows for lantern, Space for blocks, `?` key), and validates input/textarea guards.
- `js/pwa.test.js`: Verifies PWA manifest, service worker caching, and icon assets.
- `js/og.test.js`: Verifies social preview tags, dimensions, and WhatsApp file size limits.

## Keyboard Shortcuts (`keys.txt`)

PipOS features a foldable in-world cheat sheet window (`keys.txt`) that can be opened or folded from anywhere on the page by pressing the `?` key:

| Key / Control | Scope | In-World Action |
| :--- | :--- | :--- |
| `1` to `8` | Lullaby Lab | Play pentatonic chimes across ~1.6 octaves (C to high E). |
| `←` `↑` `→` `↓` | Nightlight Collection | Sweep the flashlight lantern beam across the darkroom. |
| `Space` / `Enter` | Rattle & Blocks / Darkroom | Drop the swaying block onto the tower, or inspect a hidden dream. |
| `?` | Global | Open or fold the `keys.txt` shortcuts cheat sheet (ignored while typing in the wish wall form). |
| `Escape` | Global | Close secret dialog or fold the focused cheat sheet window. |

The shortcuts window is fully accessible, reuses the `.win` and `data-foldable` components, and is also linked from the desktop shortcut icons rail on wide screens.

## Content Security Policy (CSP)

PipOS enforces a strict Content Security Policy delivered via `<meta http-equiv="Content-Security-Policy">` in `index.html`. It is specifically tailored for plain HTML/CSS/JS with zero build steps while maintaining compatibility with Google Fonts, inline styles, SVGs, and optional shared backends:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' https://*.firebaseio.com https://*.supabase.co; object-src 'none'; base-uri 'self';">
```

### Directive Breakdown:
| Directive | Value | Purpose |
| :--- | :--- | :--- |
| `default-src` | `'self'` | Base fallback restricting all unlisted resource types strictly to the site's own origin. |
| `script-src` | `'self' 'unsafe-inline'` | Permits local scripts (`js/*.js`), the synchronous `<head>` script (`classList.add('js')`), and optional inline `PIP_WALL_BACKEND` configuration. |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Permits local `css/style.css`, Google Fonts stylesheets, and dynamic CSS custom properties (`--rot`, `--dx`, `--dy`, `--scene`). |
| `font-src` | `'self' https://fonts.gstatic.com` | Permits Fraunces and Fredoka web fonts downloaded from Google Fonts' CDN and any local font files. |
| `img-src` | `'self' data: blob:` | Permits local images (`assets/*.svg`, `assets/*.png`), embedded SVGs, and data/blob URIs. |
| `media-src` | `'self'` | Disallows third-party media loading (all audio is synthesized locally using the Web Audio API). |
| `connect-src` | `'self' https://*.firebaseio.com https://*.supabase.co` | Authorizes `fetch()` calls to optional shared wish wall backends (Firebase Realtime Database and Supabase REST API) while preventing unauthorized data exfiltration. |
| `object-src` | `'none'` | Strictly disables execution of plugins (`<object>`, `<embed>`, `<applet>`). |
| `base-uri` | `'self'` | Prevents unauthorized base-tag URL manipulation (`<base href="...">`). |

> [!NOTE]
> Directives disallowed by the W3C specification in `<meta>` tags (such as `frame-ancestors`, `report-uri`, and `sandbox`) are deliberately excluded to prevent browser console warnings.

## Manual Testing & Verification Steps

### 1. Verify Zero CSP Violations
1. Open `index.html` in any modern desktop browser (Chrome, Firefox, Safari, Edge) or serve it locally (`python -m http.server 8000`).
2. Open Browser Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
3. Click on the **Console** tab.
4. Refresh the page (`Ctrl+R` / `Cmd+R`).
5. **Expected result:** The console displays **0 errors** and **0 CSP violation warnings**. Google Fonts and local scripts load cleanly.

### 2. Manual Wish Wall XSS Injection Test
1. Navigate to the **The wish wall** section (`#wall`).
2. In the **Your name** input field, enter an XSS attack vector:
   ```html
   <img src=x onerror=alert(1)>
   ```
3. In the **Your wish** textarea, enter a script injection attack vector:
   ```html
   <script>alert('XSS')</script>
   ```
4. Click **Pin my wish**.
5. **Verify Security Defenses:**
   - **No execution:** No alert dialog or script execution occurs.
   - **Literal text rendering:** The newly created wish note appears at the top of the wall displaying the literal text string `<script>alert('XSS')</script>`.
   - **Safe length truncation:** The author name displays as `<img src=x onerror=a` (strictly truncated to the 20-character limit).
   - **Inspect DOM:** Right-click the new note and select **Inspect Element**. Confirm that `<p>` and `<span>` contain plain text nodes (`#text`) and that no child `<script>` or `<img>` elements were created.
   - **Console check:** DevTools Console remains completely clean with zero error logs and zero CSP violations.

## Before you submit (do these)
1. `git init`, commit, push to a PUBLIC repo now. History must fall inside 17-19 Oct 2026 IST. Commit as you change things; do not fake dates.
2. Hard-refresh the live URL on a real phone. Open DevTools on desktop: console should be clean.
3. Optional art: see `assets/README.txt` (add 2 PNGs, flip one meta flag).
4. Personalise the footer in `index.html` if you want a different credit line.
5. Paste/adapt `SUBMISSION.md` into the form.

## What is in it
- Tier 1: eyes follow cursor/touch, head tilt, blink, day/night mood (Pip falls sleepy), scroll-driven story (4 scenes, <150 words each), fully responsive, hidden Easter egg (tap the gold nightcap star 5 times).
- Tier 2: Web Audio music box + endless generative lullaby, flashlight dark room (CSS mask), SVG dream-delivery route synced to scroll, block-stacking mini-game.
- Side quests: sparkle trail, click sounds + mute switch, odometer counter, wish wall, keys.txt foldable cheat sheet (`?` key), responsive chaos (taskbar becomes a bottom dock on phones, desktop icons on wide screens).
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
`index.html` · `css/style.css` · `js/{util,audio,wall,fx,pip,toys,main,maths,maths.test,wall.test,xss.test,shortcuts.test,pwa.test,og.test}.js` · `sw.js` · `manifest.webmanifest` · `assets/` · `docs/`
