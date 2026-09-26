import { useState, type ReactNode } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { headcount } from '../lib/cost'
import { LIMITS, countOf, type Attendance, type Role } from '../lib/settings'
import { cx } from '../lib/cx'
import styles from './AttendeeList.module.css'
import { Stepper } from './Stepper'

type AttendeeListProps = {
  roles: Role[]
  attendance: Attendance
  onChange: (roleId: string, count: number) => void
  /** Just a small "Anpassen" link, for screens that already show the headcount (the meter). */
  minimal?: boolean
}

/**
 * One calm row ("6 × Developer · 1 × PO   Anpassen") that expands into
 * per-role counters, so screens stay focused on the money.
 */
export function AttendeeList({ roles, attendance, onChange, minimal = false }: AttendeeListProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const present = roles.filter((role) => countOf(attendance, role.id) > 0)
  const people = headcount(attendance)

  return (
    <div className={cx(styles.attendees, minimal && styles.minimal)}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.icon}>
          <Users size="1.25em" />
        </span>
        {!minimal && (
          <span className={cx(styles.count, people === 0 && styles.nobody)}>
            {people > 0 ? t.quickStart.people(people) : t.attendees.nobody}
          </span>
        )}
        <ExpandLabel open={open}>{minimal ? t.attendees.adjustAttendees : t.attendees.adjust}</ExpandLabel>
        {/* While open, the list below shows the same counts. */}
        {!minimal && !open && present.length > 0 && (
          <span className={styles.summary}>
            {present.map((role) => (
              <AttendeeChip key={role.id} count={countOf(attendance, role.id)} name={role.name} />
            ))}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className={styles.panel}
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
  /** Placed inside another card, e.g. the preset editor */
  inset?: boolean
}

/** One compact counter row per role; roles nobody brings are dimmed. */
export function AttendeeRows({ roles, attendance, onChange, inset = false }: AttendeeRowsProps) {
  const { t } = useI18n()
  return (
    <ul className={cx(styles.list, inset && styles.inset)}>
      {roles.map((role) => (
        <li key={role.id} className={countOf(attendance, role.id) === 0 ? styles.absent : undefined}>
          <Stepper
            compact
            labelClassName={styles.rowLabel}
            muted={countOf(attendance, role.id) === 0}
            label={t.quickStart.roleLabel(role.name, role.hourlyRate)}
            display={
              <>
                <span className={styles.name}>{role.name}</span>
                <span className={styles.rate}>{t.quickStart.rate(role.hourlyRate)}</span>
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

/** "6 Developer" */
export function AttendeeChip({ count, name }: { count: number; name: string }) {
  return (
    <span className={styles.chip} data-testid="attendee-chip">
      <b>{count}</b> {name}
    </span>
  )
}

/** "Anpassen" with a chevron that flips while the section is open. */
export function ExpandLabel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <span className={styles.expand}>
      {children}
      <ChevronDown size="1em" className={cx(styles.chevron, open && styles.chevronOpen)} />
    </span>
  )
}
