import { cx } from '../lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'dangerSolid' | 'ghost' | 'text' | 'textDanger'
export type ButtonSize = 'normal' | 'medium' | 'large'

export type ButtonStyle = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Class names for a button; also usable on motion.button, which can't be wrapped in <Button>. */
export function buttonClass({ variant = 'default', size = 'normal', className }: ButtonStyle = {}): string {
  const textOnly = variant === 'text' || variant === 'textDanger'
  return cx(
    textOnly ? styles.text : styles.btn,
    variant === 'textDanger' && styles.textDanger,
    !textOnly && variant !== 'default' && styles[variant],
    size !== 'normal' && styles[size],
    className,
  )
}
