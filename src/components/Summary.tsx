import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import { MAX_COMPARISON_COUNT, compareCost } from '../lib/cost'
import { countOf, type Attendance, type Role } from '../lib/settings'
import { cx } from '../lib/cx'
import { AttendeeChip } from './AttendeeList'
import { Button } from './Button'
import { ShareButton } from './ShareButton'
import styles from './Summary.module.css'

type SummaryProps = {
  name: string | null
  cost: number
  elapsedMs: number
  people: number
  roles: Role[]
  attendance: Attendance
  onNew: () => void
  onRestart: () => void
}

/** End-of-meeting card: what the money could have bought, who was there, what next. */
export function Summary({ name, cost, elapsedMs, people, roles, attendance, onNew, onRestart }: SummaryProps) {
  const { t, formatEUR } = useI18n()
  const reduceMotion = useReducedMotion()
  const comparison = compareCost(cost)
  const present = roles.filter((role) => countOf(attendance, role.id) > 0)
  const emoji = comparison?.emoji ?? '☕'
  const emojiCount = comparison && comparison.count <= MAX_COMPARISON_COUNT ? comparison.count : 1

  return (
    <div className={styles.summary} data-testid="summary">
      <div className={styles.card}>
        <div className={cx(styles.emojis, emojiCount === 1 && styles.emojisSingle)} aria-hidden="true">
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
            <p className={styles.kicker}>{t.meter.comparisonPrefix}</p>
            <p className={styles.headline}>
              {comparison.count} {t.comparisons[comparison.key][comparison.count === 1 ? 0 : 1]}
            </p>
            <p className={styles.priceNote}>
              {t.meter.pricePer(formatEUR(comparison.price, { rounded: Number.isInteger(comparison.price) }))}
            </p>
          </>
        ) : (
          <>
            <p className={styles.headline}>{t.meter.noComparison}</p>
            <p className={styles.sub}>{t.meter.noComparisonSub}</p>
          </>
        )}

        {present.length > 0 && (
          <div className={styles.chips}>
            {present.map((role) => (
              <AttendeeChip key={role.id} count={countOf(attendance, role.id)} name={role.name} />
            ))}
          </div>
        )}
      </div>

      <ShareButton result={{ name, cost, elapsedMs, people }} />

      <div className={styles.actions}>
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
