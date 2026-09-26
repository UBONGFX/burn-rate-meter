# Repository Guidelines

## Project Structure & Module Organization

This is a single-page React 19 and TypeScript app built with Vite. `src/App.tsx` coordinates the start, meter, and settings views. Put UI in `src/components/`, reusable hooks in `src/hooks/`, cost and settings logic in `src/lib/`, translations in `src/i18n/`, and global tokens and styles in `src/styles/`. Component styles live beside components as `*.module.css`. Static PWA assets are in `public/`; documentation screenshots are in `docs/screenshots/`. Unit tests sit beside source files as `*.test.ts` or `*.test.tsx`; browser tests are in `e2e/*.spec.ts`.

## Build, Test, and Development Commands

Use Node 24 or newer and run `npm ci` to install locked dependencies. `npm run dev` starts Vite locally; `npm run build` type-checks and creates a production build; `npm run preview` serves that build. `npm run lint` runs Oxlint and Stylelint. `npm test` runs Vitest once, while `npm run test:watch` reruns unit tests during development. `npm run test:e2e` runs Playwright; install its browsers first with `npx playwright install --only-shell chromium firefox` if needed. `npm run screenshots` and `npm run brand-assets` regenerate checked-in visual assets.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, and no semicolons in TypeScript. Name React components in PascalCase, hooks with a `use` prefix, and CSS module classes in kebab-case; Vite exposes them as camelCase properties in TypeScript. Use CSS variables from `src/styles/tokens.css` for colors and spacing. Keep visible text in both `src/i18n/de.ts` and `src/i18n/en.ts`, and format EUR through `useI18n()`. Run `npm run lint` before opening a pull request.

## Testing Guidelines

Add Vitest tests next to changed pure logic or hooks. Add Playwright coverage in `e2e/` for user flows, accessibility, or PWA behavior; prefer role, label, or test ID selectors. There is no stated coverage percentage. Run `npm test`, `npm run test:e2e`, and `npm run build` for behavior changes.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects, often followed by a PR number, such as `Add comparisons and show their prices (#16)`. Work on a topic branch and submit a pull request to `main`; direct pushes are blocked. Explain the change, link any relevant issue, and include screenshots for visible UI changes. CI requires lint, unit tests, build, and browser tests before squash merge.
