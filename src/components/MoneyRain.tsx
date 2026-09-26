import { memo, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'

const MAX_BILLS = 30
// If many bills are due at once (e.g. after a background tab), only drop a few.
const MAX_SPAWN_AT_ONCE = 5

type Bill = { id: number; x: number; rotate: number; spin: number; duration: number; delay: number }

let nextBillId = 0

function makeBill(index: number): Bill {
  return {
    id: nextBillId++,
    x: 5 + Math.random() * 85,
    rotate: Math.random() * 60 - 30,
    spin: Math.random() * 360 - 180,
    duration: 3 + Math.random() * 2,
    delay: index * 0.15,
  }
}

type MoneyRainProps = {
  /** Total number of bills burned so far; each increase drops new bills. */
  count: number
  billValue: number
}

export const MoneyRain = memo(function MoneyRain({ count, billValue }: MoneyRainProps) {
  const { formatEUR } = useI18n()
  const reduceMotion = useReducedMotion()
  const [bills, setBills] = useState<Bill[]>([])
  const prevCount = useRef(count)

  useEffect(() => {
    const due = count - prevCount.current
    prevCount.current = count
    if (due <= 0 || reduceMotion) return
    const spawned = Array.from({ length: Math.min(due, MAX_SPAWN_AT_ONCE) }, (_, i) => makeBill(i))
    setBills((current) => [...current, ...spawned].slice(-MAX_BILLS))
  }, [count, reduceMotion])

  const label = formatEUR(billValue, { rounded: true })

  return (
    <div className="money-rain" aria-hidden="true">
      {bills.map((bill) => (
        <motion.div
          key={bill.id}
          className="bill"
          data-testid="bill"
          style={{ left: `${bill.x}%` }}
          initial={{ y: '-15vh', rotate: bill.rotate, opacity: 0 }}
          animate={{ y: '110vh', rotate: bill.rotate + bill.spin, opacity: [0, 1, 1, 0.2] }}
          transition={{ duration: bill.duration, delay: bill.delay, ease: 'easeIn' }}
          onAnimationComplete={() => setBills((current) => current.filter((b) => b.id !== bill.id))}
        >
          <span className="bill-value">{label}</span>
          <span className="bill-flame">🔥</span>
        </motion.div>
      ))}
    </div>
  )
})
