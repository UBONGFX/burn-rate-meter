import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMeetingTimer } from '../hooks/useMeetingTimer'
import { useI18n } from '../i18n/useI18n'
import { changeHeadcount, compareCost, costAt, costPerMinute, formatDuration, startSegment } from '../lib/cost'
import { LIMITS } from '../lib/settings'
import { MoneyRain } from './MoneyRain'
import type { MeetingConfig } from './QuickStart'
import { Stepper } from './Stepper'

type MeterProps = {
  config: MeetingConfig
  billValue: number
  onRestart: () => void
  onNew: () => void
}

export function Meter({ config, billValue, onRestart, onNew }: MeterProps) {
  const { t, formatEUR } = useI18n()
  const { status, elapsedMs, now, pause, resume, stop } = useMeetingTimer()
  const [segment, setSegment] = useState(() => startSegment(config.people, config.hourlyRate))
  const reduceMotion = useReducedMotion()

  const cost = costAt(elapsedMs, segment)
  const billCount = Math.floor(cost / billValue)
  const comparison = compareCost(cost)
  const summary = t.meter.summary(formatDuration(elapsedMs), segment.people)

  return (
    <section className="meter">
      <MoneyRain count={status === 'ended' ? 0 : billCount} billValue={billValue} />

      <p className="meter-label">
        {config.name ?? t.meter.defaultName} · {t.meter.status[status]}
      </p>

      <div className="counter-wrap">
        {status === 'running' && !reduceMotion && (
          <motion.div
            className="counter-glow"
            animate={{ opacity: [0.45, 0.8, 0.5, 0.7, 0.45], scale: [1, 1.06, 0.98, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          key={billCount}
          className={`counter ${status === 'paused' ? 'counter-paused' : ''}`}
          initial={reduceMotion || billCount === 0 ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          aria-live="off"
        >
          {formatEUR(cost)}
        </motion.div>
      </div>

      <dl className="stats">
        <div>
          <dt>{t.meter.duration}</dt>
          <dd>{formatDuration(elapsedMs)}</dd>
        </div>
        <div>
          <dt>{t.meter.perMinute}</dt>
          <dd>{formatEUR(costPerMinute(segment.people, segment.hourlyRate))}</dd>
        </div>
        <div>
          <dt>{t.meter.hourlyRate}</dt>
          <dd>{formatEUR(segment.hourlyRate, { rounded: true })}</dd>
        </div>
      </dl>

      <AnimatePresence mode="wait" initial={false}>
        {status === 'ended' ? (
          <motion.div
            key="summary"
            className="card summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p>
              {summary.before} <strong>{formatEUR(cost)}</strong>
              {summary.after}
            </p>
            <p className="comparison">
              {comparison ? (
                <>
                  {t.meter.comparisonPrefix} <span className="comparison-emoji">{comparison.emoji}</span>{' '}
                  {comparison.count} {t.comparisons[comparison.key][comparison.count === 1 ? 0 : 1]}!
                </>
              ) : (
                t.meter.noComparison
              )}
            </p>
            <div className="actions">
              <button type="button" className="btn" onClick={onNew}>
                {t.meter.newMeeting}
              </button>
              <button type="button" className="btn btn-primary" onClick={onRestart}>
                {t.meter.sameAgain}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            className="controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Stepper
              label={t.meter.peopleInRoom}
              value={segment.people}
              onChange={(people) => setSegment((s) => changeHeadcount(s, now(), people))}
              {...LIMITS.people}
            />
            <div className="actions">
              {status === 'running' ? (
                <button type="button" className="btn" onClick={pause}>
                  {t.meter.pause}
                </button>
              ) : (
                <button type="button" className="btn" onClick={resume}>
                  {t.meter.resume}
                </button>
              )}
              <button type="button" className="btn btn-danger" onClick={stop}>
                {t.meter.end}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
