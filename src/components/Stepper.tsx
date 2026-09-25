import { useId, useState } from 'react'

type StepperProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}

export function Stepper({ label, value, onChange, min, max, step = 1, suffix }: StepperProps) {
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
    <div className="stepper">
      <label htmlFor={id}>{label}</label>
      <div className="stepper-controls">
        <button
          type="button"
          aria-label={`${label} verringern`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          −
        </button>
        <div className="stepper-input">
          <input
            id={id}
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
          aria-label={`${label} erhöhen`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  )
}
