import { AnimatePresence, motion } from 'motion/react'
import { LIMITS, type Preset, type Settings as SettingsType } from '../lib/settings'
import { Stepper } from './Stepper'

type SettingsProps = {
  settings: SettingsType
  onChange: (settings: SettingsType) => void
  onReset: () => void
}

export function Settings({ settings, onChange, onReset }: SettingsProps) {
  const update = (patch: Partial<SettingsType>) => onChange({ ...settings, ...patch })

  const updatePreset = (id: string, patch: Partial<Preset>) =>
    update({ presets: settings.presets.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const addPreset = () =>
    update({
      presets: [
        ...settings.presets,
        {
          id: crypto.randomUUID(),
          name: 'Neue Vorlage',
          people: settings.defaultPeople,
          hourlyRate: settings.defaultHourlyRate,
        },
      ],
    })

  return (
    <div className="settings">
      <section className="card">
        <h2>Standardwerte</h2>
        <div className="stepper-row">
          <Stepper
            label="Meetinggröße"
            value={settings.defaultPeople}
            onChange={(defaultPeople) => update({ defaultPeople })}
            {...LIMITS.people}
          />
          <Stepper
            label="Stundensatz"
            value={settings.defaultHourlyRate}
            onChange={(defaultHourlyRate) => update({ defaultHourlyRate })}
            step={5}
            suffix="€/h"
            {...LIMITS.hourlyRate}
          />
          <Stepper
            label="Ein Geldschein pro"
            value={settings.billValue}
            onChange={(billValue) => update({ billValue })}
            step={5}
            suffix="€"
            {...LIMITS.billValue}
          />
        </div>
      </section>

      <section className="card">
        <h2>Vorlagen</h2>
        <ul className="preset-list">
          <AnimatePresence initial={false}>
            {settings.presets.map((preset) => (
              <motion.li
                key={preset.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="preset-edit">
                  <input
                    className="preset-name"
                    aria-label="Name der Vorlage"
                    value={preset.name}
                    onChange={(e) => updatePreset(preset.id, { name: e.target.value })}
                  />
                  <Stepper
                    label="Personen"
                    value={preset.people}
                    onChange={(people) => updatePreset(preset.id, { people })}
                    {...LIMITS.people}
                  />
                  <Stepper
                    label="Stundensatz"
                    value={preset.hourlyRate}
                    onChange={(hourlyRate) => updatePreset(preset.id, { hourlyRate })}
                    step={5}
                    suffix="€/h"
                    {...LIMITS.hourlyRate}
                  />
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`${preset.name} löschen`}
                    onClick={() => update({ presets: settings.presets.filter((p) => p.id !== preset.id) })}
                  >
                    🗑
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <button type="button" className="btn" onClick={addPreset}>
          + Vorlage hinzufügen
        </button>
      </section>

      <div className="actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (confirm('Alle Einstellungen auf Standard zurücksetzen?')) onReset()
          }}
        >
          Auf Standard zurücksetzen
        </button>
      </div>
    </div>
  )
}
