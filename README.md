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
- `js/pwa.test.js`: Verifies W3C `manifest.webmanifest` installability compliance, application icon dimensions (192px, 512px, 180px) and PNG headers, Service Worker pre-caching manifest, offline navigation fallbacks, and Google Fonts degradation.

## Progressive Web App (PWA) & Offline Support

PipOS is fully installable as an offline-first Progressive Web App on mobile and desktop:

- **Web App Manifest (`manifest.webmanifest`)**: Configured with `standalone` display mode, Pip OS branding, nursery theme colors (`#fff8f1`), and responsive adaptive icons.
- **Application Icons**:
  - `assets/icon-192.png`: 192x192 PNG launcher icon.
  - `assets/icon-512.png`: 512x512 PNG splash and high-res icon.
  - `assets/icon-maskable-512.png`: 512x512 PNG adaptive maskable icon with safe zone padding for Android devices.
  - `assets/apple-touch-icon.png`: 180x180 PNG icon for iOS Safari home screen.
- **Service Worker (`sw.js`)**:
  - **Local Pre-caching**: Caches all essential local files on install (`index.html`, `manifest.webmanifest`, `css/style.css`, `js/*.js`, and `assets/*`).
  - **Cache-First Offline Strategy**: Instant local loading with background revalidation.
  - **Offline Navigation Fallback**: Returns cached `index.html` if the user opens or refreshes the app without network.
  - **Graceful Google Fonts Degradation**: External font requests (`fonts.googleapis.com`, `fonts.gstatic.com`) degrade cleanly when offline without throwing network errors or delaying page render, seamlessly falling back to local system fonts (`Georgia`, `Trebuchet MS`, `Segoe UI`, `sans-serif`).

### Installing pipOS:
- **Chrome / Edge (Desktop)**: Click the **Install pipOS** icon in the address bar.
- **Android (Chrome)**: Tap the menu (⋮) and select **Install app** or **Add to Home screen**.
- **iOS (Safari)**: Tap the Share button (⎋) and select **Add to Home Screen**.

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
`index.html` · `manifest.webmanifest` · `sw.js` · `css/style.css` · `js/{util,audio,wall,fx,pip,toys,main,maths,maths.test,wall.test,pwa.test}.js` · `assets/`
