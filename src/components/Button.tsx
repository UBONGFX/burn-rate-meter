import type { ComponentProps } from 'react'
import { buttonClass, type ButtonStyle } from './buttonClass'

type ButtonProps = ComponentProps<'button'> & Omit<ButtonStyle, 'className'>

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />
}
