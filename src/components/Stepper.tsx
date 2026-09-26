import { useId, useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import { cx } from '../lib/cx'
import styles from './Stepper.module.css'

type StepperProps = {
  /** Accessible name; also shown unless `display` is given. */
  label: string
  /** Richer visible label, e.g. name plus a muted hint. */
  display?: ReactNode
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  /** One-line layout (label left, small controls right) for dense lists. */
  compact?: boolean
  /** Keep the label for screen readers only, when the row already makes it obvious. */
  hideLabel?: boolean
  /** Extra class for the visible label, e.g. a two-line name + rate layout. */
  labelClassName?: string
  /** Show the value as secondary, e.g. for roles nobody brings. */
  muted?: boolean
  /** Hide −/+ on phones: the value is typed directly, leaving room for the label. */
  typedOnPhone?: boolean
}

export function Stepper({
  label,
  display,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  compact = false,
  hideLabel = false,
  labelClassName,
  muted = false,
  typedOnPhone = false,
}: StepperProps) {
  const { t } = useI18n()
  const id = useId()
  // Keep the typed text separately so the field can be empty while editing.
  const [draft, setDraft] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(String(value))
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  return (
    <div className={cx(styles.stepper, compact && styles.compact, typedOnPhone && styles.typedOnPhone)}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : cx(styles.label, labelClassName)}>
        {display ?? label}
      </label>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          aria-label={t.stepper.decrease(label)}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          <Minus size="0.9em" />
        </button>
        <div className={styles.field}>
          <input
            id={id}
            className={cx(styles.input, muted && styles.muted)}
            aria-label={display ? label : undefined}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              const n = Number(e.target.value)
              if (e.target.value !== '' && Number.isFinite(n) && n >= min && n <= max) onChange(n)
            }}
            onBlur={() => setDraft(String(value))}
          />
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </div>
        <button
          type="button"
          className={styles.step}
          aria-label={t.stepper.increase(label)}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          <Plus size="0.9em" />
        </button>
      </div>
    </div>
  )
}
