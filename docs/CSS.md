# PipOS CSS Architecture & Design Tokens

This document details the design tokens, component architecture, day/night theming mechanism, and section organization of [`css/style.css`](file:///c:/Users/Rushabh%20Mahajan/Documents/GitHub/pipOS/css/style.css).

PipOS adheres strictly to a **zero-build, plain CSS** philosophy. All styling is self-contained without preprocessors, CSS-in-JS, or build tooling.

---

## 1. Design Tokens Reference

All design tokens are defined as CSS Custom Properties in [`css/style.css`](file:///c:/Users/Rushabh%20Mahajan/Documents/GitHub/pipOS/css/style.css#L8-L50). They automatically switch values depending on the active theme (`:root` for Day, `[data-theme="night"]` for Night).

### 1.1 Color Tokens

The visual palette draws from the haX.baby canon: warm nostalgic cream, playful berry ink, and rich cocoa line work.

| Token | Day Theme (`:root`) | Night Theme (`[data-theme="night"]`) | Purpose & Semantic Role |
| :--- | :--- | :--- | :--- |
| `--cream` | `#fff8f1` | `#1b1430` | Root background color for desktop workspace and input buttons |
| `--paper` | `#fffdf9` | `#2a2145` | Window surface, cards, buttons, and elevated container backgrounds |
| `--ink` | `#5c4033` | `#ffe9d2` | Primary body text and icon strokes (WCAG AA compliant against background) |
| `--line` | `#5c4033` | `#e9d3bb` | Solid 3px structural borders for retro windows, buttons, and dividers |
| `--berry` | `#a34063` | `#8e3a63` | Primary brand accent; used for buttons, active dots, and toast banners |
| `--berry-2` | `#913758` | `#7a2f55` | Secondary berry shade used for candy-stripe titlebar patterns |
| `--berry-ink` | `#a34063` | `#ffa6c4` | High-contrast heading and interactive link color |
| `--blush` | `#f7dfe4` | `#3a2a55` | Soft pastel pink; code tags, desktop icon backgrounds, note cards |
| `--butter` | `#ffe9ae` | `#4a3a2e` | Warm golden yellow; marquee banner, chips, notes, active lanterns |
| `--mint` | `#cfeadb` | `#26404a` | Gentle pastel mint green; note cards and shortcut accents |
| `--sky` | `#d6e6f5` | `#241d44` | Soft sky blue; wish notes, route backdrop, and window accents |
| `--bar` | `#ffe3ea` | `#2a2145` | Taskbar background and footer container background |
| `--shadow` | `#5c4033` | `#0c0818` | Hard-edge 3D retro box-shadow (`box-shadow: 7px 7px 0 var(--shadow)`) |
| `--dot` | `rgba(163, 64, 99, 0.14)` | `rgba(255, 233, 210, 0.07)` | Procedural desktop wallpaper dot grid pattern |
| `--focus` | `#a34063` | `#ffa6c4` | Accessible keyboard focus indicator ring (3px solid with offset) |
| `--cloud` | `#ffffff` | `#c9c4f0` | Pip's cloud fill (crisp white in day, soft moonlit lavender at night) |

### 1.2 Typography Tokens

Typography blends classical editorial warmth with approachable rounded letterforms:

| Token | Font Family Stack | Purpose & Usage |
| :--- | :--- | :--- |
| `--f-head` | `"Fraunces", Georgia, "Times New Roman", serif` | Primary display & heading font; titles (`h1`, `h2`, `h3`), storybook text, and Pip's narrative voice. |
| `--f-ui` | `"Fredoka", "Trebuchet MS", "Segoe UI", system-ui, sans-serif` | Interface font; buttons, taskbar, navigation, labels, forms, odometer, and body text. |

> [!NOTE]
> System font fallbacks (`Georgia`, `Trebuchet MS`, `Segoe UI`) are intentionally ordered to guarantee that if Google Fonts are blocked or offline, the layout gracefully renders with matching character and weight metrics.

### 1.3 Layout & Dimension Tokens

| Token | Default Value | Mobile Value (`≤ 720px`) | Purpose |
| :--- | :--- | :--- | :--- |
| `--stick` | `76px` | `12px` | Sticky scroll margin for top navigation bar / dock |
| `--oh` | `64px` | `54px` | Dream odometer digit container height and line-height |

### 1.4 Dynamic / Component-Scoped Tokens

Several components use inline CSS Custom Properties updated in real-time by JavaScript:

| Variable | Scoped Component | Purpose & Description |
| :--- | :--- | :--- |
| `--x`, `--y` | `.darkroom` | Lantern flashlight coordinates in percentage or pixel units |
| `--r` | `.darkroom` | Flashlight illumination radius (default: `92px`) |
| `--glow` | `.darkroom` | Lantern light color cast (`#cfe3ff`, `#ffe9ae`, etc.) |
| `--d` | `.odo-strip` | Odometer digit position (0 through 9) multiplied by `--oh` |
| `--rot` | `.note` | Randomised organic paper tilt on the Wish Wall (`-2.2deg` to `+2.4deg`) |
| `--n` | `.story-track` | Number of bedtime story scenes (used for scroll height: `calc(var(--n) * 90vh)`) |
| `--dx`, `--dy` | `.sparkle` | Pointer velocity vector for floating cursor trail stars |

---

## 2. The Window Component (`.win`)

The `.win` class represents the foundational retro window metaphor throughout PipOS.

### 2.1 Anatomy of a Window

```
+-----------------------------------------------------------+
| [icon] Window Title                             [i][i][x] |  <-- .win-bar (candy-stripe gradient)
+-----------------------------------------------------------+
|                                                           |
|                       .win-body                           |  <-- .win-body (padding: 1.1rem 1.2rem 1.3rem)
|                (Main window content)                      |
|                                                           |
+-----------------------------------------------------------+
 \__________________________________________________________/   <-- box-shadow: 7px 7px 0 var(--shadow)
```

1. **Outer Frame (`.win`)**:
   - `background: var(--paper);`
   - `border: 3px solid var(--line);`
   - `border-radius: 14px;`
   - `box-shadow: 7px 7px 0 var(--shadow);` (hard-edged 3D drop shadow without blur).
   - `overflow: hidden;` ensures title bar stripes and border-radius clip smoothly.
   - On mobile (`≤ 720px`), shadow reduces to `5px 5px 0 var(--shadow)` for compact screens.

2. **Window Bar (`.win-bar`)**:
   - Striped retro gradient: `repeating-linear-gradient(90deg, var(--berry) 0 12px, var(--berry-2) 12px 24px)`.
   - `.win-title`: Truncates cleanly with ellipsis (`text-overflow: ellipsis; white-space: nowrap`).
   - `.win-dots i`: Three decorative circular control dots with 2px white borders.
   - `.win-btn`: Tactile square action button (`36px x 36px`) with 2.5px solid border and cream fill.

3. **Window Body (`.win-body`)**:
   - Interior content padding (`padding: 1.1rem 1.2rem 1.3rem;`).
   - Adapts to `padding: 0.9rem` on narrow screens (`≤ 380px`).

### 2.2 Foldable Windows (`[data-foldable]`)
Windows with `data-foldable` attribute can be collapsed by visitors:
- When folded (`.is-folded`), `.win-body` is hidden via `display: none`.
- The fold toggle button changes icon/label to indicate expand/collapse state.

---

## 3. How Day & Night Themes Work

Theme switching is implemented via CSS Custom Properties toggled by the `data-theme` attribute on the root `<html>` element:

```html
<!-- Day Mode -->
<html lang="en" data-theme="day">

<!-- Night Mode -->
<html lang="en" data-theme="night">
```

### 3.1 Mechanism & State Management
1. **Detection & Persistence**: Handled in `js/main.js` via `initTheme()`. It inspects `localStorage.getItem('theme')`, falling back to `window.matchMedia('(prefers-color-scheme: dark)')`.
2. **Meta Theme Color**: Simultaneously updates `<meta name="theme-color">` to `#fff8f1` (Day) or `#1b1430` (Night) so browser chrome and mobile status bars match the atmosphere.
3. **Sound Effect**: Plays a warm two-note pentatonic chime when switching between modes.

### 3.2 Visual Atmosphere Transformations

- **The Desktop (`.desk`)**:
  - In Day mode: Clean cream background with subtle berry dot grid (`radial-gradient(var(--dot) 1.8px, transparent 2px)`).
  - In Night mode: Deep midnight purple with a procedural 10-star twinkling overlay (`.desk::after`) animated via `@keyframes twinkle`.
- **Pip Character SVG (`.pip-svg`)**:
  - In Day mode: Eyes wide awake and responsive, smiling.
  - In Night mode (`.pip-svg.is-night`): Pip becomes sleepy!
    - Eyelids droop: `.pip-svg.is-night .lid { transform: scaleY(0.58); }`
    - Golden halo appears: `.pip-svg.is-night .halo { opacity: 1; }`
    - Staggered animated sleep letters drift up: `.pip-svg.is-night .p-zzz text { animation: zzz 3s infinite; }`
    - Clicking Pip or saying "Hi" temporarily wakes Pip with giggle expression (`.is-awake`).
- **Darkroom & Toys**:
  - The darkroom flashlight room reflects the ambient lighting tokens seamlessly.
  - Blocks game canvas uses theme-adaptive linear gradients (`linear-gradient(var(--sky), var(--blush))`).

---

## 4. File Section Organization of `css/style.css`

[`css/style.css`](file:///c:/Users/Rushabh%20Mahajan/Documents/GitHub/pipOS/css/style.css) is organized into 17 clearly defined sections:

| # | Section Banner | Description |
| :- | :--- | :--- |
| `01` | `DESIGN TOKENS & THEMES` | `:root` day tokens and `[data-theme="night"]` token overrides |
| `02` | `BASE & RESET` | Box-sizing, typography defaults, accessibility utility classes (`.sr-only`, `.skip`), desktop background |
| `03` | `BUTTONS & CONTROLS` | Tactile rounded button `.btn`, `.btn-primary`, flex row helpers |
| `04` | `TASKBAR & NAVIGATION` | Top bar, Start button, sound toggle, theme switch, live clock |
| `05` | `DESKTOP SHORTCUTS` | Retro desktop icon shortcuts (`.desk-icons`, visible on wide screens `> 1360px`) |
| `06` | `MAIN LAYOUT` | Max-width constraint, section spacing, heading hierarchy |
| `07` | `WINDOWS COMPONENT` | `.win` container, `.win-bar`, titlebar stripes, dots, buttons |
| `08` | `HERO & PIP ILLUSTRATION` | Hero banner, speech bubble, SVG skull baby illustration & states |
| `09` | `ABOUT SHEET & KEYS CHEAT SHEET` | Key-value description list, skills chips, voice sample, &lt;kbd&gt; styling, keys.txt cards |
| `10` | `WORK GRID & TOYS` | 12-column work project grid: Lullaby Lab, Nightlight, Blocks, Route |
| `11` | `BEDTIME STORYBOOK` | Sticky scroll-driven track, scene progression dots, SVG story scenes |
| `12` | `WISH WALL & ODOMETER` | Guestbook form, pinned sticky notes, dream counter mechanical odometer |
| `13` | `FOOTER & CREDITS` | Candy tape separator, haX.baby canon credits, badges |
| `14` | `OVERLAYS & MODALS` | Notification toast, canvas confetti, cursor sparkles, secret dialog |
| `15` | `KEYFRAME ANIMATIONS` | `bob`, `wave`, `wiggle`, `zzz`, `twinkle`, `marq`, `spark`, `ring` |
| `16` | `RESPONSIVE BREAKPOINTS` | Media queries (`1360px`, `960px`, `860px`, `760px`, `720px`, `380px`), bottom dock reflow |
| `17` | `REDUCED MOTION` | `@media (prefers-reduced-motion: reduce)` overrides for vestibular accessibility |

---

## 5. Responsive Behavior & Accessibility

- **Mobile Dock (`≤ 720px`)**:
  - The taskbar shifts from the top of the screen to the bottom (`inset: auto 0 0 0`), mimicking a smartphone bottom navigation bar.
  - Safe area insets (`env(safe-area-inset-bottom)`) ensure thumb-friendly reachability above native home indicators.
- **Keyboard Navigation & Visible Focus**:
  - Custom `:focus-visible` ring (`outline: 3px solid var(--focus); outline-offset: 3px;`).
  - Primary button focus rings add a double outline (`box-shadow: 0 0 0 2px var(--paper)`) to guarantee visible distinction on any background.
- **Reduced Motion**:
  - When `prefers-reduced-motion: reduce` is enabled, all non-essential movement (sparkles, floating clouds, bobbing animations, marquee translation) is disabled, and transitions drop to `0.01s`.
