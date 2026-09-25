import { motion } from 'motion/react'

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
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={value === option ? 'segmented-active' : ''}
          onClick={() => onChange(option)}
        >
          {value === option && <motion.span layoutId={`${name}-indicator`} className="segmented-indicator" />}
          <span className="segmented-label">{labels[option]}</span>
        </button>
      ))}
    </div>
  )
}
