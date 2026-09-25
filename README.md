# 🔥 Burn Rate Meter

How much money is this meeting burning right now? Pick the number of people and a rough hourly rate, start the meeting – and watch the bills fall.

A small, fun side project: a live meeting cost meter built with React and Motion.

## Features

- **Quick start:** choose the number of colleagues and an hourly rate, or use a preset (e.g. team meeting, ART meeting, department call)
- **Live counter:** a ticking € counter with falling bills (one per X €), pause/resume, and headcount changes mid-meeting
- **Summary:** total cost, duration and a comparison ("That's 🍕 12 pizzas!")
- **Settings:** default meeting size, hourly rate, bill value and your own presets, saved in the browser (localStorage)
- **German & English:** detected automatically from your browser/system language, or set it in the settings
- **Light & dark mode:** follows your system by default, or pick one in the settings

## Development

```bash
npm install
npm run dev      # dev server
npm test         # unit tests (Vitest)
npm run lint     # oxlint
npm run build    # type-check + production build
```

Built with Vite, React, TypeScript and [Motion](https://motion.dev).
