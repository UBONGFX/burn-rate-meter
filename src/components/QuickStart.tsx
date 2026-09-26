import { useState } from 'react'
import { Flame } from 'lucide-react'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { costPerMinute, headcount, hourlyTotal } from '../lib/cost'
import { countOf, type Attendance, type Role, type Settings } from '../lib/settings'
import { amountFontSize } from '../lib/amountFontSize'
import { cx } from '../lib/cx'
import { AttendeeList } from './AttendeeList'
import { buttonClass } from './buttonClass'
import styles from './QuickStart.module.css'

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
    <section className={styles.quickStart}>
      {/* The price is the hero, echoing the meter the meeting will run on. */}
      <div className={styles.hero} aria-live="polite">
        <h2 className={styles.kicker}>{t.quickStart.title}</h2>
        <p
          className={styles.price}
          style={{ fontSize: amountFontSize(formatEUR(costPerMinute(total))) }}
          data-testid="price-per-minute"
        >
          {formatEUR(costPerMinute(total))}
        </p>
        <p className={styles.unit}>{t.quickStart.perMinute}</p>
        <p className={styles.sub}>{t.quickStart.perHour(formatEUR(total, { rounded: true }))}</p>
      </div>

      {presets.length > 0 && (
        <div className={styles.pills} role="group" aria-label={t.quickStart.presets}>
          {presets.map((p) => {
            const active = activePreset?.id === p.id
            return (
              <motion.button
                key={p.id}
                type="button"
                className={cx(styles.pill, active && styles.pillActive)}
                aria-pressed={active}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setPresetId(p.id)
                  setAttendance(p.attendance)
                }}
              >
                {p.name}
                <span className={styles.pillCount} aria-label={t.quickStart.people(headcount(p.attendance))}>
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
        className={buttonClass({ variant: 'primary', size: 'large' })}
        whileHover={people > 0 ? { scale: 1.02 } : undefined}
        whileTap={people > 0 ? { scale: 0.97 } : undefined}
        disabled={people === 0}
        onClick={() => onStart({ name: activePreset?.name ?? null, roles, attendance })}
      >
        <Flame size="1.1em" />
        {t.quickStart.start}
      </motion.button>
    </section>
  )
}
