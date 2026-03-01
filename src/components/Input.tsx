import { Input as BaseInput } from '@base-ui/react/input'
import cx from 'classnames'

export type Props = {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
}

const inputStyles = cx(
  'w-full px-4 py-3.5 rounded-xl',
  'bg-white/5 border border-white/10',
  'text-[#EFEFF1] placeholder-[#ADADB8]',
  'outline-none',
  'focus:border-[#9146FF] focus:ring-[3px] focus:ring-[#9146FF]/50',
  'focus:bg-white/8',
  'transition-all duration-300 ease-out'
)

export default function Input({ value, onChange, placeholder, className }: Props) {
  return (
    <BaseInput
      value={value}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      placeholder={placeholder}
      className={cx(inputStyles, className)}
    />
  )
}
