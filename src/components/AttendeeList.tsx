import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { headcount } from '../lib/cost'
import { LIMITS, countOf, type Attendance, type Role } from '../lib/settings'
import { Stepper } from './Stepper'

type AttendeeListProps = {
  roles: Role[]
  attendance: Attendance
  onChange: (roleId: string, count: number) => void
  /** Just a small "👥 Anpassen" link, for screens that already show the headcount (the meter). */
  minimal?: boolean
}

/**
 * One calm row ("👥 6 × Developer · 1 × PO   Anpassen ▾") that expands into
 * per-role counters, so screens stay focused on the money.
 */
export function AttendeeList({ roles, attendance, onChange, minimal = false }: AttendeeListProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const present = roles.filter((role) => countOf(attendance, role.id) > 0)
  const people = headcount(attendance)

  return (
    <div className={minimal ? 'attendees attendees-minimal' : 'attendees'}>
      <button
        type="button"
        className="attendees-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="attendees-icon" aria-hidden="true">
          👥
        </span>
        {!minimal && (
          <span className={people > 0 ? 'attendees-count' : 'attendees-count attendees-nobody'}>
            {people > 0 ? t.quickStart.people(people) : t.attendees.nobody}
          </span>
        )}
        <span className="attendees-action">
          {minimal ? t.attendees.adjustAttendees : t.attendees.adjust} <span className={open ? 'chevron chevron-open' : 'chevron'}>▾</span>
        </span>
        {/* While open, the list below shows the same counts. */}
        {!minimal && !open && present.length > 0 && (
          <span className="attendees-summary">
            {present.map((role) => (
              <span key={role.id} className="attendee-chip" data-testid="attendee-chip">
                <b>{countOf(attendance, role.id)}</b> {role.name}
              </span>
            ))}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="attendees-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <AttendeeRows roles={roles} attendance={attendance} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type AttendeeRowsProps = {
  roles: Role[]
  attendance: Attendance
  onChange: (roleId: string, count: number) => void
}

/** One compact counter row per role; roles nobody brings are dimmed. */
export function AttendeeRows({ roles, attendance, onChange }: AttendeeRowsProps) {
  const { t } = useI18n()
  return (
    <ul className="attendee-list">
      {roles.map((role) => (
        <li key={role.id} className={countOf(attendance, role.id) === 0 ? 'attendee-absent' : undefined}>
          <Stepper
            compact
            label={t.quickStart.roleLabel(role.name, role.hourlyRate)}
            display={
              <>
                <span className="attendee-name">{role.name}</span>
                <span className="attendee-rate">{t.quickStart.rate(role.hourlyRate)}</span>
              </>
            }
            value={countOf(attendance, role.id)}
            onChange={(count) => onChange(role.id, count)}
            {...LIMITS.count}
          />
        </li>
      ))}
    </ul>
  )
}
