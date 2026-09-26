import { useState } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { costPerMinute, headcount, hourlyTotal } from '../lib/cost'
import { countOf, type Attendance, type Role, type Settings } from '../lib/settings'
import { AttendeeList } from './AttendeeList'

export type MeetingConfig = {
  name: string | null
  /** Snapshot of the roles at start, so editing settings never changes a running meeting. */
  roles: Role[]
  attendance: Attendance
}

type QuickStartProps = {
  settings: Settings
  onStart: (config: MeetingConfig) => void
}

export function QuickStart({ settings, onStart }: QuickStartProps) {
  const { t, formatEUR } = useI18n()
  const { roles, presets } = settings
  const [attendance, setAttendance] = useState<Attendance>(settings.defaultAttendance)
  const [presetId, setPresetId] = useState<string | null>(null)

  const preset = presets.find((p) => p.id === presetId)
  // A preset stays selected only while its counts are untouched.
  const activePreset =
    preset && roles.every((r) => countOf(preset.attendance, r.id) === countOf(attendance, r.id)) ? preset : null
  const people = headcount(attendance)
  const total = hourlyTotal(roles, attendance)

  return (
    <section className="quick-start">
      {/* The price is the hero, echoing the meter the meeting will run on. */}
      <div className="qs-hero" aria-live="polite">
        <h2 className="qs-kicker">{t.quickStart.title}</h2>
        <p className="qs-price" data-testid="price-per-minute">{formatEUR(costPerMinute(total))}</p>
        <p className="qs-unit">{t.quickStart.perMinute}</p>
        <p className="qs-sub">{t.quickStart.perHour(formatEUR(total, { rounded: true }))}</p>
      </div>

      {presets.length > 0 && (
        <div className="preset-pills" role="group" aria-label={t.quickStart.presets}>
          {presets.map((p) => {
            const active = activePreset?.id === p.id
            return (
              <motion.button
                key={p.id}
                type="button"
                className={active ? 'preset-pill preset-pill-active' : 'preset-pill'}
                aria-pressed={active}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setPresetId(p.id)
                  setAttendance(p.attendance)
                }}
              >
                {p.name}
                <span className="preset-pill-count" aria-label={t.quickStart.people(headcount(p.attendance))}>
                  {headcount(p.attendance)}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      <AttendeeList
        roles={roles}
        attendance={attendance}
        onChange={(roleId, count) => setAttendance((a) => ({ ...a, [roleId]: count }))}
      />

      <motion.button
        type="button"
        className="btn btn-primary btn-large"
        whileHover={people > 0 ? { scale: 1.02 } : undefined}
        whileTap={people > 0 ? { scale: 0.97 } : undefined}
        disabled={people === 0}
        onClick={() => onStart({ name: activePreset?.name ?? null, roles, attendance })}
      >
        {t.quickStart.start}
      </motion.button>
    </section>
  )
}
