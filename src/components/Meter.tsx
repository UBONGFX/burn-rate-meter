import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMeetingTimer } from '../hooks/useMeetingTimer'
import { useI18n } from '../i18n/useI18n'
import {
  changeRate,
  costAt,
  costPerMinute,
  formatDuration,
  headcount,
  hourlyTotal,
  startSegment,
} from '../lib/cost'
import type { Attendance } from '../lib/settings'
import { cx } from '../lib/cx'
import { AttendeeList } from './AttendeeList'
import { Button } from './Button'
import { MoneyRain } from './MoneyRain'
import styles from './Meter.module.css'
import { Summary } from './Summary'
import type { MeetingConfig } from './QuickStart'

/**
 * As large as possible, but shrinking with the number of characters so long
 * amounts like "12.345,67 €" still fit the page width (max 760px minus gutters).
 */
function counterFontSize(text: string): string {
  return `min(8.5rem, calc(${(1.55 / text.length).toFixed(4)} * min(100vw - 32px, 728px)))`
}

type MeterProps = {
  config: MeetingConfig
  billValue: number
  onRestart: () => void
  onNew: () => void
}

export function Meter({ config, billValue, onRestart, onNew }: MeterProps) {
  const { t, formatEUR } = useI18n()
  const { status, elapsedMs, now, pause, resume, stop } = useMeetingTimer()
  const [attendance, setAttendance] = useState<Attendance>(config.attendance)
  const [segment, setSegment] = useState(() => startSegment(hourlyTotal(config.roles, config.attendance)))
  const reduceMotion = useReducedMotion()

  const cost = costAt(elapsedMs, segment)
  const billCount = Math.floor(cost / billValue)
  const people = headcount(attendance)

  // Someone joins or leaves: only the time from now on is billed at the new rate.
  const changeCount = (roleId: string, count: number) => {
    const next = { ...attendance, [roleId]: count }
    setAttendance(next)
    setSegment((s) => changeRate(s, now(), hourlyTotal(config.roles, next)))
  }

  return (
    <section className={styles.meter}>
      <MoneyRain count={status === 'ended' ? 0 : billCount} billValue={billValue} />

      <p className={styles.label}>
        {config.name ?? t.meter.defaultName} · {t.meter.status[status]}
      </p>

      <div className={styles.counterWrap}>
        {status === 'running' && !reduceMotion && (
          <motion.div
            className={styles.counterGlow}
            animate={{ opacity: [0.45, 0.8, 0.5, 0.7, 0.45], scale: [1, 1.06, 0.98, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          key={billCount}
          className={cx(styles.counter, status === 'paused' && styles.paused)}
          data-testid="meter-total"
          initial={reduceMotion || billCount === 0 ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{ fontSize: counterFontSize(formatEUR(cost)) }}
          aria-live="off"
        >
          {formatEUR(cost)}
        </motion.div>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>{t.meter.duration}</dt>
          <dd>{formatDuration(elapsedMs)}</dd>
        </div>
        <div>
          <dt>{t.meter.perMinute}</dt>
          <dd>{formatEUR(costPerMinute(segment.hourlyTotal))}</dd>
        </div>
        <div>
          <dt>{t.meter.people}</dt>
          <dd data-testid="meter-people">{people}</dd>
        </div>
      </dl>

      <AnimatePresence mode="wait" initial={false}>
        {status === 'ended' ? (
          <motion.div
            key="summary"
            className={styles.summaryWrap}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Summary
              name={config.name}
              cost={cost}
              elapsedMs={elapsedMs}
              people={people}
              roles={config.roles}
              attendance={attendance}
              onNew={onNew}
              onRestart={onRestart}
            />
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            className={styles.controls}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.actions}>
              {status === 'running' ? (
                <Button onClick={pause}>{t.meter.pause}</Button>
              ) : (
                <Button onClick={resume}>{t.meter.resume}</Button>
              )}
              <Button variant="danger" onClick={stop}>
                {t.meter.end}
              </Button>
            </div>
            <AttendeeList minimal roles={config.roles} attendance={attendance} onChange={changeCount} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
