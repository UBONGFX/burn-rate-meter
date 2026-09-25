# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                          # Vite dev server
npm test                             # all unit tests (vitest run)
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
- **Settings (`src/lib/settings.ts`)** are stored in localStorage under `burn-rate-meter:settings` as `{ version, settings }`. If the `version` doesn't match, the app falls back to the defaults. `sanitizeSettings` repairs saved values field by field, and all storage access is wrapped in try/catch. A new field only needs a fallback in `sanitizeSettings`; bump `SETTINGS_VERSION` only for incompatible changes (renames, changed meaning). Number bounds for inputs come from `LIMITS`.

## Conventions

- The UI text is **German**. Money is formatted only through `formatEUR` (`Intl`, `de-DE`).
- Animations use `motion` (the successor to Framer Motion). Import it from `motion/react`, not `framer-motion`.
- Styling is plain CSS in `src/index.css`. Colors are tokens on `:root` (dark is the base); light overrides live in both the `prefers-color-scheme: light` block and `:root[data-theme="light"]` — keep the two in sync and never hardcode colors outside the tokens. `settings.theme` (`system` | `light` | `dark`) is chosen in the Settings view (default `system` = OS preference) and applied as `data-theme` on `<html>` by `App.tsx`, and an inline script in `index.html` applies it before first paint. There is no UI library.
- Code style: no semicolons, single quotes (the Vite template style).
