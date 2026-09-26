# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                          # Vite dev server
npm test                             # all unit tests (vitest run, src/**/*.test.ts)
npm run test:e2e                     # Playwright end-to-end tests in e2e/, Chromium + Firefox (starts its own dev server on :5198)
npx playwright test --project=firefox  # one browser only
npx playwright install --only-shell chromium firefox  # one-time browser download for test:e2e
npx vitest run src/lib/cost.test.ts  # single test file
npx vitest run -t "headcount"        # tests matching a name
npm run lint                         # oxlint (.oxlintrc.json) + stylelint (.stylelintrc.json) for src/**/*.css
npm run build                        # tsc -b + vite build
npm run screenshots                  # regenerate docs/screenshots (e2e/screenshots.spec.ts, skipped otherwise)
npm run brand-assets                 # regenerate public/icons and public/og-image.png (e2e/brand-assets.spec.ts)
```

## Workflow

`main` is protected by a GitHub ruleset: no direct pushes, force pushes or deletion. Every change goes through a pull request that is squash-merged once both CI jobs ("Lint, unit tests, build" and "End-to-end tests") pass; the branch is deleted on merge.

```bash
git switch -c <topic>                 # one branch per change
git push -u origin <topic>
gh pr create --fill                   # title/body become the squash commit
gh pr checks --watch                  # wait for CI
gh pr merge --squash                  # then: git switch main && git pull
```

## Architecture

A single-page React 19 + TypeScript app (Vite), with no router and no backend. `App.tsx` switches between three views (`start` | `meter` | `settings`) using `useState` and animates the transitions with `AnimatePresence`.

- **Money math is pure and lives in `src/lib/cost.ts`.** Attendees are counted per role (`Attendance` = role id → count); `hourlyTotal(roles, attendance)` sums count × rate. Cost is a `RateSegment` (`startMs`, `baseCost`, `hourlyTotal`). When someone joins or leaves, `changeRate` starts a new segment and carries the cost already burned into `baseCost`, so money spent is never recomputed at the new rate. A meeting copies the roles into its `MeetingConfig` at start, so editing roles in the settings never changes a running meeting. Put new cost logic here and test it in `cost.test.ts`.
- **The timer (`src/hooks/useMeetingTimer.ts`) is based on accumulated time, not intervals.** Elapsed time is `accumulatedMs + (performance.now() - runningSince)`, and `requestAnimationFrame` only triggers re-renders. Use `now()` (not the `elapsedMs` state) when you need the exact time inside an event handler.
- **`ErrorBoundary` (`src/components/ErrorBoundary.tsx`) wraps `<App>` in `main.tsx`.** It sits outside the settings and i18n context, so it uses `detectLocale()` + `MESSAGES` directly, and offers a settings reset in case stored data causes the crash.
- **Sharing:** `src/lib/share.ts` builds the text (pure, unit-tested); `src/lib/shareImage.ts` draws the 1080×1080 PNG on a canvas using the current theme's tokens read from the page. `ShareButton` uses `navigator.share` when it can share files, otherwise downloads the image and copies the text. E2E tests fake `navigator.share`/`clipboard` via init scripts.
- **PWA:** `public/manifest.webmanifest` + `public/sw.js` (registered only in production builds from `main.tsx`). The service worker serves pages network-first and built files cache-first (`ignoreVary`, because Vite loads them with `crossorigin`), and on every page load re-caches the files the page references and drops the rest. `e2e/pwa.spec.ts` tests it against a production build under `/burn-rate-meter/` served on port 5196 (second Playwright web server, see `e2e/servers.ts`).
- **Deployment:** the CI `deploy` job publishes to GitHub Pages after both checks pass on main; the build uses `BASE_PATH=/burn-rate-meter/` (Vite `base`), everything else runs at `/`.
- **Restarting a meeting remounts `<Meter>`.** It is keyed by `meetingRun` in `App.tsx`, so its timer and segment state reset. Do not add reset logic inside `Meter`.
- **`MoneyRain` gets a bill *count*** (`floor(cost / billValue)`) and spawns new bills when that count goes up. The number of bills is capped, bills remove themselves when their animation completes, and no bills are shown under `useReducedMotion()`.
- **Language:** `settings.language` is `auto` | `de` | `en`. `auto` uses `detectLocale()` in `src/i18n/locale.ts` (first `de`/`en` entry in `navigator.languages`, else English). `useLocaleI18n` in `src/i18n/useI18n.ts` resolves it, re-detects on the `languagechange` event, and `App.tsx` provides it via `I18nContext` and sets `<html lang>`. `locale.ts` stays free of React so `settings.ts` and the tests can import it.
- **Settings (`src/lib/settings.ts`)** are stored in localStorage under `burn-rate-meter:settings` as `{ version, settings }`. `roles` (at least one, always) carry the hourly rates; `defaultAttendance` and each preset's `attendance` count people per role id. `sanitizeSettings` repairs saved values field by field and drops counts for unknown roles, and all storage access is wrapped in try/catch. A new field only needs a fallback in `sanitizeSettings`; for incompatible changes bump `SETTINGS_VERSION` — there are no migrations, stored settings of another version are discarded and the defaults apply. `useSettings` only writes settings after the user changes something, and reset clears storage instead of saving defaults, so improved defaults reach everyone who never customized them. Number bounds for inputs come from `LIMITS`.

## Tests

- Unit tests (Vitest) cover the pure logic in `src/lib` and `src/i18n`. `src/hooks/useMeetingTimer.test.ts` runs in jsdom (per-file `@vitest-environment` comment) with faked `performance` + `requestAnimationFrame`, under React strict mode.
- `e2e/meeting.spec.ts` drives a full meeting under Playwright's fake clock, **paused** via `clock.pauseAt` so time only moves with `clock.runFor()`. It deletes `Element.prototype.animate` in an init script: Motion otherwise animates opacity through the Web Animations API, whose `document.timeline` the fake clock doesn't advance, so exit animations (and `AnimatePresence mode="wait"` view switches) would never finish. After Pause/Beenden, advance the clock a little before reading the counter — the timer swaps the last frame's value for the exact time.
- `e2e/a11y.spec.ts` scans every screen with axe (WCAG 2.1 AA) in light and dark mode and drives a meeting by keyboard. axe skips gradients, so text on colored fills must use the `--cta-*` / `--danger-solid` tokens, and small accent text `--accent-text` (all checked to reach 4.5:1). Dim things with muted colors, never with `opacity`.
- E2E tests find elements by role, label or `data-testid`, never by CSS class (class names are an implementation detail of the styles).
- The e2e tests pin the browser locale to `de-DE` (the app auto-detects its language); override with `test.use({ locale })`.

## Conventions

- **All UI text lives in `src/i18n/de.ts` and `src/i18n/en.ts`**, never inline in components; read it with `const { t, formatEUR } = useI18n()`. `de.ts` is the source of truth (`Messages = typeof de`), so a key missing from `en.ts` fails `tsc`, and `i18n.test.ts` also compares the key sets. Texts with values or plurals are small functions in the dictionary. Format money only through the `formatEUR` from `useI18n()` (`de-DE` / `en-IE`, always EUR). Preset names are user data and are not translated.
- Animations use `motion` (the successor to Framer Motion). Import it from `motion/react`, not `framer-motion`.
- Styling is CSS modules: each component has a `Component.module.css` next to it (class names are kebab-case in CSS, camelCase in TS via `styles.presetPill`; combine with `cx()` from `src/lib/cx.ts`). Only `src/styles/tokens.css` and `src/styles/base.css` are global. Don't style another component's internals from outside – give it a prop instead (e.g. `Stepper`'s `labelClassName`, `muted`, `typedOnPhone`). Buttons are `<Button variant size>` (or `buttonClass()` for `motion.button`). Spacing (`--space-<px>`), font sizes (`--text-*`) and radii (`--radius-*`) are tokens too — use them instead of raw values (only display sizes and component metrics stay literal). Colors are tokens in `tokens.css` (dark is the base) — stylelint rejects hex/named colors and `!important` anywhere else; light overrides live in both the `prefers-color-scheme: light` block and `:root[data-theme="light"]` — keep the two in sync and never hardcode colors outside the tokens. `settings.theme` (`system` | `light` | `dark`) is chosen in the Settings view (default `system` = OS preference) and applied as `data-theme` on `<html>` by `App.tsx`, and an inline script in `index.html` applies it before first paint. There is no UI library.
- Code style: no semicolons, single quotes (the Vite template style).
