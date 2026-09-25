# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                          # Vite dev server
npm test                             # all unit tests (vitest run, src/**/*.test.ts)
npm run test:e2e                     # Playwright end-to-end tests in e2e/ (starts its own dev server on :5198)
npx playwright install --only-shell chromium  # one-time browser download for test:e2e
npx vitest run src/lib/cost.test.ts  # single test file
npx vitest run -t "headcount"        # tests matching a name
npm run lint                         # oxlint (not ESLint), config in .oxlintrc.json
npm run build                        # tsc -b + vite build
```

## Architecture

A single-page React 19 + TypeScript app (Vite), with no router and no backend. `App.tsx` switches between three views (`start` | `meter` | `settings`) using `useState` and animates the transitions with `AnimatePresence`.

- **Money math is pure and lives in `src/lib/cost.ts`.** Cost is modeled as a `RateSegment` (`startMs`, `baseCost`, `people`, `hourlyRate`). A headcount change mid-meeting starts a new segment through `changeHeadcount`, which carries the cost already burned into `baseCost`. Money spent is never recomputed with the new headcount. Put new cost logic here and test it in `cost.test.ts`.
- **The timer (`src/hooks/useMeetingTimer.ts`) is based on accumulated time, not intervals.** Elapsed time is `accumulatedMs + (performance.now() - runningSince)`, and `requestAnimationFrame` only triggers re-renders. Use `now()` (not the `elapsedMs` state) when you need the exact time inside an event handler.
- **Restarting a meeting remounts `<Meter>`.** It is keyed by `meetingRun` in `App.tsx`, so its timer and segment state reset. Do not add reset logic inside `Meter`.
- **`MoneyRain` gets a bill *count*** (`floor(cost / billValue)`) and spawns new bills when that count goes up. The number of bills is capped, bills remove themselves when their animation completes, and no bills are shown under `useReducedMotion()`.
- **Language:** `settings.language` is `auto` | `de` | `en`. `auto` uses `detectLocale()` in `src/i18n/locale.ts` (first `de`/`en` entry in `navigator.languages`, else English). `useLocaleI18n` in `src/i18n/useI18n.ts` resolves it, re-detects on the `languagechange` event, and `App.tsx` provides it via `I18nContext` and sets `<html lang>`. `locale.ts` stays free of React so `settings.ts` and the tests can import it.
- **Settings (`src/lib/settings.ts`)** are stored in localStorage under `burn-rate-meter:settings` as `{ version, settings }`. If the `version` doesn't match, the app falls back to the defaults. `sanitizeSettings` repairs saved values field by field, and all storage access is wrapped in try/catch. A new field only needs a fallback in `sanitizeSettings`; bump `SETTINGS_VERSION` only for incompatible changes (renames, changed meaning). Number bounds for inputs come from `LIMITS`.

## Tests

- Unit tests (Vitest) cover the pure logic in `src/lib` and `src/i18n`. `src/hooks/useMeetingTimer.test.ts` runs in jsdom (per-file `@vitest-environment` comment) with faked `performance` + `requestAnimationFrame`, under React strict mode.
- `e2e/meeting.spec.ts` drives a full meeting under Playwright's fake clock, **paused** via `clock.pauseAt` so time only moves with `clock.runFor()`. It deletes `Element.prototype.animate` in an init script: Motion otherwise animates opacity through the Web Animations API, whose `document.timeline` the fake clock doesn't advance, so exit animations (and `AnimatePresence mode="wait"` view switches) would never finish. After Pause/Beenden, advance the clock a little before reading the counter — the timer swaps the last frame's value for the exact time.
- The e2e tests pin the browser locale to `de-DE` (the app auto-detects its language); override with `test.use({ locale })`.

## Conventions

- **All UI text lives in `src/i18n/de.ts` and `src/i18n/en.ts`**, never inline in components; read it with `const { t, formatEUR } = useI18n()`. `de.ts` is the source of truth (`Messages = typeof de`), so a key missing from `en.ts` fails `tsc`, and `i18n.test.ts` also compares the key sets. Texts with values or plurals are small functions in the dictionary. Format money only through the `formatEUR` from `useI18n()` (`de-DE` / `en-IE`, always EUR). Preset names are user data and are not translated.
- Animations use `motion` (the successor to Framer Motion). Import it from `motion/react`, not `framer-motion`.
- Styling is plain CSS in `src/index.css`. Colors are tokens on `:root` (dark is the base); light overrides live in both the `prefers-color-scheme: light` block and `:root[data-theme="light"]` — keep the two in sync and never hardcode colors outside the tokens. `settings.theme` (`system` | `light` | `dark`) is chosen in the Settings view (default `system` = OS preference) and applied as `data-theme` on `<html>` by `App.tsx`, and an inline script in `index.html` applies it before first paint. There is no UI library.
- Code style: no semicolons, single quotes (the Vite template style).
