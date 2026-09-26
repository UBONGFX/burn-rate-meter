import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { compareCost } from '../lib/cost'
import { countOf, type Attendance, type Role } from '../lib/settings'
import { Button } from './Button'

// Up to this many, the comparison shows one emoji per item ("🍕🍕🍕").
const MAX_EMOJIS = 12

type SummaryProps = {
  cost: number
  roles: Role[]
  attendance: Attendance
  onNew: () => void
  onRestart: () => void
}

/** End-of-meeting card: what the money could have bought, who was there, what next. */
export function Summary({ cost, roles, attendance, onNew, onRestart }: SummaryProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const comparison = compareCost(cost)
  const present = roles.filter((role) => countOf(attendance, role.id) > 0)
  const emoji = comparison?.emoji ?? '☕'
  const emojiCount = comparison && comparison.count <= MAX_EMOJIS ? comparison.count : 1

  return (
    <div className="summary" data-testid="summary">
      <div className="summary-card">
        <div className={emojiCount === 1 ? 'summary-emojis summary-emojis-single' : 'summary-emojis'} aria-hidden="true">
          {Array.from({ length: emojiCount }, (_, i) => (
            <motion.span
              key={i}
              initial={reduceMotion ? false : { scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.15 + i * 0.06 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {comparison ? (
          <>
            <p className="summary-kicker">{t.meter.comparisonPrefix}</p>
            <p className="summary-headline">
              {comparison.count} {t.comparisons[comparison.key][comparison.count === 1 ? 0 : 1]}
            </p>
          </>
        ) : (
          <>
            <p className="summary-headline">{t.meter.noComparison}</p>
            <p className="summary-sub">{t.meter.noComparisonSub}</p>
          </>
        )}

        {present.length > 0 && (
          <div className="summary-chips">
            {present.map((role) => (
              <span key={role.id} className="attendee-chip" data-testid="attendee-chip">
                <b>{countOf(attendance, role.id)}</b> {role.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="summary-actions">
        <Button size="medium" onClick={onNew}>
          {t.meter.newMeeting}
        </Button>
        <Button variant="primary" size="medium" onClick={onRestart}>
          {t.meter.sameAgain}
        </Button>
      </div>
    </div>
  )
}
