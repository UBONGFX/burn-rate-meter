# 🔥 Burn Rate Meter

Wie viel Geld verbrennt dieses Meeting gerade? Personen und groben Stundensatz wählen, Meeting starten – und zusehen, wie die Scheine fallen.

*A small fun side project: a live meeting cost meter built with React and Motion.*

## Features

- **Schnellstart:** pick the number of colleagues and an hourly rate, or use a preset (Teammeeting, ART-Meeting, Bereichscall)
- **Live-Zähler:** a ticking € counter with falling bills (one per X €), pause/resume, and headcount changes mid-meeting
- **Zusammenfassung:** total, duration and a comparison ("Das sind 🍕 12 Pizzen!")
- **Einstellungen:** default meeting size, hourly rate, bill value and your own presets, saved in the browser (localStorage)

## Entwicklung

```bash
npm install
npm run dev      # dev server
npm test         # unit tests (Vitest)
npm run lint     # oxlint
npm run build    # type-check + production build
```
