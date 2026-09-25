import type { ComparisonKey } from '../lib/cost'
import type { Theme } from '../lib/settings'
import type { Language } from './locale'

// The German dictionary is the source of truth: `en.ts` must match its shape.
const de = {
  nav: {
    settings: 'Einstellungen',
    back: '← Zurück',
  },
  stepper: {
    decrease: (label: string) => `${label} verringern`,
    increase: (label: string) => `${label} erhöhen`,
  },
  attendees: {
    adjust: 'Anpassen',
    adjustAttendees: 'Teilnehmer anpassen',
    nobody: 'Noch niemand ausgewählt',
  },
  quickStart: {
    title: 'Schnellstart',
    presets: 'Vorlagen',
    roleLabel: (name: string, hourlyRate: number) => `${name} · ${hourlyRate} €/h`,
    rate: (hourlyRate: number) => `${hourlyRate} €/h`,
    perMinute: 'pro Minute',
    perHour: (amount: string) => `${amount} pro Stunde`,
    people: (count: number) => `${count} ${count === 1 ? 'Person' : 'Personen'}`,
    start: '🔥 Meeting starten',
  },
  meter: {
    defaultName: 'Meeting',
    status: { running: 'Verbrannt', paused: 'Pausiert', ended: 'Endstand' },
    duration: 'Dauer',
    perMinute: 'Pro Minute',
    people: 'Personen',
    pause: '⏸ Pause',
    resume: '▶ Weiter',
    end: '⏹ Beenden',
    comparisonPrefix: 'Das sind',
    noComparison: 'Nicht mal ein Kaffee',
    noComparisonSub: 'Gut gemacht!',
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
    general: 'Allgemein',
    themeLabel: 'Farbschema',
    themes: {
      system: '🖥️ Automatisch',
      light: '☀️ Hell',
      dark: '🌙 Dunkel',
    } satisfies Record<Theme, string>,
    language: 'Sprache',
    languages: {
      auto: '🌐 Automatisch',
      de: 'Deutsch',
      en: 'English',
    } satisfies Record<Language, string>,
    roles: 'Rollen',
    rolesHint: 'Grobe Kosten pro Stunde und Person.',
    roleName: 'Name der Rolle',
    hourlyRate: 'Stundensatz',
    newRoleName: 'Neue Rolle',
    addRole: '+ Rolle hinzufügen',
    deleteRole: (name: string) => `Rolle ${name} löschen`,
    defaults: 'Standard-Besetzung',
    defaultsHint: 'Damit beginnt der Schnellstart.',
    billValue: 'Ein Geldschein pro',
    presets: 'Vorlagen',
    presetName: 'Name der Vorlage',
    newPresetName: 'Neue Vorlage',
    addPreset: '+ Vorlage hinzufügen',
    deletePreset: (name: string) => `${name} löschen`,
    deletePresetText: '🗑 Vorlage löschen',
    edit: 'Bearbeiten',
    presetMeta: (people: string, perMinute: string) => `${people} · ${perMinute}/min`,
    reset: 'Auf Standard zurücksetzen',
    resetConfirm: 'Alle Einstellungen auf Standard zurücksetzen?',
  },
}

export type Messages = typeof de
export default de
