import type { ComparisonKey } from '../lib/cost'
import type { Theme } from '../lib/settings'
import type { Language } from './locale'

// The German dictionary is the source of truth: `en.ts` must match its shape.
const de = {
  nav: {
    settings: '⚙️ Einstellungen',
    back: '← Zurück',
  },
  stepper: {
    decrease: (label: string) => `${label} verringern`,
    increase: (label: string) => `${label} erhöhen`,
  },
  quickStart: {
    title: 'Schnellstart',
    presets: 'Vorlagen',
    people: 'Personen',
    hourlyRate: 'Stundensatz',
    perMinute: 'pro Minute',
    perHour: 'pro Stunde',
    start: '🔥 Meeting starten',
  },
  meter: {
    defaultName: 'Meeting',
    status: { running: 'Verbrannt', paused: 'Pausiert', ended: 'Endstand' },
    duration: 'Dauer',
    perMinute: 'Pro Minute',
    hourlyRate: 'Stundensatz',
    peopleInRoom: 'Personen im Raum',
    pause: '⏸ Pause',
    resume: '▶ Weiter',
    end: '⏹ Beenden',
    // Rendered as: {before} <strong>{amount}</strong>{after}
    summary: (duration: string, people: number) => ({
      before: `${duration} Meeting mit ${people} ${people === 1 ? 'Person' : 'Personen'} hat`,
      after: ' gekostet.',
    }),
    comparisonPrefix: 'Das sind',
    noComparison: 'Nicht mal ein Kaffee – gut gemacht! ☕',
    newMeeting: 'Neues Meeting',
    sameAgain: 'Nochmal gleich',
  },
  comparisons: {
    usedCar: ['Gebrauchtwagen', 'Gebrauchtwagen'],
    holiday: ['Pauschalurlaub', 'Pauschalurlaube'],
    laptop: ['Laptop', 'Laptops'],
    bike: ['Fahrrad', 'Fahrräder'],
    headphones: ['Kopfhörer', 'Kopfhörer'],
    pizza: ['Pizza', 'Pizzen'],
    doner: ['Döner', 'Döner'],
    coffee: ['Kaffee', 'Kaffees'],
  } satisfies Record<ComparisonKey, [singular: string, plural: string]>,
  settings: {
    appearance: 'Darstellung',
    themeLabel: 'Farbschema',
    themes: {
      system: '🖥️ Automatisch',
      light: '☀️ Hell',
      dark: '🌙 Dunkel',
    } satisfies Record<Theme, string>,
    themeHint: '„Automatisch“ folgt der Einstellung deines Systems.',
    language: 'Sprache',
    languages: {
      auto: '🌐 Automatisch',
      de: 'Deutsch',
      en: 'English',
    } satisfies Record<Language, string>,
    languageHint: '„Automatisch“ nutzt die Sprache deines Browsers bzw. Systems.',
    defaults: 'Standardwerte',
    meetingSize: 'Meetinggröße',
    hourlyRate: 'Stundensatz',
    billValue: 'Ein Geldschein pro',
    presets: 'Vorlagen',
    presetName: 'Name der Vorlage',
    people: 'Personen',
    newPresetName: 'Neue Vorlage',
    addPreset: '+ Vorlage hinzufügen',
    deletePreset: (name: string) => `${name} löschen`,
    reset: 'Auf Standard zurücksetzen',
    resetConfirm: 'Alle Einstellungen auf Standard zurücksetzen?',
  },
}

export type Messages = typeof de
export default de
