import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMeetingTimer } from '../hooks/useMeetingTimer'
import { changeHeadcount, compareCost, costAt, costPerMinute, formatDuration, formatEUR, startSegment } from '../lib/cost'
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
  const { status, elapsedMs, now, pause, resume, stop } = useMeetingTimer()
  const [segment, setSegment] = useState(() => startSegment(config.people, config.hourlyRate))
  const reduceMotion = useReducedMotion()

  const cost = costAt(elapsedMs, segment)
  const billCount = Math.floor(cost / billValue)
  const comparison = compareCost(cost)

  return (
    <section className="meter">
      <MoneyRain count={status === 'ended' ? 0 : billCount} billValue={billValue} />

      <p className="meter-label">
        {config.name ?? 'Meeting'} · {status === 'ended' ? 'Endstand' : status === 'paused' ? 'Pausiert' : 'Verbrannt'}
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
          <dt>Dauer</dt>
          <dd>{formatDuration(elapsedMs)}</dd>
        </div>
        <div>
          <dt>Pro Minute</dt>
          <dd>{formatEUR(costPerMinute(segment.people, segment.hourlyRate))}</dd>
        </div>
        <div>
          <dt>Stundensatz</dt>
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
              {formatDuration(elapsedMs)} Meeting mit {segment.people} {segment.people === 1 ? 'Person' : 'Personen'} hat{' '}
              <strong>{formatEUR(cost)}</strong> gekostet.
            </p>
            <p className="comparison">
              {comparison ? (
                <>
                  Das sind <span className="comparison-emoji">{comparison.emoji}</span> {comparison.count}{' '}
                  {comparison.label}!
                </>
              ) : (
                'Nicht mal ein Kaffee – gut gemacht! ☕'
              )}
            </p>
            <div className="actions">
              <button type="button" className="btn" onClick={onNew}>
                Neues Meeting
              </button>
              <button type="button" className="btn btn-primary" onClick={onRestart}>
                Nochmal gleich
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
              label="Personen im Raum"
              value={segment.people}
              onChange={(people) => setSegment((s) => changeHeadcount(s, now(), people))}
              {...LIMITS.people}
            />
            <div className="actions">
              {status === 'running' ? (
                <button type="button" className="btn" onClick={pause}>
                  ⏸ Pause
                </button>
              ) : (
                <button type="button" className="btn" onClick={resume}>
                  ▶ Weiter
                </button>
              )}
              <button type="button" className="btn btn-danger" onClick={stop}>
                ⏹ Beenden
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
