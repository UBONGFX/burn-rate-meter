import { useId, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'

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
    <div className={compact ? 'stepper stepper-compact' : 'stepper'}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {display ?? label}
      </label>
      <div className="stepper-controls">
        <button
          type="button"
          aria-label={t.stepper.decrease(label)}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          −
        </button>
        <div className="stepper-input">
          <input
            id={id}
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
          {suffix && <span className="stepper-suffix">{suffix}</span>}
        </div>
        <button
          type="button"
          aria-label={t.stepper.increase(label)}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  )
}
