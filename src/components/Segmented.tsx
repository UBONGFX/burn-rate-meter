import { motion } from 'motion/react'
import { cx } from '../lib/cx'
import styles from './Segmented.module.css'

type SegmentedProps<T extends string> = {
  /** Unique per group so each group animates its own indicator. */
  name: string
  label: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ name, label, options, labels, value, onChange }: SegmentedProps<T>) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={cx(styles.option, value === option && styles.active)}
          onClick={() => onChange(option)}
        >
          {value === option && <motion.span layoutId={`${name}-indicator`} className={styles.indicator} />}
          <span className={styles.label}>{labels[option]}</span>
        </button>
      ))}
    </div>
  )
}
