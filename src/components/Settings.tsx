import { AnimatePresence, motion } from 'motion/react'
import { LANGUAGES } from '../i18n/locale'
import { useI18n } from '../i18n/useI18n'
import { LIMITS, THEMES, type Preset, type Settings as SettingsType } from '../lib/settings'
import { Segmented } from './Segmented'
import { Stepper } from './Stepper'

type SettingsProps = {
  settings: SettingsType
  onChange: (settings: SettingsType) => void
  onReset: () => void
}

export function Settings({ settings, onChange, onReset }: SettingsProps) {
  const { t } = useI18n()
  const update = (patch: Partial<SettingsType>) => onChange({ ...settings, ...patch })

  const updatePreset = (id: string, patch: Partial<Preset>) =>
    update({ presets: settings.presets.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const addPreset = () =>
    update({
      presets: [
        ...settings.presets,
        {
          id: crypto.randomUUID(),
          name: t.settings.newPresetName,
          people: settings.defaultPeople,
          hourlyRate: settings.defaultHourlyRate,
        },
      ],
    })

  return (
    <div className="settings">
      <section className="card">
        <h2>{t.settings.appearance}</h2>
        <Segmented
          name="theme"
          label={t.settings.themeLabel}
          options={THEMES}
          labels={t.settings.themes}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
        />
        <p className="hint">{t.settings.themeHint}</p>
      </section>

      <section className="card">
        <h2>{t.settings.language}</h2>
        <Segmented
          name="language"
          label={t.settings.language}
          options={LANGUAGES}
          labels={t.settings.languages}
          value={settings.language}
          onChange={(language) => update({ language })}
        />
        <p className="hint">{t.settings.languageHint}</p>
      </section>

      <section className="card">
        <h2>{t.settings.defaults}</h2>
        <div className="stepper-row">
          <Stepper
            label={t.settings.meetingSize}
            value={settings.defaultPeople}
            onChange={(defaultPeople) => update({ defaultPeople })}
            {...LIMITS.people}
          />
          <Stepper
            label={t.settings.hourlyRate}
            value={settings.defaultHourlyRate}
            onChange={(defaultHourlyRate) => update({ defaultHourlyRate })}
            step={5}
            suffix="€/h"
            {...LIMITS.hourlyRate}
          />
          <Stepper
            label={t.settings.billValue}
            value={settings.billValue}
            onChange={(billValue) => update({ billValue })}
            step={5}
            suffix="€"
            {...LIMITS.billValue}
          />
        </div>
      </section>

      <section className="card">
        <h2>{t.settings.presets}</h2>
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
                    aria-label={t.settings.presetName}
                    value={preset.name}
                    onChange={(e) => updatePreset(preset.id, { name: e.target.value })}
                  />
                  <Stepper
                    label={t.settings.people}
                    value={preset.people}
                    onChange={(people) => updatePreset(preset.id, { people })}
                    {...LIMITS.people}
                  />
                  <Stepper
                    label={t.settings.hourlyRate}
                    value={preset.hourlyRate}
                    onChange={(hourlyRate) => updatePreset(preset.id, { hourlyRate })}
                    step={5}
                    suffix="€/h"
                    {...LIMITS.hourlyRate}
                  />
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={t.settings.deletePreset(preset.name)}
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
          {t.settings.addPreset}
        </button>
      </section>

      <div className="actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (confirm(t.settings.resetConfirm)) onReset()
          }}
        >
          {t.settings.reset}
        </button>
      </div>
    </div>
  )
}
