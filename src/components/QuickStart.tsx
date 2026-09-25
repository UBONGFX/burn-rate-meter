import { useState } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { costPerMinute } from '../lib/cost'
import { LIMITS, type Settings } from '../lib/settings'
import { Stepper } from './Stepper'

export type MeetingConfig = {
  name: string | null
  people: number
  hourlyRate: number
}

type QuickStartProps = {
  settings: Settings
  onStart: (config: MeetingConfig) => void
}

export function QuickStart({ settings, onStart }: QuickStartProps) {
  const { t, formatEUR } = useI18n()
  const [people, setPeople] = useState(settings.defaultPeople)
  const [hourlyRate, setHourlyRate] = useState(settings.defaultHourlyRate)
  const [presetId, setPresetId] = useState<string | null>(null)

  const preset = settings.presets.find((p) => p.id === presetId)
  // A preset stays selected only while its values are untouched.
  const activePreset = preset && preset.people === people && preset.hourlyRate === hourlyRate ? preset : null

  return (
    <section className="card quick-start">
      <h2>{t.quickStart.title}</h2>

      {settings.presets.length > 0 && (
        <div className="presets" role="group" aria-label={t.quickStart.presets}>
          {settings.presets.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              className={`chip ${activePreset?.id === p.id ? 'chip-active' : ''}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPresetId(p.id)
                setPeople(p.people)
                setHourlyRate(p.hourlyRate)
              }}
            >
              {p.name}
              <span className="chip-meta">
                {p.people} × {p.hourlyRate} €
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <div className="stepper-row">
        <Stepper label={t.quickStart.people} value={people} onChange={setPeople} {...LIMITS.people} />
        <Stepper
          label={t.quickStart.hourlyRate}
          value={hourlyRate}
          onChange={setHourlyRate}
          step={5}
          suffix="€/h"
          {...LIMITS.hourlyRate}
        />
      </div>

      <p className="preview">
        ≈ <strong>{formatEUR(costPerMinute(people, hourlyRate))}</strong> {t.quickStart.perMinute} ·{' '}
        {formatEUR(people * hourlyRate, { rounded: true })} {t.quickStart.perHour}
      </p>

      <motion.button
        type="button"
        className="btn btn-primary btn-large"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onStart({ name: activePreset?.name ?? null, people, hourlyRate })}
      >
        {t.quickStart.start}
      </motion.button>
    </section>
  )
}
