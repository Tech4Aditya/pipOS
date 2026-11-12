#!/usr/bin/env bash

# pipOS - GitHub Issues Automation
# Repository: Tech4Aditya/pipOS
# Creates labels and 13 starter issues.

set -Eeuo pipefail

REPO="Tech4Aditya/pipOS"

# --------------------------------------------------
# 1. Locate GitHub CLI
# --------------------------------------------------

# GitHub CLI Windows compatibility

GH_EXE="/c/Program Files/GitHub CLI/gh.exe"

if [ -f "$GH_EXE" ]; then
    gh() {
        "$GH_EXE" "$@"
    }
elif command -v gh >/dev/null 2>&1; then
    :
else
    echo "ERROR: GitHub CLI not found."
    exit 1
fi

echo "[OK] GitHub CLI detected."

echo "========================================="
echo "        pipOS ISSUE AUTOMATION"
echo "========================================="

echo "[1/4] Checking GitHub authentication..."

gh auth status

echo "[2/4] Checking repository access..."

gh repo view "$REPO" >/dev/null

echo "Repository access confirmed."

# --------------------------------------------------
# 2. Create Labels
# --------------------------------------------------

echo "[3/4] Creating repository labels..."

create_label() {
    local name="$1"
    local color="$2"
    local description="$3"

    gh label create "$name" \
        --color "$color" \
        --description "$description" \
        --repo "$REPO" \
        --force >/dev/null

    echo "  [LABEL] $name"
}

create_label "good first issue" "7057ff" "Good for newcomers"
create_label "help wanted" "008672" "Extra attention needed"
create_label "testing" "fbca04" "Testing and QA"
create_label "accessibility" "0e8a16" "Accessibility improvements"
create_label "enhancement" "a2eeef" "New feature or request"
create_label "new toy" "f9d0c4" "New interactive toy"
create_label "performance" "d93f0b" "Performance improvements"
create_label "bug" "d73a4a" "Something is not working"
create_label "documentation" "0075ca" "Documentation improvements"
create_label "i18n" "c5def5" "Internationalization"

# --------------------------------------------------
# 3. Create Issues
# --------------------------------------------------

CREATED=0
SKIPPED=0
FAILED=0

create_issue() {
    local title="$1"
    local labels="$2"
    local body="$3"

    echo ""
    echo "-----------------------------------------"
    echo "Issue: $title"

    # Prevent duplicate issues, including closed ones.
    if gh issue list \
        --repo "$REPO" \
        --state all \
        --limit 500 \
        --json title \
        --jq '.[].title' |
        grep -Fqx -- "$title"; then

        echo "[SKIP] Issue already exists."
        ((SKIPPED+=1))
        return 0
    fi

    if gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --label "$labels" \
        --body "$body"; then

        echo "[SUCCESS] Issue created."
        ((CREATED+=1))
    else
        echo "[FAILED] Could not create issue."
        ((FAILED+=1))
    fi
}

# --------------------------------------------------
# ISSUE 1
# --------------------------------------------------

create_issue \
"Test on Safari, Firefox and real phones, report what breaks" \
"good first issue,testing" \
"## Why

The site needs testing beyond Chromium. Safari and Firefox handle Web Audio, CSS masks, dialogs and viewport units differently.

## Tasks

- Test the website in Safari (macOS/iOS).
- Test in Firefox.
- Test on a real Android phone.
- Check sound on/off.
- Check Lullaby Lab.
- Check Nightlight flashlight.
- Check Rattle & Blocks.
- Check story scrolling and night mode.
- Report bugs with browser, OS and screenshots.

## Done when

A browser compatibility report is submitted and individual bugs are documented."

# --------------------------------------------------
# ISSUE 2
# --------------------------------------------------

create_issue \
"Accessibility audit: screen reader, focus order and contrast" \
"good first issue,accessibility" \
"## Objective

Make pipOS more accessible for everyone.

## Tasks

- Test keyboard navigation throughout the website.
- Ensure every interactive element is reachable.
- Check visible focus indicators.
- Test with NVDA, VoiceOver or TalkBack.
- Check colour contrast in day and night modes.
- Improve accessibility labels and descriptions.
- Check forms and error messages.

## Done when

A pull request documents accessibility problems and their fixes."

# --------------------------------------------------
# ISSUE 3
# --------------------------------------------------

create_issue \
"Shared Wish Wall backend (replace device-only storage)" \
"help wanted,enhancement" \
"## Current limitation

The Wish Wall currently uses localStorage, meaning wishes are only available on the current device.

## Tasks

- Propose a free backend such as Supabase or Firebase.
- Implement shared wish submission and retrieval.
- Add basic rate limiting.
- Add input length validation.
- Prevent XSS attacks.
- Keep local fallback functionality.
- Document backend setup in README.

## Done when

Wishes submitted from two different browsers appear on the same wall."

# --------------------------------------------------
# ISSUE 4
# --------------------------------------------------

create_issue \
"New toy: Bedtime Storybook (flipbook)" \
"enhancement,new toy" \
"## Feature

Introduce a new interactive Bedtime Storybook window.

## Requirements

- Create 5-8 illustrated story pages.
- Add page-flip animations.
- Support touch swipe.
- Support keyboard arrow navigation.
- Add previous and next buttons.
- Use original stories and SVG illustrations.
- Respect prefers-reduced-motion.
- Match the existing pipOS design.

## Done when

The storybook works on desktop and mobile without external dependencies."

# --------------------------------------------------
# ISSUE 5
# --------------------------------------------------

create_issue \
"New toy: Pip's Growth Chart" \
"enhancement,new toy" \
"## Feature

Create an interactive nursery-style growth chart showing Pip's achievements.

## Requirements

- Display milestones and achievements.
- Add smooth animations.
- Use IntersectionObserver.
- Support day and night themes.
- Make the chart mobile-friendly.
- Ensure values are accessible as text.

## Done when

The chart integrates naturally into the existing pipOS interface."

# --------------------------------------------------
# ISSUE 6
# --------------------------------------------------

create_issue \
"Lullaby Lab: volume slider and more melodies" \
"good first issue,enhancement" \
"## Feature

Improve the Lullaby Lab with additional music controls.

## Tasks

- Add a labelled volume slider.
- Connect it to the master gain in js/audio.js.
- Add two original melodies.
- Add a melody selection interface.
- Preserve mute functionality.
- Persist volume preferences.

## Done when

Users can select melodies and control volume independently."

# --------------------------------------------------
# ISSUE 7
# --------------------------------------------------

create_issue \
"Lighthouse performance and mobile polish pass" \
"good first issue,performance" \
"## Objective

Improve pipOS loading speed and mobile performance.

## Tasks

- Run Google Lighthouse.
- Record mobile performance scores.
- Optimize font loading.
- Remove unused CSS.
- Reduce layout shifts.
- Improve mobile tap target sizes.
- Avoid unnecessary dependencies.

## Done when

A pull request includes before-and-after Lighthouse scores."

# --------------------------------------------------
# ISSUE 8
# --------------------------------------------------

create_issue \
"Make pipOS a Progressive Web App (PWA)" \
"enhancement" \
"## Feature

Allow users to install pipOS and use it offline.

## Tasks

- Add manifest.webmanifest.
- Add application icons.
- Implement a service worker.
- Cache essential local assets.
- Add offline fallback support.
- Handle unavailable Google Fonts gracefully.

## Done when

Users can install pipOS and access its cached functionality offline."

# --------------------------------------------------
# ISSUE 9
# --------------------------------------------------

create_issue \
"Unit tests for block game and audio logic" \
"good first issue,testing" \
"## Objective

Introduce basic automated tests for core game logic.

## Tasks

- Extract pure logic from the block game's drop function.
- Separate DOM operations from game calculations.
- Use Node.js built-in node:test.
- Test miss scenarios.
- Test partial overlap.
- Test perfect-drop snapping.
- Document test execution in README.

## Done when

The core block game logic has automated test coverage."

# --------------------------------------------------
# ISSUE 10
# --------------------------------------------------

create_issue \
"Dark room on touch devices: scrolling vs light dragging" \
"bug,help wanted" \
"## Problem

The Nightlight dark room interaction may conflict with page scrolling on touch devices.

## Tasks

- Reproduce on iOS Safari.
- Reproduce on Android Chrome.
- Investigate touch-action behaviour.
- Improve dragging interaction.
- Consider a dedicated drag handle.
- Preserve keyboard arrow controls.

## Done when

Light dragging works reliably without breaking normal page scrolling."

# --------------------------------------------------
# ISSUE 11
# --------------------------------------------------

create_issue \
"README: screenshots, GIF demo and architecture notes" \
"good first issue,documentation" \
"## Objective

Improve project documentation for new contributors.

## Tasks

- Add desktop screenshots.
- Add day mode screenshot.
- Add night mode screenshot.
- Add mobile screenshot.
- Add a short animated GIF demonstration.
- Explain the JavaScript module structure.
- Document the window.PIP namespace.
- Add a Good First Issues section.

## Done when

README clearly explains the project and helps newcomers get started."

# --------------------------------------------------
# ISSUE 12
# --------------------------------------------------

create_issue \
"Add Hindi and other language support" \
"enhancement,i18n" \
"## Feature

Introduce multilingual support, starting with Hindi.

## Tasks

- Extract visible strings into language dictionaries.
- Create Hindi translations.
- Add a language selection interface.
- Preserve the existing no-framework architecture.
- Ensure translations work in desktop and mobile layouts.

## Done when

Users can switch between English and Hindi throughout the interface."

# --------------------------------------------------
# ISSUE 13
# --------------------------------------------------

create_issue \
"Add LICENSE and CODE_OF_CONDUCT" \
"good first issue,documentation" \
"## Objective

Prepare pipOS for open-source contributions.

## Tasks

- Confirm the intended project license with the maintainer.
- Add the selected LICENSE file.
- Add Contributor Covenant CODE_OF_CONDUCT.md.
- Link both files from README.

## Done when

The repository has clear licensing and contributor conduct guidelines."

# --------------------------------------------------
# 4. Final Summary
# --------------------------------------------------

echo ""
echo "========================================="
echo "          EXECUTION COMPLETE"
echo "========================================="

echo "Created : $CREATED"
echo "Skipped : $SKIPPED"
echo "Failed  : $FAILED"

echo ""
echo "Check your issues here:"
echo "https://github.com/$REPO/issues"

echo "========================================="

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi